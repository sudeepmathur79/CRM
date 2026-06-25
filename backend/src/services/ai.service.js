const { OpenAI } = require('openai');

// Auto-detect which provider is configured — priority: Groq → OpenRouter → Mistral → Gemini
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];

const getClient = () => {
  if (process.env.GROQ_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }),
      model: process.env.AI_MODEL || GROQ_MODELS[0],
      fallbackModels: process.env.AI_MODEL ? [] : GROQ_MODELS.slice(1),
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: { 'HTTP-Referer': 'https://crm-mjky.onrender.com', 'X-Title': 'CRM' },
      }),
      model: process.env.AI_MODEL || 'mistralai/mistral-7b-instruct:free',
    };
  }
  if (process.env.MISTRAL_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' }),
      model: process.env.AI_MODEL || 'mistral-small-latest',
    };
  }
  return null;
};

const EXTRACT_PROMPT = (today) => `You are a CRM data extraction assistant. Extract lead/contact information from the text below.

Return ONLY a valid JSON object — no markdown, no explanation, just raw JSON:
{
  "name": "full name of the lead/prospect (string or null)",
  "company": "company or organization name (string or null)",
  "email": "email address (string or null)",
  "phone": "phone number (string or null)",
  "status": "one of: New, Contacted, Qualified, Proposal, Closed Won, Closed Lost",
  "source": "one of: Website, Referral, LinkedIn, Cold Call, Email Campaign, Event, Other, or null",
  "notes": "key points and context in 2-3 sentences (string or null)",
  "nextFollowUp": "follow-up date as YYYY-MM-DD, or null",
  "summary": "one sentence summary of the interaction"
}

Rules:
- status: ready to buy → Qualified/Proposal, initial contact → New/Contacted
- Today is ${today}. Convert relative dates: "next Monday", "this Friday", "tomorrow" → actual YYYY-MM-DD
- Keep notes brief but capture key business context

Text:
`;

const callWithFallback = async (provider, params) => {
  const models = [provider.model, ...(provider.fallbackModels || [])];
  let lastError;
  for (const model of models) {
    try {
      return await provider.client.chat.completions.create({ ...params, model });
    } catch (e) {
      if (e.status === 503 || e.status === 429) { lastError = e; continue; }
      throw e;
    }
  }
  throw lastError;
};

const extractLeadFromText = async (text) => {
  const provider = getClient();
  if (!provider) throw Object.assign(new Error('No AI provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or MISTRAL_API_KEY in environment variables.'), { status: 400 });

  const today = new Date().toISOString().split('T')[0];
  const completion = await callWithFallback(provider, {
    messages: [
      { role: 'system', content: 'You are a CRM assistant. Always respond with valid JSON only, no markdown formatting.' },
      { role: 'user', content: EXTRACT_PROMPT(today) + text }
    ],
    temperature: 0.1,
    max_tokens: 600,
  });

  const raw = completion.choices[0].message.content.trim()
    .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON from response if wrapped in text
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw Object.assign(new Error('AI returned invalid JSON'), { status: 500 });
  }
};

const analyzeConversation = async (transcript) => {
  const provider = getClient();
  if (!provider || !transcript) return { summary: null, nextSteps: null };
  try {
    const today = new Date().toISOString().split('T')[0];
    const completion = await callWithFallback(provider, {
      messages: [{
        role: 'user',
        content: `Analyze this conversation transcript. Today is ${today}.

The conversation may span multiple days, involve partners, referrals, introductions, and business discussions — not just direct sales. Treat all meaningful interactions (partner meetings, introductions, follow-ups, deal discussions) as relevant.

Parse the transcript by date. For each date that has meaningful interaction, write a 1-2 sentence summary of what happened that day. Return dates in reverse chronological order (most recent first).

Return ONLY valid JSON, no markdown:
{
  "summary": "Chronological log, latest first. Format each entry as: [DATE]: summary of that day's interaction. Separate entries with a newline. Example:\\n[14 Jun]: Agreed to sign MNDA; Sudiip shared address for DocuSign.\\n[12 Jun]: Gopal shared Symulat deck and proposed formalizing finder relationship.\\n[05 May]: First meeting at Starbucks with Srini Ramani introduction.",
  "nextSteps": "Numbered list of 2-4 specific actionable next steps based on the most recent interactions, e.g.: 1. Follow up on MNDA from Gopal via DocuSign 2. Connect with Ivan Rosas regarding Mexico City BPO 3. Schedule call with Ganesan on OpenPOWER"
}

Transcript:
${transcript}`
      }],
      temperature: 0.2,
      max_tokens: 1200,
    });
    const raw = completion.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const normalizeNextSteps = (val) => {
      if (!val) return null;
      if (Array.isArray(val)) return val.map((s, i) => `${i + 1}. ${s.replace(/^\d+\.\s*/, '')}`).join('\n');
      return String(val);
    };

    try {
      const parsed = JSON.parse(raw);
      return {
        summary: parsed.summary || parsed.Summary || null,
        nextSteps: normalizeNextSteps(parsed.nextSteps || parsed.next_steps || parsed.NextSteps || parsed['next steps']),
      };
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          return {
            summary: parsed.summary || parsed.Summary || null,
            nextSteps: normalizeNextSteps(parsed.nextSteps || parsed.next_steps),
          };
        } catch {}
      }
      return { summary: raw.slice(0, 800), nextSteps: null };
    }
  } catch (e) {
    console.error('AI analyze error:', e.message);
    return { summary: null, nextSteps: null };
  }
};

const summarizeTranscript = async (transcript) => {
  const provider = getClient();
  if (!provider || !transcript) return null;
  try {
    const completion = await callWithFallback(provider, {
      messages: [
        { role: 'user', content: `Summarize this call/meeting transcript in 2-3 sentences, focusing on outcomes, decisions, and next steps:\n\n${transcript}` }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });
    return completion.choices[0].message.content.trim();
  } catch (e) {
    console.error('AI summarize error:', e.message);
    return null;
  }
};

const transcribeAudio = async (filePath) => {
  if (process.env.OPENAI_API_KEY && process.env.WHISPER_ENABLED === 'true') {
    const fs = require('fs');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });
    return response.text;
  }
  return null;
};

const recommendManagementActions = async ({ agentStats, unassigned, staleLeads }) => {
  const provider = getClient();
  if (!provider) return [{ priority: 'info', action: 'Configure an AI provider (GROQ_API_KEY) to enable AI recommendations.' }];

  const summary = `
You are a sales manager AI assistant. Based on this CRM snapshot, provide 4-6 specific, actionable recommendations.

TEAM SNAPSHOT:
${agentStats.map(a => `- ${a.name} (${a.role}): ${a.total} leads, ${a.won} won, ${a.conversionRate}% conversion, ${a.overdue} overdue follow-ups, pipeline $${a.pipelineValue}`).join('\n')}

UNASSIGNED LEADS: ${unassigned.length}
${unassigned.slice(0, 5).map(l => `- ${l.name}${l.company ? ` (${l.company})` : ''}${l.value ? `, $${l.value}` : ''}`).join('\n')}

STALE LEADS (14+ days no activity): ${staleLeads.length}
${staleLeads.slice(0, 5).map(l => `- ${l.name}, owned by ${l.assignedTo?.name || 'unassigned'}, status: ${l.status}${l.value ? `, $${l.value}` : ''}`).join('\n')}

Return a JSON array of recommendations. Each item: { "priority": "high|medium|low", "action": "specific action text", "reason": "brief why" }
Return ONLY the JSON array, no other text.`;

  const completion = await callWithFallback(provider, {
    messages: [{ role: 'user', content: summary }],
    temperature: 0.4,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : parsed.recommendations || parsed.actions || Object.values(parsed)[0] || [];
    return arr.slice(0, 6);
  } catch {
    return [{ priority: 'info', action: 'AI recommendations unavailable — could not parse response.' }];
  }
};

module.exports = { extractLeadFromText, summarizeTranscript, analyzeConversation, transcribeAudio, recommendManagementActions };
