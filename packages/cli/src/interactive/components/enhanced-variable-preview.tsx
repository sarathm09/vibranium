/**
 * Enhanced variable preview component with comprehensive variable state management
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../state/app-context';
import { VariableStateManager } from '../state/variable-state-manager';
import {
  VariableFilter,
  VariableSortOptions,
  VariableStateEntry,
  VariableCategory,
  VariableSource,
  VariableInspectorData
} from '../types/variable-state';

interface VariablePreviewState {
  mode: 'list' | 'search' | 'inspector' | 'dependencies';
  searchPattern: string;
  selectedVariable: string | null;
  inspectorData: VariableInspectorData | null;
  showBookmarkedOnly: boolean;
  showRecentChangesOnly: boolean;
  selectedCategory: VariableCategory | 'all';
  sortBy: VariableSortOptions;
  scrollOffset: number;
}

export const EnhancedVariablePreview: React.FC = () => {
  const { state } = useAppContext();
  const [variableManager] = useState(() => new VariableStateManager());
  const [previewState, setPreviewState] = useState<VariablePreviewState>({
    mode: 'list',
    searchPattern: '',
    selectedVariable: null,
    inspectorData: null,
    showBookmarkedOnly: false,
    showRecentChangesOnly: false,
    selectedCategory: 'all',
    sortBy: { field: 'name', direction: 'asc' },
    scrollOffset: 0
  });

  // Initialize and update variables
  useEffect(() => {
    updateVariables();
  }, [state.currentScenario, state.currentEnvironment, state.ui.selectedStepIndex, state.lastResult]);

  // Subscribe to variable changes
  useEffect(() => {
    const handleVariableChange = () => {
      // Trigger re-render when variables change
      setPreviewState(prev => ({ ...prev }));
    };
    
    variableManager.subscribe(handleVariableChange);
    return () => variableManager.unsubscribe(handleVariableChange);
  }, [variableManager]);

  const updateVariables = useCallback(() => {
    try {
      // Environment variables
      variableManager.setVariable('$.env.API_URL', process.env.API_URL || 'https://api.example.com', 'environment');
      variableManager.setVariable('$.env.TIMEOUT', parseInt(process.env.TIMEOUT || '10000'), 'environment');
      variableManager.setVariable('$.env.DEBUG', process.env.DEBUG === 'true', 'environment');
      variableManager.setVariable('$.env.NODE_ENV', process.env.NODE_ENV || 'development', 'environment');
      
      // Global context variables
      variableManager.setVariable('$.global.version', '1.0.0', 'system');
      variableManager.setVariable('$.global.timestamp', new Date().toISOString(), 'system');
      variableManager.setVariable('$.global.platform', process.platform, 'system');
      
      // Execution context
      variableManager.setVariable('$.context.executionId', 'exec_' + Date.now(), 'runtime');
      variableManager.setVariable('$.context.startTime', new Date().toISOString(), 'runtime');
      variableManager.setVariable('$.context.environment', state.currentEnvironment, 'runtime');
      variableManager.setVariable('$.context.scenarioCount', state.scenarios.length, 'runtime');
      
      // Random generators
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      variableManager.setVariable('$.random.uuid', uuid, 'runtime');
      variableManager.setVariable('$.random.email', `user${Math.floor(Math.random() * 1000)}@example.com`, 'runtime');
      variableManager.setVariable('$.random.string', Math.random().toString(36).substring(2, 15), 'runtime');
      variableManager.setVariable('$.random.number', Math.floor(Math.random() * 1000), 'runtime');
      
      // Current scenario variables
      if (state.currentScenario) {
        variableManager.setVariable('$.scenario.name', state.currentScenario.name, 'scenario');
        variableManager.setVariable('$.scenario.stepCount', state.currentScenario.steps?.length || 0, 'scenario');
        variableManager.setVariable('$.scenario.currentStep', state.ui.selectedStepIndex + 1, 'scenario');
      }

      // Current step variables
      if (state.currentScenario?.steps && state.ui.selectedStepIndex >= 0) {
        const currentStep = state.currentScenario.steps[state.ui.selectedStepIndex];
        variableManager.setVariable('$.api.name', currentStep.name || `Step ${state.ui.selectedStepIndex + 1}`, 'runtime');
        variableManager.setVariable('$.api.type', currentStep.type || 'unknown', 'runtime');
        variableManager.setVariable('$.api.index', state.ui.selectedStepIndex, 'runtime');
        
        if (currentStep.type === 'api') {
          variableManager.setVariable('$.request.method', (currentStep as any).method || 'GET', 'runtime');
          variableManager.setVariable('$.request.url', (currentStep as any).url || '', 'runtime');
          variableManager.setVariable('$.request.timeout', (currentStep as any).timeout || 30000, 'runtime');
          
          if ((currentStep as any).headers) {
            Object.entries((currentStep as any).headers).forEach(([key, value]) => {
              variableManager.setVariable(`$.request.headers.${key}`, value, 'runtime');
            });
          }
        }
      }

      // Response variables from last execution
      if (state.lastResult?.stepResults && state.ui.selectedStepIndex < state.lastResult.stepResults.length) {
        const stepResult = state.lastResult.stepResults[state.ui.selectedStepIndex];
        if (stepResult) {
          variableManager.setVariable('$.response.success', stepResult.success, 'response');
          variableManager.setVariable('$.response.duration', stepResult.duration, 'response');
          variableManager.setVariable('$.response.error', stepResult.error || null, 'response');
          
          if (stepResult.response) {
            variableManager.setVariable('$.response.status', stepResult.response.status, 'response');
            variableManager.setVariable('$.response.statusText', stepResult.response.statusText || '', 'response');
            variableManager.setVariable('$.response.body', stepResult.response.body, 'response');
            variableManager.setVariable('$.response.headers', stepResult.response.headers || {}, 'response');
          }
        }
      }
      
      // Execution history variables
      if (state.executionHistory.length > 0) {
        variableManager.setVariable('$.history.count', state.executionHistory.length, 'runtime');
        variableManager.setVariable('$.history.lastSuccess', state.executionHistory.find(r => r.success)?.scenarioName || null, 'runtime');
        variableManager.setVariable('$.history.successRate', Math.round((state.executionHistory.filter(r => r.success).length / state.executionHistory.length) * 100), 'runtime');
      }
    } catch (error) {
      console.error('Failed to update variables:', error);
    }
  }, [state, variableManager]);

  // Input handling
  useInput((input, key) => {
    if (state.ui.activePane !== 'variables') return;
    
    // Mode switching
    if (input.toLowerCase() === 'v' && !key.ctrl) {
      setPreviewState(prev => ({ ...prev, mode: 'list' }));
      return;
    }
    
    if (input.toLowerCase() === 'f' && !key.ctrl) {
      setPreviewState(prev => ({ ...prev, mode: 'search' }));
      return;
    }
    
    if (input.toLowerCase() === 'i' && !key.ctrl) {
      if (previewState.selectedVariable) {
        const inspectorData = variableManager.getInspectorData(previewState.selectedVariable);
        setPreviewState(prev => ({ 
          ...prev, 
          mode: 'inspector', 
          inspectorData 
        }));
      }
      return;
    }
    
    if (input.toLowerCase() === 'd' && !key.ctrl) {
      setPreviewState(prev => ({ ...prev, mode: 'dependencies' }));
      return;
    }
    
    // Variable operations
    if (input.toLowerCase() === 'c' && !key.ctrl) {
      if (previewState.selectedVariable) {
        variableManager.copyVariable(previewState.selectedVariable);
      }
      return;
    }
    
    if (input.toLowerCase() === 'b' && !key.ctrl) {
      if (previewState.selectedVariable) {
        variableManager.bookmarkVariable(previewState.selectedVariable);
      }
      return;
    }
    
    // Filters
    if (input.toLowerCase() === 'r' && !key.ctrl) {
      setPreviewState(prev => ({ 
        ...prev, 
        showRecentChangesOnly: !prev.showRecentChangesOnly 
      }));
      return;
    }
    
    if (input.toLowerCase() === 'm' && !key.ctrl) {
      setPreviewState(prev => ({ 
        ...prev, 
        showBookmarkedOnly: !prev.showBookmarkedOnly 
      }));
      return;
    }
    
    // Navigation
    if (key.upArrow) {
      setPreviewState(prev => ({ 
        ...prev, 
        scrollOffset: Math.max(0, prev.scrollOffset - 1) 
      }));
    } else if (key.downArrow) {
      setPreviewState(prev => ({ 
        ...prev, 
        scrollOffset: prev.scrollOffset + 1 
      }));
    }
  });

  // Get filtered and sorted variables
  const filteredVariables = useMemo(() => {
    const filter: VariableFilter = {
      searchPattern: previewState.searchPattern || undefined,
      categories: previewState.selectedCategory !== 'all' ? [previewState.selectedCategory] : undefined,
      bookmarkedOnly: previewState.showBookmarkedOnly || undefined,
      recentChangesOnly: previewState.showRecentChangesOnly || undefined
    };
    
    const variables = variableManager.filterVariables(filter);
    return variableManager.sortVariables(variables, previewState.sortBy);
  }, [variableManager, previewState]);

  const getPanelTitle = () => {
    const isActive = state.ui.activePane === 'variables';
    const title = '🔢 Variables';
    const color = isActive ? 'cyan' : 'gray';
    const modeIndicator = previewState.mode === 'search' ? ' 🔍' : 
                         previewState.mode === 'inspector' ? ' 🔬' : 
                         previewState.mode === 'dependencies' ? ' 🔗' : '';
    return { title: title + modeIndicator, color };
  };

  const renderModeHeader = () => {
    const { title, color } = getPanelTitle();
    return (
      <Box paddingX={1} paddingY={0} height={2}>
        <Text color={color} bold>{title}</Text>
        <Text color="yellow"> ({filteredVariables.length})</Text>
        {previewState.showBookmarkedOnly && <Text color="blue"> ⭐</Text>}
        {previewState.showRecentChangesOnly && <Text color="green"> 🔄</Text>}
      </Box>
    );
  };

  const renderCategorySelector = () => {
    const categories: Array<{ key: VariableCategory | 'all'; label: string; count: number }> = [
      { key: 'all', label: 'All', count: filteredVariables.length },
      { key: 'environment', label: 'Env', count: 0 },
      { key: 'global', label: 'Glb', count: 0 },
      { key: 'context', label: 'Ctx', count: 0 },
      { key: 'response', label: 'Res', count: 0 }
    ];
    
    // Count variables by category
    const allVars = variableManager.getAllVariables();
    for (const [_, entry] of allVars) {
      const cat = categories.find(c => c.key === entry.metadata.category);
      if (cat) cat.count++;
    }
    
    return (
      <Box paddingX={1} height={2}>
        {categories.slice(0, 4).map((cat, index) => {
          const isSelected = previewState.selectedCategory === cat.key;
          const color = isSelected ? 'cyan' : 'gray';
          const separator = index < 3 ? '•' : '';
          
          return (
            <Text key={cat.key} color={color} bold={isSelected}>
              {cat.label}({cat.count}){separator}
            </Text>
          );
        })}
      </Box>
    );
  };

  const renderVariableList = () => {
    if (filteredVariables.length === 0) {
      return (
        <Box justifyContent="center" alignItems="center" flexGrow={1}>
          <Text color="gray">
            {previewState.searchPattern ? 'No matching variables' : 'No variables to display'}
          </Text>
        </Box>
      );
    }

    const maxVisibleEntries = 12;
    const visibleEntries = filteredVariables.slice(
      previewState.scrollOffset, 
      previewState.scrollOffset + maxVisibleEntries
    );

    return (
      <Box flexDirection="column" flexGrow={1}>
        {/* Scroll indicator */}
        {previewState.scrollOffset > 0 && (
          <Text color="gray" dimColor>
            ↑ {previewState.scrollOffset} variables above
          </Text>
        )}
        
        {visibleEntries.map(([path, entry], index) => {
          const isSelected = previewState.selectedVariable === path;
          const keyParts = path.split('.');
          const shortKey = keyParts.length > 2 ? keyParts.slice(-2).join('.') : path;
          const categoryColor = getCategoryColor(entry.metadata.category);
          
          return (
            <Box 
              key={path} 
              flexDirection="column" 
              marginBottom={1}
              borderStyle={isSelected ? 'round' : undefined}
              borderColor={isSelected ? 'blue' : undefined}
              paddingX={isSelected ? 1 : 0}
            >
              <Box justifyContent="space-between">
                <Text color={categoryColor} bold>
                  {entry.metadata.isBookmarked && '⭐ '}
                  {entry.hasRecentChange && '🔄 '}
                  {shortKey}
                </Text>
                <Text color="gray" dimColor>
                  {entry.metadata.dataType}
                </Text>
              </Box>
              
              <Box paddingLeft={isSelected ? 0 : 2}>
                <Text color="white" wrap="wrap">
                  {formatValue(entry.value)}
                </Text>
              </Box>
              
              {isSelected && (
                <Box paddingLeft={2}>
                  <Text color="gray" dimColor>
                    Source: {entry.metadata.source} | Size: {entry.metadata.size}b | Used: {entry.metadata.usageCount}x
                  </Text>
                  {entry.metadata.dependencies.length > 0 && (
                    <Text color="yellow" dimColor>
                      Deps: {entry.metadata.dependencies.join(', ')}
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
        
        {filteredVariables.length > previewState.scrollOffset + maxVisibleEntries && (
          <Text color="gray" dimColor>
            ↓ {filteredVariables.length - (previewState.scrollOffset + maxVisibleEntries)} more variables
          </Text>
        )}
      </Box>
    );
  };

  const renderInspector = () => {
    if (!previewState.inspectorData) {
      return (
        <Box justifyContent="center" alignItems="center" flexGrow={1}>
          <Text color="gray">Select a variable to inspect</Text>
        </Box>
      );
    }

    const data = previewState.inspectorData;
    return (
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        <Text color="cyan" bold>{data.metadata.path}</Text>
        
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow">Type: <Text color="white">{data.metadata.dataType}</Text></Text>
          <Text color="yellow">Source: <Text color="white">{data.metadata.source}</Text></Text>
          <Text color="yellow">Category: <Text color="white">{data.metadata.category}</Text></Text>
          <Text color="yellow">Usage: <Text color="white">{data.usageAnalysis.totalUsage}x</Text></Text>
        </Box>
        
        <Box flexDirection="column" marginTop={1}>
          <Text color="green" bold>Value:</Text>
          <Text color="white">{data.formattedValue.substring(0, 200)}</Text>
        </Box>
        
        {data.dependencyTree.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="blue" bold>Dependencies:</Text>
            {data.dependencyTree.slice(0, 3).map(dep => (
              <Text key={dep.path} color={dep.isAvailable ? 'white' : 'red'}>
                {dep.type === 'circular' ? '↻ ' : '  '}{dep.path}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const renderDependencies = () => {
    const graph = variableManager.getDependencyGraph();
    const entries = Array.from(graph.entries()).slice(0, 10);
    
    return (
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        <Text color="blue" bold>Dependency Graph</Text>
        
        {entries.map(([path, deps]) => (
          <Box key={path} flexDirection="column" marginTop={1}>
            <Text color="cyan">{path.substring(0, 30)}</Text>
            {deps.slice(0, 2).map(dep => (
              <Text key={dep} color="gray" paddingLeft={2}>
                → {dep}
              </Text>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  const renderFooter = () => {
    const shortcuts = {
      list: 'V:List F:Search I:Inspect D:Deps C:Copy B:Bookmark R:Recent M:Marked',
      search: 'V:Back to List',
      inspector: 'V:Back to List',
      dependencies: 'V:Back to List'
    };
    
    return (
      <Box paddingX={1} height={2}>
        <Text color="gray" dimColor>
          {state.ui.activePane === 'variables' ? 
            shortcuts[previewState.mode] : 
            'Tab to activate'
          }
        </Text>
      </Box>
    );
  };

  const getCategoryColor = (category: VariableCategory): string => {
    const colors: Record<VariableCategory, string> = {
      environment: 'green',
      global: 'blue', 
      context: 'cyan',
      scenario: 'magenta',
      api: 'yellow',
      ui: 'blue',
      request: 'green',
      response: 'red',
      random: 'gray',
      history: 'white',
      custom: 'white'
    };
    return colors[category] || 'white';
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
      return value.length > 50 ? value.substring(0, 47) + '...' : value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    
    try {
      const str = JSON.stringify(value);
      return str.length > 50 ? str.substring(0, 47) + '...' : str;
    } catch {
      return String(value);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {renderModeHeader()}
      
      {previewState.mode === 'list' && renderCategorySelector()}
      
      <Box flexGrow={1} overflow="hidden">
        {previewState.mode === 'list' && renderVariableList()}
        {previewState.mode === 'search' && renderVariableList()}
        {previewState.mode === 'inspector' && renderInspector()}
        {previewState.mode === 'dependencies' && renderDependencies()}
      </Box>

      {renderFooter()}
    </Box>
  );
};