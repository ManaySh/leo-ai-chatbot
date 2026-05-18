import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import { forgotPassword } from '../store/slices/authSlice.js';

export default function Forgot() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await dispatch(forgotPassword({ email })).unwrap();
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
        <div className="text-xl font-semibold">Forgot password</div>
        <div className="mt-1 text-sm text-slate-400">We’ll email you a reset link.</div>

        <div className="mt-6 space-y-4">
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

          {error && <div className="text-sm text-rose-400">{error}</div>}

          <button className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 transition px-4 py-2 font-medium" type="submit">
            Send reset link
          </button>

          {sent && <div className="text-sm text-emerald-400">If the email exists, a reset link has been sent.</div>}

          <div className="text-sm text-slate-400">
            <Link className="hover:text-slate-200" to="/login">Back to login</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
