/**
 * WebSocket state management for real-time communication
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  ConnectionStatus,
  WebSocketEvent,
  ExecutionCommand,
  CommandType,
} from '../../types/execution';

/**
 * WebSocket state
 */
interface WebSocketState {
  /** Connection status */
  status: ConnectionStatus;
  
  /** WebSocket URL */
  url: string | null;
  
  /** Connection attempts */
  connectionAttempts: number;
  
  /** Max reconnection attempts */
  maxReconnectionAttempts: number;
  
  /** Reconnection delay (ms) */
  reconnectionDelay: number;
  
  /** Last error */
  lastError: string | null;
  
  /** Connected timestamp */
  connectedAt: Date | null;
  
  /** Disconnected timestamp */
  disconnectedAt: Date | null;
  
  /** Message queue for offline messages */
  messageQueue: ExecutionCommand[];
  
  /** Event history */
  eventHistory: WebSocketEvent[];
  
  /** Subscriptions */
  subscriptions: Set<string>;
  
  /** Ping/pong tracking */
  lastPing: Date | null;
  lastPong: Date | null;
  
  /** Connection metrics */
  metrics: {
    messagesReceived: number;
    messagesSent: number;
    reconnections: number;
    totalUptime: number;
    averageLatency: number;
  };
}

/**
 * Initial WebSocket state
 */
const initialState: WebSocketState = {
  status: 'disconnected',
  url: null,
  connectionAttempts: 0,
  maxReconnectionAttempts: 10,
  reconnectionDelay: 1000,
  lastError: null,
  connectedAt: null,
  disconnectedAt: null,
  messageQueue: [],
  eventHistory: [],
  subscriptions: new Set(),
  lastPing: null,
  lastPong: null,
  metrics: {
    messagesReceived: 0,
    messagesSent: 0,
    reconnections: 0,
    totalUptime: 0,
    averageLatency: 0,
  },
};

/**
 * Async thunks for WebSocket operations
 */

// Connect to WebSocket
export const connectWebSocket = createAsyncThunk(
  'websocket/connect',
  async (url: string, { rejectWithValue }) => {
    try {
      // This would initialize the actual WebSocket connection
      // For now, we'll simulate a connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        url,
        connectedAt: new Date(),
      };
    } catch (error) {
      return rejectWithValue(`Failed to connect to ${url}: ${error}`);
    }
  }
);

// Disconnect WebSocket
export const disconnectWebSocket = createAsyncThunk(
  'websocket/disconnect',
  async () => {
    // This would close the actual WebSocket connection
    return {
      disconnectedAt: new Date(),
    };
  }
);

// Send command via WebSocket
export const sendCommand = createAsyncThunk(
  'websocket/sendCommand',
  async (command: Omit<ExecutionCommand, 'requestId' | 'timestamp'>, { getState, rejectWithValue }) => {
    const state = getState() as { websocket: WebSocketState };
    
    if (state.websocket.status !== 'connected') {
      return rejectWithValue('WebSocket not connected');
    }
    
    const fullCommand: ExecutionCommand = {
      ...command,
      requestId: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    // This would send the command via the actual WebSocket
    // For now, we'll simulate sending
    
    return fullCommand;
  }
);

// Subscribe to events
export const subscribeToEvents = createAsyncThunk(
  'websocket/subscribe',
  async (eventTypes: string[]) => {
    // This would subscribe to specific event types
    return eventTypes;
  }
);

// Unsubscribe from events
export const unsubscribeFromEvents = createAsyncThunk(
  'websocket/unsubscribe',
  async (eventTypes: string[]) => {
    // This would unsubscribe from specific event types
    return eventTypes;
  }
);

/**
 * WebSocket slice
 */
const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    // Connection status updates
    connectionStatusChanged: (state, action: PayloadAction<ConnectionStatus>) => {
      state.status = action.payload;
      
      if (action.payload === 'connected') {
        state.connectedAt = new Date();
        state.connectionAttempts = 0;
        state.lastError = null;
      } else if (action.payload === 'disconnected') {
        state.disconnectedAt = new Date();
      }
    },

    // Message handling
    messageReceived: (state, action: PayloadAction<WebSocketEvent>) => {
      state.eventHistory.push(action.payload);
      state.metrics.messagesReceived += 1;
      
      // Keep only recent events to prevent memory issues
      if (state.eventHistory.length > 1000) {
        state.eventHistory = state.eventHistory.slice(-1000);
      }
    },

    messageSent: (state, action: PayloadAction<ExecutionCommand>) => {
      state.metrics.messagesSent += 1;
    },

    // Queue management
    queueMessage: (state, action: PayloadAction<ExecutionCommand>) => {
      state.messageQueue.push(action.payload);
    },

    clearMessageQueue: (state) => {
      state.messageQueue = [];
    },

    processMessageQueue: (state) => {
      // Process queued messages when connection is restored
      if (state.status === 'connected') {
        state.messageQueue = [];
      }
    },

    // Error handling
    connectionError: (state, action: PayloadAction<string>) => {
      state.lastError = action.payload;
      state.status = 'error';
    },

    // Ping/pong tracking
    pingReceived: (state) => {
      state.lastPing = new Date();
    },

    pongReceived: (state) => {
      state.lastPong = new Date();
      
      // Calculate latency
      if (state.lastPing) {
        const latency = state.lastPong.getTime() - state.lastPing.getTime();
        state.metrics.averageLatency = 
          (state.metrics.averageLatency + latency) / 2;
      }
    },

    // Subscription management
    addSubscription: (state, action: PayloadAction<string>) => {
      state.subscriptions.add(action.payload);
    },

    removeSubscription: (state, action: PayloadAction<string>) => {
      state.subscriptions.delete(action.payload);
    },

    clearSubscriptions: (state) => {
      state.subscriptions.clear();
    },

    // Metrics updates
    updateMetrics: (state, action: PayloadAction<Partial<WebSocketState['metrics']>>) => {
      state.metrics = {
        ...state.metrics,
        ...action.payload,
      };
    },

    // Reset state
    resetWebSocket: (state) => {
      return {
        ...initialState,
        url: state.url, // Preserve URL
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect WebSocket
      .addCase(connectWebSocket.pending, (state) => {
        state.status = 'connecting';
        state.connectionAttempts += 1;
        state.lastError = null;
      })
      .addCase(connectWebSocket.fulfilled, (state, action) => {
        state.status = 'connected';
        state.url = action.payload.url;
        state.connectedAt = action.payload.connectedAt;
        state.connectionAttempts = 0;
        state.lastError = null;
      })
      .addCase(connectWebSocket.rejected, (state, action) => {
        state.status = 'error';
        state.lastError = action.payload as string;
      })

      // Disconnect WebSocket
      .addCase(disconnectWebSocket.fulfilled, (state, action) => {
        state.status = 'disconnected';
        state.disconnectedAt = action.payload.disconnectedAt;
        state.subscriptions.clear();
        state.messageQueue = [];
      })

      // Send command
      .addCase(sendCommand.fulfilled, (state, action) => {
        state.metrics.messagesSent += 1;
      })
      .addCase(sendCommand.rejected, (state, action) => {
        // Queue message for retry if connection is lost
        state.lastError = action.payload as string;
      })

      // Subscribe to events
      .addCase(subscribeToEvents.fulfilled, (state, action) => {
        action.payload.forEach(eventType => {
          state.subscriptions.add(eventType);
        });
      })

      // Unsubscribe from events
      .addCase(unsubscribeFromEvents.fulfilled, (state, action) => {
        action.payload.forEach(eventType => {
          state.subscriptions.delete(eventType);
        });
      });
  },
});

export const {
  connectionStatusChanged,
  messageReceived,
  messageSent,
  queueMessage,
  clearMessageQueue,
  processMessageQueue,
  connectionError,
  pingReceived,
  pongReceived,
  addSubscription,
  removeSubscription,
  clearSubscriptions,
  updateMetrics,
  resetWebSocket,
} = websocketSlice.actions;

export default websocketSlice.reducer;