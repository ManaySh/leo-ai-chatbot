import { configureStore } from '@reduxjs/toolkit';

import chatReducer from './slices/chatSlice.js';
import authReducer from './slices/authSlice.js';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
  },
});
