/**
 * Professional execution summary component with key metrics and visual indicators
 */

import React from 'react';
import { Box, Text } from 'ink';
import { ScenarioResult, StepResult } from '../../types';

interface ExecutionSummaryProps {
  result: ScenarioResult;
  isRunning?: boolean;
  currentStepIndex?: number;
  totalSteps?: number;
}

export const ExecutionSummary: React.FC<ExecutionSummaryProps> = ({
  result,
  isRunning = false,
  currentStepIndex = 0,
  totalSteps = 0
}) => {
  const statusIcon = result.success ? '✅' : '❌';
  const statusColor = result.success ? 'green' : 'red';
  const statusText = result.success ? 'PASSED' : 'FAILED';
  
  // Calculate step statistics
  const stepStats = result.stepResults ? {
    total: result.stepResults.length,
    passed: result.stepResults.filter(step => step.success).length,
    failed: result.stepResults.filter(step => !step.success).length,
    passRate: Math.round((result.stepResults.filter(step => step.success).length / result.stepResults.length) * 100)
  } : { total: 0, passed: 0, failed: 0, passRate: 0 };

  // Format duration for readability
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  // Create visual progress bar
  const createProgressBar = (completed: number, total: number, width: number = 20): string => {
    const progress = Math.floor((completed / total) * width);
    const filled = '█'.repeat(progress);
    const empty = '░'.repeat(width - progress);
    return filled + empty;
  };

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} borderStyle="round" borderColor={statusColor}>
      {/* Header with overall status */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color={statusColor}>
          {statusIcon} {statusText}
        </Text>
        <Text color="gray">
          {formatDuration(result.duration)}
        </Text>
      </Box>

      {/* Scenario information */}
      <Box flexDirection="column" marginBottom={1}>
        <Text>
          <Text color="cyan" bold>Scenario:</Text> {result.scenarioName}
        </Text>
        <Text>
          <Text color="cyan" bold>Environment:</Text> {result.environment}
        </Text>
        <Text>
          <Text color="cyan" bold>Executed:</Text> {result.startTime.toLocaleString()}
        </Text>
      </Box>

      {/* Step statistics */}
      {stepStats.total > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>
            📊 Step Results ({stepStats.passRate}% success rate)
          </Text>
          
          <Box paddingLeft={2} flexDirection="column">
            <Box justifyContent="space-between">
              <Text>
                <Text color="green">✅ Passed:</Text> {stepStats.passed}
              </Text>
              <Text>
                <Text color="red">❌ Failed:</Text> {stepStats.failed}
              </Text>
              <Text>
                <Text color="blue">📝 Total:</Text> {stepStats.total}
              </Text>
            </Box>
            
            {/* Visual progress bar */}
            <Box marginTop={1}>
              <Text color="gray">Progress: </Text>
              <Text color={stepStats.passRate >= 80 ? 'green' : stepStats.passRate >= 60 ? 'yellow' : 'red'}>
                {createProgressBar(stepStats.passed, stepStats.total)}
              </Text>
              <Text color="cyan"> {stepStats.passRate}%</Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Real-time execution status (if running) */}
      {isRunning && (
        <Box flexDirection="column" paddingTop={1} borderTop borderColor="gray">
          <Text color="yellow" bold>
            ⚡ Currently Running
          </Text>
          <Box paddingLeft={2}>
            <Text>
              <Text color="cyan">Step:</Text> {currentStepIndex + 1} of {totalSteps}
            </Text>
            <Text color="gray">
              Progress: {createProgressBar(currentStepIndex, totalSteps)} {Math.round((currentStepIndex / totalSteps) * 100)}%
            </Text>
          </Box>
        </Box>
      )}

      {/* Performance insights */}
      {result.stepResults && result.stepResults.length > 0 && (
        <Box paddingTop={1} borderTop borderColor="gray">
          <Text color="magenta" bold>⚡ Performance</Text>
          <Box paddingLeft={2} flexDirection="column">
            <Text>
              <Text color="cyan">Avg step time:</Text> {formatDuration(result.duration / result.stepResults.length)}
            </Text>
            {result.stepResults.some(step => step.duration) && (
              <>
                <Text>
                  <Text color="cyan">Fastest step:</Text> {formatDuration(Math.min(...result.stepResults.filter(s => s.duration).map(s => s.duration!)))}
                </Text>
                <Text>
                  <Text color="cyan">Slowest step:</Text> {formatDuration(Math.max(...result.stepResults.filter(s => s.duration).map(s => s.duration!)))}
                </Text>
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};