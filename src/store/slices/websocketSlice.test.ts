import { describe, it, expect } from 'vitest';
import websocketReducer, { setConnectionState, setReconnectAttempts, setLastHeartbeat, setPort, initialState } from './websocketSlice';

describe('websocketSlice reducers', () => {
  it('should set connection state to connected', () => {
    const state = websocketReducer(initialState, setConnectionState('connected'));
    expect(state.state).toBe('connected');
  });

  it('should set connection state to reconnecting', () => {
    const state = websocketReducer(initialState, setConnectionState('reconnecting'));
    expect(state.state).toBe('reconnecting');
  });

  it('should set connection state to offline', () => {
    const state = websocketReducer(initialState, setConnectionState('offline'));
    expect(state.state).toBe('offline');
  });

  it('should update reconnect attempts', () => {
    const state = websocketReducer(initialState, setReconnectAttempts(5));
    expect(state.reconnectAttempts).toBe(5);
  });

  it('should update last heartbeat timestamp', () => {
    const timestamp = Date.now();
    const state = websocketReducer(initialState, setLastHeartbeat(timestamp));
    expect(state.lastHeartbeat).toBe(timestamp);
  });

  it('should update port', () => {
    const state = websocketReducer(initialState, setPort(8080));
    expect(state.port).toBe(8080);
  });

  it('should handle state transitions correctly', () => {
    let state = initialState;
    
    state = websocketReducer(state, setConnectionState('connected'));
    expect(state.state).toBe('connected');
    expect(state.reconnectAttempts).toBe(0);
    
    state = websocketReducer(state, setConnectionState('reconnecting'));
    expect(state.state).toBe('reconnecting');
    
    state = websocketReducer(state, setReconnectAttempts(3));
    expect(state.reconnectAttempts).toBe(3);
    
    state = websocketReducer(state, setConnectionState('offline'));
    expect(state.state).toBe('offline');
  });
});

