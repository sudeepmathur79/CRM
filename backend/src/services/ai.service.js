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
  if (!provider) return [{ priority: 'info', action: 'Configure an AI provider (GROQ_API_KEY) to enable AI recommendations.', reason: null }];

  const totalLeads = agentStats.reduce((s, a) => s + a.total, 0);
  const totalOverdue = agentStats.reduce((s, a) => s + a.overdue, 0);
  const totalPipeline = agentStats.reduce((s, a) => s + a.pipelineValue, 0);
  const stalePipelineValue = staleLeads.reduce((s, l) => s + (l.value || 0), 0);
  const unassignedValue = unassigned.reduce((s, l) => s + (l.value || 0), 0);

  const agentLines = agentStats.map(a => {
    const overdueRate = a.total > 0 ? ((a.overdue / a.total) * 100).toFixed(0) : 0;
    const staleOwned = staleLeads.filter(l => l.assignedTo?.name === a.name).length;
    return `  • ${a.name} (${a.role}): ${a.total} leads total, ${a.won} won, ${a.conversionRate}% conversion rate, ${a.overdue} overdue (${overdueRate}% of portfolio), ${a.newThisMonth} new this month, pipeline $${a.pipelineValue.toLocaleString()}, stale leads owned: ${staleOwned}`;
  }).join('\n');

  const staleSample = staleLeads.slice(0, 8).map(l =>
    `  • ${l.name}${l.company ? ` (${l.company})` : ''}, status: ${l.status}, owner: ${l.assignedTo?.name || 'unassigned'}${l.value ? `, value: $${l.value.toLocaleString()}` : ''}`
  ).join('\n');

  const unassignedSample = unassigned.slice(0, 8).map(l =>
    `  • ${l.name}${l.company ? ` (${l.company})` : ''}, status: ${l.status}${l.value ? `, value: $${l.value.toLocaleString()}` : ''}, created: ${new Date(l.createdAt).toLocaleDateString()}`
  ).join('\n');

  const prompt = `You are an experienced sales operations manager reviewing a CRM snapshot. Provide 5-7 specific, actionable recommendations tailored to the actual data. Be concrete — mention agent names, lead names, and dollar amounts where relevant. Avoid generic advice.

=== PORTFOLIO OVERVIEW ===
Total leads in system: ${totalLeads}
Total overdue follow-ups: ${totalOverdue}
Combined pipeline value: $${totalPipeline.toLocaleString()}
Unassigned leads: ${unassigned.length}${unassignedValue > 0 ? ` (value at risk: $${unassignedValue.toLocaleString()})` : ''}
Stale leads (14+ days no activity, not closed): ${staleLeads.length}${stalePipelineValue > 0 ? ` ($${stalePipelineValue.toLocaleString()} pipeline at risk)` : ''}

=== TEAM BREAKDOWN ===
${agentLines || '  (no agents yet)'}

=== STALE LEADS ===
${staleSample || '  (none)'}

=== UNASSIGNED LEADS ===
${unassignedSample || '  (none)'}

=== INSTRUCTIONS ===
Analyse: workload balance, pipeline health, conversion gaps, at-risk value, follow-up discipline, and velocity.
For each recommendation include who should act and what specifically to do.
Prioritise by revenue impact.

Return a JSON array only. Each element: { "priority": "high|medium|low", "category": "pipeline|workload|followup|conversion|risk", "action": "specific action (1-2 sentences, name names)", "reason": "data-driven reason (1 sentence)" }
No markdown, no wrapper object — just the raw JSON array.`;

  const completion = await callWithFallback(provider, {
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 900,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : parsed.recommendations || parsed.actions || Object.values(parsed)[0] || [];
    return arr.slice(0, 7);
  } catch {
    return [{ priority: 'info', action: 'AI recommendations unavailable — could not parse response.', reason: null }];
  }
};

const scoreLead = async (lead) => {
  const provider = getClient();
  if (!provider) return null;

  const daysSinceCreated = Math.floor((Date.now() - new Date(lead.createdAt)) / 86400000);
  const daysSinceActivity = lead.lastActivityAt
    ? Math.floor((Date.now() - new Date(lead.lastActivityAt)) / 86400000)
    : daysSinceCreated;

  const notes = [
    lead.notes,
    ...(lead.leadNotes || []).map(n => n.content),
    ...(lead.recordings || []).map(r => r.summary || r.transcript?.slice(0, 400)),
  ].filter(Boolean).join('\n\n').slice(0, 2000);

  const prompt = `You are a sales scoring assistant. Score this lead 1-10 based on the available information.

=== LEAD DATA ===
Name: ${lead.name}
Company: ${lead.company || 'unknown'}
Status: ${lead.status}
Deal value: ${lead.value ? `$${lead.value.toLocaleString()}` : 'not set'}
Source: ${lead.source || 'unknown'}
Days in pipeline: ${daysSinceCreated}
Days since last activity: ${daysSinceActivity}
Follow-up overdue: ${lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date() ? 'YES' : 'no'}
Notes / call summaries:
${notes || '(none)'}

=== SCORING GUIDE ===
9-10: Strong buying signals, high value, recent engagement, decision maker confirmed
7-8: Clear interest, budget likely, active engagement
5-6: Some interest, needs nurturing, no strong signals yet
3-4: Uncertain interest, stale, or early stage
1-2: Cold, lost contact, no budget signal, long inactive

Return ONLY valid JSON, no markdown:
{
  "score": <integer 1-10>,
  "reason": "<one sentence explaining the score based on specific data points>",
  "nextAction": "<one specific, actionable next step tailored to this lead's situation>"
}`;

  try {
    const completion = await callWithFallback(provider, {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
    });
    const raw = completion.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    return {
      score: Math.min(10, Math.max(1, Math.round(parsed.score))),
      reason: parsed.reason || null,
      nextAction: parsed.nextAction || null,
    };
  } catch (e) {
    console.error('AI score error:', e.message);
    return null;
  }
};

const callAI = async (prompt) => {
  const { client, model } = getClient();
  const resp = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
  });
  return resp.choices[0]?.message?.content?.trim() || '';
};

module.exports = { extractLeadFromText, summarizeTranscript, analyzeConversation, transcribeAudio, recommendManagementActions, scoreLead, callAI };
