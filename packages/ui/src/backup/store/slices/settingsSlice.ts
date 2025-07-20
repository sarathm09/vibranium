/**
 * Settings state management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ExecutionSettings } from '../../types/execution';

/**
 * UI-specific settings
 */
interface UISettings {
  /** Theme mode */
  theme: 'light' | 'dark' | 'system';
  
  /** Sidebar collapsed */
  sidebarCollapsed: boolean;
  
  /** Panel layout */
  panelLayout: 'horizontal' | 'vertical' | 'tabs';
  
  /** Font size */
  fontSize: 'small' | 'medium' | 'large';
  
  /** Code highlighting */
  syntaxHighlighting: boolean;
  
  /** Auto-refresh interval (ms) */
  autoRefreshInterval: number;
  
  /** Show line numbers */
  showLineNumbers: boolean;
  
  /** Word wrap */
  wordWrap: boolean;
  
  /** Compact mode */
  compactMode: boolean;
  
  /** Animation enabled */
  animationsEnabled: boolean;
}

/**
 * Complete settings state
 */
interface SettingsState {
  /** Execution settings */
  execution: ExecutionSettings;
  
  /** UI settings */
  ui: UISettings;
  
  /** Recently used environments */
  recentEnvironments: string[];
  
  /** Recently used scenarios */
  recentScenarios: string[];
  
  /** Favorite scenarios */
  favoriteScenarios: string[];
  
  /** Custom keyboard shortcuts */
  keyboardShortcuts: Record<string, string>;
  
  /** Export preferences */
  exportPreferences: {
    defaultFormat: 'json' | 'html' | 'junit' | 'pdf';
    includeScreenshots: boolean;
    includeLogs: boolean;
    includeMetrics: boolean;
  };
}

/**
 * Initial settings state
 */
const initialState: SettingsState = {
  execution: {
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
  ui: {
    theme: 'system',
    sidebarCollapsed: false,
    panelLayout: 'horizontal',
    fontSize: 'medium',
    syntaxHighlighting: true,
    autoRefreshInterval: 5000,
    showLineNumbers: true,
    wordWrap: true,
    compactMode: false,
    animationsEnabled: true,
  },
  recentEnvironments: ['default'],
  recentScenarios: [],
  favoriteScenarios: [],
  keyboardShortcuts: {
    'start_execution': 'Ctrl+Enter',
    'stop_execution': 'Ctrl+Shift+C',
    'toggle_sidebar': 'Ctrl+B',
    'toggle_debug': 'F9',
    'step_over': 'F10',
    'step_into': 'F11',
    'continue': 'F5',
    'toggle_breakpoint': 'F9',
    'open_scenario': 'Ctrl+O',
    'save_scenario': 'Ctrl+S',
    'new_scenario': 'Ctrl+N',
    'switch_environment': 'Ctrl+E',
    'toggle_logs': 'Ctrl+L',
    'clear_logs': 'Ctrl+Shift+L',
    'export_results': 'Ctrl+Shift+E',
  },
  exportPreferences: {
    defaultFormat: 'html',
    includeScreenshots: true,
    includeLogs: true,
    includeMetrics: true,
  },
};

/**
 * Settings slice
 */
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Execution settings
    updateExecutionSettings: (state, action: PayloadAction<Partial<ExecutionSettings>>) => {
      state.execution = {
        ...state.execution,
        ...action.payload,
      };
    },

    updateNotificationSettings: (state, action: PayloadAction<Partial<ExecutionSettings['notifications']>>) => {
      state.execution.notifications = {
        ...state.execution.notifications,
        ...action.payload,
      };
    },

    // UI settings
    updateUISettings: (state, action: PayloadAction<Partial<UISettings>>) => {
      state.ui = {
        ...state.ui,
        ...action.payload,
      };
    },

    setTheme: (state, action: PayloadAction<UISettings['theme']>) => {
      state.ui.theme = action.payload;
    },

    toggleSidebar: (state) => {
      state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
    },

    setPanelLayout: (state, action: PayloadAction<UISettings['panelLayout']>) => {
      state.ui.panelLayout = action.payload;
    },

    setFontSize: (state, action: PayloadAction<UISettings['fontSize']>) => {
      state.ui.fontSize = action.payload;
    },

    toggleSyntaxHighlighting: (state) => {
      state.ui.syntaxHighlighting = !state.ui.syntaxHighlighting;
    },

    toggleLineNumbers: (state) => {
      state.ui.showLineNumbers = !state.ui.showLineNumbers;
    },

    toggleWordWrap: (state) => {
      state.ui.wordWrap = !state.ui.wordWrap;
    },

    toggleCompactMode: (state) => {
      state.ui.compactMode = !state.ui.compactMode;
    },

    toggleAnimations: (state) => {
      state.ui.animationsEnabled = !state.ui.animationsEnabled;
    },

    // Recent items management
    addRecentEnvironment: (state, action: PayloadAction<string>) => {
      const environment = action.payload;
      state.recentEnvironments = [
        environment,
        ...state.recentEnvironments.filter(env => env !== environment)
      ].slice(0, 10);
    },

    addRecentScenario: (state, action: PayloadAction<string>) => {
      const scenario = action.payload;
      state.recentScenarios = [
        scenario,
        ...state.recentScenarios.filter(s => s !== scenario)
      ].slice(0, 20);
    },

    clearRecentEnvironments: (state) => {
      state.recentEnvironments = ['default'];
    },

    clearRecentScenarios: (state) => {
      state.recentScenarios = [];
    },

    // Favorite scenarios
    addFavoriteScenario: (state, action: PayloadAction<string>) => {
      const scenario = action.payload;
      if (!state.favoriteScenarios.includes(scenario)) {
        state.favoriteScenarios.push(scenario);
      }
    },

    removeFavoriteScenario: (state, action: PayloadAction<string>) => {
      state.favoriteScenarios = state.favoriteScenarios.filter(s => s !== action.payload);
    },

    clearFavoriteScenarios: (state) => {
      state.favoriteScenarios = [];
    },

    // Keyboard shortcuts
    updateKeyboardShortcut: (state, action: PayloadAction<{ action: string; shortcut: string }>) => {
      state.keyboardShortcuts[action.payload.action] = action.payload.shortcut;
    },

    resetKeyboardShortcuts: (state) => {
      state.keyboardShortcuts = initialState.keyboardShortcuts;
    },

    // Export preferences
    updateExportPreferences: (state, action: PayloadAction<Partial<SettingsState['exportPreferences']>>) => {
      state.exportPreferences = {
        ...state.exportPreferences,
        ...action.payload,
      };
    },

    // Reset all settings
    resetSettings: (state) => {
      return initialState;
    },

    // Import/export settings
    importSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const {
  updateExecutionSettings,
  updateNotificationSettings,
  updateUISettings,
  setTheme,
  toggleSidebar,
  setPanelLayout,
  setFontSize,
  toggleSyntaxHighlighting,
  toggleLineNumbers,
  toggleWordWrap,
  toggleCompactMode,
  toggleAnimations,
  addRecentEnvironment,
  addRecentScenario,
  clearRecentEnvironments,
  clearRecentScenarios,
  addFavoriteScenario,
  removeFavoriteScenario,
  clearFavoriteScenarios,
  updateKeyboardShortcut,
  resetKeyboardShortcuts,
  updateExportPreferences,
  resetSettings,
  importSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;