const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('./lead.service');
const { uploadFile, deleteFile, isConfigured: cloudinaryConfigured } = require('./cloudinary.service');
const { summarizeTranscript, transcribeAudio } = require('./ai.service');
const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const saveRecording = async ({ leadId, file, type, userId, autoTranscribe = false }) => {
  let fileUrl = `/uploads/${file.filename}`;

  // Upload to Cloudinary if configured (persistent storage)
  if (cloudinaryConfigured()) {
    try {
      const cloudUrl = await uploadFile(file.path, file.originalname, leadId);
      if (cloudUrl) {
        fileUrl = cloudUrl;
        // Clean up local temp file
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    } catch (e) {
      console.error('Cloudinary upload error, falling back to local:', e.message);
    }
  }

  const transcript = autoTranscribe ? await transcribeAudio(file.path) : null;
  const summary = transcript ? await summarizeTranscript(transcript) : null;

  const recording = await prisma.recording.create({
    data: { leadId, fileName: file.originalname, fileUrl, fileSize: file.size, type, transcript, summary }
  });
  await logActivity(leadId, userId, 'recording_added', { fileName: file.originalname, type });
  return recording;
};

const getRecordings = async (leadId) =>
  prisma.recording.findMany({ where: { leadId }, orderBy: { createdAt: 'desc' } });

const deleteRecording = async (id) => {
  const rec = await prisma.recording.findUnique({ where: { id } });
  if (!rec) throw Object.assign(new Error('Not found'), { status: 404 });

  if (rec.fileUrl?.includes('cloudinary')) {
    await deleteFile(rec.fileUrl);
  } else {
    const filePath = path.join(__dirname, '../../', rec.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await prisma.recording.delete({ where: { id } });
};

const transcribeRecording = async (id) => {
  const rec = await prisma.recording.findUnique({ where: { id } });
  if (!rec) throw Object.assign(new Error('Not found'), { status: 404 });

  let transcript = null;
  if (!rec.fileUrl?.includes('cloudinary')) {
    const filePath = path.join(__dirname, '../../', rec.fileUrl);
    transcript = await transcribeAudio(filePath);
  }
  const summary = transcript ? await summarizeTranscript(transcript) : null;
  return prisma.recording.update({ where: { id }, data: { transcript, summary } });
};

module.exports = { saveRecording, getRecordings, deleteRecording, transcribeRecording, UPLOAD_DIR };
