/**
 * Main professional results view component that orchestrates all result displays
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { ScenarioResult, StepResult } from '../../types';
import { ExecutionSummary } from './execution-summary';
import { StepResultsTimeline } from './step-results-timeline';
import { RequestResponseDisplay } from './request-response-display';
import { ErrorDisplay } from './error-display';

interface ResultsViewProps {
  result?: ScenarioResult;
  isRunning?: boolean;
  currentStepIndex?: number;
  selectedStepIndex?: number;
  onStepSelect?: (index: number) => void;
  viewMode?: 'summary' | 'timeline' | 'details' | 'errors';
  onViewModeChange?: (mode: ResultsViewProps['viewMode']) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  isRunning = false,
  currentStepIndex = 0,
  selectedStepIndex = -1,
  onStepSelect,
  viewMode = 'summary',
  onViewModeChange
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  if (!result) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
        <Text color="gray" bold>📊 No Execution Results</Text>
        <Text color="gray" dimColor marginTop={1}>
          Run a scenario to see professional execution analysis
        </Text>
        <Box marginTop={2} flexDirection="column" alignItems="center">
          <Text color="cyan">🎯 Press Enter to run current scenario</Text>
          <Text color="cyan">🔄 Press R to retry last execution</Text>
          <Text color="cyan">⚡ Press S to run single step</Text>
        </Box>
      </Box>
    );
  }

  const renderViewModeSelector = () => {
    const modes = [
      { key: 'summary', label: '📊 Summary', description: 'Overall execution overview' },
      { key: 'timeline', label: '🕒 Timeline', description: 'Step-by-step execution flow' },
      { key: 'details', label: '🔍 Details', description: 'Request/response analysis' },
      { key: 'errors', label: '❌ Errors', description: 'Error analysis and troubleshooting' }
    ];

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

  const renderSummaryView = () => {
    return (
      <Box flexDirection="column">
        <ExecutionSummary 
          result={result}
          isRunning={isRunning}
          currentStepIndex={currentStepIndex}
          totalSteps={result.stepResults?.length || 0}
        />
        
        {/* Quick insights */}
        {result.stepResults && result.stepResults.length > 0 && (
          <Box marginTop={2} paddingX={1} borderStyle="single" borderColor="blue">
            <Box flexDirection="column" paddingY={1}>
              <Text color="blue" bold>🔍 Quick Insights</Text>
              
              {/* Failed steps summary */}
              {result.stepResults.some(step => !step.success) && (
                <Box marginTop={1}>
                  <Text color="red" bold>❌ Failed Steps:</Text>
                  <Box paddingLeft={2} flexDirection="column">
                    {result.stepResults
                      .filter(step => !step.success)
                      .slice(0, 3)
                      .map((step, index) => (
                        <Text key={index} color="red">
                          • {step.stepName}: {step.error || 'Unknown error'}
                        </Text>
                      ))}
                    {result.stepResults.filter(step => !step.success).length > 3 && (
                      <Text color="gray" dimColor>
                        ... {result.stepResults.filter(step => !step.success).length - 3} more failed steps
                      </Text>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Performance insights */}
              {result.stepResults.some(step => step.duration && step.duration > 3000) && (
                <Box marginTop={1}>
                  <Text color="yellow" bold>🐌 Slow Steps (&gt;3s):</Text>
                  <Box paddingLeft={2} flexDirection="column">
                    {result.stepResults
                      .filter(step => step.duration && step.duration > 3000)
                      .slice(0, 3)
                      .map((step, index) => (
                        <Text key={index} color="yellow">
                          • {step.stepName}: {step.duration}ms
                        </Text>
                      ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderTimelineView = () => {
    return (
      <StepResultsTimeline
        stepResults={result.stepResults || []}
        selectedStepIndex={selectedStepIndex}
        showDetails={true}
        onStepSelect={onStepSelect}
      />
    );
  };

  const renderDetailsView = () => {
    const selectedStep = selectedStepIndex >= 0 && result.stepResults 
      ? result.stepResults[selectedStepIndex] 
      : result.stepResults?.[0];

    if (!selectedStep) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
          <Text color="gray" bold>🔍 No Step Selected</Text>
          <Text color="gray" dimColor marginTop={1}>
            Select a step from the timeline to view detailed request/response information
          </Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Text color="cyan" bold marginBottom={1}>
          🔍 Detailed Analysis: {selectedStep.stepName}
        </Text>
        
        <RequestResponseDisplay
          stepResult={selectedStep}
          showRequest={true}
          showResponse={true}
          compact={false}
        />
      </Box>
    );
  };

  const renderErrorsView = () => {
    const failedSteps = result.stepResults?.filter(step => !step.success) || [];

    if (failedSteps.length === 0) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
          <Text color="green" bold>✅ No Errors Found</Text>
          <Text color="green" dimColor marginTop={1}>
            All steps executed successfully!
          </Text>
          <Box marginTop={2}>
            <Text color="cyan">🎉 Congratulations on a successful execution</Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Text color="red" bold marginBottom={1}>
          ❌ Error Analysis ({failedSteps.length} failed steps)
        </Text>
        
        {failedSteps.map((step, index) => {
          const stepIndex = result.stepResults?.indexOf(step) || 0;
          
          return (
            <ErrorDisplay
              key={index}
              error={step.error || 'Unknown error occurred'}
              stepName={step.stepName}
              stepType="api" // Assuming API step for now
              context={{
                statusCode: step.response?.status,
                responseTime: step.duration,
                url: 'N/A', // Would need to get from step config
                method: 'N/A' // Would need to get from step config
              }}
            />
          );
        })}
        
        {/* Error summary */}
        <Box marginTop={2} paddingX={1} borderStyle="single" borderColor="yellow">
          <Box flexDirection="column" paddingY={1}>
            <Text color="yellow" bold>📋 Error Summary</Text>
            <Box paddingLeft={2} marginTop={1}>
              <Text>
                <Text color="cyan">Total Errors:</Text> {failedSteps.length}
              </Text>
              <Text>
                <Text color="cyan">Success Rate:</Text>{' '}
                <Text color={result.success ? 'green' : 'red'}>
                  {Math.round(((result.stepResults?.length || 0) - failedSteps.length) / (result.stepResults?.length || 1) * 100)}%
                </Text>
              </Text>
              <Text>
                <Text color="cyan">Recommendations:</Text> Review error details above and apply suggested fixes
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'summary':
        return renderSummaryView();
      case 'timeline':
        return renderTimelineView();
      case 'details':
        return renderDetailsView();
      case 'errors':
        return renderErrorsView();
      default:
        return renderSummaryView();
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* View mode selector */}
      {renderViewModeSelector()}
      
      {/* Content area */}
      <Box flexGrow={1} overflow="hidden">
        {renderContent()}
      </Box>
      
      {/* Footer with controls */}
      <Box paddingY={1} borderTop borderColor="gray">
        <Text color="gray" dimColor>
          ←→ Switch Views • ↑↓ Navigate • Enter: Select • C: Copy • R: Retry • E: Export
        </Text>
      </Box>
    </Box>
  );
};