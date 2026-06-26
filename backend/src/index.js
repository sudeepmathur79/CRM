require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const leadRoutes = require('./routes/lead.routes');
const recordingRoutes = require('./routes/recording.routes');
const activityRoutes = require('./routes/activity.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const tagRoutes = require('./routes/tag.routes');
const aiRoutes = require('./routes/ai.routes');
const csvRoutes = require('./routes/csv.routes');
const migrateRoutes = require('./routes/migrate.routes');
const messageRoutes = require('./routes/message.routes');
const voiceDraftRoutes = require('./routes/voicedraft.routes');
const agentRoutes = require('./routes/agent.routes');
const orgRoutes = require('./routes/org.routes');
const geoRoutes = require('./routes/geo.routes');

const { startAgents } = require('./services/agents');
const { startReminderScheduler } = require('./services/reminders');
const { runStuckDealAgents } = require('./services/agent.service');

const isProd = process.env.NODE_ENV === 'production';

// Build dynamic origin whitelist — always includes CORS_ORIGIN and, when set,
// the Cloudflare Tunnel domain (Agent A: explicit allowlist, no wildcard in prod)
function buildAllowedOrigins() {
  const origins = new Set();
  if (process.env.CORS_ORIGIN) origins.add(process.env.CORS_ORIGIN);
  if (process.env.CLOUDFLARE_TUNNEL_DOMAIN) origins.add(process.env.CLOUDFLARE_TUNNEL_DOMAIN);
  // Render injects RENDER_EXTERNAL_URL automatically — use it so CORS_ORIGIN
  // doesn't need to be manually set for same-service deployments
  if (process.env.RENDER_EXTERNAL_URL) origins.add(process.env.RENDER_EXTERNAL_URL);
  if (!isProd) origins.add('http://localhost:5173');
  return [...origins];
}
const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin: (origin, cb) => {
    // No origin = same-origin request (browser serving our own frontend) or server-to-server
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // In dev with no env vars set, allow all to avoid blocking local work
    if (!isProd && !allowedOrigins.size) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();
if (isProd) app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

app.set('io', io);

// Public config — exposes non-secret runtime values to the frontend
app.get('/api/config', (req, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/voice-drafts', voiceDraftRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/geo', geoRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Serve React frontend in production
if (isProd) {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(`user:${userId}`));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAgents(io);
  startReminderScheduler(io);
});

module.exports = { app, io };
