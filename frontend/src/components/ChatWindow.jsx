import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { socket } from '../socket/socket.js';
import {
  addMessage,
  setAiTyping,
  setConnected,
  setHistory,
  setRoomInfo,
  upsertStreamingAiMessage,
} from '../store/slices/chatSlice.js';

import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';

export default function ChatWindow() {
  const dispatch = useDispatch();
  const roomInfo = useSelector((s) => s.chat.roomInfo);
  const messages = useSelector((s) => s.chat.messages);
  const aiTyping = useSelector((s) => s.chat.typingStatus.aiTyping);
  const connected = useSelector((s) => s.chat.connectionStatus.connected);

  const [input, setInput] = useState('');

  const listRef = useRef(null);

  const createId = () => {
    const fn = globalThis.crypto?.randomUUID;
    if (typeof fn === 'function') return fn.call(globalThis.crypto);
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const ownName = useMemo(() => roomInfo?.name, [roomInfo]);

  useEffect(() => {
    const onConnect = () => dispatch(setConnected(true));
    const onDisconnect = () => dispatch(setConnected(false));

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('room_joined', ({ roomId, name, history }) => {
      dispatch(setRoomInfo({ roomId, name }));
      dispatch(setHistory(history || []));
    });

    socket.on('new_message', (msg) => {
      dispatch(addMessage(msg));
    });

    socket.on('system_message', (msg) => {
      dispatch(addMessage(msg));
    });

    socket.on('ai_typing', ({ typing }) => {
      dispatch(setAiTyping(typing));
    });

    socket.on('ai_message_start', (msg) => {
      dispatch(upsertStreamingAiMessage(msg));
    });

    socket.on('ai_message_chunk', ({ id, content }) => {
      dispatch(upsertStreamingAiMessage({ id, role: 'assistant', name: 'AI', content }));
    });

    socket.on('error_message', ({ message }) => {
      dispatch(
        addMessage({
          id: createId(),
          role: 'system',
          content: message || 'Error',
          ts: Date.now(),
        })
      );
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_joined');
      socket.off('new_message');
      socket.off('system_message');
      socket.off('ai_typing');
      socket.off('ai_message_start');
      socket.off('ai_message_chunk');
      socket.off('error_message');
    };
  }, [dispatch]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, aiTyping]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    if (!roomInfo?.roomId) return;

    socket.emit('send_message', {
      roomId: roomInfo.roomId,
      name: roomInfo.name,
      message: text,
    });

    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-slate-800 bg-slate-950/40">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Room</div>
            <div className="font-semibold">{roomInfo.roomId}</div>
          </div>
          <div className={`text-xs ${connected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isOwn={m.role === 'user' && (m.name || '') === (ownName || '')}
              />
            ))}
            <TypingIndicator visible={aiTyping} />
          </div>

          <div className="border-t border-slate-800 bg-slate-950/40 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                className="flex-1 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
                placeholder="Type a message..."
              />
              <button
                onClick={send}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 transition px-4 py-2 font-medium"
              >
                Send
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              AI responses stream in real-time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
