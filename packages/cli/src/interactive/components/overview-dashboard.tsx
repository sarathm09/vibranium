/**
 * Professional Overview Dashboard Component
 * 
 * A completely redesigned, dashboard-style overview pane that provides:
 * - Clear information architecture with logical sections
 * - Professional visual design with proper hierarchy
 * - Intuitive navigation with keyboard shortcuts
 * - Informative content display with smart truncation
 * - Interactive elements with progressive disclosure
 * - Smart layout that adapts to terminal size
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import chalk from 'chalk';

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

  const isCompact = terminalWidth < 100;
  const cardWidth = Math.max(isCompact ? terminalWidth - 6 : Math.floor(terminalWidth / 2) - 4, 30);
  
  return (
    <Box flexDirection="column" height="100%">
      {/* Dashboard Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">📊 Overview Dashboard</Text>
        <Text color="gray" marginLeft={2}>
          {scenario.name ? `[${scenario.name}]` : '[Unnamed Scenario]'}
        </Text>
        {isActive && (
          <Text color="yellow" marginLeft={2}>● ACTIVE</Text>
        )}
      </Box>

      {/* Main Dashboard Grid */}
      <Box flexDirection={isCompact ? "column" : "row"} flexGrow={1} gap={2}>
        {/* Left Column */}
        <Box flexDirection="column" width={cardWidth} flexShrink={0}>
          {renderScenarioInfoCard(scenario, cardWidth)}
          {renderQuickActionsCard(isActive, cardWidth)}
          {state.lastResult && renderExecutionStatusCard(state.lastResult, cardWidth)}
        </Box>

        {/* Right Column */}
        <Box flexDirection="column" flexGrow={1}>
          {renderStepsOverviewCard(scenario, state, cardWidth)}
          {renderVariablesCard(scenario, state, cardWidth)}
          {state.isRunning && renderLiveExecutionCard(state, cardWidth)}
        </Box>
      </Box>

      {/* Navigation Footer */}
      <Box marginTop={1} paddingTop={1} borderTop borderColor="gray">
        <Text color="gray" dimColor>
          {isActive 
            ? "ACTIVE: J/K Steps • Enter Run • R Full Scenario • E Environment • C Copy • ? Help"
            : "Tab Activate • R Run • E Environment • 1-5 View Modes"
          }
        </Text>
      </Box>
    </Box>
  );
};

// Empty state component
const renderEmptyState = () => (
  <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
    <Text color="gray" bold fontSize="large">
      📋 No Scenario Selected
    </Text>
    <Text color="gray" dimColor marginTop={1}>
      Select a scenario from the navigation pane to view details
    </Text>
    <Box marginTop={2} paddingX={4} paddingY={1} borderStyle="round" borderColor="blue">
      <Text color="blue" bold>Quick Start</Text>
      <Text color="gray" marginTop={1}>
        • ↑↓ Navigate scenarios
      </Text>
      <Text color="gray">
        • Enter Select scenario
      </Text>
      <Text color="gray">
        • R Run selected scenario
      </Text>
    </Box>
  </Box>
);

// Scenario Information Card
const renderScenarioInfoCard = (scenario: any, width: number) => (
  <Box marginBottom={2}>
    <Card title="📄 Scenario Info" icon="📄" width={width}>
      <InfoRow label="Name" value={scenario.name} color="white" />
      {scenario.description && (
        <InfoRow 
          label="Description" 
          value={truncateText(scenario.description, width - 20)} 
          color="gray" 
        />
      )}
      <Box flexDirection="row" gap={3} marginTop={1}>
        <InfoBadge label="Steps" value={scenario.steps?.length || 0} color="cyan" />
        {scenario.version && (
          <InfoBadge label="Version" value={scenario.version} color="green" />
        )}
      </Box>
      
      {scenario.environments && (
        <Box marginTop={1}>
          <Text color="blue" bold>🌍 Environments:</Text>
          <Text color="white" marginLeft={1}>
            {Array.isArray(scenario.environments) 
              ? scenario.environments.join(', ') 
              : Object.keys(scenario.environments).join(', ')
            }
          </Text>
        </Box>
      )}
    </Card>
  </Box>
);

// Quick Actions Card
const renderQuickActionsCard = (isActive: boolean, width: number) => (
  <Box marginBottom={2}>
    <Card title="⚡ Quick Actions" icon="⚡" width={width}>
      <Box flexDirection="column" gap={1}>
        <ActionButton 
          shortcut="R" 
          label="Run Full Scenario" 
          color="green" 
          active={isActive}
        />
        <ActionButton 
          shortcut="Enter" 
          label="Run Selected Step" 
          color="yellow" 
          active={isActive}
        />
        <ActionButton 
          shortcut="E" 
          label="Switch Environment" 
          color="blue" 
          active={isActive}
        />
        <ActionButton 
          shortcut="C" 
          label="Copy Step Data" 
          color="cyan" 
          active={isActive}
        />
      </Box>
    </Card>
  </Box>
);

// Execution Status Card
const renderExecutionStatusCard = (result: any, width: number) => {
  const statusColor = result.success ? 'green' : 'red';
  const statusIcon = result.success ? '✅' : '❌';
  
  return (
    <Box marginBottom={2}>
      <Card title="🎯 Last Execution" icon="🎯" width={width}>
        <Box flexDirection="row" alignItems="center" marginBottom={1}>
          <Text color={statusColor} bold>
            {statusIcon} {result.success ? 'PASSED' : 'FAILED'}
          </Text>
          <Text color="gray" marginLeft={2}>
            {formatDuration(result.duration)}
          </Text>
        </Box>
        
        <Box flexDirection="row" gap={2} marginBottom={1}>
          <InfoBadge 
            label="Steps" 
            value={`${result.stepResults?.filter((s: any) => s.success).length || 0}/${result.stepResults?.length || 0}`} 
            color="cyan" 
          />
          <InfoBadge 
            label="Env" 
            value={result.environment} 
            color="blue" 
          />
        </Box>
        
        <Text color="gray" dimColor>
          🕐 {new Date(result.timestamp || Date.now()).toLocaleTimeString()}
        </Text>
      </Card>
    </Box>
  );
};

// Steps Overview Card
const renderStepsOverviewCard = (scenario: any, state: any, width: number) => {
  const steps = scenario.steps || [];
  const selectedIndex = state.ui.overviewSelectedStepIndex;
  const selectedStep = steps[selectedIndex];
  
  return (
    <Box marginBottom={2}>
      <Card title="📋 Steps Overview" icon="📋" width={width} expandable>
        {/* Step Type Summary */}
        <Box flexDirection="row" gap={3} marginBottom={2}>
          <InfoBadge 
            label="Total" 
            value={steps.length} 
            color="white" 
          />
          <InfoBadge 
            label="API" 
            value={steps.filter((s: any) => s.type === 'api').length} 
            color="blue" 
          />
          <InfoBadge 
            label="UI" 
            value={steps.filter((s: any) => s.type === 'ui').length} 
            color="green" 
          />
        </Box>

        {/* Current Step Selection */}
        {selectedStep && (
          <Box marginBottom={2} paddingX={2} paddingY={1} 
               backgroundColor="#0A3A4A" borderLeft borderColor="cyan">
            <Text color="cyan" bold>
              🎯 Selected: Step {selectedIndex + 1}
            </Text>
            <Text color="white" marginTop={1}>
              {selectedStep.name}
            </Text>
            <Box flexDirection="row" gap={2} marginTop={1}>
              <Text color="blue">
                {getTypeIcon(selectedStep.type)} {selectedStep.type}
              </Text>
              {selectedStep.type === 'api' && (
                <Text color="green">
                  {selectedStep.method || 'GET'}
                </Text>
              )}
            </Box>
            {selectedStep.description && (
              <Text color="gray" dimColor marginTop={1}>
                {truncateText(selectedStep.description, width - 10)}
              </Text>
            )}
          </Box>
        )}

        {/* Step Navigation Hints */}
        <Box paddingY={1} borderTop borderColor="gray">
          <Text color="gray" dimColor>
            J/K Navigate Steps • Enter Run Selected • ↑↓ Step Details
          </Text>
        </Box>
      </Card>
    </Box>
  );
};

// Variables Card
const renderVariablesCard = (scenario: any, state: any, width: number) => {
  const variables = scenario.variables || scenario.config?.variables || {};
  const globalVars = state.variableManager?.getGlobalVariables() || {};
  const envVars = state.variableManager?.getEnvironmentVariables(state.currentEnvironment) || {};
  
  const totalVars = Object.keys({...variables, ...globalVars, ...envVars}).length;
  
  return (
    <Box marginBottom={2}>
      <Card title="🔧 Variables" icon="🔧" width={width} expandable>
        {totalVars === 0 ? (
          <Text color="gray" dimColor>No variables defined</Text>
        ) : (
          <Box flexDirection="column">
            <Box flexDirection="row" gap={3} marginBottom={1}>
              <InfoBadge 
                label="Total" 
                value={totalVars} 
                color="cyan" 
              />
              <InfoBadge 
                label="Scenario" 
                value={Object.keys(variables).length} 
                color="yellow" 
              />
              <InfoBadge 
                label="Global" 
                value={Object.keys(globalVars).length} 
                color="blue" 
              />
              <InfoBadge 
                label="Environment" 
                value={Object.keys(envVars).length} 
                color="green" 
              />
            </Box>
            
            {/* Variable Preview */}
            {Object.keys(variables).length > 0 && (
              <Box marginTop={1}>
                <Text color="yellow" bold>Scenario Variables:</Text>
                <Box paddingLeft={2} marginTop={1}>
                  {Object.entries(variables).slice(0, 3).map(([key, value]) => (
                    <VariablePreview 
                      key={key} 
                      name={key} 
                      value={value} 
                      width={width - 8} 
                    />
                  ))}
                  {Object.keys(variables).length > 3 && (
                    <Text color="gray" dimColor>
                      ... {Object.keys(variables).length - 3} more
                    </Text>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}
        
        <Box marginTop={1} paddingTop={1} borderTop borderColor="gray">
          <Text color="gray" dimColor>
            V View All • E Environment • Tab Variables Pane
          </Text>
        </Box>
      </Card>
    </Box>
  );
};

// Live Execution Card
const renderLiveExecutionCard = (state: any, width: number) => {
  if (!state.executionProgress) return null;
  
  const { currentStepIndex, totalSteps, completedSteps, passedSteps, failedSteps } = state.executionProgress;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
  const currentStep = state.currentScenario?.steps?.[currentStepIndex];
  
  return (
    <Box marginBottom={2}>
      <Card title="⚡ Live Execution" icon="⚡" width={width} highlight>
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="row" alignItems="center">
            <Text color="yellow" bold>
              🏃 Running Step {currentStepIndex + 1}/{totalSteps}
            </Text>
            <Text color="cyan" marginLeft={2}>
              ({progressPercentage}%)
            </Text>
          </Box>
          
          <Text color="white">
            {currentStep?.name || 'Unknown step'}
          </Text>
          
          <Box flexDirection="row" gap={2} marginTop={1}>
            <InfoBadge label="Completed" value={completedSteps} color="blue" />
            <InfoBadge label="Passed" value={passedSteps} color="green" />
            <InfoBadge label="Failed" value={failedSteps} color="red" />
          </Box>
          
          {/* Progress Bar */}
          <Box marginTop={1}>
            <Text>
              {generateProgressBar(progressPercentage, Math.floor(width / 4))}
              <Text color="cyan"> {progressPercentage}%</Text>
            </Text>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

// Reusable Card Component
interface CardProps {
  title: string;
  icon?: string;
  width: number;
  children: React.ReactNode;
  expandable?: boolean;
  highlight?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  icon, 
  width, 
  children, 
  expandable = false,
  highlight = false 
}) => (
  <Box flexDirection="column" width={width}>
    {/* Card Header */}
    <Box paddingX={2} paddingY={1} 
         backgroundColor={highlight ? "#1A1A2E" : "#0F0F1A"} 
         borderTop borderLeft borderRight 
         borderColor={highlight ? "yellow" : "gray"}>
      <Box flexDirection="row" alignItems="center">
        {icon && <Text color="cyan" marginRight={1}>{icon}</Text>}
        <Text bold color={highlight ? "yellow" : "white"}>
          {title}
        </Text>
        {expandable && (
          <Text color="gray" marginLeft={1}>▼</Text>
        )}
      </Box>
    </Box>
    
    {/* Card Content */}
    <Box paddingX={2} paddingY={1} 
         backgroundColor="#0A0A0A" 
         borderBottom borderLeft borderRight 
         borderColor={highlight ? "yellow" : "gray"}>
      {children}
    </Box>
  </Box>
);

// Reusable Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
  color?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, color = "white" }) => (
  <Box flexDirection="row" marginBottom={1}>
    <Text bold color="cyan" width={12}>
      {label}:
    </Text>
    <Text color={color}>
      {value}
    </Text>
  </Box>
);

// Reusable Info Badge Component
interface InfoBadgeProps {
  label: string;
  value: string | number;
  color: string;
}

const InfoBadge: React.FC<InfoBadgeProps> = ({ label, value, color }) => (
  <Box flexDirection="row" alignItems="center">
    <Text color="gray" dimColor>
      {label}:
    </Text>
    <Text color={color} bold marginLeft={1}>
      {value}
    </Text>
  </Box>
);

// Action Button Component
interface ActionButtonProps {
  shortcut: string;
  label: string;
  color: string;
  active: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ shortcut, label, color, active }) => (
  <Box flexDirection="row" alignItems="center" opacity={active ? 1 : 0.7}>
    <Text color={color} bold backgroundColor="gray" paddingX={1}>
      {shortcut}
    </Text>
    <Text color="white" marginLeft={2}>
      {label}
    </Text>
  </Box>
);

// Variable Preview Component
interface VariablePreviewProps {
  name: string;
  value: any;
  width: number;
}

const VariablePreview: React.FC<VariablePreviewProps> = ({ name, value, width }) => {
  const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
  const truncatedValue = truncateText(valueStr, width - name.length - 8);
  
  return (
    <Box flexDirection="row" alignItems="center">
      <Text color="cyan" bold>
        {name}:
      </Text>
      <Text color="white" marginLeft={1}>
        {truncatedValue}
      </Text>
    </Box>
  );
};

// Utility Functions
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

const formatDuration = (duration: number): string => {
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
};

const getTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    api: '🌐',
    ui: '🖥️',
    validation: '✅',
    setup: '🔧',
    teardown: '🧹'
  };
  return iconMap[type] || '⚡';
};

const generateProgressBar = (percentage: number, width: number): string => {
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
};