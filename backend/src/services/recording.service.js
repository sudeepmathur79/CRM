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
  let transcript = null;
  let summary = null;
  let nextSteps = null;

  // Read text content BEFORE uploading (temp file still exists at this point)
  if (isTextFile(file.originalname)) {
    try { transcript = fs.readFileSync(file.path, 'utf8'); } catch {}
  } else {
    transcript = await transcribeAudio(file.path);
  }

  const fileUrl = await uploadToStorage(file, leadId);

  // Clean up local temp file after cloud upload
  if (!fileUrl.startsWith('/uploads/') && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
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
  if (summary) {
    const noteContent = buildAiNoteContent(file.originalname, summary, nextSteps);
    await prisma.leadNote.create({ data: { leadId, userId, content: noteContent, type: 'ai_summary' } });
  }
  return recording;
};

const getRecordings = async (leadId) => {
  const where = leadId ? { leadId } : {};
  return prisma.recording.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: leadId ? undefined : { lead: { select: { id: true, name: true } } },
  });
};

const deleteRecording = async (id, userId) => {
  const rec = await prisma.recording.findUnique({ where: { id } });
  if (!rec) throw Object.assign(new Error('Not found'), { status: 404 });

  if (rec.fileUrl?.includes('.amazonaws.com/') || rec.fileUrl?.includes('r2.cloudflarestorage.com') || (process.env.AWS_PUBLIC_URL && rec.fileUrl?.startsWith(process.env.AWS_PUBLIC_URL))) {
    try { await s3Delete(rec.fileUrl); } catch (e) { console.error('S3 delete error:', e.message); }
  } else if (rec.fileUrl?.includes('cloudinary')) {
    try { await cloudinaryDelete(rec.fileUrl); } catch (e) { console.error('Cloudinary delete error:', e.message); }
  } else {
    const filePath = path.join(__dirname, '../../', rec.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await prisma.recording.delete({ where: { id } });
  if (userId) await logActivity(rec.leadId, userId, 'recording_deleted', { fileName: rec.fileName, type: rec.type });
};

const buildAiNoteContent = (fileName, summary, nextSteps) => {
  let content = `📎 ${fileName}\n\n${summary || ''}`;
  if (nextSteps) content += `\n\n🎯 Next Steps:\n${nextSteps}`;
  return content;
};

const analyzeRecording = async (id) => {
  const rec = await prisma.recording.findUnique({ where: { id } });
  if (!rec) throw Object.assign(new Error('Not found'), { status: 404 });

  let transcript = rec.transcript;

  // If no transcript yet, try to fetch it
  if (!transcript) {
    const isRemote = rec.fileUrl?.startsWith('http');
    const isText = isTextFile(rec.fileName);

    if (isRemote && isText) {
      // Fetch text file content from R2/Cloudinary
      try {
        const res = await fetch(rec.fileUrl);
        if (res.ok) transcript = await res.text();
      } catch (e) { console.error('Fetch transcript error:', e.message); }
    } else if (!isRemote) {
      const filePath = path.join(__dirname, '../../', rec.fileUrl);
      if (isText && fs.existsSync(filePath)) {
        transcript = fs.readFileSync(filePath, 'utf8');
      } else {
        transcript = await transcribeAudio(filePath);
      }
    }
  }

  if (!transcript) throw Object.assign(new Error('No transcript available. Upload a text file or enable Whisper for audio.'), { status: 400 });

  const analysis = await analyzeConversation(transcript);
  const updated = await prisma.recording.update({
    where: { id },
    data: { transcript, summary: analysis.summary, nextSteps: analysis.nextSteps }
  });
  if (analysis.summary) {
    const noteContent = buildAiNoteContent(rec.fileName, analysis.summary, analysis.nextSteps);
    // Delete any existing AI note for this recording before creating a fresh one
    await prisma.leadNote.deleteMany({ where: { leadId: rec.leadId, type: 'ai_summary', content: { contains: rec.fileName } } });
    await prisma.leadNote.create({ data: { leadId: rec.leadId, content: noteContent, type: 'ai_summary' } });
  }
  return updated;
};

module.exports = { saveRecording, getRecordings, deleteRecording, analyzeRecording, UPLOAD_DIR };
