/**
 * Application state management for interactive CLI
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { parse as parseYaml } from 'yaml';
import { Scenario, ScenarioResult, Environment } from '../types';
import { ResolvedConfig } from '../../utils/config-resolver';
// Temporarily commented out for testing until build issues are resolved
// import { ScenarioOrchestrator, ExecutionProgress } from '@vibraniumjs/core';
// import { CoreApiPlugin } from '@vibraniumjs/plugins';
// import { EnvironmentManager } from '@vibraniumjs/utils';

// Temporary mock interfaces for testing
interface ExecutionProgress {
  totalSteps: number;
  completedSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  currentBatch: number;
  totalBatches: number;
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
  lastResult?: ScenarioResult;
  executionHistory: ScenarioResult[];
  executionOrchestrator?: any; // ScenarioOrchestrator;

  // UI state
  ui: {
    selectedScenarioIndex: number;
    selectedStepIndex: number;
    activePane: 'navigation' | 'details' | 'variables' | 'help';
    showVariablePreview: boolean;
    editorContent: string;
    editorChanged: boolean;
    navigationMode: 'scenarios' | 'folders'; // Toggle between scenarios and file navigation
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
  saveCurrentScenario: () => Promise<void>;

  // Environment management
  switchEnvironment: (environment?: string) => Promise<void>;
  loadEnvironments: () => Promise<void>;

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

  // Navigation
  navigateScenarios: (direction: 'up' | 'down') => void;
  navigateSteps: (direction: 'up' | 'down') => void;
  navigateFileSystem: (direction: 'up' | 'down') => Promise<void>;
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
  | { type: 'SELECT_SCENARIO'; payload: number }
  | { type: 'SELECT_STEP'; payload: number }
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
  | { type: 'TOGGLE_NAVIGATION_MODE' };

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
    
    case 'SELECT_SCENARIO':
      return { ...state, ui: { ...state.ui, selectedScenarioIndex: action.payload } };
    
    case 'SELECT_STEP':
      return { ...state, ui: { ...state.ui, selectedStepIndex: action.payload } };
    
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
    fileSystemTree: [],
    currentDirectory: config.workspaceRoot,
    selectedNodePath: '',
    expandedFolders: new Set<string>(),
    breadcrumbs: [],
    isRunning: false,
    canStop: false,
    executionProgress: undefined,
    lastResult: undefined,
    executionHistory: [],
    executionOrchestrator: undefined,
    ui: {
      selectedScenarioIndex: 0,
      selectedStepIndex: 0,
      activePane: 'navigation',
      showVariablePreview: false,
      editorContent: '',
      editorChanged: false,
      navigationMode: 'folders'
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
        // Simplified environment loading for now
        const environments = [
          { name: 'local', variables: {}, secrets: {} },
          { name: 'staging', variables: {}, secrets: {} },
          { name: 'production', variables: {}, secrets: {} }
        ];
        dispatch({ type: 'SET_ENVIRONMENTS', payload: environments });
        actions.setStatus('Environments loaded', 'success');
      } catch (error) {
        actions.setStatus(`Failed to load environments: ${error instanceof Error ? error.message : error}`, 'error');
      }
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
    
    // Enhanced simulation that mimics real HTTP execution
    async simulateEnhancedExecution(scenario: any, variables: any, options: any) {
      const startTime = new Date();
      const stepResults: any[] = [];
      let overallSuccess = true;
      
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const stepStartTime = Date.now();
        
        // Update step progress
        dispatch({ type: 'SELECT_STEP', payload: i });
        
        // Simulate step execution time based on step type
        const baseDelay = step.type === 'api' ? 500 : 200;
        const randomDelay = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, baseDelay + randomDelay));
        
        const stepDuration = Date.now() - stepStartTime;
        
        // Enhanced simulation based on step type
        let stepResult: any;
        if (step.type === 'api' || ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(step.type)) {
          stepResult = await actions.simulateApiStep(step, variables, stepDuration);
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
        }
        
        stepResults.push(stepResult);
        
        if (stepResult.status === 'failed') {
          overallSuccess = false;
          if (options.failFast) {
            break;
          }
        }
        
        // Update execution progress
        const progress: ExecutionProgress = {
          totalSteps: scenario.steps.length,
          completedSteps: i + 1,
          passedSteps: stepResults.filter(r => r.status === 'passed').length,
          failedSteps: stepResults.filter(r => r.status === 'failed').length,
          skippedSteps: stepResults.filter(r => r.status === 'skipped').length,
          currentBatch: 1,
          totalBatches: 1
        };
        dispatch({ type: 'SET_EXECUTION_PROGRESS', payload: progress });
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
    }
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
        
        // Load environments
        const environments = [
          { name: 'local', variables: {}, secrets: {} },
          { name: 'staging', variables: {}, secrets: {} },
          { name: 'production', variables: {}, secrets: {} }
        ];
        dispatch({ type: 'SET_ENVIRONMENTS', payload: environments });
        
        // Load initial file system tree from the configured workspace root
        await actions.loadFileSystemTree(initialProps.config.workspaceRoot);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
        actions.setStatus('Failed to initialize application', 'error');
      }
    };
    
    loadInitialData();
  }, []);

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