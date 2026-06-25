const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth.middleware');
const { saveRecording, getRecordings, deleteRecording, analyzeRecording, UPLOAD_DIR } = require('../services/recording.service');

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
    const allowed = ['.mp3', '.wav', '.mp4', '.webm', '.ogg', '.m4a', '.txt', '.vtt', '.srt', '.md'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try { res.json(await getRecordings(req.query.leadId)); } catch (e) { next(e); }
});

router.post('/upload/:leadId', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.status(201).json(await saveRecording({ leadId: req.params.leadId, file: req.file, type: 'upload', userId: req.user.id }));
  } catch (e) { next(e); }
});

router.post('/record/:leadId', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio data' });
    res.status(201).json(await saveRecording({ leadId: req.params.leadId, file: req.file, type: 'call', userId: req.user.id }));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try { await deleteRecording(req.params.id, req.user.id); res.json({ success: true }); } catch (e) { next(e); }
});

// Trigger AI analysis on an existing recording
router.post('/:id/analyze', async (req, res, next) => {
  try { res.json(await analyzeRecording(req.params.id)); } catch (e) { next(e); }
});

module.exports = router;
