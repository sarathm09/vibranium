/**
 * Details pane component with YAML/JSON editor and scenario information
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import chalk from 'chalk';

export const DetailsPane: React.FC = () => {
  const { state, actions } = useAppContext();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'overview' | 'raw' | 'execution'>('overview');
  
  // Reset scroll when scenario changes
  useEffect(() => {
    setScrollOffset(0);
  }, [state.currentScenario]);

  const getPanelTitle = () => {
    const isActive = state.ui.activePane === 'details';
    let title = '📝 Scenario Details';
    
    if (state.currentScenario) {
      title = `📝 ${state.currentScenario.name}`;
      if (state.ui.editorChanged) {
        title += ' •';
      }
    }
    
    const color = isActive ? 'cyan' : 'gray';
    return { title, color };
  };

  const renderContent = () => {
    if (!state.currentScenario) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
          <Text color="gray" bold>
            👁️ No Scenario Selected
          </Text>
          <Text color="gray" dimColor marginTop={1}>
            Use ↑↓ to navigate and Enter to select a scenario
          </Text>
          {state.scenarios.length === 0 && (
            <Text color="yellow" marginTop={1}>
              ⚠️ No scenarios found in current directory
            </Text>
          )}
        </Box>
      );
    }

    switch (viewMode) {
      case 'overview':
        return renderOverview();
      case 'raw':
        return renderRawContent();
      case 'execution':
        return renderExecutionDetails();
      default:
        return renderOverview();
    }
  };
  
  const renderViewModeSelector = () => {
    const modes = [{ key: 'overview', label: '📋 Overview' }, { key: 'raw', label: '📜 Raw' }, { key: 'execution', label: '🏃 Execution' }];
    
    return (
      <Box marginBottom={1}>
        {modes.map((mode, index) => {
          const isSelected = viewMode === mode.key;
          const color = isSelected ? 'cyan' : 'gray';
          const separator = index < modes.length - 1 ? ' • ' : '';
          
          return (
            <Text key={mode.key} color={color} bold={isSelected}>
              {mode.label}{separator}
            </Text>
          );
        })}
      </Box>
    );
  };
  
  const renderOverview = () => {
    return (
      <Box flexDirection="column" height="100%">
        {/* Scenario metadata */}
        <Box flexDirection="column" marginBottom={2}>
          <Text bold>
            <Text color="cyan">🏷️ Name:</Text> {state.currentScenario.name}
          </Text>
          {state.currentScenario.description && (
            <Text marginTop={1}>
              <Text color="cyan">📋 Description:</Text> {state.currentScenario.description}
            </Text>
          )}
          <Text marginTop={1}>
            <Text color="cyan">🔢 Steps:</Text> {state.currentScenario.steps?.length || 0}
          </Text>
          {state.currentScenario.environments && state.currentScenario.environments.length > 0 && (
            <Text marginTop={1}>
              <Text color="cyan">🌍 Environments:</Text> {state.currentScenario.environments.join(', ')}
            </Text>
          )}
        </Box>

        {/* Current step details */}
        {state.currentScenario.steps && state.currentScenario.steps.length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Text color="yellow" bold>
              🎯 Current Step ({state.ui.selectedStepIndex + 1}/{state.currentScenario.steps.length})
            </Text>
            {renderCurrentStepDetails()}
          </Box>
        )}
        
        {/* Execution summary */}
        {state.lastResult && (
          <Box flexDirection="column" marginBottom={1}>
            <Text color="magenta" bold>
              📊 Last Execution Summary
            </Text>
            {renderExecutionSummary()}
          </Box>
        )}
      </Box>
    );
  };
  
  const renderRawContent = () => {
    return (
      <Box flexDirection="column" height="100%">
        <Text color="yellow" bold marginBottom={1}>
          📜 Raw Content {state.ui.editorChanged ? '(• Modified)' : '(Read-only)'}
        </Text>
        {renderJsonContent()}
      </Box>
    );
  };
  
  const renderExecutionDetails = () => {
    if (!state.lastResult) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%">
          <Text color="gray">No execution results available</Text>
        </Box>
      );
    }
    
    return (
      <Box flexDirection="column" height="100%">
        <Text color="green" bold marginBottom={1}>
          🏃 Execution Results
        </Text>
        {renderDetailedExecutionResults()}
      </Box>
    );
  };

  const renderCurrentStepDetails = () => {
    const currentStep = state.currentScenario?.steps?.[state.ui.selectedStepIndex];
    if (!currentStep) {
      return (
        <Box paddingLeft={2}>
          <Text color="gray" dimColor>No step selected</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" paddingLeft={2}>
        <Text marginTop={1}>
          <Text color="green">🏷️ Name:</Text> {currentStep.name || 'Unnamed step'}
        </Text>
        <Text>
          <Text color="green">🔧 Type:</Text> {currentStep.type || 'unknown'}
        </Text>
        
        {/* API-specific details */}
        {currentStep.type === 'api' && (
          <>
            <Text>
              <Text color="green">🌐 Method:</Text> {(currentStep as any).method || 'GET'}
            </Text>
            <Text>
              <Text color="green">🔗 URL:</Text> {(currentStep as any).url || 'Not specified'}
            </Text>
            {(currentStep as any).headers && (
              <Text>
                <Text color="green">📜 Headers:</Text> {Object.keys((currentStep as any).headers).length} defined
              </Text>
            )}
          </>
        )}
        
        {/* UI-specific details */}
        {currentStep.type === 'ui' && (
          <>
            <Text>
              <Text color="green">🖥️ Action:</Text> {(currentStep as any).action || 'Not specified'}
            </Text>
            <Text>
              <Text color="green">🎯 Target:</Text> {(currentStep as any).target || 'Not specified'}
            </Text>
          </>
        )}
        
        {/* Expectations */}
        {currentStep.expect && (
          <Text>
            <Text color="green">✓ Expectations:</Text> {currentStep.expect.length} checks
          </Text>
        )}
        
        {/* Variables used */}
        {(currentStep as any).variables && (
          <Text>
            <Text color="green">🔢 Variables:</Text> {Object.keys((currentStep as any).variables).length} defined
          </Text>
        )}
        
        {/* Show step result if available */}
        {state.lastResult?.stepResults && (
          <Box marginTop={1}>
            {renderStepResult(currentStep.name)}
          </Box>
        )}
      </Box>
    );
  };

  const renderStepResult = (stepName: string) => {
    const stepResult = state.lastResult?.stepResults?.find(sr => sr.stepName === stepName);
    if (!stepResult) return null;

    const statusColor = stepResult.success ? 'green' : 'red';
    const statusIcon = stepResult.success ? '✓' : '✗';

    return (
      <Box flexDirection="column">
        <Text color={statusColor} bold>
          {statusIcon} Status: {stepResult.success ? 'PASSED' : 'FAILED'}
        </Text>
        {stepResult.duration && (
          <Text color="gray">
            Duration: {stepResult.duration}ms
          </Text>
        )}
        {stepResult.error && (
          <Text color="red">
            Error: {stepResult.error}
          </Text>
        )}
      </Box>
    );
  };

  const renderExecutionSummary = () => {
    if (!state.lastResult) return null;
    
    const statusColor = state.lastResult.success ? 'green' : 'red';
    const statusIcon = state.lastResult.success ? '✓' : '✗';
    
    return (
      <Box flexDirection="column" paddingLeft={2}>
        <Text color={statusColor} bold>
          {statusIcon} Status: {state.lastResult.success ? 'PASSED' : 'FAILED'}
        </Text>
        <Text>
          <Text color="cyan">⏱️ Duration:</Text> {state.lastResult.duration}ms
        </Text>
        <Text>
          <Text color="cyan">🌍 Environment:</Text> {state.lastResult.environment}
        </Text>
        {state.lastResult.stepResults && (
          <Text>
            <Text color="cyan">🔢 Steps:</Text> {state.lastResult.stepResults.filter(s => s.success).length}/{state.lastResult.stepResults.length} passed
          </Text>
        )}
      </Box>
    );
  };
  
  const renderDetailedExecutionResults = () => {
    if (!state.lastResult?.stepResults) return null;
    
    return (
      <Box flexDirection="column">
        {state.lastResult.stepResults.map((stepResult, index) => {
          const statusColor = stepResult.success ? 'green' : 'red';
          const statusIcon = stepResult.success ? '✓' : '✗';
          
          return (
            <Box key={stepResult.stepName || index} flexDirection="column" marginBottom={1}>
              <Text color={statusColor} bold>
                {statusIcon} {stepResult.stepName}
              </Text>
              <Box paddingLeft={2}>
                <Text color="gray">
                  Duration: {stepResult.duration}ms
                </Text>
                {stepResult.error && (
                  <Text color="red">
                    Error: {stepResult.error}
                  </Text>
                )}
                {stepResult.response && (
                  <Text color="cyan">
                    Response: {stepResult.response.status || 'N/A'}
                  </Text>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };
  
  const renderJsonContent = () => {
    if (!state.ui.editorContent) {
      return (
        <Box justifyContent="center" paddingY={2}>
          <Text color="gray" dimColor>No content available</Text>
        </Box>
      );
    }
    
    const lines = state.ui.editorContent.split('\n');
    const maxVisibleLines = 12;
    const visibleLines = lines.slice(scrollOffset, scrollOffset + maxVisibleLines);

    return (
      <Box flexDirection="column" paddingX={1}>
        {/* Scroll indicator */}
        {scrollOffset > 0 && (
          <Text color="gray" dimColor>
            ... {scrollOffset} lines above (↑ to scroll up)
          </Text>
        )}
        
        {visibleLines.map((line, index) => {
          const lineNumber = scrollOffset + index + 1;
          return (
            <Box key={lineNumber}>
              <Text color="blue" dimColor>
                {lineNumber.toString().padStart(3, ' ')}
              </Text>
              <Text> {line}</Text>
            </Box>
          );
        })}
        
        {lines.length > scrollOffset + maxVisibleLines && (
          <Text color="gray" dimColor marginTop={1}>
            ... {lines.length - (scrollOffset + maxVisibleLines)} more lines (↓ to scroll down)
          </Text>
        )}
      </Box>
    );
  };

  const { title, color } = getPanelTitle();
  
  return (
    <Box flexDirection="column" height="100%">
      {/* Compact Header with view mode selector */}
      <Box paddingX={1} paddingY={0} height={state.currentScenario ? 3 : 2}>
        <Text color={color} bold>{title}</Text>
        {state.currentScenario && (
          <Box>
            {renderViewModeSelector()}
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box flexGrow={1} paddingX={1} overflow="hidden">
        {renderContent()}
      </Box>

      {/* Compact footer */}
      <Box paddingX={1} height={2}>
        <Text color="gray" dimColor>
          {state.ui.activePane === 'details' ? 
            '🎯 1-3 Mode • ↑↓ Scroll • R Run' : 
            'Tab • R Run'
          }
        </Text>
      </Box>
    </Box>
  );
};