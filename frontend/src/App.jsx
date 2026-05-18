import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';

import { fetchMe, logoutUser } from './store/slices/authSlice.js';
import { socket } from './socket/socket.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Forgot from './pages/Forgot.jsx';
import Reset from './pages/Reset.jsx';

import RoomJoin from './components/RoomJoin.jsx';
import ChatWindow from './components/ChatWindow.jsx';

function ProtectedChat() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) return;
    socket.connect();
    return () => socket.disconnect();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-800 bg-slate-950/40">
        <div className="max-w-4xl mx-auto p-3 flex items-center justify-between">
          <div className="text-sm text-slate-300">Signed in as {user.name || user.email}</div>
          <button
            onClick={() => dispatch(logoutUser())}
            className="text-xs rounded-lg border border-slate-700 px-3 py-1 hover:bg-slate-900"
          >
            Logout
          </button>
        </div>
      </div>
      <RoomJoin onJoin={({ name, roomId }) => socket.emit('join_room', { name, roomId })} />
      <ChatWindow />
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/chat" element={<ProtectedChat />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}
