/**
 * Simple Terminal-Friendly Overview Component
 * 
 * A clean, text-based overview that provides essential information without visual clutter:
 * - Clean text layout with good spacing
 * - Essential scenario information at a glance
 * - Terminal-friendly design patterns
 * - Fast rendering and easy scanning
 * - Simple borders and clear hierarchy
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';

interface OverviewDashboardProps {
  isActive: boolean;
  terminalWidth: number;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
  isActive, 
  terminalWidth 
}) => {
  const { state, actions } = useAppContext();
  const scenario = state.currentScenario;
  
  if (!scenario) {
    return renderEmptyState();
  }
  
  return (
    <Box flexDirection="column" height="100%">
      {/* Simple Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">Overview</Text>
        {isActive && <Text color="yellow" marginLeft={2}>ACTIVE</Text>}
      </Box>

      {/* Main Content */}
      <Box flexDirection="column" flexGrow={1}>
        {renderScenarioInfo(scenario)}
        {renderStepsInfo(scenario)}
        {renderEnvironmentInfo(state)}
        {state.lastResult && renderExecutionInfo(state.lastResult)}
        {state.isRunning && renderRunningInfo(state)}
      </Box>

      {/* Simple Footer */}
      <Box marginTop={1} paddingTop={1} borderTop borderColor="gray">
        <Text color="gray">
          {isActive 
            ? "J/K Steps • Enter Run • R Full Scenario • E Environment"
            : "Tab to activate • R to run"
          }
        </Text>
      </Box>
    </Box>
  );
};

// Empty state component
const renderEmptyState = () => (
  <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
    <Text color="gray" bold>
      No Scenario Selected
    </Text>
    <Text color="gray" marginTop={1}>
      Select a scenario from the navigation pane
    </Text>
    <Box marginTop={2}>
      <Text color="blue" bold>Navigation:</Text>
      <Text color="gray">↑↓ Navigate • Enter Select • R Run</Text>
    </Box>
  </Box>
);

// Simple scenario info section
const renderScenarioInfo = (scenario: any) => (
  <Box marginBottom={2}>
    <Text bold color="white">{scenario.name || 'Unnamed Scenario'}</Text>
    {scenario.description && (
      <Text color="gray" marginTop={1}>{scenario.description}</Text>
    )}
    {scenario.version && (
      <Text color="green" marginTop={1}>Version: {scenario.version}</Text>
    )}
  </Box>
);

// Simple steps info section
const renderStepsInfo = (scenario: any) => {
  const steps = scenario.steps || [];
  const apiSteps = steps.filter((s: any) => s.type === 'api').length;
  const uiSteps = steps.filter((s: any) => s.type === 'ui').length;
  
  return (
    <Box marginBottom={2}>
      <Text bold color="cyan">Steps: {steps.length}</Text>
      {steps.length > 0 && (
        <Box marginTop={1}>
          <Text color="blue">API: {apiSteps}</Text>
          <Text color="green" marginLeft={3}>UI: {uiSteps}</Text>
        </Box>
      )}
    </Box>
  );
};

// Simple environment info section
const renderEnvironmentInfo = (state: any) => (
  <Box marginBottom={2}>
    <Text bold color="yellow">Environment: {state.currentEnvironment || 'default'}</Text>
    {state.currentScenario?.environments && (
      <Box marginTop={1}>
        <Text color="gray">Available: {
          Array.isArray(state.currentScenario.environments) 
            ? state.currentScenario.environments.join(', ')
            : Object.keys(state.currentScenario.environments).join(', ')
        }</Text>
      </Box>
    )}
  </Box>
);

// Simple execution info section
const renderExecutionInfo = (result: any) => {
  const statusColor = result.success ? 'green' : 'red';
  const statusText = result.success ? 'PASSED' : 'FAILED';
  
  return (
    <Box marginBottom={2}>
      <Text bold color={statusColor}>Last Run: {statusText}</Text>
      <Box marginTop={1}>
        <Text color="gray">Duration: {formatDuration(result.duration)}</Text>
        <Text color="gray" marginTop={1}>
          Steps: {result.stepResults?.filter((s: any) => s.success).length || 0}/{result.stepResults?.length || 0}
        </Text>
        <Text color="gray" marginTop={1}>
          Time: {new Date(result.timestamp || Date.now()).toLocaleTimeString()}
        </Text>
      </Box>
    </Box>
  );
};

// Simple running info section
const renderRunningInfo = (state: any) => {
  if (!state.executionProgress) return null;
  
  const { currentStepIndex, totalSteps, completedSteps } = state.executionProgress;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
  const currentStep = state.currentScenario?.steps?.[currentStepIndex];
  
  return (
    <Box marginBottom={2}>
      <Text bold color="yellow">Running: Step {currentStepIndex + 1}/{totalSteps}</Text>
      <Box marginTop={1}>
        <Text color="white">{currentStep?.name || 'Unknown step'}</Text>
        <Text color="cyan" marginTop={1}>Progress: {progressPercentage}%</Text>
      </Box>
    </Box>
  );
};

// Utility function
const formatDuration = (duration: number): string => {
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
};