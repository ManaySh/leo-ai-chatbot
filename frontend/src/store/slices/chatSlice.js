import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roomInfo: {
    roomId: null,
    name: null,
  },
  messages: [],
  typingStatus: {
    aiTyping: false,
  },
  connectionStatus: {
    connected: false,
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setRoomInfo(state, action) {
      state.roomInfo = action.payload;
    },
    setHistory(state, action) {
      state.messages = action.payload || [];
    },
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    setAiTyping(state, action) {
      state.typingStatus.aiTyping = Boolean(action.payload);
    },
    setConnected(state, action) {
      state.connectionStatus.connected = Boolean(action.payload);
    },
    upsertStreamingAiMessage(state, action) {
      const { id, role, name, content, ts } = action.payload;
      const idx = state.messages.findIndex((m) => m.id === id);
      if (idx === -1) {
        state.messages.push({ id, role, name, content, ts });
      } else {
        state.messages[idx] = { ...state.messages[idx], content };
      }
    },
  },
});

export const {
  setRoomInfo,
  setHistory,
  addMessage,
  setAiTyping,
  setConnected,
  upsertStreamingAiMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
