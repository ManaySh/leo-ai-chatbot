import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { registerUser } from '../store/slices/authSlice.js';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector((s) => s.auth.status);
  const error = useSelector((s) => s.auth.error);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(registerUser({ email, name, password })).unwrap();
      navigate('/chat');
    } catch {
      // handled by slice
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
        <div className="text-xl font-semibold">Create account</div>
        <div className="mt-1 text-sm text-slate-400">Register to start chatting.</div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
              placeholder="you@example.com"
              type="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
              type="password"
              required
            />
          </div>

          {error && <div className="text-sm text-rose-400">{error}</div>}

          <button
            disabled={status === 'loading'}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition px-4 py-2 font-medium"
            type="submit"
          >
            Register
          </button>

          <div className="text-sm text-slate-400">
            Already have an account? <Link className="hover:text-slate-200" to="/login">Login</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
