const { GoogleGenerativeAI } = require('@google/generative-ai');

const getModel = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

const EXTRACT_PROMPT = `You are a CRM data extraction assistant. Extract lead/contact information from the following text.

Return ONLY a valid JSON object with these fields (use null for missing fields):
{
  "name": "full name of the lead/prospect",
  "company": "company or organization name",
  "email": "email address",
  "phone": "phone number",
  "status": "one of: New, Contacted, Qualified, Proposal, Closed Won, Closed Lost",
  "source": "one of: Website, Referral, LinkedIn, Cold Call, Email Campaign, Event, Other, or null",
  "notes": "key points, context, and any other relevant information (2-3 sentences max)",
  "nextFollowUp": "follow-up date in YYYY-MM-DD format, or null",
  "budget": "budget amount if mentioned, or null",
  "tags": ["array", "of", "relevant", "tags"],
  "summary": "one sentence summary of the interaction"
}

Rules:
- For status: if they seem ready to buy → "Qualified" or "Proposal", if just initial contact → "New" or "Contacted"
- Extract dates relative to today (${new Date().toISOString().split('T')[0]})
- If "follow up Monday/tomorrow/next week" → calculate the actual date
- Keep notes concise but capture key business context

Text to analyze:
`;

const extractLeadFromText = async (text) => {
  const model = getModel();
  if (!model) throw Object.assign(new Error('GEMINI_API_KEY not configured'), { status: 400 });

  const result = await model.generateContent(EXTRACT_PROMPT + text);
  const response = result.response.text();

  // Strip markdown code blocks if present
  const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw Object.assign(new Error('Failed to parse AI response'), { status: 500 });
  }
};

const summarizeTranscript = async (transcript) => {
  const model = getModel();
  if (!model || !transcript) return null;
  try {
    const result = await model.generateContent(
      `Summarize this call/meeting transcript in 2-3 sentences, focusing on key outcomes, decisions made, and next steps:\n\n${transcript}`
    );
    return result.response.text();
  } catch (e) {
    console.error('Gemini summarize error:', e.message);
    return null;
  }
};

const transcribeAudio = async (filePath) => {
  // Gemini supports audio - but for now fall back to OpenAI Whisper if configured
  if (process.env.OPENAI_API_KEY && process.env.WHISPER_ENABLED === 'true') {
    const { OpenAI } = require('openai');
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

module.exports = { extractLeadFromText, summarizeTranscript, transcribeAudio };
