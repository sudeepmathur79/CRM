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
        content: `Analyze this sales conversation transcript. Today is ${today}.

Return ONLY valid JSON, no markdown:
{
  "summary": "2-3 sentence summary of the conversation covering key points, prospect's interest level, and any decisions made",
  "nextSteps": "Numbered list of 2-4 specific, actionable next steps the sales agent should take, e.g.: 1. Send proposal by Friday 2. Schedule demo for next week 3. Follow up on budget approval"
}

Transcript:
${transcript}`
      }],
      temperature: 0.2,
      max_tokens: 800,
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

module.exports = { extractLeadFromText, summarizeTranscript, analyzeConversation, transcribeAudio };
