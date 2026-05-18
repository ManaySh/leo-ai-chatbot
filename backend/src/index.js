import http from 'http';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cookie from 'cookie';

import { registerChatHandlers } from './socket/chatHandler.js';
import { getRoomHistory } from './services/redisService.js';
import authRoutes from './routes/authRoutes.js';
import { verifyAccessToken } from './middleware/authMiddleware.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_ORIGINS,
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/rooms/:roomId/history', async (req, res) => {
  const roomId = String(req.params.roomId || '').trim().slice(0, 64);
  if (!roomId) {
    res.status(400).json({ message: 'roomId is required' });
    return;
  }

  try {
    const history = await getRoomHistory(roomId, 20);
    res.json({ roomId, history });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Redis error' });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGINS,
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const rawCookie = socket.handshake.headers?.cookie;
    if (!rawCookie) return next(new Error('Unauthorized'));

    const parsed = cookie.parse(rawCookie);
    const token = parsed?.access_token;
    if (!token) return next(new Error('Unauthorized'));

    const decoded = verifyAccessToken(token);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  registerChatHandlers(io, socket);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
