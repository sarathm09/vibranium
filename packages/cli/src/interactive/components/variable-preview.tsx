/**
 * Enhanced variable preview component with categorized variable display
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import chalk from 'chalk';

export const VariablePreview: React.FC = () => {
  const { state } = useAppContext();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [resolvedVariables, setResolvedVariables] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Reset scroll when variables change
  useEffect(() => {
    setScrollOffset(0);
  }, [resolvedVariables]);

  // Resolve variables when environment, scenario, or step changes
  useEffect(() => {
    resolveCurrentVariables();
  }, [state.currentScenario, state.currentEnvironment, state.ui.selectedStepIndex, state.lastResult]);

  const resolveCurrentVariables = async () => {
    try {
      const variables: Record<string, any> = {};
      
      // Environment-specific variables from current environment
      const currentEnv = state.environments.find(env => env.name === state.currentEnvironment);
      if (currentEnv?.variables) {
        Object.entries(currentEnv.variables).forEach(([key, value]) => {
          variables[`$.env.${key}`] = value;
        });
      }
      
      // Fallback environment variables
      variables['$.env.API_URL'] = currentEnv?.baseUrl || process.env.API_URL || 'https://api.example.com';
      variables['$.env.TIMEOUT'] = currentEnv?.timeout || parseInt(process.env.TIMEOUT || '10000');
      variables['$.env.NODE_ENV'] = process.env.NODE_ENV || 'development';
      
      // Global context variables
      variables['$.global.version'] = '1.0.0';
      variables['$.global.timestamp'] = new Date().toISOString();
      variables['$.global.platform'] = process.platform;
      
      // Execution context
      variables['$.context.executionId'] = 'exec_' + Date.now();
      variables['$.context.startTime'] = new Date().toISOString();
      variables['$.context.environment'] = state.currentEnvironment;
      variables['$.context.scenarioCount'] = state.scenarios.length;
      variables['$.context.environmentCount'] = state.environments.length;
      
      // Environment metadata
      if (currentEnv?.metadata) {
        variables['$.env.type'] = currentEnv.metadata.type;
        variables['$.env.version'] = currentEnv.metadata.version;
        variables['$.env.owner'] = currentEnv.metadata.owner;
      }
      
      // Random generators
      variables['$.random.uuid'] = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      variables['$.random.email'] = `user${Math.floor(Math.random() * 1000)}@example.com`;
      variables['$.random.string'] = Math.random().toString(36).substring(2, 15);
      variables['$.random.number'] = Math.floor(Math.random() * 1000);
      
      // Current scenario variables
      if (state.currentScenario) {
        variables['$.scenario.name'] = state.currentScenario.name;
        variables['$.scenario.stepCount'] = state.currentScenario.steps?.length || 0;
        variables['$.scenario.currentStep'] = state.ui.selectedStepIndex + 1;
      }

      // Current step variables
      if (state.currentScenario?.steps && state.ui.selectedStepIndex >= 0) {
        const currentStep = state.currentScenario.steps[state.ui.selectedStepIndex];
        variables['$.api.name'] = currentStep.name || `Step ${state.ui.selectedStepIndex + 1}`;
        variables['$.api.type'] = currentStep.type || 'unknown';
        variables['$.api.index'] = state.ui.selectedStepIndex;
        
        if (currentStep.type === 'api') {
          variables['$.request.method'] = (currentStep as any).method || 'GET';
          variables['$.request.url'] = (currentStep as any).url || '';
          variables['$.request.timeout'] = (currentStep as any).timeout || 30000;
          
          if ((currentStep as any).headers) {
            Object.entries((currentStep as any).headers).forEach(([key, value]) => {
              variables[`$.request.headers.${key}`] = value;
            });
          }
        }
        
        if (currentStep.type === 'ui') {
          variables['$.ui.action'] = (currentStep as any).action || '';
          variables['$.ui.target'] = (currentStep as any).target || '';
          variables['$.ui.timeout'] = (currentStep as any).timeout || 5000;
        }
      }

      // Response variables from last execution
      if (state.lastResult?.stepResults && state.ui.selectedStepIndex < state.lastResult.stepResults.length) {
        const stepResult = state.lastResult.stepResults[state.ui.selectedStepIndex];
        if (stepResult) {
          variables['$.response.success'] = stepResult.success;
          variables['$.response.duration'] = stepResult.duration;
          variables['$.response.error'] = stepResult.error || null;
          
          if (stepResult.response) {
            variables['$.response.status'] = stepResult.response.status;
            variables['$.response.statusText'] = stepResult.response.statusText || '';
            variables['$.response.body'] = stepResult.response.body;
            variables['$.response.headers'] = stepResult.response.headers || {};
          }
        }
      }
      
      // Execution history variables
      if (state.executionHistory.length > 0) {
        variables['$.history.count'] = state.executionHistory.length;
        variables['$.history.lastSuccess'] = state.executionHistory.find(r => r.success)?.scenarioName || null;
        variables['$.history.successRate'] = Math.round((state.executionHistory.filter(r => r.success).length / state.executionHistory.length) * 100);
      }

      setResolvedVariables(variables);
    } catch (error) {
      console.error('Failed to resolve variables:', error);
      setResolvedVariables({});
    }
  };

  const getPanelTitle = () => {
    const isActive = state.ui.activePane === 'variables';
    const title = '🔢 Variables';
    const color = isActive ? 'cyan' : 'gray';
    return { title, color };
  };
  
  const getVariablesByCategory = () => {
    const categories: Record<string, Record<string, any>> = {
      environment: {},
      global: {},
      context: {},
      scenario: {},
      api: {},
      ui: {},
      request: {},
      response: {},
      random: {},
      history: {}
    };
    
    Object.entries(resolvedVariables).forEach(([key, value]) => {
      const parts = key.split('.');
      if (parts.length >= 2) {
        const category = parts[1]; // Get category after '$'
        if (categories[category]) {
          categories[category][key] = value;
        } else {
          categories['context'][key] = value; // Default category
        }
      }
    });
    
    return categories;
  };
  
  const renderCategorySelector = () => {
    const categories = getVariablesByCategory();
    const categoryNames = Object.keys(categories).filter(cat => Object.keys(categories[cat]).length > 0);
    categoryNames.unshift('all');
    
    // Only show first 3 categories due to space constraints
    const visibleCategories = categoryNames.slice(0, 3);
    
    return (
      <Box>
        {visibleCategories.map((cat, index) => {
          const isSelected = selectedCategory === cat;
          const color = isSelected ? 'cyan' : 'gray';
          const count = cat === 'all' ? Object.keys(resolvedVariables).length : Object.keys(categories[cat] || {}).length;
          const separator = index < visibleCategories.length - 1 ? '•' : '';
          
          return (
            <Text key={cat} color={color} bold={isSelected}>
              {cat.slice(0,3)}({count}){separator}
            </Text>
          );
        })}
        {categoryNames.length > 3 && (
          <Text color="gray"> +{categoryNames.length - 3}</Text>
        )}
      </Box>
    );
  };

  const renderVariables = () => {
    const categories = getVariablesByCategory();
    let entries: [string, any][];
    
    if (selectedCategory === 'all') {
      entries = Object.entries(resolvedVariables);
    } else {
      entries = Object.entries(categories[selectedCategory] || {});
    }
    
    if (entries.length === 0) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%">
          <Text color="gray">
            {selectedCategory === 'all' ? 'No variables to display' : `No ${selectedCategory} variables`}
          </Text>
        </Box>
      );
    }

    const maxVisibleEntries = 8;
    const visibleEntries = entries.slice(scrollOffset, scrollOffset + maxVisibleEntries);

    return (
      <Box flexDirection="column">
        {/* Scroll indicator */}
        {scrollOffset > 0 && (
          <Text color="gray" dimColor marginBottom={1}>
            ... {scrollOffset} variables above (↑ to scroll up)
          </Text>
        )}
        
        {visibleEntries.map(([key, value]) => {
          const keyParts = key.split('.');
          const shortKey = keyParts.length > 2 ? keyParts.slice(-2).join('.') : key;
          const categoryColor = getCategoryColor(keyParts[1]);
          
          return (
            <Box key={key} flexDirection="column" marginBottom={1}>
              <Text color={categoryColor} bold>
                {shortKey}
              </Text>
              <Box paddingLeft={2}>
                <Text color="white" wrap="wrap">
                  {formatValue(value)}
                </Text>
              </Box>
              {key !== shortKey && (
                <Box paddingLeft={2}>
                  <Text color="gray" dimColor>
                    Full: {key}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
        
        {entries.length > scrollOffset + maxVisibleEntries && (
          <Text color="gray" dimColor marginTop={1}>
            ... {entries.length - (scrollOffset + maxVisibleEntries)} more variables (↓ to scroll down)
          </Text>
        )}
      </Box>
    );
  };
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      env: 'green',
      global: 'blue', 
      context: 'cyan',
      scenario: 'magenta',
      api: 'yellow',
      ui: 'blue',
      request: 'green',
      response: 'red',
      random: 'gray',
      history: 'white'
    };
    return colors[category] || 'white';
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const getQuickStats = () => {
    const categories = getVariablesByCategory();
    const totalVars = Object.keys(resolvedVariables).length;
    const activeCategories = Object.keys(categories).filter(cat => Object.keys(categories[cat]).length > 0).length;
    
    return {
      totalVars,
      activeCategories,
      currentCategory: selectedCategory,
      currentCount: selectedCategory === 'all' ? totalVars : Object.keys(categories[selectedCategory] || {}).length
    };
  };

  const { title, color } = getPanelTitle();
  const stats = getQuickStats();
  
  return (
    <Box flexDirection="column" height="100%">
      {/* Compact Header with stats */}
      <Box paddingX={1} paddingY={0} height={3}>
        <Text color={color} bold>Variables</Text>
        <Text color="yellow">
          {stats.totalVars} vars
        </Text>
      </Box>
      
      {/* Category selector - compact */}
      {stats.totalVars > 0 && (
        <Box paddingX={1} height={2}>
          {renderCategorySelector()}
        </Box>
      )}

      {/* Variables list */}
      <Box flexGrow={1} paddingX={1} overflow="hidden">
        {renderVariables()}
      </Box>

      {/* Compact footer */}
      <Box paddingX={1} height={2}>
        <Text color="gray" dimColor>
          {state.ui.activePane === 'variables' ? 
            '🎯 ↑↓ Scroll' : 
            'Ctrl+V'
          }
        </Text>
      </Box>
    </Box>
  );
};