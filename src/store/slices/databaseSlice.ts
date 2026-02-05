import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Chat {
  id: number;
  title: string;
  lastMessageAt: number;
  unreadCount: number;
}

export interface Message {
  id: number;
  chatId: number;
  ts: number;
  sender: string;
  body: string;
}

interface DatabaseState {
  isInitialized: boolean;
  chats: Chat[];
  messages: Record<number, Message[]>;
  hasMoreChats: boolean;
  hasMoreMessages: Record<number, boolean>;
  isLoading: boolean;
}

const initialState: DatabaseState = {
  isInitialized: false,
  chats: [],
  messages: {},
  hasMoreChats: true,
  hasMoreMessages: {},
  isLoading: false,
};

export const initializeDatabase = createAsyncThunk('database/initialize', async () => {
  if (!window.apiAdapter) {
    throw new Error('API adapter not available');
  }
  const result = await window.apiAdapter.dbInit();
  if (result && typeof result === 'object' && 'success' in result) {
    return result;
  }
});

export const seedDatabase = createAsyncThunk('database/seed', async () => {
  if (!window.apiAdapter) {
    throw new Error('API adapter not available');
  }
  const result = await window.apiAdapter.dbSeed();
  if (result && typeof result === 'object' && 'success' in result) {
    return result;
  }
});

export const loadChats = createAsyncThunk('database/loadChats', async (params: { limit: number; offset: number }) => {
  if (!window.apiAdapter) {
    throw new Error('API adapter not available');
  }
  const chats = await window.apiAdapter.dbGetChats(params.limit, params.offset);
  return chats;
});

export const loadMessages = createAsyncThunk(
  'database/loadMessages',
  async (params: { chatId: number; limit: number; offset: number }) => {
    if (!window.apiAdapter) {
      throw new Error('API adapter not available');
    }
    const messages = await window.apiAdapter.dbGetMessages(params.chatId, params.limit, params.offset);
    return { chatId: params.chatId, messages };
  }
);

export const searchMessages = createAsyncThunk(
  'database/searchMessages',
  async (params: { chatId: number; query: string }) => {
    if (!window.apiAdapter) {
      throw new Error('API adapter not available');
    }
    const messages = await window.apiAdapter.dbSearchMessages(params.chatId, params.query);
    return { chatId: params.chatId, messages };
  }
);

export const markChatAsRead = createAsyncThunk('database/markChatAsRead', async (chatId: number) => {
  if (!window.apiAdapter) {
    throw new Error('API adapter not available');
  }
  await window.apiAdapter.dbMarkChatAsRead(chatId);
  return chatId;
});

const databaseSlice = createSlice({
  name: 'database',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<{ chatId: number; message: Message; isSelected?: boolean }>) => {
      const { chatId, message, isSelected = false } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      const existingIndex = state.messages[chatId].findIndex((m) => m.id === message.id);
      if (existingIndex === -1) {
        state.messages[chatId].push(message);
        state.messages[chatId].sort((a, b) => a.ts - b.ts);
      }

      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.lastMessageAt = message.ts;
        if (!isSelected) {
          chat.unreadCount += 1;
        }
        state.chats.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      }
    },
    clearMessages: (state, action: PayloadAction<number>) => {
      delete state.messages[action.payload];
      delete state.hasMoreMessages[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeDatabase.fulfilled, (state) => {
        state.isInitialized = true;
      })
      .addCase(loadChats.fulfilled, (state, action) => {
        if (action.payload.length === 0) {
          state.hasMoreChats = false;
        } else {
          const existingIds = new Set(state.chats.map((c) => c.id));
          const newChats = action.payload.filter((c) => !existingIds.has(c.id));
          state.chats.push(...newChats);
          state.chats.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
          state.hasMoreChats = action.payload.length >= 50;
        }
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        const existingIds = new Set(state.messages[chatId].map((m) => m.id));
        const newMessages = messages.filter((m) => !existingIds.has(m.id));
        state.messages[chatId].push(...newMessages);
        state.messages[chatId].sort((a, b) => a.ts - b.ts);
        state.hasMoreMessages[chatId] = messages.length >= 50;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;
        state.messages[chatId] = messages;
        state.hasMoreMessages[chatId] = false;
      })
      .addCase(markChatAsRead.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c.id === action.payload);
        if (chat) {
          chat.unreadCount = 0;
        }
      });
  },
});

export const { addMessage, clearMessages } = databaseSlice.actions;
export default databaseSlice.reducer;

