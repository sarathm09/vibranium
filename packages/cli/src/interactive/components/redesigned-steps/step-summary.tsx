/**
 * Step Summary - Clean overview with grouping and organization
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import type { Step } from '@vibraniumjs/types';

export interface StepSummaryProps {
  onStepJump?: (stepIndex: number) => void;
  showGroups?: boolean;
  showDependencies?: boolean;
}

export const StepSummary: React.FC<StepSummaryProps> = ({ 
  onStepJump,
  showGroups = true,
  showDependencies = true
}) => {
  const { state } = useAppContext();
  
  if (!state.currentScenario?.steps || state.currentScenario.steps.length === 0) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="gray">📋 No steps to summarize</Text>
      </Box>
    );
  }

  const steps = state.currentScenario.steps;
  const groupedSteps = showGroups ? groupSteps(steps) : [{ name: 'All Steps', steps, indices: steps.map((_, i) => i) }];

  return (
    <Box flexDirection="column" height="100%">
      <SummaryHeader steps={steps} />
      
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {groupedSteps.map((group, groupIndex) => (
          <StepGroup
            key={groupIndex}
            group={group}
            onStepJump={onStepJump}
            showDependencies={showDependencies}
          />
        ))}
      </Box>
      
      <SummaryFooter />
    </Box>
  );
};

// Summary header with stats
const SummaryHeader: React.FC<{ steps: Step[] }> = ({ steps }) => {
  const { state } = useAppContext();
  
  const stats = {
    total: steps.length,
    byType: getStepTypeStats(steps),
    execution: getExecutionStats(state.lastResult?.stepResults),
    estimated: estimateTotalDuration(steps)
  };

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} borderBottom>
      <Text bold color="cyan">
        📊 Steps Summary ({stats.total} total)
      </Text>
      
      <Box marginTop={1} flexDirection="column">
        <Box>
          {Object.entries(stats.byType).map(([type, count]) => (
            <Text key={type} marginRight={2}>
              <TypeIcon type={type} /> {count}
            </Text>
          ))}
        </Box>
        
        {stats.execution && (
          <Box marginTop={1}>
            <Text color="green">✅ {stats.execution.passed}</Text>
            <Text> • </Text>
            <Text color="red">❌ {stats.execution.failed}</Text>
            <Text> • </Text>
            <Text color="gray">⏱️ {stats.execution.duration}ms</Text>
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Est. duration: ~{stats.estimated}ms
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, string> = {
    api: '🌐',
    ui: '🖥️',
    validation: '✅',
    setup: '🔧',
    teardown: '🧹'
  };
  return <Text color="blue">{icons[type] || '⚡'}</Text>;
};

// Step group with clean organization
interface StepGroupData {
  name: string;
  steps: Step[];
  indices: number[];
}

const StepGroup: React.FC<{
  group: StepGroupData;
  onStepJump?: (stepIndex: number) => void;
  showDependencies: boolean;
}> = ({ group, onStepJump, showDependencies }) => {
  const { state } = useAppContext();
  const [expanded, setExpanded] = React.useState(true);

  return (
    <Box flexDirection="column" marginBottom={2}>
      {/* Group header */}
      <Box
        paddingX={1}
        paddingY={1}
        borderStyle="round"
        borderColor="blue"
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Text color="blue" bold>
          {expanded ? '📂' : '📁'} {group.name} ({group.steps.length} steps)
        </Text>
      </Box>

      {/* Group content */}
      {expanded && (
        <Box flexDirection="column" paddingLeft={2} marginTop={1}>
          {group.steps.map((step, stepIndex) => {
            const originalIndex = group.indices[stepIndex];
            const isSelected = originalIndex === state.ui.selectedStepIndex;
            const isCurrent = originalIndex === state.executionProgress?.currentStepIndex && state.isRunning;
            const result = state.lastResult?.stepResults?.[originalIndex];

            return (
              <StepSummaryItem
                key={originalIndex}
                step={step}
                index={originalIndex}
                isSelected={isSelected}
                isCurrent={isCurrent}
                result={result}
                showDependencies={showDependencies}
                onJump={() => onStepJump?.(originalIndex)}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};

// Individual step summary item
const StepSummaryItem: React.FC<{
  step: Step;
  index: number;
  isSelected: boolean;
  isCurrent: boolean;
  result?: any;
  showDependencies: boolean;
  onJump?: () => void;
}> = ({ step, index, isSelected, isCurrent, result, showDependencies, onJump }) => {
  const statusDisplay = getStepStatusDisplay(result, isCurrent);

  return (
    <Box
      flexDirection="column"
      marginBottom={1}
      paddingX={1}
      paddingY={1}
      borderStyle={isSelected ? 'round' : undefined}
      borderColor={isSelected ? 'yellow' : undefined}
      cursor="pointer"
      onClick={onJump}
    >
      {/* Step header */}
      <Box justifyContent="space-between" alignItems="center">
        <Box>
          <Text color={statusDisplay.color} bold={isSelected}>
            {statusDisplay.icon} {index + 1}. {step.name}
          </Text>
          {isCurrent && (
            <Text color="yellow" bold> ← Running</Text>
          )}
        </Box>
        <Box>
          <TypeIcon type={step.type} />
          {result?.duration && (
            <Text color="gray" marginLeft={1}>
              {result.duration}ms
            </Text>
          )}
        </Box>
      </Box>

      {/* Step details */}
      <Box paddingLeft={2} marginTop={1}>
        <StepSummaryDetails step={step} />
        
        {/* Dependencies */}
        {showDependencies && (step.dependsOn || (step as any).depends_on) && (
          <Box marginTop={1}>
            <Text color="purple" dimColor>
              🔗 Depends on: {Array.isArray(step.dependsOn || (step as any).depends_on) 
                ? (step.dependsOn || (step as any).depends_on).join(', ') 
                : (step.dependsOn || (step as any).depends_on)}
            </Text>
          </Box>
        )}
        
        {/* Parallel execution indicator */}
        {(step as any).parallel && (
          <Box marginTop={1}>
            <Text color="cyan" dimColor>
              ⚡ Can run in parallel
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Clean step details
const StepSummaryDetails: React.FC<{ step: Step }> = ({ step }) => {
  const apiStep = step as any;
  
  return (
    <Box flexDirection="column">
      {/* API step summary */}
      {step.type === 'api' && (
        <Box>
          <Text color="blue">{apiStep.method || 'GET'}</Text>
          <Text color="gray" marginLeft={1}>
            {truncateUrl(apiStep.url || '')}
          </Text>
          {apiStep.auth && (
            <Text color="magenta" marginLeft={1}>🔐</Text>
          )}
        </Box>
      )}
      
      {/* UI step summary */}
      {step.type === 'ui' && (
        <Box>
          <Text color="green">{apiStep.action || 'click'}</Text>
          <Text color="gray" marginLeft={1}>
            {truncateText(apiStep.selector || apiStep.target || '', 30)}
          </Text>
        </Box>
      )}
      
      {/* Expectations indicator */}
      {step.expect && (
        <Text color="yellow" dimColor marginTop={1}>
          ✅ {Array.isArray(step.expect) ? step.expect.length : 1} validation{Array.isArray(step.expect) && step.expect.length !== 1 ? 's' : ''}
        </Text>
      )}
      
      {/* Configuration badges */}
      <Box marginTop={1}>
        {step.timeout && (
          <Text color="orange" marginRight={2}>⏱️{step.timeout}ms</Text>
        )}
        {step.retries && (
          <Text color="orange" marginRight={2}>🔄{step.retries}x</Text>
        )}
        {step.skip && (
          <Text color="gray" marginRight={2}>⏭️skip</Text>
        )}
      </Box>
    </Box>
  );
};

// Summary footer
const SummaryFooter: React.FC = () => {
  return (
    <Box paddingX={1} paddingY={1} borderTop>
      <Text color="gray" dimColor>
        Click step to jump • G Toggle groups • D Toggle dependencies • R Run selected
      </Text>
    </Box>
  );
};

// Helper functions
function groupSteps(steps: Step[]): StepGroupData[] {
  const groups: StepGroupData[] = [];
  
  // Group by step type first
  const typeGroups = steps.reduce((acc, step, index) => {
    const type = step.type;
    if (!acc[type]) {
      acc[type] = { steps: [], indices: [] };
    }
    acc[type].steps.push(step);
    acc[type].indices.push(index);
    return acc;
  }, {} as Record<string, { steps: Step[]; indices: number[] }>);
  
  // Create named groups
  Object.entries(typeGroups).forEach(([type, data]) => {
    const groupName = getGroupName(type, data.steps.length);
    groups.push({
      name: groupName,
      steps: data.steps,
      indices: data.indices
    });
  });
  
  // Sort groups by logical order
  groups.sort((a, b) => {
    const order = ['setup', 'api', 'ui', 'validation', 'teardown'];
    const aOrder = order.indexOf(a.name.toLowerCase()) + 1 || 999;
    const bOrder = order.indexOf(b.name.toLowerCase()) + 1 || 999;
    return aOrder - bOrder;
  });
  
  return groups;
}

function getGroupName(type: string, count: number): string {
  const names: Record<string, string> = {
    api: `API Requests (${count})`,
    ui: `UI Actions (${count})`,
    validation: `Validations (${count})`,
    setup: `Setup Steps (${count})`,
    teardown: `Cleanup Steps (${count})`
  };
  return names[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Steps (${count})`;
}

function getStepTypeStats(steps: Step[]): Record<string, number> {
  return steps.reduce((acc, step) => {
    acc[step.type] = (acc[step.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getExecutionStats(stepResults?: any[]) {
  if (!stepResults) return null;
  
  return {
    passed: stepResults.filter(r => r.success).length,
    failed: stepResults.filter(r => !r.success).length,
    duration: stepResults.reduce((sum, r) => sum + (r.duration || 0), 0)
  };
}

function estimateTotalDuration(steps: Step[]): number {
  return steps.reduce((total, step) => {
    // Estimate based on step type and configuration
    let estimate = 0;
    
    switch (step.type) {
      case 'api':
        estimate = step.timeout || 5000; // Default API timeout
        break;
      case 'ui':
        estimate = step.timeout || 10000; // UI actions typically slower
        break;
      default:
        estimate = step.timeout || 1000;
    }
    
    // Factor in retries
    if (step.retries) {
      estimate *= (step.retries + 1);
    }
    
    return total + estimate;
  }, 0);
}

function getStepStatusDisplay(result?: any, isCurrent?: boolean): { icon: string; color: string } {
  if (isCurrent) {
    return { icon: '⏳', color: 'yellow' };
  }
  
  if (!result) {
    return { icon: '⚪', color: 'gray' };
  }
  
  return result.success 
    ? { icon: '✅', color: 'green' }
    : { icon: '❌', color: 'red' };
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function truncateUrl(url: string): string {
  if (url.length <= 40) return url;
  
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname.substring(0, 20)}...`;
  } catch {
    return truncateText(url, 40);
  }
}