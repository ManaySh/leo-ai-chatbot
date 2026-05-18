import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setRoomInfo } from '../store/slices/chatSlice.js';

export default function RoomJoin({ onJoin }) {
  const dispatch = useDispatch();
  const roomInfo = useSelector((s) => s.chat.roomInfo);

  const initialName = useMemo(() => roomInfo?.name || '', [roomInfo]);
  const initialRoomId = useMemo(() => roomInfo?.roomId || 'main', [roomInfo]);

  const [name, setName] = useState(initialName);
  const [roomId, setRoomId] = useState(initialRoomId);

  const join = () => {
    const trimmedName = String(name || '').trim();
    const trimmedRoomId = String(roomId || '').trim();
    if (!trimmedRoomId) return;

    dispatch(setRoomInfo({ name: trimmedName, roomId: trimmedRoomId }));
    onJoin({ name: trimmedName, roomId: trimmedRoomId });
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-xs text-slate-400">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
              placeholder="e.g. Manay"
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-xs text-slate-400">Room</label>
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
              placeholder="e.g. main"
            />
          </div>
          <button
            onClick={join}
            className="w-full md:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 transition px-5 py-2 font-medium"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
