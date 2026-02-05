import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { addMessage } from './databaseSlice';
import { Message } from './databaseSlice';

export type ConnectionState = 'connected' | 'reconnecting' | 'offline';

interface WebSocketState {
  state: ConnectionState;
  port: number | null;
  reconnectAttempts: number;
  lastHeartbeat: number | null;
}

const initialState: WebSocketState = {
  state: 'offline',
  port: null,
  reconnectAttempts: 0,
  lastHeartbeat: null,
};

let ws: WebSocket | null = null;
let heartbeatInterval: number | null = null;
let reconnectTimeout: number | null = null;

const getBackoffDelay = (attempts: number): number => {
  return Math.min(1000 * Math.pow(2, attempts), 30000);
};

export const connectWebSocket = createAsyncThunk(
  'websocket/connect',
  async (port: number, { dispatch, getState }) => {
    return new Promise<void>((resolve, reject) => {
      const isElectron = window.electronAPI !== undefined;

      if (!isElectron) {
        dispatch(setConnectionState('connected'));
        dispatch(setReconnectAttempts(0));
        dispatch(setLastHeartbeat(Date.now()));

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        heartbeatInterval = window.setInterval(() => {
          dispatch(setLastHeartbeat(Date.now()));
        }, 10000);

        const messageHandler = (event: CustomEvent) => {
          try {
            const data = event.detail;
            const decryptedBody = atob(data.body);
            const message: Message = {
              id: data.messageId,
              chatId: data.chatId,
              ts: data.ts,
              sender: data.sender,
              body: decryptedBody,
            };
            const state = getState() as any;
            const isSelected = state.ui.selectedChatId === data.chatId;
            dispatch(addMessage({ chatId: data.chatId, message, isSelected }));
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        const closeHandler = () => {
          dispatch(setConnectionState('offline'));
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          window.removeEventListener('websocket-message', messageHandler as EventListener);
          window.removeEventListener('websocket-close', closeHandler);
        };

        window.addEventListener('websocket-message', messageHandler as EventListener);
        window.addEventListener('websocket-close', closeHandler);

        resolve();
        return;
      }

      const connect = () => {
        try {
          ws = new WebSocket(`ws://localhost:${port}`);

          ws.onopen = () => {
            dispatch(setConnectionState('connected'));
            dispatch(setReconnectAttempts(0));
            dispatch(setLastHeartbeat(Date.now()));

            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
              reconnectTimeout = null;
            }
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
            }
            heartbeatInterval = window.setInterval(() => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                dispatch(setLastHeartbeat(Date.now()));
              }
            }, 10000);

            resolve();
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              const decryptedBody = atob(data.body);
              const message: Message = {
                id: data.messageId,
                chatId: data.chatId,
                ts: data.ts,
                sender: data.sender,
                body: decryptedBody,
              };
              const state = getState() as any;
              const isSelected = state.ui.selectedChatId === data.chatId;
              dispatch(addMessage({ chatId: data.chatId, message, isSelected }));
            } catch (error) {
              console.error('Error processing message:', error);
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
          };

          ws.onclose = () => {
            dispatch(setConnectionState('offline'));
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              heartbeatInterval = null;
            }

            const state = getState() as any;
            const attempts = state.websocket.reconnectAttempts;
            const delay = getBackoffDelay(attempts);

            dispatch(setConnectionState('reconnecting'));
            dispatch(setReconnectAttempts(attempts + 1));

            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
            }
            reconnectTimeout = window.setTimeout(() => {
              reconnectTimeout = null;
              connect();
            }, delay);
          };
        } catch (error) {
          reject(error);
        }
      };

      connect();
    });
  }
);

export const simulateConnectionDrop = createAsyncThunk('websocket/simulateDrop', async () => {
  if (window.apiAdapter) {
    await window.apiAdapter.wsSimulateDrop();
  }
  if (ws) {
    ws.close();
  }
});

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      state.state = action.payload;
    },
    setReconnectAttempts: (state, action: PayloadAction<number>) => {
      state.reconnectAttempts = action.payload;
    },
    setLastHeartbeat: (state, action: PayloadAction<number>) => {
      state.lastHeartbeat = action.payload;
    },
    setPort: (state, action: PayloadAction<number>) => {
      state.port = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectWebSocket.fulfilled, (state, action) => {
        state.port = action.meta.arg;
      })
      .addCase(connectWebSocket.rejected, (state) => {
        state.state = 'offline';
      });
  },
});

export const { setConnectionState, setReconnectAttempts, setLastHeartbeat, setPort } = websocketSlice.actions;
export default websocketSlice.reducer;

