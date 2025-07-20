/**
 * Redesigned Steps UI - Clean, intuitive, and scannable steps visualization
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import type { Step, StepStatus, StepResult } from '@vibraniumjs/types';

export interface StepsUIProps {
  onStepSelect?: (stepIndex: number) => void;
  onStepRun?: (stepIndex: number) => void;
  mode?: 'overview' | 'detailed' | 'minimal';
}

export const StepsUI: React.FC<StepsUIProps> = ({ 
  onStepSelect, 
  onStepRun, 
  mode = 'overview' 
}) => {
  const { state } = useAppContext();

  if (!state.currentScenario?.steps || state.currentScenario.steps.length === 0) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
        <Text color="gray">📝 No steps defined</Text>
        <Text color="gray" dimColor marginTop={1}>
          Add steps to your scenario to see them here
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <StepsHeader steps={state.currentScenario.steps} />
      <StepsList 
        steps={state.currentScenario.steps}
        selectedIndex={state.ui.selectedStepIndex}
        executionResults={state.lastResult?.stepResults}
        realtimeResults={state.realTimeStepResults}
        isRunning={state.isRunning}
        currentStepIndex={state.executionProgress?.currentStepIndex}
        mode={mode}
        onStepSelect={onStepSelect}
        onStepRun={onStepRun}
      />
      <StepsFooter />
    </Box>
  );
};

// Clean header with summary
const StepsHeader: React.FC<{ steps: Step[] }> = ({ steps }) => {
  const { state } = useAppContext();
  
  const stepStats = {
    total: steps.length,
    api: steps.filter(s => s.type === 'api').length,
    ui: steps.filter(s => s.type === 'ui').length,
    custom: steps.filter(s => !['api', 'ui'].includes(s.type)).length
  };

  const executionStats = state.lastResult?.stepResults ? {
    passed: state.lastResult.stepResults.filter(r => r.success).length,
    failed: state.lastResult.stepResults.filter(r => !r.success).length,
    total: state.lastResult.stepResults.length
  } : null;

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} borderBottom>
      <Text bold color="cyan">
        📋 {stepStats.total} Steps
      </Text>
      <Box marginTop={1}>
        <Text color="gray">
          {stepStats.api > 0 && <Text color="blue">🌐 {stepStats.api} API</Text>}
          {stepStats.api > 0 && (stepStats.ui > 0 || stepStats.custom > 0) && <Text> • </Text>}
          {stepStats.ui > 0 && <Text color="green">🖥️ {stepStats.ui} UI</Text>}
          {stepStats.ui > 0 && stepStats.custom > 0 && <Text> • </Text>}
          {stepStats.custom > 0 && <Text color="yellow">⚡ {stepStats.custom} Custom</Text>}
        </Text>
      </Box>
      {executionStats && (
        <Box marginTop={1}>
          <Text>
            <Text color="green">✅ {executionStats.passed}</Text>
            <Text> • </Text>
            <Text color="red">❌ {executionStats.failed}</Text>
            <Text color="gray"> / {executionStats.total}</Text>
          </Text>
        </Box>
      )}
    </Box>
  );
};

// Clean, scannable steps list
interface StepsListProps {
  steps: Step[];
  selectedIndex: number;
  executionResults?: StepResult[];
  realtimeResults?: any[];
  isRunning?: boolean;
  currentStepIndex?: number;
  mode: 'overview' | 'detailed' | 'minimal';
  onStepSelect?: (stepIndex: number) => void;
  onStepRun?: (stepIndex: number) => void;
}

const StepsList: React.FC<StepsListProps> = ({
  steps,
  selectedIndex,
  executionResults,
  realtimeResults,
  isRunning,
  currentStepIndex,
  mode,
  onStepSelect,
  onStepRun
}) => {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {steps.map((step, index) => (
        <StepCard
          key={index}
          step={step}
          index={index}
          isSelected={index === selectedIndex}
          isCurrent={index === currentStepIndex && isRunning}
          status={getStepStatus(index, executionResults, realtimeResults, isRunning, currentStepIndex)}
          result={executionResults?.[index]}
          realtimeResult={realtimeResults?.find(r => r.stepIndex === index)}
          mode={mode}
          onSelect={() => onStepSelect?.(index)}
          onRun={() => onStepRun?.(index)}
        />
      ))}
    </Box>
  );
};

// Clean, intuitive step card
interface StepCardProps {
  step: Step;
  index: number;
  isSelected: boolean;
  isCurrent: boolean;
  status: StepStatus;
  result?: StepResult;
  realtimeResult?: any;
  mode: 'overview' | 'detailed' | 'minimal';
  onSelect?: () => void;
  onRun?: () => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  isSelected,
  isCurrent,
  status,
  result,
  realtimeResult,
  mode
}) => {
  const { icon, color } = getStatusDisplay(status, isCurrent);
  
  return (
    <Box
      flexDirection="column"
      marginBottom={1}
      paddingX={1}
      paddingY={mode === 'minimal' ? 0 : 1}
      borderStyle={isSelected ? 'round' : undefined}
      borderColor={isSelected ? 'cyan' : undefined}
    >
      {/* Clean step header */}
      <Box justifyContent="space-between" alignItems="center">
        <Box>
          <Text color={color} bold={isSelected}>
            {icon} {index + 1}. {step.name}
          </Text>
          {isCurrent && (
            <Text color="yellow" bold> ← Running</Text>
          )}
        </Box>
        <Box>
          <StepTypeIcon type={step.type} />
          {(result?.duration || realtimeResult?.duration) && (
            <Text color="gray" marginLeft={1}>
              {result?.duration || realtimeResult?.duration}ms
            </Text>
          )}
        </Box>
      </Box>

      {/* Essential step info (only in overview+ modes) */}
      {mode !== 'minimal' && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          <StepEssentials step={step} />
          
          {/* Expandable details for selected step */}
          {isSelected && mode === 'detailed' && (
            <Box marginTop={1}>
              <StepDetails step={step} result={result} realtimeResult={realtimeResult} />
            </Box>
          )}
        </Box>
      )}

      {/* Status indicator bar */}
      <StatusBar 
        status={status} 
        error={result?.error || realtimeResult?.error}
        isSelected={isSelected}
      />
    </Box>
  );
};

// Simple step type icons
const StepTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconMap: Record<string, { icon: string; color: string }> = {
    api: { icon: '🌐', color: 'blue' },
    ui: { icon: '🖥️', color: 'green' },
    validation: { icon: '✅', color: 'yellow' },
    setup: { icon: '🔧', color: 'cyan' },
    teardown: { icon: '🧹', color: 'magenta' }
  };

  const display = iconMap[type] || { icon: '⚡', color: 'white' };
  
  return (
    <Text color={display.color}>{display.icon}</Text>
  );
};

// Essential step information (clean, scannable)
const StepEssentials: React.FC<{ step: Step }> = ({ step }) => {
  const apiStep = step as any;
  
  return (
    <Box flexDirection="column">
      {/* API step essentials */}
      {step.type === 'api' && (
        <Text color="gray">
          <Text color="cyan">{apiStep.method || 'GET'}</Text>
          <Text> {truncateUrl(apiStep.url || '')}</Text>
        </Text>
      )}
      
      {/* UI step essentials */}
      {step.type === 'ui' && (
        <Text color="gray">
          <Text color="green">{apiStep.action || 'click'}</Text>
          <Text> {truncateText(apiStep.selector || apiStep.target || '', 40)}</Text>
        </Text>
      )}
      
      {/* Common step info */}
      {step.description && (
        <Text color="gray" dimColor>
          {truncateText(step.description, 60)}
        </Text>
      )}
    </Box>
  );
};

// Detailed step information (progressive disclosure)
const StepDetails: React.FC<{ 
  step: Step; 
  result?: StepResult; 
  realtimeResult?: any;
}> = ({ step, result, realtimeResult }) => {
  const apiStep = step as any;
  
  return (
    <Box flexDirection="column" paddingLeft={2} borderLeft borderColor="gray">
      {/* API details */}
      {step.type === 'api' && (
        <Box flexDirection="column">
          {apiStep.headers && Object.keys(apiStep.headers).length > 0 && (
            <Text color="blue">
              📜 {Object.keys(apiStep.headers).length} headers
            </Text>
          )}
          {apiStep.body && (
            <Text color="blue">
              📦 Body: {typeof apiStep.body === 'object' ? 'JSON' : 'Text'}
            </Text>
          )}
          {apiStep.auth && (
            <Text color="magenta">
              🔐 Auth: {apiStep.auth.type}
            </Text>
          )}
        </Box>
      )}
      
      {/* UI details */}
      {step.type === 'ui' && (
        <Box flexDirection="column">
          {apiStep.value && (
            <Text color="green">
              📝 Value: {truncateText(String(apiStep.value), 30)}
            </Text>
          )}
          {apiStep.wait && (
            <Text color="yellow">
              ⏰ Wait: {apiStep.wait.type}
            </Text>
          )}
        </Box>
      )}
      
      {/* Expectations */}
      {step.expect && (
        <Text color="yellow">
          ✅ {Array.isArray(step.expect) ? step.expect.length : 1} expectations
        </Text>
      )}
      
      {/* Configuration */}
      <Box>
        {step.timeout && (
          <Text color="orange" marginRight={2}>
            ⏱️ {step.timeout}ms
          </Text>
        )}
        {step.retries && (
          <Text color="orange" marginRight={2}>
            🔄 {step.retries}x
          </Text>
        )}
      </Box>
      
      {/* Result summary */}
      {result && (
        <Box marginTop={1} paddingTop={1} borderTop borderColor="gray">
          <ResultSummary result={result} />
        </Box>
      )}
    </Box>
  );
};

// Clean result summary
const ResultSummary: React.FC<{ result: StepResult }> = ({ result }) => {
  return (
    <Box flexDirection="column">
      <Text color={result.error ? 'red' : 'green'} bold>
        {result.error ? '❌ Failed' : '✅ Passed'}
        {result.duration && <Text color="gray"> ({result.duration}ms)</Text>}
      </Text>
      {result.error && (
        <Text color="red" dimColor>
          {truncateText(result.error.toString(), 60)}
        </Text>
      )}
      {result.response && (
        <Text color="cyan" dimColor>
          {(result.response as any).status} {(result.response as any).statusText}
        </Text>
      )}
    </Box>
  );
};

// Simple status bar
const StatusBar: React.FC<{ 
  status: StepStatus; 
  error?: string | Error;
  isSelected: boolean;
}> = ({ status, error, isSelected }) => {
  if (!isSelected || status === 'pending') return null;
  
  const getBarColor = () => {
    switch (status) {
      case 'running': return 'yellow';
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'skipped': return 'gray';
      default: return 'gray';
    }
  };
  
  return (
    <Box marginTop={1}>
      <Text color={getBarColor()}>
        {'▄'.repeat(isSelected ? 30 : 20)}
      </Text>
    </Box>
  );
};

// Footer with keyboard shortcuts
const StepsFooter: React.FC = () => {
  return (
    <Box paddingX={1} paddingY={1} borderTop>
      <Text color="gray" dimColor>
        ↑↓ Navigate • Enter Select/Run • 1,2,3 View Modes • / Search • J Jump
      </Text>
    </Box>
  );
};

// Helper functions
function getStepStatus(
  index: number,
  executionResults?: StepResult[],
  realtimeResults?: any[],
  isRunning?: boolean,
  currentStepIndex?: number
): StepStatus {
  // Check realtime results first
  const realtimeResult = realtimeResults?.find(r => r.stepIndex === index);
  if (realtimeResult) {
    switch (realtimeResult.status) {
      case 'running': return 'running';
      case 'completed': return 'passed';
      case 'failed': return 'failed';
      default: return 'pending';
    }
  }
  
  // Check execution results
  const result = executionResults?.[index];
  if (result) {
    return result.success ? 'passed' : 'failed';
  }
  
  // Check if currently running
  if (isRunning && currentStepIndex === index) {
    return 'running';
  }
  
  return 'pending';
}

function getStatusDisplay(status: StepStatus, isCurrent: boolean): { icon: string; color: string } {
  if (isCurrent) {
    return { icon: '⏳', color: 'yellow' };
  }
  
  switch (status) {
    case 'running':
      return { icon: '⏳', color: 'yellow' };
    case 'passed':
      return { icon: '✅', color: 'green' };
    case 'failed':
      return { icon: '❌', color: 'red' };
    case 'skipped':
      return { icon: '⏭️', color: 'gray' };
    case 'blocked':
      return { icon: '🚫', color: 'red' };
    default:
      return { icon: '⚪', color: 'gray' };
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function truncateUrl(url: string): string {
  if (url.length <= 50) return url;
  
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    if (path.length <= 35) {
      return `${urlObj.hostname}${path}`;
    }
    return `${urlObj.hostname}${path.substring(0, 30)}...`;
  } catch {
    return truncateText(url, 50);
  }
}