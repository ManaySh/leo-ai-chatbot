import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { resetPassword } from '../store/slices/authSlice.js';

export default function Reset() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = useMemo(() => params.get('token') || '', [params]);

  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await dispatch(resetPassword({ token, newPassword })).unwrap();
      navigate('/chat');
    } catch (err) {
      setError(err?.message || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
        <div className="text-xl font-semibold">Reset password</div>
        <div className="mt-1 text-sm text-slate-400">Choose a new password.</div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300">New password</label>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
              type="password"
              required
            />
          </div>

          {!token && <div className="text-sm text-rose-400">Missing reset token.</div>}
          {error && <div className="text-sm text-rose-400">{error}</div>}

          <button
            disabled={!token}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition px-4 py-2 font-medium"
            type="submit"
          >
            Reset
          </button>

          <div className="text-sm text-slate-400">
            <Link className="hover:text-slate-200" to="/login">Back to login</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
