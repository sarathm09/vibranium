/**
 * Enhanced status bar component with comprehensive status information
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import chalk from 'chalk';

export const StatusBar: React.FC = () => {
  const { state } = useAppContext();
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getStatusColor = () => {
    switch (state.status.type) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'yellow';
      default: return 'blue';
    }
  };

  const getStatusIcon = () => {
    switch (state.status.type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  const getExecutionStatus = () => {
    if (state.isRunning) {
      let details = 'Executing scenario...';
      if (state.executionProgress) {
        const { completedSteps, totalSteps, passedSteps, failedSteps } = state.executionProgress;
        details = `${completedSteps}/${totalSteps} steps • ${passedSteps} ✓ ${failedSteps} ✗`;
      }
      
      return {
        text: '⏳ RUNNING',
        color: 'yellow',
        details,
        showStop: state.canStop
      };
    }
    
    if (state.lastResult) {
      const icon = state.lastResult.success ? '✓' : '✗';
      const color = state.lastResult.success ? 'green' : 'red';
      const status = state.lastResult.success ? 'PASSED' : 'FAILED';
      const stepInfo = state.lastResult.stepResults 
        ? `${state.lastResult.stepResults.filter(r => r.success).length}/${state.lastResult.stepResults.length} steps`
        : '';
      const duration = state.lastResult.duration ? `${state.lastResult.duration}ms` : '';
      const details = [stepInfo, duration].filter(Boolean).join(' • ');
      
      return {
        text: `${icon} ${status}`,
        color,
        details,
        canRetry: !state.lastResult.success
      };
    }
    
    return {
      text: '⏸ READY',
      color: 'gray',
      details: 'No execution yet'
    };
  };
  
  const getScenarioInfo = () => {
    const total = state.scenarios.length;
    const current = state.ui.selectedScenarioIndex + 1;
    
    if (total === 0) {
      return 'No scenarios';
    }
    
    return `${current}/${total} scenarios`;
  };
  
  const getStepInfo = () => {
    if (!state.currentScenario || !state.currentScenario.steps) {
      return '';
    }
    
    const total = state.currentScenario.steps.length;
    const current = state.ui.selectedStepIndex + 1;
    
    return `Step ${current}/${total}`;
  };
  
  const getActivePaneIndicator = () => {
    const paneIcons = {
      'navigation': '📁',
      'details': '📝',
      'variables': '🔢',
      'help': '❓',
      'search': '🔍'
    };
    
    return paneIcons[state.ui.activePane] || '📁';
  };

  const executionStatus = getExecutionStatus();
  
  return (
    <Box borderStyle="single" paddingX={1} borderColor="blue" height={3}>
      {/* Single compact row with all essential info */}
      <Box justifyContent="space-between" width="100%">
        {/* Left - Status and execution status */}
        <Box>
          <Text color={getStatusColor()}>
            {getStatusIcon()}
          </Text>
          <Text color={executionStatus.color} bold marginLeft={1}>
            {executionStatus.text}
          </Text>
          {executionStatus.details && (
            <Text color="gray" dimColor> ({executionStatus.details})</Text>
          )}
        </Box>
        
        {/* Center - Scenario and step info */}
        <Box>
          <Text color="cyan">
            {getScenarioInfo()}
            {getStepInfo() && <Text color="gray"> • {getStepInfo()}</Text>}
          </Text>
        </Box>

        {/* Right - Environment, Active pane and execution controls */}
        <Box>
          <Text color="green" marginRight={2}>
            🌍 {state.currentEnvironment}
            {state.ui.showEnvironmentViewer && <Text color="cyan"> [VIEWER]</Text>}
            {state.ui.showEnvironmentSwitcher && <Text color="yellow"> [SWITCH]</Text>}
          </Text>
          <Text color="yellow">
            {getActivePaneIndicator()} {state.ui.activePane.slice(0,3).toUpperCase()}
            {state.ui.showVariablePreview && <Text color="cyan"> VAR</Text>}
          </Text>
          <Text color="gray" dimColor marginLeft={2}>
            {state.isRunning ? 'Ctrl+S:Stop' : 'Ctrl+R:Run'}
            {executionStatus.canRetry && <Text color="cyan"> • Ctrl+T:Retry</Text>}
            <Text> • E:Env • Ctrl+F:Search • Ctrl+Q:Quit</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};