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

const { startAgents } = require('./services/agents');

const isProd = process.env.NODE_ENV === 'production';

const app = express();
if (isProd) app.set('trust proxy', 1); // Render sits behind a proxy
const server = http.createServer(app);
const io = new Server(server, {
  cors: isProd ? false : { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
if (!isProd) {
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

app.set('io', io);

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
});

module.exports = { app, io };
