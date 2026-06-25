const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('./lead.service');
const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const transcribeWithWhisper = async (filePath) => {
  if (!process.env.OPENAI_API_KEY || process.env.WHISPER_ENABLED !== 'true') return null;
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });
    return response.text;
  } catch (e) {
    console.error('Whisper error:', e.message);
    return null;
  }
};

const summarizeTranscript = async (transcript) => {
  if (!process.env.OPENAI_API_KEY || !transcript) return null;
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a CRM assistant. Summarize this call transcript in 2-3 sentences focusing on key outcomes, decisions, and next steps.' },
        { role: 'user', content: transcript }
      ],
      max_tokens: 200
    });
    return res.choices[0].message.content;
  } catch (e) {
    console.error('Summary error:', e.message);
    return null;
  }
};

const saveRecording = async ({ leadId, file, type, userId, autoTranscribe = false }) => {
  const fileUrl = `/uploads/${file.filename}`;
  const transcript = autoTranscribe ? await transcribeWithWhisper(file.path) : null;
  const summary = transcript ? await summarizeTranscript(transcript) : null;

  const recording = await prisma.recording.create({
    data: { leadId, fileName: file.originalname, fileUrl, fileSize: file.size, type, transcript, summary }
  });
  await logActivity(leadId, userId, 'recording_added', { fileName: file.originalname, type });
  return recording;
};

const getRecordings = async (leadId) => {
  return prisma.recording.findMany({ where: { leadId }, orderBy: { createdAt: 'desc' } });
};

const deleteRecording = async (id) => {
  const rec = await prisma.recording.findUnique({ where: { id } });
  if (!rec) throw Object.assign(new Error('Not found'), { status: 404 });
  const filePath = path.join(__dirname, '../../', rec.fileUrl);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await prisma.recording.delete({ where: { id } });
};

const transcribeRecording = async (id) => {
  const rec = await prisma.recording.findUnique({ where: { id } });
  if (!rec) throw Object.assign(new Error('Not found'), { status: 404 });
  const filePath = path.join(__dirname, '../../', rec.fileUrl);
  const transcript = await transcribeWithWhisper(filePath);
  const summary = transcript ? await summarizeTranscript(transcript) : null;
  return prisma.recording.update({ where: { id }, data: { transcript, summary } });
};

module.exports = { saveRecording, getRecordings, deleteRecording, transcribeRecording, UPLOAD_DIR };
