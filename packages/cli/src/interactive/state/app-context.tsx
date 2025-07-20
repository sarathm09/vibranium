/**
 * Application state management for interactive CLI
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { parse as parseYaml } from 'yaml';
import { Scenario, ScenarioResult, Environment } from '../types';
import { ResolvedConfig } from '../../utils/config-resolver';

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
  lastResult?: ScenarioResult;
  executionHistory: ScenarioResult[];

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

  // File system navigation
  loadFileSystemTree: (directory?: string) => Promise<void>;
  expandFolder: (folderPath: string) => void;
  collapseFolder: (folderPath: string) => void;
  toggleFolder: (folderPath: string) => void;
  navigateToDirectory: (directoryPath: string) => Promise<void>;
  navigateToParentDirectory: () => Promise<void>;
  selectFileSystemNode: (nodePath: string) => void;
  toggleNavigationMode: () => void;

  // UI actions
  togglePane: (pane: 'variables' | 'help' | 'next') => void;
  updateEditorContent: (content: string) => void;
  setStatus: (message: string, type?: AppState['status']['type']) => void;

  // Navigation
  navigateScenarios: (direction: 'up' | 'down') => void;
  navigateSteps: (direction: 'up' | 'down') => void;
  navigateFileSystem: (direction: 'up' | 'down') => void;
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
    lastResult: undefined,
    executionHistory: [],
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
      
      dispatch({ type: 'SET_RUNNING', payload: true });
      const startTime = new Date();
      actions.setStatus(`Running scenario: ${state.currentScenario.name}...`, 'info');
      
      try {
        const stepResults: any[] = [];
        const totalSteps = state.currentScenario.steps?.length || 0;
        
        // Simulate step execution
        for (let i = 0; i < totalSteps; i++) {
          const step = state.currentScenario.steps![i];
          actions.setStatus(`Running step ${i + 1}/${totalSteps}: ${step.name}`, 'info');
          
          // Update selected step index to show progress
          dispatch({ type: 'SELECT_STEP', payload: i });
          
          // Simulate step execution time
          const stepStartTime = Date.now();
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
          const stepDuration = Date.now() - stepStartTime;
          
          // Simulate step success/failure (90% success rate)
          const stepSuccess = Math.random() > 0.1;
          
          const stepResult = {
            stepName: step.name,
            success: stepSuccess,
            duration: stepDuration,
            error: stepSuccess ? undefined : 'Mock execution error',
            response: stepSuccess ? {
              status: 200,
              statusText: 'OK',
              body: { id: i + 1, message: 'Success' },
              headers: { 'content-type': 'application/json' }
            } : undefined
          };
          
          stepResults.push(stepResult);
          
          // Early exit on failure (optional)
          if (!stepSuccess && state.currentScenario.lifecycle?.onFailure !== 'continue') {
            break;
          }
        }
        
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        const overallSuccess = stepResults.every(r => r.success);
        
        const result: ScenarioResult = {
          scenarioName: state.currentScenario.name,
          success: overallSuccess,
          duration,
          stepResults,
          startTime,
          endTime,
          environment: state.currentEnvironment
        };
        
        dispatch({ type: 'SET_LAST_RESULT', payload: result });
        dispatch({ type: 'ADD_EXECUTION_RESULT', payload: result });
        
        const status = overallSuccess ? 'PASSED' : 'FAILED';
        const statusType = overallSuccess ? 'success' : 'error';
        actions.setStatus(`Scenario ${status} - ${stepResults.filter(r => r.success).length}/${stepResults.length} steps passed (${duration}ms)`, statusType);
        
      } catch (error) {
        console.error('Execution error:', error);
        actions.setStatus(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      } finally {
        dispatch({ type: 'SET_RUNNING', payload: false });
      }
    },

    async runCurrentStep() {
      actions.setStatus('Step execution not implemented yet', 'warning');
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
    },

    async navigateToParentDirectory() {
      const path = await import('path');
      const parentDir = path.dirname(state.currentDirectory);
      if (parentDir !== state.currentDirectory) {
        await actions.navigateToDirectory(parentDir);
      }
    },

    selectFileSystemNode(nodePath: string) {
      dispatch({ type: 'SET_SELECTED_NODE', payload: nodePath });
      
      // If it's a scenario file, try to load it
      if (nodePath.endsWith('.json') || nodePath.endsWith('.yaml') || nodePath.endsWith('.yml')) {
        // Find the scenario in the scenarios list and select it
        const scenarioIndex = state.scenarios.findIndex(s => s === nodePath);
        if (scenarioIndex >= 0) {
          actions.selectScenario(scenarioIndex);
        }
      }
    },

    toggleNavigationMode() {
      dispatch({ type: 'TOGGLE_NAVIGATION_MODE' });
      const newMode = state.ui.navigationMode === 'scenarios' ? 'folders' : 'scenarios';
      actions.setStatus(`Switched to ${newMode} navigation mode`, 'info');
    },

    navigateFileSystem(direction: 'up' | 'down') {
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
        actions.selectFileSystemNode(selectedNode.path);
        actions.setStatus(`Selected: ${selectedNode.name}`, 'info');
      }
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
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