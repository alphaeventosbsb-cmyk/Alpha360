// ============================================================
// Alpha360 API — Express Server
// Backend centralizado com multi-tenant
// ============================================================

import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middlewares/auth';

// Routes
import authRoutes from './routes/auth';
import jobsRoutes from './routes/jobs';
import usersRoutes from './routes/users';
import guardsRoutes from './routes/guards';
import assignmentsRoutes from './routes/assignments';
import alertsRoutes from './routes/alerts';
import sitesRoutes from './routes/sites';
import paymentsRoutes from './routes/payments';
import checkinRoutes from './routes/checkin';
import checkoutRoutes from './routes/checkout';
import onboardingRoutes from './routes/onboarding';
import messagesRoutes from './routes/messages';

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middlewares Globais ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS — permitir frontends
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (ex: Postman, curl, mobile)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Bloqueado: ${origin}`);
      callback(null, true); // Em produção, trocar para callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---- Health Check (sem auth) ----
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    error: null,
  });
});

// ---- Rotas Protegidas (com auth) ----
app.use('/api/auth', authMiddleware, authRoutes);
app.use('/api/jobs', authMiddleware, jobsRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/guards', authMiddleware, guardsRoutes);
app.use('/api/assignments', authMiddleware, assignmentsRoutes);
app.use('/api/alerts', authMiddleware, alertsRoutes);
app.use('/api/sites', authMiddleware, sitesRoutes);
app.use('/api/payments', authMiddleware, paymentsRoutes);
app.use('/api/checkin', authMiddleware, checkinRoutes);
app.use('/api/checkout', authMiddleware, checkoutRoutes);
app.use('/api/onboarding', authMiddleware, onboardingRoutes);
app.use('/api/messages', authMiddleware, messagesRoutes);

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: 'Rota não encontrada.',
  });
});

// ---- Error Handler Global ----
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message || err);
  res.status(500).json({
    success: false,
    data: null,
    error: 'Erro interno do servidor.',
  });
});

// ---- Start Server & Socket.IO ----
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// State for Half-Duplex (Who is speaking in which room)
const activeSpeakers = new Map<string, string>(); // room -> socket.id

io.on('connection', (socket) => {
  console.log(`[Socket.io] Connected: ${socket.id}`);

  // Join a tactical channel
  socket.on('join-channel', (channel: string) => {
    socket.join(channel);
    console.log(`[Socket.io] ${socket.id} joined ${channel}`);
  });

  // Leave a tactical channel
  socket.on('leave-channel', (channel: string) => {
    socket.leave(channel);
    if (activeSpeakers.get(channel) === socket.id) {
      activeSpeakers.delete(channel);
      io.to(channel).emit('speaker-stopped');
    }
  });

  // Start Voice Transmission (PTT Down)
  socket.on('start-speaking', (channel: string, callback?: (allowed: boolean) => void) => {
    if (!activeSpeakers.has(channel)) {
      activeSpeakers.set(channel, socket.id);
      socket.broadcast.to(channel).emit('speaker-started', socket.id);
      if (callback) callback(true);
    } else {
      // Channel is busy! "Um derruba o outro"
      if (callback) callback(false);
    }
  });

  // Stop Voice Transmission (PTT Up)
  socket.on('stop-speaking', (channel: string) => {
    if (activeSpeakers.get(channel) === socket.id) {
      activeSpeakers.delete(channel);
      socket.broadcast.to(channel).emit('speaker-stopped');
    }
  });

  // Relay Audio Chunks
  socket.on('audio-chunk', (channel: string, audioData: ArrayBuffer) => {
    // Only relay if this socket is the active speaker
    if (activeSpeakers.get(channel) === socket.id) {
      socket.broadcast.to(channel).emit('audio-chunk', audioData);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Disconnected: ${socket.id}`);
    // Cleanup any rooms this socket was speaking in
    for (const [channel, speakerId] of activeSpeakers.entries()) {
      if (speakerId === socket.id) {
        activeSpeakers.delete(channel);
        io.to(channel).emit('speaker-stopped');
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🛡️  Alpha360 API v1.0.0               ║
║   🚀 Rodando em http://localhost:${PORT}    ║
║   📦 Multi-tenant habilitado            ║
║   🔐 JWT Auth ativo                     ║
║   📻 Socket.IO PTT Ativado              ║
╚══════════════════════════════════════════╝
  `);
});

export default app;
