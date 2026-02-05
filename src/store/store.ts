import { configureStore } from '@reduxjs/toolkit';
import databaseReducer from './slices/databaseSlice';
import websocketReducer from './slices/websocketSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    database: databaseReducer,
    websocket: websocketReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

