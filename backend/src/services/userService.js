import bcrypt from 'bcryptjs';

import { redis } from '../config/redis.js';

function userKey(email) {
  return `user:email:${email.toLowerCase()}`;
}

export async function getUserByEmail(email) {
  if (!email) return null;
  const raw = await redis.get(userKey(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function createUser({ email, name, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedName = String(name || '').trim().slice(0, 64);
  const pwd = String(password || '');

  if (!normalizedEmail || !pwd) {
    throw new Error('Email and password are required');
  }

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(pwd, 10);

  const user = {
    email: normalizedEmail,
    name: normalizedName || normalizedEmail.split('@')[0],
    passwordHash,
    createdAt: Date.now(),
  };

  await redis.set(userKey(normalizedEmail), JSON.stringify(user));
  return { email: user.email, name: user.name };
}

export async function verifyPassword(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
  if (!ok) return null;
  return { email: user.email, name: user.name };
}

export async function updatePassword(email, newPassword) {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('User not found');

  const passwordHash = await bcrypt.hash(String(newPassword || ''), 10);
  const updated = { ...user, passwordHash, updatedAt: Date.now() };
  await redis.set(userKey(email), JSON.stringify(updated));
  return { email: updated.email, name: updated.name };
}
