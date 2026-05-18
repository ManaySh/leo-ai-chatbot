import { redis } from '../config/redis.js';

const TTL_SECONDS = 60 * 60 * 24;

function roomKey(roomId) {
  return `chat:room:${roomId}:messages`;
}

export async function getRoomHistory(roomId, limit = 20) {
  const key = roomKey(roomId);
  const raw = await redis.get(key);
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];
  return parsed.slice(-limit);
}

export async function pushRoomMessages(roomId, newMessages, limit = 20) {
  const key = roomKey(roomId);
  const existing = await getRoomHistory(roomId, limit);

  const merged = [...existing, ...(newMessages || [])].slice(-limit);

  await redis.set(key, JSON.stringify(merged), 'EX', TTL_SECONDS);

  return merged;
}
