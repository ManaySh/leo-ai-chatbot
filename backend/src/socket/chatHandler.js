import { randomUUID } from 'crypto';

import { getRoomHistory, pushRoomMessages } from '../services/redisService.js';
import { streamGroqResponse } from '../services/groqService.js';

const HISTORY_LIMIT = 20;

function toRoomId(rawRoomId) {
  if (!rawRoomId) return null;
  return String(rawRoomId).trim().slice(0, 64);
}

function toName(rawName) {
  if (!rawName) return 'Anonymous';
  return String(rawName).trim().slice(0, 32) || 'Anonymous';
}

export function registerChatHandlers(io, socket) {
  let currentRoomId = null;
  let currentUserName = null;

  if (!socket.user?.email) {
    socket.emit('error_message', { message: 'Unauthorized' });
    socket.disconnect(true);
    return;
  }

  socket.on('join_room', async ({ roomId, name }) => {
    const normalizedRoomId = toRoomId(roomId);
    const normalizedName = toName(name || socket.user?.name || socket.user?.email);

    if (!normalizedRoomId) {
      socket.emit('error_message', { message: 'Room id is required.' });
      return;
    }

    if (currentRoomId) {
      socket.leave(currentRoomId);
    }

    currentRoomId = normalizedRoomId;
    currentUserName = normalizedName;

    socket.join(currentRoomId);

    const history = await getRoomHistory(currentRoomId, HISTORY_LIMIT);
    socket.emit('room_joined', {
      roomId: currentRoomId,
      name: currentUserName,
      history,
    });

    io.to(currentRoomId).emit('system_message', {
      id: randomUUID(),
      role: 'system',
      content: `${currentUserName} joined the room.`,
      ts: Date.now(),
    });
  });

  socket.on('send_message', async ({ roomId, name, message }) => {
    const normalizedRoomId = toRoomId(roomId || currentRoomId);
    const normalizedName = toName(name || currentUserName || socket.user?.name || socket.user?.email);
    const content = String(message || '').trim();

    if (!normalizedRoomId) {
      socket.emit('error_message', { message: 'Join a room first.' });
      return;
    }

    if (!content) return;

    const userMsg = {
      id: randomUUID(),
      role: 'user',
      name: normalizedName,
      content,
      ts: Date.now(),
    };

    io.to(normalizedRoomId).emit('new_message', userMsg);

    const history = await pushRoomMessages(normalizedRoomId, [userMsg], HISTORY_LIMIT);

    const aiMsgId = randomUUID();
    io.to(normalizedRoomId).emit('ai_typing', { roomId: normalizedRoomId, typing: true });
    io.to(normalizedRoomId).emit('ai_message_start', {
      id: aiMsgId,
      role: 'assistant',
      name: 'AI',
      content: '',
      ts: Date.now(),
    });

    let aiContent = '';

    try {
      for await (const delta of streamGroqResponse({
        roomId: normalizedRoomId,
        messages: history,
      })) {
        if (!delta) continue;
        aiContent += delta;
        io.to(normalizedRoomId).emit('ai_message_chunk', {
          id: aiMsgId,
          delta,
          content: aiContent,
        });
      }

      const aiMsg = {
        id: aiMsgId,
        role: 'assistant',
        name: 'AI',
        content: aiContent.trim(),
        ts: Date.now(),
      };

      io.to(normalizedRoomId).emit('ai_message_end', { id: aiMsgId });
      io.to(normalizedRoomId).emit('ai_typing', { roomId: normalizedRoomId, typing: false });

      await pushRoomMessages(normalizedRoomId, [aiMsg], HISTORY_LIMIT);
    } catch (err) {
      io.to(normalizedRoomId).emit('ai_typing', { roomId: normalizedRoomId, typing: false });
      socket.emit('error_message', {
        message: err instanceof Error ? err.message : 'AI error',
      });
    }
  });

  socket.on('disconnect', () => {
    if (currentRoomId && currentUserName) {
      io.to(currentRoomId).emit('system_message', {
        id: randomUUID(),
        role: 'system',
        content: `${currentUserName} left the room.`,
        ts: Date.now(),
      });
    }
  });
}
