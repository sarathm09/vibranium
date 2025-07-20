/**
 * Timeline view of step execution results with professional layout
 */

import React from 'react';
import { Box, Text } from 'ink';
import { StepResult } from '../../types';

interface StepResultsTimelineProps {
  stepResults: StepResult[];
  selectedStepIndex?: number;
  showDetails?: boolean;
  onStepSelect?: (index: number) => void;
}

export const StepResultsTimeline: React.FC<StepResultsTimelineProps> = ({
  stepResults,
  selectedStepIndex = -1,
  showDetails = true,
  onStepSelect
}) => {
  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusIcon = (step: StepResult): string => {
    return step.success ? '✅' : '❌';
  };

  const getStatusColor = (step: StepResult): string => {
    return step.success ? 'green' : 'red';
  };

  const getPerformanceIndicator = (duration?: number): { icon: string; color: string } => {
    if (!duration) return { icon: '⏱️', color: 'gray' };
    
    if (duration < 500) return { icon: '🚀', color: 'green' };      // Fast
    if (duration < 2000) return { icon: '⏱️', color: 'yellow' };    // Normal
    if (duration < 5000) return { icon: '🐌', color: 'orange' };    // Slow
    return { icon: '🔥', color: 'red' };                            // Very slow
  };

  return (
    <Box flexDirection="column">
      <Text color="yellow" bold marginBottom={1}>
        🕒 Execution Timeline ({stepResults.length} steps)
      </Text>

      {stepResults.map((step, index) => {
        const isSelected = index === selectedStepIndex;
        const statusIcon = getStatusIcon(step);
        const statusColor = getStatusColor(step);
        const perfIndicator = getPerformanceIndicator(step.duration);

        return (
          <Box key={index} flexDirection="column" marginBottom={1}>
            {/* Timeline connector */}
            {index > 0 && (
              <Box paddingLeft={1}>
                <Text color="gray">│</Text>
              </Box>
            )}
            
            {/* Step header */}
            <Box 
              borderStyle={isSelected ? 'double' : 'single'} 
              borderColor={isSelected ? 'yellow' : statusColor}
              paddingX={1}
              paddingY={0}
            >
              <Box justifyContent="space-between" width="100%">
                <Box>
                  <Text color={statusColor} bold>
                    {statusIcon} {index + 1}. {step.stepName}
                  </Text>
                  {isSelected && <Text color="yellow" bold> ← SELECTED</Text>}
                </Box>
                
                <Box>
                  <Text color={perfIndicator.color}>
                    {perfIndicator.icon} {formatDuration(step.duration)}
                  </Text>
                </Box>
              </Box>
            </Box>

            {/* Step details (expanded for selected or failed steps) */}
            {(showDetails && (isSelected || !step.success)) && (
              <Box paddingLeft={3} paddingY={0} marginBottom={1}>
                {/* Error information */}
                {step.error && (
                  <Box flexDirection="column" marginBottom={1}>
                    <Text color="red" bold>❌ Error Details:</Text>
                    <Box paddingLeft={2} borderLeft borderColor="red">
                      <Text color="red">{step.error}</Text>
                    </Box>
                  </Box>
                )}

                {/* Response information */}
                {step.response && (
                  <Box flexDirection="column" marginBottom={1}>
                    <Text color="blue" bold>📡 Response:</Text>
                    <Box paddingLeft={2}>
                      <Text>
                        <Text color="cyan">Status:</Text>{' '}
                        <Text color={step.response.status && step.response.status < 400 ? 'green' : 'red'}>
                          {step.response.status || 'N/A'} {step.response.statusText || ''}
                        </Text>
                      </Text>
                      
                      {/* Response headers summary */}
                      {step.response.headers && Object.keys(step.response.headers).length > 0 && (
                        <Text>
                          <Text color="cyan">Headers:</Text> {Object.keys(step.response.headers).length} defined
                        </Text>
                      )}
                      
                      {/* Content type and size info */}
                      {step.response.headers && (
                        <>
                          {step.response.headers['content-type'] && (
                            <Text>
                              <Text color="cyan">Content-Type:</Text> {step.response.headers['content-type']}
                            </Text>
                          )}
                          {step.response.headers['content-length'] && (
                            <Text>
                              <Text color="cyan">Size:</Text> {step.response.headers['content-length']} bytes
                            </Text>
                          )}
                        </>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Performance analysis */}
                {step.duration && (
                  <Box flexDirection="column">
                    <Text color="magenta" bold>⚡ Performance Analysis:</Text>
                    <Box paddingLeft={2}>
                      <Text>
                        <Text color="cyan">Execution Time:</Text> {formatDuration(step.duration)}
                      </Text>
                      {step.duration > 5000 && (
                        <Text color="orange">
                          ⚠️ This step took longer than expected ({'>'}5s)
                        </Text>
                      )}
                      {step.duration < 100 && (
                        <Text color="green">
                          🚀 Very fast execution
                        </Text>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      })}

      {/* Timeline summary */}
      {stepResults.length > 1 && (
        <Box marginTop={1} paddingTop={1} borderTop borderColor="gray">
          <Text color="gray" dimColor>
            ▼ End of execution timeline • {stepResults.filter(s => s.success).length}/{stepResults.length} steps passed
          </Text>
        </Box>
      )}
    </Box>
  );
};