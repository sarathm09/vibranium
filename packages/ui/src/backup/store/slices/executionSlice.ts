/**
 * Execution state management with Redux Toolkit
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  ExecutionState,
  ExecutionSession,
  QueuedExecution,
  ActiveStep,
  ExecutionLog,
  ExecutionProgress,
  VariableState,
  Breakpoint,
  ExecutionSettings,
  ConnectionStatus,
  ExecutionMetrics,
} from '../../types/execution';

/**
 * Initial execution state
 */
const initialState: ExecutionState = {
  session: null,
  queue: [],
  history: [],
  activeExecutions: new Set(),
  settings: {
    autoStart: false,
    maxConcurrentExecutions: 3,
    defaultTimeout: 30000,
    realTimeUpdates: true,
    updateInterval: 1000,
    autoRetry: false,
    saveHistory: true,
    maxHistoryEntries: 100,
    notifications: {
      enabled: true,
      onCompletion: true,
      onFailure: true,
      onError: true,
      soundEnabled: false,
      browserNotifications: false,
    },
  },
  connectionStatus: 'disconnected',
  metrics: {
    totalExecutions: 0,
    activeExecutions: 0,
    queuedExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0,
    resourceUsage: {
      memoryUsage: 0,
      cpuUsage: 0,
      networkActivity: {
        bytesReceived: 0,
        bytesSent: 0,
        requestCount: 0,
        errorCount: 0,
      },
    },
    performance: {
      cpuUsage: 0,
      memoryUsage: 0,
      networkThroughput: 0,
      activeConnections: 0,
      requestRate: 0,
      errorRate: 0,
    },
  },
};

/**
 * Async thunks for execution operations
 */

// Start execution session
export const startExecutionSession = createAsyncThunk(
  'execution/startSession',
  async (sessionConfig: Partial<ExecutionSession>) => {
    // This would connect to the CLI engine via WebSocket
    const session: ExecutionSession = {
      id: crypto.randomUUID(),
      name: sessionConfig.name || 'Untitled Session',
      type: sessionConfig.type || 'single',
      status: 'pending' as const,
      scenarios: sessionConfig.scenarios || [],
      environment: sessionConfig.environment || 'default',
      config: {
        maxConcurrency: 1,
        timeout: 30000,
        retryPolicy: {
          enabled: false,
          maxAttempts: 3,
          delay: 1000,
          exponentialBackoff: true,
          conditions: [],
        },
        stopOnFailure: false,
        continueOnError: true,
        generateArtifacts: true,
        realTimeReporting: true,
        debugMode: false,
        variableOverrides: {},
        ...sessionConfig.config,
      },
      startedAt: new Date(),
      progress: {
        overall: 0,
        currentScenario: 0,
        totalScenarios: sessionConfig.scenarios?.length || 0,
        completedScenarios: 0,
        currentStep: 0,
        totalSteps: 0,
        completedSteps: 0,
        estimatedTimeRemaining: 0,
        elapsedTime: 0,
      },
      results: [],
      currentSteps: [],
      logs: [],
      resources: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkActivity: {
          bytesReceived: 0,
          bytesSent: 0,
          requestCount: 0,
          errorCount: 0,
        },
      },
      variables: {
        global: {},
        environment: {},
        context: {},
        response: {},
        request: {},
        random: {},
        aliases: {},
        history: [],
      },
      breakpoints: [],
    };

    return session;
  }
);

// Stop execution session
export const stopExecutionSession = createAsyncThunk(
  'execution/stopSession',
  async (sessionId: string) => {
    // This would send stop command via WebSocket
    return sessionId;
  }
);

// Pause execution session
export const pauseExecutionSession = createAsyncThunk(
  'execution/pauseSession',
  async (sessionId: string) => {
    // This would send pause command via WebSocket
    return sessionId;
  }
);

// Resume execution session
export const resumeExecutionSession = createAsyncThunk(
  'execution/resumeSession',
  async (sessionId: string) => {
    // This would send resume command via WebSocket
    return sessionId;
  }
);

// Add execution to queue
export const queueExecution = createAsyncThunk(
  'execution/queueExecution',
  async (queueConfig: Partial<QueuedExecution>) => {
    const queuedExecution: QueuedExecution = {
      id: crypto.randomUUID(),
      name: queueConfig.name || 'Untitled Execution',
      scenarios: queueConfig.scenarios || [],
      environment: queueConfig.environment || 'default',
      config: {
        maxConcurrency: 1,
        timeout: 30000,
        retryPolicy: {
          enabled: false,
          maxAttempts: 3,
          delay: 1000,
          exponentialBackoff: true,
          conditions: [],
        },
        stopOnFailure: false,
        continueOnError: true,
        generateArtifacts: true,
        realTimeReporting: true,
        debugMode: false,
        variableOverrides: {},
        ...queueConfig.config,
      },
      priority: queueConfig.priority || 1,
      scheduledAt: queueConfig.scheduledAt,
      createdAt: new Date(),
      status: 'pending',
      dependencies: queueConfig.dependencies || [],
    };

    return queuedExecution;
  }
);

/**
 * Execution slice
 */
const executionSlice = createSlice({
  name: 'execution',
  initialState,
  reducers: {
    // Session management
    updateSessionStatus: (state, action: PayloadAction<{ sessionId: string; status: any }>) => {
      if (state.session && state.session.id === action.payload.sessionId) {
        state.session.status = action.payload.status;
      }
    },

    updateSessionProgress: (state, action: PayloadAction<{ sessionId: string; progress: ExecutionProgress }>) => {
      if (state.session && state.session.id === action.payload.sessionId) {
        state.session.progress = action.payload.progress;
      }
    },

    // Step management
    addActiveStep: (state, action: PayloadAction<ActiveStep>) => {
      if (state.session) {
        state.session.currentSteps.push(action.payload);
      }
    },

    updateActiveStep: (state, action: PayloadAction<{ stepId: string; updates: Partial<ActiveStep> }>) => {
      if (state.session) {
        const stepIndex = state.session.currentSteps.findIndex(step => step.id === action.payload.stepId);
        if (stepIndex !== -1) {
          state.session.currentSteps[stepIndex] = {
            ...state.session.currentSteps[stepIndex],
            ...action.payload.updates,
          };
        }
      }
    },

    removeActiveStep: (state, action: PayloadAction<string>) => {
      if (state.session) {
        state.session.currentSteps = state.session.currentSteps.filter(step => step.id !== action.payload);
      }
    },

    // Logging
    addLog: (state, action: PayloadAction<ExecutionLog>) => {
      if (state.session) {
        state.session.logs.push(action.payload);
        // Keep only recent logs to prevent memory issues
        if (state.session.logs.length > 1000) {
          state.session.logs = state.session.logs.slice(-1000);
        }
      }
    },

    clearLogs: (state) => {
      if (state.session) {
        state.session.logs = [];
      }
    },

    // Variable management
    updateVariable: (state, action: PayloadAction<{ path: string; value: any; source?: string }>) => {
      if (state.session) {
        const { path, value, source } = action.payload;
        const pathParts = path.split('.');
        const category = pathParts[0] as keyof VariableState;
        
        if (category in state.session.variables) {
          const variablePath = pathParts.slice(1).join('.');
          
          // Record variable change
          const change = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            path,
            oldValue: state.session.variables[category][variablePath],
            newValue: value,
            sourceStep: source,
            reason: 'manual_update',
          };
          
          state.session.variables.history.push(change);
          
          // Update the variable
          if (variablePath) {
            state.session.variables[category][variablePath] = value;
          }
        }
      }
    },

    // Breakpoint management
    addBreakpoint: (state, action: PayloadAction<Breakpoint>) => {
      if (state.session) {
        state.session.breakpoints.push(action.payload);
      }
    },

    removeBreakpoint: (state, action: PayloadAction<string>) => {
      if (state.session) {
        state.session.breakpoints = state.session.breakpoints.filter(bp => bp.id !== action.payload);
      }
    },

    toggleBreakpoint: (state, action: PayloadAction<string>) => {
      if (state.session) {
        const breakpoint = state.session.breakpoints.find(bp => bp.id === action.payload);
        if (breakpoint) {
          breakpoint.enabled = !breakpoint.enabled;
        }
      }
    },

    // Queue management
    updateQueueItem: (state, action: PayloadAction<{ id: string; updates: Partial<QueuedExecution> }>) => {
      const queueIndex = state.queue.findIndex(item => item.id === action.payload.id);
      if (queueIndex !== -1) {
        state.queue[queueIndex] = {
          ...state.queue[queueIndex],
          ...action.payload.updates,
        };
      }
    },

    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
    },

    clearQueue: (state) => {
      state.queue = [];
    },

    // History management
    addToHistory: (state, action: PayloadAction<ExecutionSession>) => {
      state.history.unshift(action.payload);
      // Keep only recent history entries
      if (state.history.length > state.settings.maxHistoryEntries) {
        state.history = state.history.slice(0, state.settings.maxHistoryEntries);
      }
    },

    clearHistory: (state) => {
      state.history = [];
    },

    // Settings management
    updateSettings: (state, action: PayloadAction<Partial<ExecutionSettings>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    // Connection status
    updateConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },

    // Metrics
    updateMetrics: (state, action: PayloadAction<Partial<ExecutionMetrics>>) => {
      state.metrics = {
        ...state.metrics,
        ...action.payload,
      };
    },

    // Reset state
    resetExecution: (state) => {
      state.session = null;
      state.queue = [];
      state.activeExecutions = new Set();
    },
  },
  extraReducers: (builder) => {
    builder
      // Start execution session
      .addCase(startExecutionSession.pending, (state) => {
        state.connectionStatus = 'connecting';
      })
      .addCase(startExecutionSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.activeExecutions.add(action.payload.id);
        state.connectionStatus = 'connected';
        state.metrics.activeExecutions = state.activeExecutions.size;
      })
      .addCase(startExecutionSession.rejected, (state) => {
        state.connectionStatus = 'error';
      })

      // Stop execution session
      .addCase(stopExecutionSession.fulfilled, (state, action) => {
        if (state.session && state.session.id === action.payload) {
          state.session.status = 'cancelled';
          state.session.endedAt = new Date();
          state.activeExecutions.delete(action.payload);
          state.metrics.activeExecutions = state.activeExecutions.size;
          
          // Move to history
          if (state.settings.saveHistory) {
            state.history.unshift(state.session);
          }
          
          state.session = null;
        }
      })

      // Pause execution session
      .addCase(pauseExecutionSession.fulfilled, (state, action) => {
        if (state.session && state.session.id === action.payload) {
          state.session.status = 'paused' as any;
        }
      })

      // Resume execution session
      .addCase(resumeExecutionSession.fulfilled, (state, action) => {
        if (state.session && state.session.id === action.payload) {
          state.session.status = 'running' as any;
        }
      })

      // Queue execution
      .addCase(queueExecution.fulfilled, (state, action) => {
        state.queue.push(action.payload);
        state.metrics.queuedExecutions = state.queue.length;
      });
  },
});

export const {
  updateSessionStatus,
  updateSessionProgress,
  addActiveStep,
  updateActiveStep,
  removeActiveStep,
  addLog,
  clearLogs,
  updateVariable,
  addBreakpoint,
  removeBreakpoint,
  toggleBreakpoint,
  updateQueueItem,
  removeFromQueue,
  clearQueue,
  addToHistory,
  clearHistory,
  updateSettings,
  updateConnectionStatus,
  updateMetrics,
  resetExecution,
} = executionSlice.actions;

export default executionSlice.reducer;