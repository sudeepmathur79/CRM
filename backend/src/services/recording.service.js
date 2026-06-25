const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('./lead.service');
const { uploadFile: s3Upload, deleteFile: s3Delete, isConfigured: s3Configured } = require('./s3.service');
const { uploadFile: cloudinaryUpload, deleteFile: cloudinaryDelete, isConfigured: cloudinaryConfigured } = require('./cloudinary.service');
const { analyzeConversation, transcribeAudio } = require('./ai.service');
const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const TEXT_EXTS = ['.txt', '.vtt', '.srt', '.md'];

const isTextFile = (fileName) => TEXT_EXTS.includes(path.extname(fileName).toLowerCase());

const uploadToStorage = async (file, leadId) => {
  // S3 takes priority, then Cloudinary, then local
  if (s3Configured()) {
    try {
      const url = await s3Upload(file.path, file.originalname, leadId);
      if (url) return url;
    } catch (e) { console.error('S3 upload error, trying Cloudinary:', e.message); }
  }
  if (cloudinaryConfigured()) {
    try {
      const url = await cloudinaryUpload(file.path, file.originalname, leadId);
      if (url) return url;
    } catch (e) { console.error('Cloudinary upload error, falling back to local:', e.message); }
  }
  return `/uploads/${file.filename}`;
};

const saveRecording = async ({ leadId, file, type, userId }) => {
  const fileUrl = await uploadToStorage(file, leadId);

  // Clean up local temp file after cloud upload
  if (!fileUrl.startsWith('/uploads/') && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  let transcript = null;
  let summary = null;
  let nextSteps = null;

  // For text files (transcripts), read contents directly
  if (isTextFile(file.originalname)) {
    try {
      transcript = fs.existsSync(file.path)
        ? fs.readFileSync(file.path, 'utf8')
        : null;
    } catch {}
  } else {
    // Try audio transcription if Whisper configured
    transcript = await transcribeAudio(file.path);
  }

  // AI analysis if we have a transcript
  if (transcript) {
    const analysis = await analyzeConversation(transcript);
    summary = analysis.summary;
    nextSteps = analysis.nextSteps;
  }

  const recording = await prisma.recording.create({
    data: { leadId, fileName: file.originalname, fileUrl, fileSize: file.size, type, transcript, summary, nextSteps }
  });
  await logActivity(leadId, userId, 'recording_added', { fileName: file.originalname, type });
  return recording;
};

const getRecordings = async (leadId) =>
  prisma.recording.findMany({ where: { leadId }, orderBy: { createdAt: 'desc' } });

const deleteRecording = async (id) => {
  const rec = await prisma.recording.findUnique({ where: { id } });
  if (!rec) throw Object.assign(new Error('Not found'), { status: 404 });

  if (rec.fileUrl?.includes('.amazonaws.com/')) {
    try { await s3Delete(rec.fileUrl); } catch (e) { console.error('S3 delete error:', e.message); }
  } else if (rec.fileUrl?.includes('cloudinary')) {
    try { await cloudinaryDelete(rec.fileUrl); } catch (e) { console.error('Cloudinary delete error:', e.message); }
  } else {
    const filePath = path.join(__dirname, '../../', rec.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await prisma.recording.delete({ where: { id } });
};

const analyzeRecording = async (id) => {
  const rec = await prisma.recording.findUnique({ where: { id } });
  if (!rec) throw Object.assign(new Error('Not found'), { status: 404 });

  let transcript = rec.transcript;

  // If no transcript yet, try transcribing audio
  if (!transcript && !rec.fileUrl?.includes('.amazonaws.com/') && !rec.fileUrl?.includes('cloudinary')) {
    const filePath = path.join(__dirname, '../../', rec.fileUrl);
    transcript = await transcribeAudio(filePath);
  }

  if (!transcript) throw Object.assign(new Error('No transcript available. Upload a text file or enable Whisper for audio.'), { status: 400 });

  const analysis = await analyzeConversation(transcript);
  return prisma.recording.update({
    where: { id },
    data: { transcript, summary: analysis.summary, nextSteps: analysis.nextSteps }
  });
};

module.exports = { saveRecording, getRecordings, deleteRecording, analyzeRecording, UPLOAD_DIR };
