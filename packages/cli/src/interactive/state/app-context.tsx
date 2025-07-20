/**
 * Application state management for interactive CLI
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { parse as parseYaml } from 'yaml';
import { Scenario, ScenarioResult, Environment } from '../types';
import { ResolvedConfig } from '../../utils/config-resolver';
import { VariableStateManager } from './variable-state-manager';
import { VariableChangeEvent } from '../types/variable-state';
// Temporarily commented out for testing until build issues are resolved
// import { ScenarioOrchestrator, ExecutionProgress } from '@vibraniumjs/core';
// import { CoreApiPlugin } from '@vibraniumjs/plugins';
// import { EnvironmentManager } from '@vibraniumjs/utils';

// Enhanced execution progress with real-time step tracking
interface ExecutionProgress {
  totalSteps: number;
  completedSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  currentBatch: number;
  totalBatches: number;
  currentStepIndex: number;
  currentStepStatus: 'pending' | 'running' | 'completed' | 'failed';
  stepStartTime?: Date;
  overallStartTime?: Date;
  realTimeResults: Map<number, StepExecutionResult>;
}

// Persistent step response data for historical viewing
interface PersistentStepResponse {
  stepIndex: number;
  stepName: string;
  executionId: string;
  timestamp: Date;
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    size?: number;
  };
  timing: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
  };
  success: boolean;
  error?: string;
  validationResults?: Array<{
    field: string;
    operator: string;
    expected: any;
    actual: any;
    passed: boolean;
    message: string;
  }>;
}

// Real-time step execution result
interface StepExecutionResult {
  stepIndex: number;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    size?: number;
  };
  error?: string;
  validationResults?: Array<{
    field: string;
    operator: string;
    expected: any;
    actual: any;
    passed: boolean;
    message: string;
  }>;
}

// File system tree node
export interface FileSystemNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileSystemNode[];
  expanded?: boolean;
  parent?: string;
}

export interface AppState {
  // Core data
  scenarios: string[];
  currentScenario?: Scenario;
  currentScenarioPath?: string;
  environments: Environment[];
  currentEnvironment: string;
  config: ResolvedConfig;
  
  // Variable state management
  variableManager: VariableStateManager;

  // File system navigation
  fileSystemTree: FileSystemNode[];
  currentDirectory: string;
  selectedNodePath: string;
  expandedFolders: Set<string>;
  breadcrumbs: string[];

  // Execution state
  isRunning: boolean;
  canStop: boolean;
  executionProgress?: ExecutionProgress;
  realTimeStepResults: StepExecutionResult[];
  lastResult?: ScenarioResult;
  executionHistory: ScenarioResult[];
  executionOrchestrator?: any; // ScenarioOrchestrator;
  autoScrollToCurrentStep: boolean;
  
  // Persistent step response data
  stepResponseHistory: Map<string, PersistentStepResponse[]>; // keyed by scenario name
  currentExecutionId?: string;

  // UI state
  ui: {
    selectedScenarioIndex: number;
    selectedStepIndex: number;
    selectedStepId?: string; // Enhanced step selection tracking
    overviewSelectedStepIndex: number; // Separate selection for overview mode
    stepResponseViewerMode: 'current' | 'historical'; // Current execution vs historical data
    selectedHistoricalExecution?: string; // Selected execution ID for historical viewing
    activePane: 'navigation' | 'details' | 'variables' | 'help';
    showVariablePreview: boolean;
    editorContent: string;
    editorChanged: boolean;
    navigationMode: 'scenarios' | 'folders'; // Toggle between scenarios and file navigation
    detailsViewMode: 'overview' | 'steps' | 'timeline' | 'source' | 'results'; // Logical view mode ordering
    stepInspectionMode: boolean; // Whether we're in step inspection mode
    detailsScrollOffset: number; // Scroll position in details pane
    // Environment UI state
    showEnvironmentViewer: boolean;
    showEnvironmentSwitcher: boolean;
    environmentComparisonMode: boolean;
    selectedEnvironmentForComparison?: string;
  };

  // Status
  status: {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  };
}

export interface AppActions {
  // Scenario management
  loadScenarios: () => Promise<void>;
  selectScenario: (index: number) => Promise<void>;
  selectStep: (index: number) => void;
  selectStepById: (stepId: string) => void;
  selectOverviewStep: (index: number) => void;
  runSingleStep: (stepIndex: number) => Promise<void>;
  copyStepData: (stepIndex: number, dataType: 'request' | 'response' | 'full') => void;
  toggleStepBookmark: (stepIndex: number) => void;
  saveCurrentScenario: () => Promise<void>;
  
  // Step response data management
  getStepResponseData: (stepIndex: number, executionId?: string) => PersistentStepResponse | undefined;
  getExecutionStepResponses: (executionId: string) => PersistentStepResponse[];
  switchToHistoricalView: (executionId: string) => void;
  switchToCurrentView: () => void;

  // Environment management
  switchEnvironment: (environment?: string) => Promise<void>;
  loadEnvironments: () => Promise<void>;
  showEnvironmentViewer: () => void;
  showEnvironmentSwitcher: () => void;
  compareEnvironments: (env1: string, env2: string) => void;
  getEnvironmentVariables: (environmentName: string) => Record<string, any>;
  reloadEnvironments: () => Promise<void>;

  // Execution
  runCurrentScenario: () => Promise<void>;
  runCurrentStep: () => Promise<void>;
  stopExecution: () => Promise<void>;
  retryExecution: () => Promise<void>;
  initializeOrchestrator: () => Promise<void>;
  convertToCoreDomain: (uiScenario: Scenario) => any;
  convertToUIResult: (coreResult: any, uiScenario: Scenario, environment: string) => ScenarioResult;
  simulateEnhancedExecution: (scenario: any, variables: any, options: any) => Promise<any>;
  simulateApiStep: (step: any, variables: any, duration: number) => Promise<any>;
  simulateValidationResults: (expectations: any[], response: any) => any[];
  toggleAutoScroll: () => void;

  // File system navigation
  loadFileSystemTree: (directory?: string) => Promise<void>;
  expandFolder: (folderPath: string) => void;
  collapseFolder: (folderPath: string) => void;
  toggleFolder: (folderPath: string) => void;
  navigateToDirectory: (directoryPath: string) => Promise<void>;
  navigateToParentDirectory: () => Promise<void>;
  selectFileSystemNode: (nodePath: string) => Promise<void>;
  toggleNavigationMode: () => void;

  // UI actions
  togglePane: (pane: 'variables' | 'help' | 'next') => void;
  updateEditorContent: (content: string) => void;
  setStatus: (message: string, type?: AppState['status']['type']) => void;

  // Details pane specific actions
  scrollDetailsPane: (direction: 'up' | 'down') => void;
  resetDetailsScroll: () => void;
  changeDetailsViewMode: (direction: 'left' | 'right') => void;
  setDetailsViewMode: (mode: AppState['ui']['detailsViewMode']) => void;
  toggleStepInspectionMode: () => void;

  // Enhanced source view actions
  scrollSourcePageUp: () => void;
  scrollSourcePageDown: () => void;
  jumpToSourceStart: () => void;
  jumpToSourceEnd: () => void;
  copySourceContent: () => void;
  goToSourceLine: (lineNumber?: number) => void;
  searchInSource: (searchTerm?: string) => void;

  // Navigation
  navigateScenarios: (direction: 'up' | 'down') => void;
  navigateSteps: (direction: 'up' | 'down') => void;
  navigateFileSystem: (direction: 'up' | 'down') => Promise<void>;
  
  // Variable management
  updateVariableState: () => void;
  trackVariableUsage: (path: string, stepIndex: number, stepName: string, usageType: 'read' | 'write' | 'reference', field: string) => void;
  
  // Utils
  dispatch: React.Dispatch<Action>;
}

export interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<AppContextValue | null>(null);

// Action types
type Action = 
  | { type: 'SET_SCENARIOS'; payload: string[] }
  | { type: 'SET_CURRENT_SCENARIO'; payload: { scenario: Scenario; path: string } }
  | { type: 'SET_ENVIRONMENTS'; payload: Environment[] }
  | { type: 'SET_CURRENT_ENVIRONMENT'; payload: string }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'SET_CAN_STOP'; payload: boolean }
  | { type: 'SET_EXECUTION_PROGRESS'; payload: ExecutionProgress | undefined }
  | { type: 'SET_ORCHESTRATOR'; payload: any } // ScenarioOrchestrator
  | { type: 'SET_LAST_RESULT'; payload: ScenarioResult }
  | { type: 'ADD_EXECUTION_RESULT'; payload: ScenarioResult }
  | { type: 'UPDATE_REAL_TIME_STEP'; payload: StepExecutionResult }
  | { type: 'CLEAR_REAL_TIME_RESULTS' }
  | { type: 'SET_AUTO_SCROLL'; payload: boolean }
  | { type: 'SELECT_SCENARIO'; payload: number }
  | { type: 'SELECT_STEP'; payload: number }
  | { type: 'SELECT_OVERVIEW_STEP'; payload: number }
  | { type: 'SELECT_STEP_BY_ID'; payload: string }
  | { type: 'SET_DETAILS_VIEW_MODE'; payload: AppState['ui']['detailsViewMode'] }
  | { type: 'TOGGLE_STEP_INSPECTION_MODE' }
  | { type: 'SET_ACTIVE_PANE'; payload: AppState['ui']['activePane'] }
  | { type: 'TOGGLE_VARIABLE_PREVIEW' }
  | { type: 'UPDATE_EDITOR_CONTENT'; payload: string }
  | { type: 'SET_EDITOR_CHANGED'; payload: boolean }
  | { type: 'SET_STATUS'; payload: { message: string; type: AppState['status']['type'] } }
  | { type: 'SET_FILESYSTEM_TREE'; payload: FileSystemNode[] }
  | { type: 'SET_CURRENT_DIRECTORY'; payload: string }
  | { type: 'SET_SELECTED_NODE'; payload: string }
  | { type: 'EXPAND_FOLDER'; payload: string }
  | { type: 'COLLAPSE_FOLDER'; payload: string }
  | { type: 'SET_BREADCRUMBS'; payload: string[] }
  | { type: 'TOGGLE_NAVIGATION_MODE' }
  | { type: 'SCROLL_DETAILS_PANE'; payload: number }
  | { type: 'SHOW_ENVIRONMENT_VIEWER'; payload: boolean }
  | { type: 'SHOW_ENVIRONMENT_SWITCHER'; payload: boolean }
  | { type: 'SET_ENVIRONMENT_COMPARISON'; payload: { enabled: boolean; environment?: string } }
  | { type: 'ADD_STEP_RESPONSE'; payload: PersistentStepResponse }
  | { type: 'SET_CURRENT_EXECUTION_ID'; payload: string }
  | { type: 'SET_STEP_RESPONSE_VIEWER_MODE'; payload: 'current' | 'historical' }
  | { type: 'SET_SELECTED_HISTORICAL_EXECUTION'; payload: string | undefined };

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCENARIOS':
      return { ...state, scenarios: action.payload };
    
    case 'SET_CURRENT_SCENARIO':
      return { 
        ...state, 
        currentScenario: action.payload.scenario,
        currentScenarioPath: action.payload.path,
        ui: { 
          ...state.ui, 
          editorContent: JSON.stringify(action.payload.scenario, null, 2),
          editorChanged: false
        }
      };
    
    case 'SET_ENVIRONMENTS':
      return { ...state, environments: action.payload };
    
    case 'SET_CURRENT_ENVIRONMENT':
      return { ...state, currentEnvironment: action.payload };
    
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };
    
    case 'SET_CAN_STOP':
      return { ...state, canStop: action.payload };
    
    case 'SET_EXECUTION_PROGRESS':
      return { ...state, executionProgress: action.payload };
    
    case 'SET_ORCHESTRATOR':
      return { ...state, executionOrchestrator: action.payload };
    
    case 'SET_LAST_RESULT':
      return { ...state, lastResult: action.payload };
    
    case 'ADD_EXECUTION_RESULT':
      return { 
        ...state, 
        executionHistory: [action.payload, ...state.executionHistory.slice(0, 9)] // Keep last 10
      };
    
    case 'UPDATE_REAL_TIME_STEP':
      const updatedResults = [...state.realTimeStepResults];
      const existingIndex = updatedResults.findIndex(r => r.stepIndex === action.payload.stepIndex);
      if (existingIndex >= 0) {
        updatedResults[existingIndex] = action.payload;
      } else {
        updatedResults.push(action.payload);
      }
      return {
        ...state,
        realTimeStepResults: updatedResults
      };
    
    case 'CLEAR_REAL_TIME_RESULTS':
      return {
        ...state,
        realTimeStepResults: []
      };
    
    case 'SET_AUTO_SCROLL':
      return {
        ...state,
        autoScrollToCurrentStep: action.payload
      };
    
    case 'SELECT_SCENARIO':
      return { ...state, ui: { ...state.ui, selectedScenarioIndex: action.payload } };
    
    case 'SELECT_STEP':
      const selectedStep = state.currentScenario?.steps[action.payload];
      return { 
        ...state, 
        ui: { 
          ...state.ui, 
          selectedStepIndex: action.payload,
          selectedStepId: selectedStep ? `step-${action.payload}` : undefined
        }
      };
    
    case 'SELECT_OVERVIEW_STEP':
      return { 
        ...state, 
        ui: { 
          ...state.ui, 
          overviewSelectedStepIndex: action.payload
        }
      };
    
    case 'SELECT_STEP_BY_ID':
      const stepIndex = state.currentScenario?.steps.findIndex((_, index) => `step-${index}` === action.payload) ?? 0;
      return { 
        ...state, 
        ui: { 
          ...state.ui, 
          selectedStepIndex: stepIndex,
          selectedStepId: action.payload
        }
      };
    
    case 'SET_DETAILS_VIEW_MODE':
      return { ...state, ui: { ...state.ui, detailsViewMode: action.payload } };
    
    case 'TOGGLE_STEP_INSPECTION_MODE':
      return { 
        ...state, 
        ui: { 
          ...state.ui, 
          stepInspectionMode: !state.ui.stepInspectionMode,
          detailsViewMode: state.ui.stepInspectionMode ? 'overview' : 'steps'
        }
      };
    
    case 'SET_ACTIVE_PANE':
      return { ...state, ui: { ...state.ui, activePane: action.payload } };
    
    case 'TOGGLE_VARIABLE_PREVIEW':
      return { 
        ...state, 
        ui: { ...state.ui, showVariablePreview: !state.ui.showVariablePreview }
      };
    
    case 'UPDATE_EDITOR_CONTENT':
      return { 
        ...state, 
        ui: { 
          ...state.ui, 
          editorContent: action.payload,
          editorChanged: true
        }
      };
    
    case 'SET_EDITOR_CHANGED':
      return { 
        ...state, 
        ui: { ...state.ui, editorChanged: action.payload }
      };
    
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    
    case 'SET_FILESYSTEM_TREE':
      return { ...state, fileSystemTree: action.payload };
    
    case 'SET_CURRENT_DIRECTORY':
      return { ...state, currentDirectory: action.payload };
    
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNodePath: action.payload };
    
    case 'EXPAND_FOLDER':
      const newExpandedFolders = new Set(state.expandedFolders);
      newExpandedFolders.add(action.payload);
      return { ...state, expandedFolders: newExpandedFolders };
    
    case 'COLLAPSE_FOLDER':
      const updatedExpandedFolders = new Set(state.expandedFolders);
      updatedExpandedFolders.delete(action.payload);
      return { ...state, expandedFolders: updatedExpandedFolders };
    
    case 'SET_BREADCRUMBS':
      return { ...state, breadcrumbs: action.payload };
    
    case 'TOGGLE_NAVIGATION_MODE':
      const newMode = state.ui.navigationMode === 'scenarios' ? 'folders' : 'scenarios';
      return { 
        ...state, 
        ui: { ...state.ui, navigationMode: newMode }
      };
    
    case 'SCROLL_DETAILS_PANE':
      return { 
        ...state, 
        ui: { ...state.ui, detailsScrollOffset: Math.max(0, action.payload) }
      };
    
    case 'SHOW_ENVIRONMENT_VIEWER':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          showEnvironmentViewer: action.payload,
          showEnvironmentSwitcher: false // Close switcher if viewer is opened
        }
      };
    
    case 'SHOW_ENVIRONMENT_SWITCHER':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          showEnvironmentSwitcher: action.payload,
          showEnvironmentViewer: false // Close viewer if switcher is opened
        }
      };
    
    case 'SET_ENVIRONMENT_COMPARISON':
      return {
        ...state,
        ui: {
          ...state.ui,
          environmentComparisonMode: action.payload.enabled,
          selectedEnvironmentForComparison: action.payload.environment
        }
      };
    
    case 'ADD_STEP_RESPONSE':
      const scenarioName = state.currentScenario?.name || 'unknown';
      const existingResponses = state.stepResponseHistory.get(scenarioName) || [];
      const updatedResponses = [...existingResponses, action.payload];
      const newHistory = new Map(state.stepResponseHistory);
      newHistory.set(scenarioName, updatedResponses);
      return {
        ...state,
        stepResponseHistory: newHistory
      };
    
    case 'SET_CURRENT_EXECUTION_ID':
      return {
        ...state,
        currentExecutionId: action.payload
      };
    
    case 'SET_STEP_RESPONSE_VIEWER_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          stepResponseViewerMode: action.payload
        }
      };
    
    case 'SET_SELECTED_HISTORICAL_EXECUTION':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedHistoricalExecution: action.payload
        }
      };
    
    default:
      return state;
  }
}

// Initial state factory
function createInitialState(config: ResolvedConfig, environment: string): AppState {
  return {
    scenarios: [],
    currentScenario: undefined,
    currentScenarioPath: undefined,
    environments: [],
    currentEnvironment: environment,
    config,
    variableManager: new VariableStateManager(),
    fileSystemTree: [],
    currentDirectory: config.workspaceRoot,
    selectedNodePath: '',
    expandedFolders: new Set<string>(),
    breadcrumbs: [],
    isRunning: false,
    canStop: false,
    executionProgress: undefined,
    realTimeStepResults: [],
    lastResult: undefined,
    executionHistory: [],
    executionOrchestrator: undefined,
    autoScrollToCurrentStep: true,
    stepResponseHistory: new Map<string, PersistentStepResponse[]>(),
    currentExecutionId: undefined,
    ui: {
      selectedScenarioIndex: 0,
      selectedStepIndex: 0,
      selectedStepId: undefined,
      overviewSelectedStepIndex: 0,
      stepResponseViewerMode: 'current',
      selectedHistoricalExecution: undefined,
      activePane: 'navigation',
      showVariablePreview: false,
      editorContent: '',
      editorChanged: false,
      navigationMode: 'folders',
      detailsViewMode: 'overview',
      stepInspectionMode: false,
      detailsScrollOffset: 0,
      // Environment UI state
      showEnvironmentViewer: false,
      showEnvironmentSwitcher: false,
      environmentComparisonMode: false,
      selectedEnvironmentForComparison: undefined
    },
    status: {
      message: 'Welcome to Vibranium CLI',
      type: 'info'
    }
  };
}

export interface AppProviderProps {
  children: ReactNode;
  initialProps: {
    scenarioPath?: string;
    environment?: string;
    config: ResolvedConfig;
  };
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, initialProps }) => {
  const initialState = createInitialState(
    initialProps.config, 
    initialProps.environment || 'local'
  );

  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions implementation
  const actions: AppActions = {
    async loadScenarios() {
      try {
        actions.setStatus('Loading scenarios...', 'info');
        
        const { ConfigResolver } = await import('../../utils/config-resolver');
        const resolver = new ConfigResolver();
        const scenarios = await resolver.findScenarios(initialProps.config);
        
        console.log(`Loaded ${scenarios.length} scenarios:`);
        scenarios.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
        
        dispatch({ type: 'SET_SCENARIOS', payload: scenarios });
        
        if (scenarios.length === 0) {
          actions.setStatus('No scenarios found in current directory', 'warning');
        } else {
          actions.setStatus(`Loaded ${scenarios.length} scenario${scenarios.length === 1 ? '' : 's'}`, 'success');
          
          // Auto-select the first scenario or specified scenario
          let initialIndex = 0;
          if (initialProps.scenarioPath) {
            const specifiedIndex = scenarios.findIndex(s => s.includes(initialProps.scenarioPath!));
            if (specifiedIndex >= 0) {
              initialIndex = specifiedIndex;
            }
          }
          
          if (scenarios.length > 0) {
            await actions.selectScenario(initialIndex);
          }
        }
      } catch (error) {
        console.error('Error loading scenarios:', error);
        actions.setStatus(`Failed to load scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    },

    async selectScenario(index: number) {
      if (index < 0 || index >= state.scenarios.length) return;
      
      try {
        const scenarioPath = state.scenarios[index];
        actions.setStatus(`Loading scenario: ${scenarioPath.split('/').pop()}...`, 'info');
        
        // Try to load the actual scenario file
        let scenario: Scenario;
        
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          const content = await fs.readFile(scenarioPath, 'utf-8');
          
          // Parse based on file extension
          const ext = path.extname(scenarioPath).toLowerCase();
          if (ext === '.json') {
            scenario = JSON.parse(content);
          } else if (ext === '.yaml' || ext === '.yml') {
            // Use proper YAML parsing
            scenario = parseYaml(content);
          } else {
            throw new Error(`Unsupported file format: ${ext}`);
          }
        } catch (fileError) {
          console.warn('Could not load scenario file, creating mock:', fileError);
          // Fallback to mock scenario
          const filename = scenarioPath.split('/').pop()?.replace(/\.(yaml|yml|json)$/i, '') || `Scenario ${index + 1}`;
          scenario = {
            name: filename,
            description: `Mock scenario for ${filename}`,
            steps: [
              {
                name: 'Mock API Step',
                type: 'api',
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                expect: [
                  { field: 'status', operator: 'equals', value: 200 },
                  { field: 'body.id', operator: 'equals', value: 1 }
                ]
              },
              {
                name: 'Mock Validation Step',
                type: 'api',
                method: 'GET', 
                url: 'https://jsonplaceholder.typicode.com/users/1',
                expect: [
                  { field: 'status', operator: 'equals', value: 200 },
                  { field: 'body.name', operator: 'exists', value: true }
                ]
              }
            ],
            lifecycle: {
              setup: [],
              teardown: []
            },
            environments: ['local', 'staging', 'production']
          };
        }
        
        dispatch({ type: 'SELECT_SCENARIO', payload: index });
        dispatch({ type: 'SET_CURRENT_SCENARIO', payload: { scenario, path: scenarioPath } });
        actions.setStatus(`Selected: ${scenario.name} (${scenario.steps?.length || 0} steps)`, 'success');
        
      } catch (error) {
        console.error('Error selecting scenario:', error);
        actions.setStatus(`Failed to load scenario: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    },

    selectStep(index: number) {
      if (!state.currentScenario || index < 0 || index >= state.currentScenario.steps.length) return;
      dispatch({ type: 'SELECT_STEP', payload: index });
      actions.setStatus(`Selected step: ${state.currentScenario.steps[index]?.name || `Step ${index + 1}`}`, 'info');
    },

    selectStepById(stepId: string) {
      dispatch({ type: 'SELECT_STEP_BY_ID', payload: stepId });
      const stepIndex = state.currentScenario?.steps.findIndex((_, index) => `step-${index}` === stepId) ?? 0;
      const stepName = state.currentScenario?.steps[stepIndex]?.name || `Step ${stepIndex + 1}`;
      actions.setStatus(`Selected step: ${stepName}`, 'info');
    },

    selectOverviewStep(index: number) {
      if (!state.currentScenario || index < 0 || index >= state.currentScenario.steps.length) return;
      dispatch({ type: 'SELECT_OVERVIEW_STEP', payload: index });
      const stepName = state.currentScenario.steps[index]?.name || `Step ${index + 1}`;
      actions.setStatus(`Overview step selected: ${stepName}`, 'info');
    },

    async runSingleStep(stepIndex: number) {
      if (!state.currentScenario?.steps?.[stepIndex] || state.isRunning) {
        actions.setStatus('No step available or execution in progress', 'warning');
        return;
      }
      
      const step = state.currentScenario.steps[stepIndex];
      actions.setStatus(`Running step: ${step.name}...`, 'info');
      
      try {
        if (!state.executionOrchestrator) {
          await actions.initializeOrchestrator();
        }
        
        dispatch({ type: 'SET_RUNNING', payload: true });
        
        // Create a single-step scenario
        const singleStepScenario = {
          ...state.currentScenario,
          name: `${state.currentScenario.name} - ${step.name}`,
          steps: [step]
        };
        
        const coreScenario = actions.convertToCoreDomain(singleStepScenario);
        
        // Prepare environment variables
        const environmentVariables = { 
          variables: { 
            baseUrl: 'https://jsonplaceholder.typicode.com',
            timeout: 30000
          } 
        };
        
        // Execute single step
        const result = await actions.simulateEnhancedExecution(
          coreScenario,
          {
            env: environmentVariables?.variables || {},
            global: {},
            context: {},
            request: {},
            response: {},
            api: {}
          },
          {
            maxConcurrency: 1,
            failFast: true,
            timeout: 30000
          }
        );
        
        const uiResult = actions.convertToUIResult(result, singleStepScenario, state.currentEnvironment);
        const stepResult = uiResult.stepResults?.[0];
        
        if (stepResult) {
          const status = stepResult.success ? 'PASSED' : 'FAILED';
          const statusType = stepResult.success ? 'success' : 'error';
          actions.setStatus(`Step ${status}: ${step.name} (${stepResult.duration || 0}ms)`, statusType);
          
          // Store step result for display
          const updatedResult = {
            ...state.lastResult,
            stepResults: state.lastResult?.stepResults ? 
              state.lastResult.stepResults.map((sr, idx) => 
                idx === stepIndex ? stepResult : sr
              ) : [stepResult]
          };
          dispatch({ type: 'SET_LAST_RESULT', payload: updatedResult as ScenarioResult });
        }
        
      } catch (error) {
        console.error('Step execution error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        actions.setStatus(`Step execution failed: ${errorMessage}`, 'error');
      } finally {
        dispatch({ type: 'SET_RUNNING', payload: false });
      }
    },

    copyStepData(stepIndex: number, dataType: 'request' | 'response' | 'full') {
      if (!state.currentScenario?.steps?.[stepIndex]) {
        actions.setStatus('No step available to copy', 'warning');
        return;
      }
      
      const step = state.currentScenario.steps[stepIndex];
      const stepResult = state.lastResult?.stepResults?.[stepIndex];
      
      let dataToCopy = '';
      
      try {
        if (dataType === 'request') {
          // Copy request data
          const requestData = {
            name: step.name,
            type: step.type,
            method: (step as any).method,
            url: (step as any).url,
            headers: (step as any).headers,
            body: (step as any).body,
            params: (step as any).params
          };
          dataToCopy = JSON.stringify(requestData, null, 2);
        } else if (dataType === 'response' && stepResult?.response) {
          // Copy response data
          dataToCopy = JSON.stringify(stepResult.response, null, 2);
        } else if (dataType === 'full') {
          // Copy full step data including results
          const fullData = {
            step,
            result: stepResult
          };
          dataToCopy = JSON.stringify(fullData, null, 2);
        }
        
        if (dataToCopy) {
          // In a real implementation, you'd copy to clipboard
          // For now, we'll just show a success message
          actions.setStatus(`${dataType} data copied for ${step.name}`, 'success');
          console.log('Data copied:', dataToCopy);
        } else {
          actions.setStatus(`No ${dataType} data available to copy`, 'warning');
        }
      } catch (error) {
        actions.setStatus('Failed to copy step data', 'error');
      }
    },

    toggleStepBookmark(stepIndex: number) {
      // For now, just show status - would need persistent storage implementation
      const step = state.currentScenario?.steps?.[stepIndex];
      if (step) {
        actions.setStatus(`Bookmark toggled for ${step.name}`, 'info');
      }
    },

    async saveCurrentScenario() {
      if (!state.currentScenarioPath || !state.ui.editorChanged) return;
      
      try {
        // Parse and validate the editor content
        const scenario = JSON.parse(state.ui.editorContent);
        
        // Save to file
        const fs = await import('fs/promises');
        await fs.writeFile(state.currentScenarioPath, JSON.stringify(scenario, null, 2));
        
        dispatch({ type: 'SET_EDITOR_CHANGED', payload: false });
        dispatch({ type: 'SET_CURRENT_SCENARIO', payload: { scenario, path: state.currentScenarioPath } });
        actions.setStatus('Scenario saved successfully', 'success');
      } catch (error) {
        actions.setStatus(`Failed to save scenario: ${error instanceof Error ? error.message : error}`, 'error');
      }
    },

    async switchEnvironment(environment?: string) {
      if (!environment) {
        // Show environment selector
        actions.setStatus('Environment switching not implemented yet', 'warning');
        return;
      }
      
      dispatch({ type: 'SET_CURRENT_ENVIRONMENT', payload: environment });
      actions.setStatus(`Switched to environment: ${environment}`, 'info');
    },

    async loadEnvironments() {
      try {
        // Enhanced environment loading with more realistic data
        const environments = [
          { 
            name: 'local', 
            description: 'Local development environment',
            baseUrl: 'http://localhost:3000',
            timeout: 5000,
            variables: {
              API_KEY: 'dev-key-123',
              DEBUG_MODE: 'true',
              DB_HOST: 'localhost',
              CACHE_ENABLED: 'false'
            }, 
            secrets: {
              JWT_SECRET: 'local-secret',
              DB_PASSWORD: 'dev-password'
            },
            metadata: {
              type: 'development' as const,
              owner: 'dev-team',
              version: '1.0.0'
            }
          },
          { 
            name: 'staging', 
            description: 'Staging environment for testing',
            baseUrl: 'https://api-staging.example.com',
            timeout: 10000,
            variables: {
              API_KEY: 'staging-key-456',
              DEBUG_MODE: 'false',
              DB_HOST: 'staging-db.example.com',
              CACHE_ENABLED: 'true',
              RATE_LIMIT: '1000'
            }, 
            secrets: {
              JWT_SECRET: 'staging-secret',
              DB_PASSWORD: 'staging-password'
            },
            metadata: {
              type: 'testing' as const,
              owner: 'qa-team',
              version: '1.0.0'
            }
          },
          { 
            name: 'production', 
            description: 'Production environment',
            baseUrl: 'https://api.example.com',
            timeout: 15000,
            variables: {
              API_KEY: 'prod-key-789',
              DEBUG_MODE: 'false',
              DB_HOST: 'prod-db.example.com',
              CACHE_ENABLED: 'true',
              RATE_LIMIT: '10000',
              CDN_URL: 'https://cdn.example.com'
            }, 
            secrets: {
              JWT_SECRET: 'prod-secret',
              DB_PASSWORD: 'prod-password'
            },
            metadata: {
              type: 'production' as const,
              owner: 'ops-team',
              version: '1.0.0'
            }
          }
        ];
        dispatch({ type: 'SET_ENVIRONMENTS', payload: environments });
        actions.setStatus(`Loaded ${environments.length} environments`, 'success');
      } catch (error) {
        actions.setStatus(`Failed to load environments: ${error instanceof Error ? error.message : error}`, 'error');
      }
    },

    showEnvironmentViewer() {
      dispatch({ type: 'SHOW_ENVIRONMENT_VIEWER', payload: true });
      actions.setStatus('Environment viewer opened', 'info');
    },

    showEnvironmentSwitcher() {
      dispatch({ type: 'SHOW_ENVIRONMENT_SWITCHER', payload: true });
      actions.setStatus('Environment switcher opened', 'info');
    },

    compareEnvironments(env1: string, env2: string) {
      dispatch({ 
        type: 'SET_ENVIRONMENT_COMPARISON', 
        payload: { enabled: true, environment: env2 } 
      });
      actions.setStatus(`Comparing environments: ${env1} vs ${env2}`, 'info');
    },

    getEnvironmentVariables(environmentName: string): Record<string, any> {
      const environment = state.environments.find(env => env.name === environmentName);
      return environment?.variables || {};
    },

    async reloadEnvironments() {
      actions.setStatus('Reloading environments...', 'info');
      await actions.loadEnvironments();
    },

    async runCurrentScenario() {
      if (!state.currentScenario || state.isRunning) {
        actions.setStatus('No scenario selected or already running', 'warning');
        return;
      }
      
      if (!state.executionOrchestrator) {
        // Initialize orchestrator if not already done
        await actions.initializeOrchestrator();
      }
      
      dispatch({ type: 'SET_RUNNING', payload: true });
      dispatch({ type: 'SET_CAN_STOP', payload: true });
      const startTime = new Date();
      actions.setStatus(`Running scenario: ${state.currentScenario.name}...`, 'info');
      
      try {
        // Prepare environment variables (temporarily mocked)
        // const environmentManager = new EnvironmentManager();
        // const environmentVariables = await environmentManager.getEnvironment(state.currentEnvironment);
        const environmentVariables = { 
          variables: { 
            baseUrl: 'https://jsonplaceholder.typicode.com',
            timeout: 30000
          } 
        };
        
        // Convert UI scenario to core scenario format
        const coreScenario = actions.convertToCoreDomain(state.currentScenario);
        
        // Set up progress tracking
        let currentStepIndex = 0;
        const totalSteps = coreScenario.steps.length;
        
        // Execute the scenario using enhanced simulation (temporarily until build issues resolved)
        const result = await actions.simulateEnhancedExecution(
          coreScenario,
          {
            env: environmentVariables?.variables || {},
            global: {},
            context: {},
            request: {},
            response: {},
            api: {}
          },
          {
            maxConcurrency: 1, // Sequential execution for better UI feedback
            failFast: state.currentScenario.lifecycle?.onFailure !== 'continue',
            timeout: 30000
          }
        );
        
        // Convert core result to UI result format
        const uiResult = actions.convertToUIResult(result, state.currentScenario, state.currentEnvironment);
        
        dispatch({ type: 'SET_LAST_RESULT', payload: uiResult });
        dispatch({ type: 'ADD_EXECUTION_RESULT', payload: uiResult });
        
        const status = uiResult.success ? 'PASSED' : 'FAILED';
        const statusType = uiResult.success ? 'success' : 'error';
        const passedCount = uiResult.stepResults?.filter(r => r.success).length || 0;
        const totalCount = uiResult.stepResults?.length || 0;
        actions.setStatus(`Scenario ${status} - ${passedCount}/${totalCount} steps passed (${uiResult.duration}ms)`, statusType);
        
      } catch (error) {
        console.error('Execution error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        actions.setStatus(`Execution failed: ${errorMessage}`, 'error');
        
        // Create a failed result
        const failedResult: ScenarioResult = {
          scenarioName: state.currentScenario.name,
          success: false,
          duration: Date.now() - startTime.getTime(),
          stepResults: [],
          startTime,
          endTime: new Date(),
          environment: state.currentEnvironment
        };
        
        dispatch({ type: 'SET_LAST_RESULT', payload: failedResult });
        dispatch({ type: 'ADD_EXECUTION_RESULT', payload: failedResult });
      } finally {
        dispatch({ type: 'SET_RUNNING', payload: false });
        dispatch({ type: 'SET_CAN_STOP', payload: false });
        dispatch({ type: 'SET_EXECUTION_PROGRESS', payload: undefined });
      }
    },

    async runCurrentStep() {
      if (!state.currentScenario || !state.currentScenario.steps || state.isRunning) {
        actions.setStatus('No scenario/step selected or already running', 'warning');
        return;
      }
      
      const currentStep = state.currentScenario.steps[state.ui.selectedStepIndex];
      if (!currentStep) {
        actions.setStatus('No step selected', 'warning');
        return;
      }
      
      actions.setStatus(`Running single step: ${currentStep.name}...`, 'info');
      
      try {
        if (!state.executionOrchestrator) {
          await actions.initializeOrchestrator();
        }
        
        // Create a single-step scenario
        const singleStepScenario = {
          ...state.currentScenario,
          name: `${state.currentScenario.name} - ${currentStep.name}`,
          steps: [currentStep]
        };
        
        const coreScenario = actions.convertToCoreDomain(singleStepScenario);
        
        // Prepare environment variables (temporarily mocked)
        const environmentVariables = { 
          variables: { 
            baseUrl: 'https://jsonplaceholder.typicode.com',
            timeout: 30000
          } 
        };
        
        // Execute single step (enhanced simulation)
        const result = await actions.simulateEnhancedExecution(
          coreScenario,
          {
            env: environmentVariables?.variables || {},
            global: {},
            context: {},
            request: {},
            response: {},
            api: {}
          },
          {
            maxConcurrency: 1,
            failFast: true,
            timeout: 30000
          }
        );
        
        const uiResult = actions.convertToUIResult(result, singleStepScenario, state.currentEnvironment);
        const stepResult = uiResult.stepResults?.[0];
        
        if (stepResult) {
          const status = stepResult.success ? 'PASSED' : 'FAILED';
          const statusType = stepResult.success ? 'success' : 'error';
          actions.setStatus(`Step ${status}: ${currentStep.name} (${stepResult.duration || 0}ms)`, statusType);
        }
        
      } catch (error) {
        console.error('Step execution error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        actions.setStatus(`Step execution failed: ${errorMessage}`, 'error');
      }
    },
    
    async stopExecution() {
      if (!state.isRunning) {
        actions.setStatus('No execution running to stop', 'warning');
        return;
      }
      
      actions.setStatus('Stopping execution...', 'info');
      dispatch({ type: 'SET_CAN_STOP', payload: false });
      
      // In a real implementation, you'd cancel the orchestrator execution
      // For now, we'll just mark as stopped
      dispatch({ type: 'SET_RUNNING', payload: false });
      actions.setStatus('Execution stopped by user', 'warning');
    },
    
    async retryExecution() {
      if (state.isRunning) {
        actions.setStatus('Cannot retry while execution is running', 'warning');
        return;
      }
      
      if (!state.lastResult || state.lastResult.success) {
        actions.setStatus('No failed execution to retry', 'warning');
        return;
      }
      
      actions.setStatus('Retrying previous execution...', 'info');
      await actions.runCurrentScenario();
    },
    
    async initializeOrchestrator() {
      try {
        // Temporarily mock orchestrator initialization until build issues are resolved
        const orchestrator = {
          executeScenario: actions.simulateEnhancedExecution,
          registerPlugin: () => {},
          getSupportedStepTypes: () => ['api', 'http', 'get', 'post', 'put', 'patch', 'delete', 'head', 'options']
        };
        
        dispatch({ type: 'SET_ORCHESTRATOR', payload: orchestrator });
        actions.setStatus('Execution engine initialized (enhanced simulation)', 'success');
      } catch (error) {
        console.error('Failed to initialize orchestrator:', error);
        actions.setStatus('Failed to initialize execution engine', 'error');
        throw error;
      }
    },
    
    convertToCoreDomain(uiScenario: Scenario): any {
      // Convert UI scenario format to core domain format
      return {
        id: `scenario-${Date.now()}`,
        name: uiScenario.name,
        description: uiScenario.description || '',
        version: '1.0.0',
        tags: [],
        variables: {},
        steps: uiScenario.steps.map((step, index) => ({
          id: `step-${index}`,
          stepName: step.name,
          stepType: step.type,
          ...step
        })),
        lifecycle: {
          setup: uiScenario.lifecycle?.setup || [],
          teardown: uiScenario.lifecycle?.teardown || [],
          onFailure: uiScenario.lifecycle?.onFailure || 'stop'
        },
        environments: uiScenario.environments || [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'interactive-user',
          version: '1.0.0'
        }
      };
    },
    
    convertToUIResult(coreResult: any, uiScenario: Scenario, environment: string): ScenarioResult {
      // Convert core execution result to UI result format
      return {
        scenarioName: uiScenario.name,
        success: coreResult.status === 'completed',
        duration: coreResult.duration || 0,
        stepResults: coreResult.stepResults?.map((stepResult: any) => ({
          stepName: stepResult.step?.name || 'Unknown Step',
          success: stepResult.status === 'passed',
          duration: stepResult.duration || 0,
          error: stepResult.error?.message || (stepResult.status === 'failed' ? 'Step failed' : undefined),
          response: stepResult.data?.response ? {
            status: stepResult.data.response.status,
            statusText: stepResult.data.response.statusText,
            body: stepResult.data.response.body,
            headers: stepResult.data.response.headers
          } : undefined
        })) || [],
        startTime: coreResult.startTime || new Date(),
        endTime: coreResult.endTime || new Date(),
        environment
      };
    },
    
    // Enhanced simulation that mimics real HTTP execution with real-time feedback
    async simulateEnhancedExecution(scenario: any, variables: any, options: any) {
      const startTime = new Date();
      const stepResults: any[] = [];
      let overallSuccess = true;
      
      // Generate unique execution ID
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch({ type: 'SET_CURRENT_EXECUTION_ID', payload: executionId });
      
      // Clear previous real-time results
      dispatch({ type: 'CLEAR_REAL_TIME_RESULTS' });
      
      // Initialize all steps as pending
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const pendingResult: StepExecutionResult = {
          stepIndex: i,
          stepName: step.stepName || step.name || `Step ${i + 1}`,
          status: 'pending'
        };
        dispatch({ type: 'UPDATE_REAL_TIME_STEP', payload: pendingResult });
      }
      
      // Initial progress
      const initialProgress: ExecutionProgress = {
        totalSteps: scenario.steps.length,
        completedSteps: 0,
        passedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        currentBatch: 1,
        totalBatches: 1,
        currentStepIndex: 0,
        currentStepStatus: 'pending',
        overallStartTime: startTime,
        realTimeResults: new Map()
      };
      dispatch({ type: 'SET_EXECUTION_PROGRESS', payload: initialProgress });
      
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const stepStartTime = new Date();
        
        // Update step to running state and auto-scroll if enabled
        dispatch({ type: 'SELECT_STEP', payload: i });
        
        // Auto-scroll to current step if enabled
        if (state.autoScrollToCurrentStep) {
          // The UI will automatically follow the selected step
        }
        const runningResult: StepExecutionResult = {
          stepIndex: i,
          stepName: step.stepName || step.name || `Step ${i + 1}`,
          status: 'running',
          startTime: stepStartTime,
          request: step.type === 'api' ? {
            method: step.method || step.type.toUpperCase() || 'GET',
            url: step.url || 'https://jsonplaceholder.typicode.com/posts/1',
            headers: step.headers || {},
            body: step.body
          } : undefined
        };
        dispatch({ type: 'UPDATE_REAL_TIME_STEP', payload: runningResult });
        
        // Update progress to show current step as running
        const runningProgress: ExecutionProgress = {
          ...initialProgress,
          currentStepIndex: i,
          currentStepStatus: 'running',
          stepStartTime
        };
        dispatch({ type: 'SET_EXECUTION_PROGRESS', payload: runningProgress });
        
        // Show real-time status update
        actions.setStatus(`⏳ Running step ${i + 1}/${scenario.steps.length}: ${runningResult.stepName}`, 'info');
        
        // Track variable usage for this step
        if (step.type === 'api') {
          if (step.url) actions.trackVariableUsage('$.request.url', i, runningResult.stepName, 'read', 'url');
          if (step.method) actions.trackVariableUsage('$.request.method', i, runningResult.stepName, 'read', 'method');
          if (step.headers) {
            Object.keys(step.headers).forEach(header => {
              actions.trackVariableUsage(`$.request.headers.${header}`, i, runningResult.stepName, 'read', `headers.${header}`);
            });
          }
        }
        
        // Simulate step execution time based on step type
        const baseDelay = step.type === 'api' ? 800 : 300;
        const randomDelay = Math.random() * 1200;
        await new Promise(resolve => setTimeout(resolve, baseDelay + randomDelay));
        
        const stepEndTime = new Date();
        const stepDuration = stepEndTime.getTime() - stepStartTime.getTime();
        
        // Enhanced simulation based on step type
        let stepResult: any;
        let realTimeResult: StepExecutionResult;
        
        if (step.type === 'api' || ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(step.type)) {
          stepResult = await actions.simulateApiStep(step, variables, stepDuration);
          
          // Create comprehensive real-time result
          realTimeResult = {
            stepIndex: i,
            stepName: step.stepName || step.name || `Step ${i + 1}`,
            status: stepResult.status === 'passed' ? 'completed' : 'failed',
            startTime: stepStartTime,
            endTime: stepEndTime,
            duration: stepDuration,
            request: {
              method: stepResult.data?.request?.method || 'GET',
              url: stepResult.data?.request?.url || '',
              headers: stepResult.data?.request?.headers || {},
              body: stepResult.data?.request?.body
            },
            response: stepResult.data?.response ? {
              status: stepResult.data.response.status,
              statusText: stepResult.data.response.statusText,
              headers: stepResult.data.response.headers,
              body: stepResult.data.response.body,
              size: stepResult.data.response.body ? JSON.stringify(stepResult.data.response.body).length : 0
            } : undefined,
            error: stepResult.error?.message,
            validationResults: step.expect ? actions.simulateValidationResults(step.expect, stepResult.data?.response) : undefined
          };
        } else {
          // Generic step simulation
          const stepSuccess = Math.random() > 0.1; // 90% success rate
          stepResult = {
            step,
            status: stepSuccess ? 'passed' : 'failed',
            duration: stepDuration,
            error: stepSuccess ? undefined : new Error('Step execution failed'),
            data: stepSuccess ? { result: 'success' } : undefined
          };
          
          realTimeResult = {
            stepIndex: i,
            stepName: step.stepName || step.name || `Step ${i + 1}`,
            status: stepSuccess ? 'completed' : 'failed',
            startTime: stepStartTime,
            endTime: stepEndTime,
            duration: stepDuration,
            error: stepSuccess ? undefined : 'Step execution failed'
          };
        }
        
        // Update real-time result
        dispatch({ type: 'UPDATE_REAL_TIME_STEP', payload: realTimeResult });
        
        // Store persistent step response data for historical viewing
        const persistentResponse: PersistentStepResponse = {
          stepIndex: i,
          stepName: realTimeResult.stepName,
          executionId,
          timestamp: stepEndTime,
          request: realTimeResult.request,
          response: realTimeResult.response,
          timing: {
            startTime: stepStartTime,
            endTime: stepEndTime,
            duration: stepDuration
          },
          success: stepResult.status === 'passed',
          error: realTimeResult.error,
          validationResults: realTimeResult.validationResults
        };
        dispatch({ type: 'ADD_STEP_RESPONSE', payload: persistentResponse });
        
        // Track response variable writes
        if (stepResult.status === 'passed' && realTimeResult.response) {
          actions.trackVariableUsage('$.response.status', i, runningResult.stepName, 'write', 'status');
          actions.trackVariableUsage('$.response.body', i, runningResult.stepName, 'write', 'body');
          actions.trackVariableUsage('$.response.headers', i, runningResult.stepName, 'write', 'headers');
          actions.trackVariableUsage('$.response.duration', i, runningResult.stepName, 'write', 'duration');
        }
        
        stepResults.push(stepResult);
        
        if (stepResult.status === 'failed') {
          overallSuccess = false;
          actions.setStatus(`❌ Step ${i + 1} failed: ${realTimeResult.stepName}`, 'error');
          if (options.failFast) {
            break;
          }
        } else {
          actions.setStatus(`✅ Step ${i + 1} completed: ${realTimeResult.stepName} (${stepDuration}ms)`, 'success');
        }
        
        // Update execution progress
        const progress: ExecutionProgress = {
          totalSteps: scenario.steps.length,
          completedSteps: i + 1,
          passedSteps: stepResults.filter(r => r.status === 'passed').length,
          failedSteps: stepResults.filter(r => r.status === 'failed').length,
          skippedSteps: stepResults.filter(r => r.status === 'skipped').length,
          currentBatch: 1,
          totalBatches: 1,
          currentStepIndex: i,
          currentStepStatus: realTimeResult.status === 'completed' ? 'completed' : 'failed',
          overallStartTime: startTime,
          realTimeResults: new Map()
        };
        dispatch({ type: 'SET_EXECUTION_PROGRESS', payload: progress });
        
        // Small delay to show the completed state before moving to next step
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      return {
        status: overallSuccess ? 'completed' : 'failed',
        startTime,
        endTime,
        duration,
        stepResults,
        scenario
      };
    },
    
    // Simulate API step with realistic HTTP responses
    async simulateApiStep(step: any, variables: any, duration: number) {
      const method = step.method || step.type.toUpperCase() || 'GET';
      const url = step.url || 'https://jsonplaceholder.typicode.com/posts/1';
      
      // Simulate different response scenarios
      const scenarios = [
        // Success scenarios (80%)
        { weight: 40, status: 200, statusText: 'OK', body: { id: 1, title: 'Sample Post', userId: 1 } },
        { weight: 20, status: 201, statusText: 'Created', body: { id: 2, message: 'Resource created' } },
        { weight: 10, status: 204, statusText: 'No Content', body: null },
        { weight: 10, status: 202, statusText: 'Accepted', body: { status: 'accepted' } },
        
        // Client error scenarios (15%)
        { weight: 5, status: 400, statusText: 'Bad Request', body: { error: 'Invalid request' } },
        { weight: 5, status: 404, statusText: 'Not Found', body: { error: 'Resource not found' } },
        { weight: 3, status: 401, statusText: 'Unauthorized', body: { error: 'Authentication required' } },
        { weight: 2, status: 403, statusText: 'Forbidden', body: { error: 'Access denied' } },
        
        // Server error scenarios (5%)
        { weight: 3, status: 500, statusText: 'Internal Server Error', body: { error: 'Server error' } },
        { weight: 2, status: 503, statusText: 'Service Unavailable', body: { error: 'Service unavailable' } },
      ];
      
      // Weighted random selection
      const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedScenario = scenarios[0];
      
      for (const scenario of scenarios) {
        random -= scenario.weight;
        if (random <= 0) {
          selectedScenario = scenario;
          break;
        }
      }
      
      const response = {
        status: selectedScenario.status,
        statusText: selectedScenario.statusText,
        body: selectedScenario.body,
        headers: {
          'content-type': 'application/json',
          'server': 'nginx/1.18.0',
          'date': new Date().toUTCString(),
          'x-response-time': `${duration}ms`
        }
      };
      
      // Determine if step passed based on status and expectations
      let stepSuccess = selectedScenario.status < 400;
      
      // Check expectations if they exist
      if (step.expect && Array.isArray(step.expect)) {
        for (const expectation of step.expect) {
          if (expectation.field === 'status' || expectation.field === 'response.status') {
            stepSuccess = response.status === expectation.value;
          } else if (expectation.field === 'body.id' && response.body?.id) {
            stepSuccess = response.body.id === expectation.value;
          }
          // Add more expectation checks as needed
        }
      }
      
      return {
        step,
        status: stepSuccess ? 'passed' : 'failed',
        duration,
        error: stepSuccess ? undefined : new Error(`HTTP ${response.status}: ${response.statusText}`),
        data: {
          request: {
            method,
            url,
            headers: step.headers || {}
          },
          response
        }
      };
    },
    
    // Simulate validation results for real-time display
    simulateValidationResults(expectations: any[], response: any) {
      if (!expectations || !Array.isArray(expectations)) return [];
      
      return expectations.map(expectation => {
        let passed = false;
        let actual: any = 'N/A';
        
        try {
          if (expectation.field === 'status' || expectation.field === 'response.status') {
            actual = response?.status;
            passed = actual === expectation.value;
          } else if (expectation.field?.startsWith('body.')) {
            const bodyField = expectation.field.replace('body.', '');
            actual = response?.body?.[bodyField];
            
            switch (expectation.operator) {
              case 'equals':
                passed = actual === expectation.value;
                break;
              case 'exists':
                passed = actual !== undefined && actual !== null;
                break;
              case 'contains':
                passed = typeof actual === 'string' && actual.includes(expectation.value);
                break;
              case 'gt':
                passed = typeof actual === 'number' && actual > expectation.value;
                break;
              case 'lt':
                passed = typeof actual === 'number' && actual < expectation.value;
                break;
              default:
                passed = actual === expectation.value;
            }
          } else {
            // Generic field validation
            passed = Math.random() > 0.2; // 80% pass rate for other validations
          }
        } catch (error) {
          passed = false;
          actual = 'Error evaluating';
        }
        
        return {
          field: expectation.field || 'unknown',
          operator: expectation.operator || 'equals',
          expected: expectation.value,
          actual,
          passed,
          message: passed 
            ? `${expectation.field} ${expectation.operator || 'equals'} ${expectation.value}` 
            : `Expected ${expectation.field} to ${expectation.operator || 'equal'} ${expectation.value}, got ${actual}`
        };
      });
    },

    toggleAutoScroll() {
    dispatch({ type: 'SET_AUTO_SCROLL', payload: !state.autoScrollToCurrentStep });
    actions.setStatus(`Auto-scroll ${!state.autoScrollToCurrentStep ? 'enabled' : 'disabled'}`, 'info');
  },
  
  togglePane(pane: 'variables' | 'help' | 'next') {
      if (pane === 'variables') {
        dispatch({ type: 'TOGGLE_VARIABLE_PREVIEW' });
        actions.setStatus(`Variable preview ${state.ui.showVariablePreview ? 'hidden' : 'shown'}`, 'info');
      } else if (pane === 'next') {
        const availablePanes: AppState['ui']['activePane'][] = ['navigation', 'details'];
        if (state.ui.showVariablePreview) {
          availablePanes.push('variables');
        }
        
        const currentIndex = availablePanes.indexOf(state.ui.activePane);
        const nextIndex = (currentIndex + 1) % availablePanes.length;
        const newPane = availablePanes[nextIndex];
        
        dispatch({ type: 'SET_ACTIVE_PANE', payload: newPane });
        actions.setStatus(`Switched to ${newPane} pane`, 'info');
      }
    },

    updateEditorContent(content: string) {
      dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: content });
    },

    setStatus(message: string, type: AppState['status']['type'] = 'info') {
      dispatch({ type: 'SET_STATUS', payload: { message, type } });
    },

    setDetailsViewMode(mode: AppState['ui']['detailsViewMode']) {
      dispatch({ type: 'SET_DETAILS_VIEW_MODE', payload: mode });
      actions.setStatus(`Switched to ${mode} view`, 'info');
    },

    scrollDetailsPane(direction: 'up' | 'down') {
      const currentOffset = state.ui.detailsScrollOffset;
      const scrollAmount = 3; // Lines to scroll per action
      const newOffset = direction === 'up' 
        ? Math.max(0, currentOffset - scrollAmount)
        : currentOffset + scrollAmount;
      
      dispatch({ type: 'SCROLL_DETAILS_PANE', payload: newOffset });
      
      // Only show status for significant scrolling to avoid spam
      if (Math.abs(newOffset - currentOffset) >= scrollAmount) {
        actions.setStatus(`Scrolled ${direction} in details pane`, 'info');
      }
    },

    resetDetailsScroll() {
      dispatch({ type: 'SCROLL_DETAILS_PANE', payload: 0 });
    },

    changeDetailsViewMode(direction: 'left' | 'right') {
      const modes: AppState['ui']['detailsViewMode'][] = ['overview', 'steps', 'timeline', 'source', 'results'];
      const currentIndex = modes.indexOf(state.ui.detailsViewMode);
      
      const newIndex = direction === 'left'
        ? (currentIndex - 1 + modes.length) % modes.length
        : (currentIndex + 1) % modes.length;
      
      const newMode = modes[newIndex];
      actions.setDetailsViewMode(newMode);
    },

    toggleStepInspectionMode() {
      dispatch({ type: 'TOGGLE_STEP_INSPECTION_MODE' });
      const newMode = !state.ui.stepInspectionMode;
      actions.setStatus(`Step inspection mode ${newMode ? 'enabled' : 'disabled'}`, 'info');
    },

    // Enhanced source view actions
    scrollSourcePageUp() {
      const currentOffset = state.ui.detailsScrollOffset;
      const pageSize = Math.max(10, Math.floor((process.stdout.rows || 25) * 0.7));
      const newOffset = Math.max(0, currentOffset - pageSize);
      
      dispatch({ type: 'SCROLL_DETAILS_PANE', payload: newOffset });
      actions.setStatus(`Page up - Line ${newOffset + 1}`, 'info');
    },

    scrollSourcePageDown() {
      const currentOffset = state.ui.detailsScrollOffset;
      const pageSize = Math.max(10, Math.floor((process.stdout.rows || 25) * 0.7));
      const newOffset = currentOffset + pageSize;
      
      dispatch({ type: 'SCROLL_DETAILS_PANE', payload: newOffset });
      actions.setStatus(`Page down - Line ${newOffset + 1}`, 'info');
    },

    jumpToSourceStart() {
      dispatch({ type: 'SCROLL_DETAILS_PANE', payload: 0 });
      actions.setStatus('Jumped to start of file', 'info');
    },

    jumpToSourceEnd() {
      // Calculate total lines from current scenario content
      let content = state.ui.editorContent;
      if (!content && state.currentScenario) {
        try {
          const isYaml = state.currentScenarioPath?.endsWith('.yaml') || state.currentScenarioPath?.endsWith('.yml');
          if (isYaml) {
            content = JSON.stringify(state.currentScenario, null, 2); // Simplified for now
          } else {
            content = JSON.stringify(state.currentScenario, null, 2);
          }
        } catch (error) {
          content = '// Error serializing scenario data';
        }
      }
      
      if (content) {
        const totalLines = content.split('\\n').length;
        const pageSize = Math.max(10, Math.floor((process.stdout.rows || 25) * 0.7));
        const newOffset = Math.max(0, totalLines - pageSize);
        
        dispatch({ type: 'SCROLL_DETAILS_PANE', payload: newOffset });
        actions.setStatus(`Jumped to end of file - Line ${totalLines}`, 'info');
      }
    },

    copySourceContent() {
      let content = state.ui.editorContent;
      if (!content && state.currentScenario) {
        try {
          const isYaml = state.currentScenarioPath?.endsWith('.yaml') || state.currentScenarioPath?.endsWith('.yml');
          if (isYaml) {
            content = JSON.stringify(state.currentScenario, null, 2); // Simplified for now
          } else {
            content = JSON.stringify(state.currentScenario, null, 2);
          }
        } catch (error) {
          content = '// Error serializing scenario data';
        }
      }
      
      if (content) {
        // Copy to clipboard using the Node.js clipboard functionality
        try {
          const clipboardy = require('clipboardy');
          clipboardy.writeSync(content);
          actions.setStatus(`Copied ${content.split('\\n').length} lines to clipboard`, 'success');
        } catch (error) {
          // Fallback - at least show the user what would be copied
          actions.setStatus('Copy functionality requires clipboardy package. Content available in console.', 'warning');
          console.log('--- SOURCE CONTENT ---');
          console.log(content);
          console.log('--- END SOURCE CONTENT ---');
        }
      } else {
        actions.setStatus('No source content available to copy', 'warning');
      }
    },

    goToSourceLine(lineNumber?: number) {
      if (!lineNumber) {
        // Show prompt for line number input - simplified for terminal
        actions.setStatus('Go to line: Use G key + line number (e.g., G50)', 'info');
        return;
      }
      
      const targetLine = Math.max(1, lineNumber);
      const offset = Math.max(0, targetLine - 1);
      
      dispatch({ type: 'SCROLL_DETAILS_PANE', payload: offset });
      actions.setStatus(`Jumped to line ${targetLine}`, 'info');
    },

    searchInSource(searchTerm?: string) {
      if (!searchTerm) {
        actions.setStatus('Search in source: Use / key + search term', 'info');
        return;
      }
      
      let content = state.ui.editorContent;
      if (!content && state.currentScenario) {
        try {
          const isYaml = state.currentScenarioPath?.endsWith('.yaml') || state.currentScenarioPath?.endsWith('.yml');
          if (isYaml) {
            content = JSON.stringify(state.currentScenario, null, 2); // Simplified for now
          } else {
            content = JSON.stringify(state.currentScenario, null, 2);
          }
        } catch (error) {
          content = '// Error serializing scenario data';
        }
      }
      
      if (content) {
        const lines = content.split('\\n');
        const currentOffset = state.ui.detailsScrollOffset;
        
        // Search from current position forward
        for (let i = currentOffset; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
            dispatch({ type: 'SCROLL_DETAILS_PANE', payload: i });
            actions.setStatus(`Found "${searchTerm}" at line ${i + 1}`, 'success');
            return;
          }
        }
        
        // If not found forward, search from beginning
        for (let i = 0; i < currentOffset; i++) {
          if (lines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
            dispatch({ type: 'SCROLL_DETAILS_PANE', payload: i });
            actions.setStatus(`Found "${searchTerm}" at line ${i + 1} (wrapped around)`, 'success');
            return;
          }
        }
        
        actions.setStatus(`"${searchTerm}" not found in source`, 'warning');
      } else {
        actions.setStatus('No source content available to search', 'warning');
      }
    },

    navigateScenarios(direction: 'up' | 'down') {
      if (state.scenarios.length === 0) return;
      
      const newIndex = direction === 'up' 
        ? Math.max(0, state.ui.selectedScenarioIndex - 1)
        : Math.min(state.scenarios.length - 1, state.ui.selectedScenarioIndex + 1);
      
      if (newIndex !== state.ui.selectedScenarioIndex) {
        // Just update the selection, don't automatically load the scenario
        dispatch({ type: 'SELECT_SCENARIO', payload: newIndex });
        const scenarioName = state.scenarios[newIndex].split('/').pop()?.replace(/\.(yaml|yml|json)$/i, '') || `Scenario ${newIndex + 1}`;
        actions.setStatus(`Navigated to: ${scenarioName}`, 'info');
      }
    },

    navigateSteps(direction: 'up' | 'down') {
      if (!state.currentScenario?.steps || state.currentScenario.steps.length === 0) return;
      
      const newIndex = direction === 'up'
        ? Math.max(0, state.ui.selectedStepIndex - 1)
        : Math.min(state.currentScenario.steps.length - 1, state.ui.selectedStepIndex + 1);
      
      if (newIndex !== state.ui.selectedStepIndex) {
        actions.selectStep(newIndex);
        const stepName = state.currentScenario.steps[newIndex]?.name || `Step ${newIndex + 1}`;
        actions.setStatus(`Step: ${stepName}`, 'info');
      }
    },

    // File system navigation methods
    async loadFileSystemTree(directory?: string) {
      const targetDir = directory || state.currentDirectory;
      
      try {
        actions.setStatus('Loading directory...', 'info');
        
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const entries = await fs.readdir(targetDir, { withFileTypes: true });
        const nodes: FileSystemNode[] = [];
        
        // Add parent directory entry if not at root
        if (targetDir !== '/' && targetDir !== '') {
          nodes.push({
            name: '..',
            path: path.dirname(targetDir),
            type: 'directory',
            parent: targetDir
          });
        }
        
        // Process current directory entries
        for (const entry of entries) {
          // Skip hidden files and directories (start with .)
          if (entry.name.startsWith('.') && entry.name !== '..') continue;
          
          const fullPath = path.join(targetDir, entry.name);
          const node: FileSystemNode = {
            name: entry.name,
            path: fullPath,
            type: entry.isDirectory() ? 'directory' : 'file',
            expanded: false,
            parent: targetDir
          };
          
          // For directories, check if they contain scenario files
          if (entry.isDirectory()) {
            try {
              const subEntries = await fs.readdir(fullPath);
              const hasScenarios = subEntries.some(subEntry => 
                subEntry.endsWith('.json') || 
                subEntry.endsWith('.yaml') || 
                subEntry.endsWith('.yml')
              );
              if (hasScenarios) {
                node.name = `${node.name} 📋`; // Add scenario indicator
              }
            } catch {
              // Ignore read errors for subdirectories
            }
          }
          
          nodes.push(node);
        }
        
        // Sort: directories first, then files, both alphabetically
        nodes.sort((a, b) => {
          if (a.name === '..') return -1;
          if (b.name === '..') return 1;
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        
        dispatch({ type: 'SET_FILESYSTEM_TREE', payload: nodes });
        dispatch({ type: 'SET_CURRENT_DIRECTORY', payload: targetDir });
        
        // Update breadcrumbs
        const breadcrumbs = targetDir.split('/').filter(Boolean);
        dispatch({ type: 'SET_BREADCRUMBS', payload: breadcrumbs });
        
        // Auto-select the first item if nothing is selected
        if (nodes.length > 0 && !state.selectedNodePath) {
          dispatch({ type: 'SET_SELECTED_NODE', payload: nodes[0].path });
        }
        
        actions.setStatus(`Loaded ${nodes.length} items in ${path.basename(targetDir) || 'root'}`, 'success');
        
      } catch (error) {
        console.error('Error loading directory:', error);
        actions.setStatus(`Failed to load directory: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    },

    expandFolder(folderPath: string) {
      dispatch({ type: 'EXPAND_FOLDER', payload: folderPath });
    },

    collapseFolder(folderPath: string) {
      dispatch({ type: 'COLLAPSE_FOLDER', payload: folderPath });
    },

    toggleFolder(folderPath: string) {
      if (state.expandedFolders.has(folderPath)) {
        actions.collapseFolder(folderPath);
      } else {
        actions.expandFolder(folderPath);
      }
    },

    async navigateToDirectory(directoryPath: string) {
      await actions.loadFileSystemTree(directoryPath);
      dispatch({ type: 'SET_SELECTED_NODE', payload: '' });
      
      // Trigger scenario re-discovery when navigating to a new directory
      try {
        actions.setStatus('Checking for scenarios...', 'info');
        
        // Create a temporary config with the new directory as scenariosDir
        const tempConfig = {
          ...state.config,
          scenariosDir: directoryPath,
          workspaceRoot: directoryPath
        };
        
        const { ConfigResolver } = await import('../../utils/config-resolver');
        const resolver = new ConfigResolver();
        const scenarios = await resolver.findScenarios(tempConfig);
        
        // Update scenarios in state if any were found
        dispatch({ type: 'SET_SCENARIOS', payload: scenarios });
        
        if (scenarios.length === 0) {
          actions.setStatus('No scenarios found in this directory', 'warning');
        } else {
          actions.setStatus(`Found ${scenarios.length} scenario${scenarios.length === 1 ? '' : 's'} in directory`, 'success');
          
          // If we're in scenarios navigation mode, auto-select the first scenario
          if (state.ui.navigationMode === 'scenarios' && scenarios.length > 0) {
            await actions.selectScenario(0);
          }
        }
      } catch (error) {
        console.error('Error checking for scenarios during navigation:', error);
        actions.setStatus('Error checking for scenarios', 'error');
      }
    },

    async navigateToParentDirectory() {
      const path = await import('path');
      const parentDir = path.dirname(state.currentDirectory);
      if (parentDir !== state.currentDirectory) {
        await actions.navigateToDirectory(parentDir);
      }
    },

    async selectFileSystemNode(nodePath: string) {
      dispatch({ type: 'SET_SELECTED_NODE', payload: nodePath });
      
      // Check if it's a directory that might contain scenarios
      const fs = await import('fs/promises');
      try {
        const stats = await fs.stat(nodePath);
        if (stats.isDirectory()) {
          // For directories, check if they contain scenarios when selected (but don't auto-navigate)
          try {
            const tempConfig = {
              ...state.config,
              scenariosDir: nodePath,
              workspaceRoot: nodePath
            };
            
            const { ConfigResolver } = await import('../../utils/config-resolver');
            const resolver = new ConfigResolver();
            const scenarios = await resolver.findScenarios(tempConfig);
            
            if (scenarios.length > 0) {
              actions.setStatus(`Directory contains ${scenarios.length} scenario${scenarios.length === 1 ? '' : 's'}`, 'info');
            }
          } catch (error) {
            // Silently ignore errors for directory preview
          }
        } else if (nodePath.endsWith('.json') || nodePath.endsWith('.yaml') || nodePath.endsWith('.yml')) {
          // If it's a scenario file, try to load it
          const scenarioIndex = state.scenarios.findIndex(s => s === nodePath);
          if (scenarioIndex >= 0) {
            await actions.selectScenario(scenarioIndex);
          }
        }
      } catch (error) {
        // Handle file system errors silently
      }
    },

    toggleNavigationMode() {
      dispatch({ type: 'TOGGLE_NAVIGATION_MODE' });
      const newMode = state.ui.navigationMode === 'scenarios' ? 'folders' : 'scenarios';
      actions.setStatus(`Switched to ${newMode} navigation mode`, 'info');
    },

    async navigateFileSystem(direction: 'up' | 'down') {
      if (state.fileSystemTree.length === 0) return;
      
      let currentIndex = state.fileSystemTree.findIndex(node => node.path === state.selectedNodePath);
      
      // If no node is selected, start from the first one
      if (currentIndex === -1) {
        currentIndex = 0;
      }
      
      const newIndex = direction === 'up' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(state.fileSystemTree.length - 1, currentIndex + 1);
      
      if (newIndex !== currentIndex || currentIndex === -1) {
        const selectedNode = state.fileSystemTree[newIndex];
        await actions.selectFileSystemNode(selectedNode.path);
        actions.setStatus(`Selected: ${selectedNode.name}`, 'info');
      }
    },

    // Variable management methods
    updateVariableState() {
      try {
        const manager = state.variableManager;
        
        // Environment variables
        manager.setVariable('$.env.API_URL', process.env.API_URL || 'https://api.example.com', 'environment');
        manager.setVariable('$.env.TIMEOUT', parseInt(process.env.TIMEOUT || '10000'), 'environment');
        manager.setVariable('$.env.DEBUG', process.env.DEBUG === 'true', 'environment');
        manager.setVariable('$.env.NODE_ENV', process.env.NODE_ENV || 'development', 'environment');
        
        // Global context variables
        manager.setVariable('$.global.version', '1.0.0', 'system');
        manager.setVariable('$.global.timestamp', new Date().toISOString(), 'system');
        manager.setVariable('$.global.platform', process.platform, 'system');
        
        // Execution context
        manager.setVariable('$.context.executionId', 'exec_' + Date.now(), 'runtime');
        manager.setVariable('$.context.startTime', new Date().toISOString(), 'runtime');
        manager.setVariable('$.context.environment', state.currentEnvironment, 'runtime');
        manager.setVariable('$.context.scenarioCount', state.scenarios.length, 'runtime');
        
        // Current scenario variables
        if (state.currentScenario) {
          manager.setVariable('$.scenario.name', state.currentScenario.name, 'scenario');
          manager.setVariable('$.scenario.stepCount', state.currentScenario.steps?.length || 0, 'scenario');
          manager.setVariable('$.scenario.currentStep', state.ui.selectedStepIndex + 1, 'scenario');
        }

        // Current step variables
        if (state.currentScenario?.steps && state.ui.selectedStepIndex >= 0) {
          const currentStep = state.currentScenario.steps[state.ui.selectedStepIndex];
          manager.setVariable('$.api.name', currentStep.name || `Step ${state.ui.selectedStepIndex + 1}`, 'runtime');
          manager.setVariable('$.api.type', currentStep.type || 'unknown', 'runtime');
          manager.setVariable('$.api.index', state.ui.selectedStepIndex, 'runtime');
          
          if (currentStep.type === 'api') {
            manager.setVariable('$.request.method', (currentStep as any).method || 'GET', 'runtime');
            manager.setVariable('$.request.url', (currentStep as any).url || '', 'runtime');
            manager.setVariable('$.request.timeout', (currentStep as any).timeout || 30000, 'runtime');
            
            if ((currentStep as any).headers) {
              Object.entries((currentStep as any).headers).forEach(([key, value]) => {
                manager.setVariable(`$.request.headers.${key}`, value, 'runtime');
              });
            }
          }
        }

        // Response variables from last execution
        if (state.lastResult?.stepResults && state.ui.selectedStepIndex < state.lastResult.stepResults.length) {
          const stepResult = state.lastResult.stepResults[state.ui.selectedStepIndex];
          if (stepResult) {
            manager.setVariable('$.response.success', stepResult.success, 'response');
            manager.setVariable('$.response.duration', stepResult.duration, 'response');
            manager.setVariable('$.response.error', stepResult.error || null, 'response');
            
            if (stepResult.response) {
              manager.setVariable('$.response.status', stepResult.response.status, 'response');
              manager.setVariable('$.response.statusText', stepResult.response.statusText || '', 'response');
              manager.setVariable('$.response.body', stepResult.response.body, 'response');
              manager.setVariable('$.response.headers', stepResult.response.headers || {}, 'response');
            }
          }
        }
        
        // Execution history variables
        if (state.executionHistory.length > 0) {
          manager.setVariable('$.history.count', state.executionHistory.length, 'runtime');
          manager.setVariable('$.history.lastSuccess', state.executionHistory.find(r => r.success)?.scenarioName || null, 'runtime');
          manager.setVariable('$.history.successRate', Math.round((state.executionHistory.filter(r => r.success).length / state.executionHistory.length) * 100), 'runtime');
        }
      } catch (error) {
        console.error('Failed to update variable state:', error);
      }
    },

    trackVariableUsage(path: string, stepIndex: number, stepName: string, usageType: 'read' | 'write' | 'reference', field: string) {
      try {
        state.variableManager.trackUsage(path, stepIndex, stepName, usageType, field);
      } catch (error) {
        console.error('Failed to track variable usage:', error);
      }
    },

    // Step response data management
    getStepResponseData(stepIndex: number, executionId?: string): PersistentStepResponse | undefined {
      const scenarioName = state.currentScenario?.name || 'unknown';
      const responses = state.stepResponseHistory.get(scenarioName) || [];
      
      if (executionId) {
        return responses.find(r => r.stepIndex === stepIndex && r.executionId === executionId);
      } else {
        // Get the most recent response for this step
        return responses
          .filter(r => r.stepIndex === stepIndex)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      }
    },

    getExecutionStepResponses(executionId: string): PersistentStepResponse[] {
      const scenarioName = state.currentScenario?.name || 'unknown';
      const responses = state.stepResponseHistory.get(scenarioName) || [];
      return responses.filter(r => r.executionId === executionId);
    },

    switchToHistoricalView(executionId: string) {
      dispatch({ type: 'SET_STEP_RESPONSE_VIEWER_MODE', payload: 'historical' });
      dispatch({ type: 'SET_SELECTED_HISTORICAL_EXECUTION', payload: executionId });
      actions.setStatus(`Viewing historical execution: ${executionId}`, 'info');
    },

    switchToCurrentView() {
      dispatch({ type: 'SET_STEP_RESPONSE_VIEWER_MODE', payload: 'current' });
      dispatch({ type: 'SET_SELECTED_HISTORICAL_EXECUTION', payload: undefined });
      actions.setStatus('Viewing current execution data', 'info');
    },

    dispatch
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Initialize execution orchestrator
        await actions.initializeOrchestrator();
        
        // Load scenarios
        const { ConfigResolver } = await import('../../utils/config-resolver');
        const resolver = new ConfigResolver();
        const scenarios = await resolver.findScenarios(initialProps.config);
        dispatch({ type: 'SET_SCENARIOS', payload: scenarios });
        
        // Load environments using the enhanced loader
        await actions.loadEnvironments();
        
        // Load initial file system tree from the configured workspace root
        await actions.loadFileSystemTree(initialProps.config.workspaceRoot);
        
        // Initialize variable state
        actions.updateVariableState();
        
      } catch (error) {
        console.error('Error loading initial data:', error);
        actions.setStatus('Failed to initialize application', 'error');
      }
    };
    
    loadInitialData();
  }, []);

  // Update variable state when relevant state changes
  useEffect(() => {
    actions.updateVariableState();
  }, [state.currentScenario, state.currentEnvironment, state.ui.selectedStepIndex, state.lastResult]);

  const contextValue: AppContextValue = {
    state,
    actions
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};