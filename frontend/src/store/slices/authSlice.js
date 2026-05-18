import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

async function api(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data;
}

export const registerUser = createAsyncThunk('auth/register', async ({ email, name, password }) => {
  const data = await api('/api/auth/register', { email, name, password });
  return data.user;
});

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }) => {
  const data = await api('/api/auth/login', { email, password });
  return data.user;
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api('/api/auth/logout');
  return true;
});

export const forgotPassword = createAsyncThunk('auth/forgot', async ({ email }) => {
  await api('/api/auth/forgot', { email });
  return true;
});

export const resetPassword = createAsyncThunk('auth/reset', async ({ token, newPassword }) => {
  await api('/api/auth/reset', { token, newPassword });
  return true;
});

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Unauthorized');
  }
  return data.user;
});

const initialState = {
  user: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.user = a.payload;
      })
      .addCase(registerUser.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.error.message;
      })
      .addCase(loginUser.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.user = a.payload;
      })
      .addCase(loginUser.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.error.message;
      })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.user = a.payload;
      })
      .addCase(fetchMe.rejected, (s) => {
        s.user = null;
      })
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null;
      });
  },
});

export default authSlice.reducer;
