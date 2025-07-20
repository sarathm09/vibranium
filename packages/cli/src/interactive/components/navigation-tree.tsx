/**
 * Enhanced navigation tree component with folder navigation
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import chalk from 'chalk';
import path from 'path';

export const NavigationTree: React.FC = () => {
  const { state, actions } = useAppContext();
  
  // Load file system tree on mount if empty
  React.useEffect(() => {
    if (state.fileSystemTree.length === 0) {
      actions.loadFileSystemTree();
    }
  }, []);

  const renderBreadcrumbs = () => {
    if (state.breadcrumbs.length === 0) return null;
    
    return (
      <Box paddingX={1} marginBottom={1}>
        <Text color="blue" dimColor>
          📍 /{state.breadcrumbs.join('/')}
        </Text>
      </Box>
    );
  };

  const renderFileSystemTree = () => {
    if (state.fileSystemTree.length === 0) {
      return (
        <Box paddingY={1} justifyContent="center">
          <Text color="gray" dimColor>Loading directory...</Text>
        </Box>
      );
    }

    return state.fileSystemTree.map((node, index) => {
      const isSelected = node.path === state.selectedNodePath;
      const isDirectory = node.type === 'directory';
      const isScenarioFile = node.name.endsWith('.json') || node.name.endsWith('.yaml') || node.name.endsWith('.yml');
      
      // Choose appropriate icon
      let icon = '';
      if (node.name === '..') {
        icon = '↩️ ';
      } else if (isDirectory) {
        icon = '📁 ';
      } else if (isScenarioFile) {
        icon = '📋 ';
      } else {
        icon = '📄 ';
      }
      
      // Color coding
      let textColor = 'white';
      if (isSelected) {
        textColor = 'cyan';
      } else if (node.name === '..') {
        textColor = 'blue';
      } else if (isDirectory) {
        textColor = 'yellow';
      } else if (isScenarioFile) {
        textColor = 'green';
      } else {
        textColor = 'gray';
      }
      
      const bgColor = isSelected ? 'blue' : undefined;
      const prefix = isSelected ? '▶ ' : '  ';
      
      // Show execution status for scenario files
      let statusIcon = '';
      let statusColor = 'white';
      if (isScenarioFile && state.lastResult) {
        const scenarioIndex = state.scenarios.findIndex(s => s === node.path);
        if (scenarioIndex === state.ui.selectedScenarioIndex) {
          statusIcon = state.lastResult.success ? ' ✓' : ' ✗';
          statusColor = state.lastResult.success ? 'green' : 'red';
        }
      }

      return (
        <Box key={node.path} paddingY={0}>
          <Text color={textColor} bold={isSelected} backgroundColor={bgColor}>
            {prefix}{icon}{node.name}
            <Text color={statusColor}>{statusIcon}</Text>
          </Text>
        </Box>
      );
    });
  };

  const renderScenarioList = () => {
    if (state.scenarios.length === 0) {
      return (
        <Box paddingY={1} justifyContent="center">
          <Text color="gray" dimColor>No scenarios found</Text>
        </Box>
      );
    }

    return state.scenarios.map((scenarioPath, index) => {
      const isSelected = index === state.ui.selectedScenarioIndex;
      const scenarioName = path.basename(scenarioPath, path.extname(scenarioPath));
      const scenarioDir = path.dirname(scenarioPath).split('/').pop();
      
      const textColor = isSelected ? 'cyan' : 'white';
      const bgColor = isSelected ? 'blue' : undefined;
      const prefix = isSelected ? '▶ ' : '  ';
      
      // Show execution status if available
      let statusIcon = '';
      let statusColor = 'white';
      if (state.lastResult && index === state.ui.selectedScenarioIndex) {
        statusIcon = state.lastResult.success ? ' ✓' : ' ✗';
        statusColor = state.lastResult.success ? 'green' : 'red';
      }

      return (
        <Box key={scenarioPath} paddingY={0}>
          <Text color={textColor} bold={isSelected} backgroundColor={bgColor}>
            {prefix}📋 {scenarioName}
            <Text color={statusColor}>{statusIcon}</Text>
          </Text>
          {isSelected && scenarioDir && scenarioDir !== '.' && (
            <Box paddingLeft={4}>
              <Text color="gray" dimColor>in {scenarioDir}/</Text>
            </Box>
          )}
        </Box>
      );
    });
  };

  const renderStepList = () => {
    if (!state.currentScenario || !state.currentScenario.steps || state.currentScenario.steps.length === 0) {
      return (
        <Box marginTop={1} paddingLeft={2}>
          <Text color="gray" dimColor>No steps available</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color="yellow" bold marginBottom={1}>
          Steps ({state.currentScenario.steps.length}):
        </Text>
        {state.currentScenario.steps.map((step, index) => {
          const isSelected = index === state.ui.selectedStepIndex;
          const textColor = isSelected ? 'cyan' : 'gray';
          const bgColor = isSelected ? 'blue' : undefined;
          const prefix = isSelected ? '  ▶ ' : '    ';

          // Get step status from last result
          let statusColor = 'white';
          let statusIcon = '';
          
          if (state.lastResult?.stepResults) {
            const stepResult = state.lastResult.stepResults.find(sr => sr.stepName === step.name);
            if (stepResult) {
              statusColor = stepResult.success ? 'green' : 'red';
              statusIcon = stepResult.success ? ' ✓' : ' ✗';
            }
          } else if (state.isRunning && index <= state.ui.selectedStepIndex) {
            statusIcon = ' ⏳';
            statusColor = 'yellow';
          }
          
          // Show step type
          const stepType = step.type || 'unknown';
          const typeColor = stepType === 'api' ? 'green' : stepType === 'ui' ? 'blue' : 'gray';

          return (
            <Box key={step.name || index} paddingY={0}>
              <Text color={textColor} backgroundColor={bgColor}>
                {prefix}{step.name || `Step ${index + 1}`}
                <Text color={statusColor}>{statusIcon}</Text>
              </Text>
              {isSelected && (
                <Box paddingLeft={6}>
                  <Text color={typeColor} dimColor>[{stepType.toUpperCase()}]</Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  const getPanelTitle = () => {
    const isActive = state.ui.activePane === 'navigation';
    const modeText = state.ui.navigationMode === 'folders' ? 'File Explorer' : 'Scenarios & Steps';
    const title = `📁 ${modeText}`;
    const color = isActive ? 'cyan' : 'gray';
    return { title, color };
  };

  const renderModeToggle = () => {
    return (
      <Box paddingX={1} marginBottom={1}>
        <Text color="magenta" dimColor>
          Mode: {state.ui.navigationMode === 'folders' ? '📁 Files' : '📋 Scenarios'} • Press 'M' to toggle
        </Text>
      </Box>
    );
  };

  const { title, color } = getPanelTitle();
  
  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box paddingX={1} paddingY={0}>
        <Text color={color} bold>{title}</Text>
      </Box>

      {/* Mode toggle */}
      {renderModeToggle()}

      {/* Content area */}
      <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
        {state.ui.navigationMode === 'folders' ? (
          <>
            {/* Breadcrumbs */}
            {renderBreadcrumbs()}
            
            {/* File system tree */}
            <Box flexDirection="column" flexGrow={1}>
              <Text color="yellow" bold marginBottom={1}>
                📂 Directory Contents ({state.fileSystemTree.length})
              </Text>
              <Box flexDirection="column" maxHeight={20} overflow="hidden">
                {renderFileSystemTree()}
              </Box>
            </Box>
          </>
        ) : (
          <>
            {/* Scenario list */}
            <Box flexDirection="column" marginBottom={1}>
              <Text color="magenta" bold marginBottom={1}>
                📋 Scenarios ({state.scenarios.length})
              </Text>
              <Box flexDirection="column" maxHeight={15} overflow="hidden">
                {renderScenarioList()}
              </Box>
            </Box>
            
            {/* Steps for current scenario */}
            <Box flexDirection="column" flexGrow={1}>
              {renderStepList()}
            </Box>
          </>
        )}
      </Box>

      {/* Footer with navigation hints */}
      <Box paddingX={1} borderStyle="single">
        <Text color="gray" dimColor>
          {state.ui.activePane === 'navigation' ? 
            (state.ui.navigationMode === 'folders' ? 
              '🎯 ACTIVE: ↑↓ Navigate • Enter: Open • Backspace: Parent' :
              '🎯 ACTIVE: ↑↓ Navigate • Enter: Select • M: File Mode'
            ) : 
            'Tab: Activate • Ctrl+C: Commands'
          }
        </Text>
      </Box>
    </Box>
  );
};