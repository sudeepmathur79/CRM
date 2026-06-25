const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth.middleware');
const { saveRecording, getRecordings, deleteRecording, transcribeRecording, UPLOAD_DIR } = require('../services/recording.service');

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params?.leadId || 'rec'}_${Date.now()}_${uuidv4().slice(0,8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 104857600 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.mp4', '.webm', '.ogg', '.m4a', '.txt', '.vtt', '.srt'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { leadId } = req.query;
    res.json(await getRecordings(leadId));
  } catch (e) { next(e); }
});

router.post('/upload/:leadId', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const rec = await saveRecording({
      leadId: req.params.leadId,
      file: req.file,
      type: 'upload',
      userId: req.user.id,
      autoTranscribe: req.body.autoTranscribe === 'true'
    });
    res.status(201).json(rec);
  } catch (e) { next(e); }
});

router.post('/record/:leadId', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio data' });
    const rec = await saveRecording({
      leadId: req.params.leadId,
      file: req.file,
      type: 'call',
      userId: req.user.id,
      autoTranscribe: req.body.autoTranscribe === 'true'
    });
    res.status(201).json(rec);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try { await deleteRecording(req.params.id); res.json({ success: true }); } catch (e) { next(e); }
});

router.post('/:id/transcribe', async (req, res, next) => {
  try { res.json(await transcribeRecording(req.params.id)); } catch (e) { next(e); }
});

module.exports = router;
