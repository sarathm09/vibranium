/**
 * Redux store configuration for execution engine
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import executionReducer from './slices/executionSlice';
import websocketReducer from './slices/websocketSlice';
import settingsReducer from './slices/settingsSlice';
import scenarioReducer from './slices/scenarioSlice';

/**
 * Configure the Redux store
 */
export const store = configureStore({
  reducer: {
    execution: executionReducer,
    websocket: websocketReducer,
    settings: settingsReducer,
    scenarios: scenarioReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for non-serializable values
        ignoredActions: [
          'execution/addActiveStep',
          'execution/updateStepProgress',
          'execution/addLog',
          'websocket/connected',
          'websocket/disconnected',
          'websocket/messageReceived',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp', 'payload.startedAt', 'payload.endedAt'],
        // Ignore these paths in the state
        ignoredPaths: [
          'execution.session.startedAt',
          'execution.session.endedAt',
          'execution.session.logs',
          'execution.session.currentSteps',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;