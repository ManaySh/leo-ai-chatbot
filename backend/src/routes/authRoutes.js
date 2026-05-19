import { Router } from 'express';
import crypto from 'crypto';

import { createUser, getUserByEmail, updatePassword, verifyPassword } from '../services/userService.js';
import { redis } from '../config/redis.js';
import { sendPasswordResetEmail } from '../services/mailService.js';
import { requireAuth, signAccessToken } from '../middleware/authMiddleware.js';

const router = Router();

const RESET_TOKEN_TTL_SECONDS = 60 * 15;

function resetKey(token) {
  return `auth:reset:${token}`;
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24,
  });
}

router.post('/register', async (req, res) => {
  const { email, name, password } = req.body || {};
  try {
    const user = await createUser({ email, name, password });
    const token = signAccessToken({ email: user.email, name: user.name });
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Register failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  try {
    const user = await verifyPassword(email, password);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signAccessToken({ email: user.email, name: user.name });
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const email = req.user?.email;
  const user = await getUserByEmail(email);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  res.json({ user: { email: user.email, name: user.name } });
});

router.post('/forgot', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

  if (!email) {
    res.json({ ok: true });
    return;
  }

  const user = await getUserByEmail(email);
  if (!user) {
    res.json({ ok: true });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(resetKey(token), email, 'EX', RESET_TOKEN_TTL_SECONDS);

  const resetUrl = `${frontendUrl}/reset?token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail({ to: email, resetUrl });
  } catch {
    res.status(500).json({ message: 'Failed to send reset email' });
    return;
  }

  res.json({ ok: true });
});

router.post('/reset', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.newPassword || '');

  if (!token || !newPassword) {
    res.status(400).json({ message: 'token and newPassword are required' });
    return;
  }

  const email = await redis.get(resetKey(token));
  if (!email) {
    res.status(400).json({ message: 'Invalid or expired token' });
    return;
  }

  try {
    const user = await updatePassword(email, newPassword);
    await redis.del(resetKey(token));

    const jwtToken = signAccessToken({ email: user.email, name: user.name });
    setAuthCookie(res, jwtToken);

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Reset failed' });
  }
});

export default router;
