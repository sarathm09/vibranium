/**
 * Professional Details Pane Component
 * 
 * A completely redesigned, clean, and highly organized interface for scenario information
 * featuring modern UI principles and professional visual hierarchy.
 * 
 * Key Improvements:
 * - Clean section headers with consistent borders and typography
 * - Professional status indicators without excessive emojis
 * - Better information grouping with logical organization
 * - Improved visual hierarchy with proper spacing and indentation
 * - Progressive disclosure for complex information
 * - Enhanced code syntax highlighting with line numbers
 * - Consistent color scheme and visual feedback
 * - Professional borders and visual separators
 * - Better keyboard navigation indicators
 * - Structured data presentation with clear labels
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import { ResultsView } from './execution-results';
import chalk from 'chalk';

export const DetailsPane: React.FC = () => {
  const { state, actions } = useAppContext();
  const [showNavigator, setShowNavigator] = useState(false);
  
  // Use scrollOffset from context instead of local state
  const scrollOffset = state.ui.detailsScrollOffset;
  
  // Use the view mode from state instead of local state
  const viewMode = state.ui.detailsViewMode;
  
  // Reset scroll when scenario changes
  useEffect(() => {
    actions.resetDetailsScroll();
  }, [state.currentScenario]);
  

  const getPanelTitle = () => {
    const isActive = state.ui.activePane === 'details';
    let title = 'Scenario Details';
    
    if (state.currentScenario) {
      title = state.currentScenario.name;
    }
    
    const color = isActive ? 'cyan' : 'gray';
    const indicator = state.ui.editorChanged ? ' •' : '';
    return { title, color, indicator };
  };

  const renderContent = () => {
    if (!state.currentScenario) {
      return renderEmptyState();
    }

    switch (viewMode) {
      case 'overview':
        return renderOverview();
      case 'steps':
        return renderNewStepsView();
      case 'step-summary':
        return renderStepSummaryView();
      case 'step-navigator':
        return renderStepNavigatorView();
      case 'raw':
        return renderRawContent();
      case 'execution':
        return renderExecutionDetails();
      case 'realtime':
        return renderExecutionDetails();
      default:
        return renderOverview();
    }
  };

  const renderEmptyState = () => (
    <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
      <Text color="gray" bold>
        No Scenario Selected
      </Text>
      <Text color="gray" dimColor marginTop={1}>
        Use ↑↓ to navigate and Enter to select a scenario
      </Text>
      {state.scenarios.length === 0 && (
        <Text color="yellow" marginTop={1}>
          No scenarios found in current directory
        </Text>
      )}
    </Box>
  );
  
  const renderViewModeSelector = () => {
    const modes = [
      { key: 'overview', label: 'Overview' }, 
      { key: 'steps', label: 'Steps' },
      { key: 'raw', label: 'Source' }, 
      { key: 'execution', label: 'Results' },
      { key: 'realtime', label: 'Timeline' }
    ];
    
    return (
      <Box marginBottom={1}>
        {modes.map((mode, index) => {
          const isSelected = viewMode === mode.key;
          const color = isSelected ? 'cyan' : 'gray';
          const weight = isSelected ? 'bold' : 'normal';
          const separator = index < modes.length - 1 ? ' | ' : '';
          
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
        {renderScenarioMetadata()}
        {state.currentScenario?.steps && state.currentScenario.steps.length > 0 && renderStepsSection()}
        {state.currentScenario?.steps && state.currentScenario.steps.length > 0 && renderCurrentStepSection()}
        {state.isRunning && state.executionProgress && renderLiveExecutionSection()}
        {state.lastResult && !state.isRunning && renderExecutionSummarySection()}
      </Box>
    );
  };

  const renderSectionHeader = (title: string, icon?: string) => (
    <Box marginBottom={1} paddingBottom={0} borderBottom borderColor="gray">
      <Text bold color="white">
        {icon && <Text color="cyan">{icon} </Text>}{title}
      </Text>
    </Box>
  );

  const renderScenarioMetadata = () => {
    const scenario = state.currentScenario;
    if (!scenario) return null;

    return (
      <Box flexDirection="column" marginBottom={2}>
        {renderSectionHeader('Scenario Information')}
        
        <Box flexDirection="column" paddingLeft={1}>
          <Box marginBottom={1}>
            <Text bold color="cyan">Name: </Text>
            <Text>{scenario.name}</Text>
          </Box>
          
          {scenario.description && (
            <Box marginBottom={1}>
              <Text bold color="cyan">Description: </Text>
              <Text>{scenario.description}</Text>
            </Box>
          )}
          
          <Box flexDirection="row" gap={4}>
            <Box>
              <Text bold color="cyan">Steps: </Text>
              <Text color="white">{scenario.steps?.length || 0}</Text>
            </Box>
            
            {(scenario as any)?.version && (
              <Box>
                <Text bold color="cyan">Version: </Text>
                <Text color="white">{(scenario as any).version}</Text>
              </Box>
            )}
          </Box>
          
          {scenario.environments && (
            <Box marginTop={1}>
              <Text bold color="cyan">Environments: </Text>
              <Text color="white">
                {Array.isArray(scenario.environments) 
                  ? scenario.environments.join(', ') 
                  : Object.keys(scenario.environments).join(', ')}
              </Text>
            </Box>
          )}
          
          {renderGlobalVariables()}
          {renderGlobalConfiguration()}
        </Box>
      </Box>
    );
  };

  const renderStepsSection = () => (
    <Box flexDirection="column" marginBottom={2}>
      {renderSectionHeader('Steps Overview')}
      <Box paddingLeft={1}>
        {renderStepsOverview()}
      </Box>
    </Box>
  );

  const renderCurrentStepSection = () => (
    <Box flexDirection="column" marginBottom={2}>
      {renderSectionHeader(`Current Step (${state.ui.selectedStepIndex + 1}/${state.currentScenario?.steps?.length || 0})`)}
      <Box paddingLeft={1}>
        {renderCurrentStepDetails()}
      </Box>
    </Box>
  );

  const renderLiveExecutionSection = () => (
    <Box flexDirection="column" marginBottom={2}>
      {renderSectionHeader('Live Execution', '⚡')}
      <Box paddingLeft={1}>
        {renderLiveExecutionStatus()}
      </Box>
    </Box>
  );

  const renderExecutionSummarySection = () => (
    <Box flexDirection="column" marginBottom={1}>
      {renderSectionHeader('Last Execution', '✓')}
      <Box paddingLeft={1}>
        {renderExecutionSummary()}
      </Box>
    </Box>
  );
  
  const renderRawContent = () => {
    const isYaml = state.currentScenarioPath?.endsWith('.yaml') || state.currentScenarioPath?.endsWith('.yml');
    const fileType = isYaml ? 'YAML' : 'JSON';
    const status = state.ui.editorChanged ? 'Modified' : 'Read-only';
    const statusColor = state.ui.editorChanged ? 'yellow' : 'gray';
    
    return (
      <Box flexDirection="column" height="100%">
        <Box marginBottom={1} flexDirection="row">
          <Text bold color="white">
            Source Code ({fileType})
          </Text>
          <Text color={statusColor} marginLeft={2}>
            [{status}]
          </Text>
        </Box>
        {renderFormattedContent(isYaml)}
      </Box>
    );
  };
  
  const renderExecutionDetails = () => {
    return (
      <ResultsView
        result={state.lastResult}
        isRunning={state.isRunning}
        currentStepIndex={state.executionProgress?.currentStepIndex || 0}
        selectedStepIndex={state.ui.selectedStepIndex}
        onStepSelect={(index) => actions.selectStep(index)}
        viewMode={state.ui.detailsViewMode === 'execution' ? 'summary' : 
                 state.ui.detailsViewMode === 'realtime' ? 'timeline' : 'summary'}
        onViewModeChange={(mode) => {
          // Map results view modes to details view modes
          const detailsMode = mode === 'summary' ? 'execution' : 
                             mode === 'timeline' ? 'realtime' : 'execution';
          actions.setDetailsViewMode(detailsMode);
        }}
      />
    );
  };

  const renderGlobalVariables = () => {
    const variables = (state.currentScenario as any)?.variables || (state.currentScenario as any)?.config?.variables;
    if (!variables || Object.keys(variables).length === 0) return null;
    
    return (
      <Box marginTop={1}>
        <Text bold color="cyan">Variables: </Text>
        <Text color="white">{Object.keys(variables).length} defined</Text>
      </Box>
    );
  };

  const renderGlobalConfiguration = () => {
    const config = (state.currentScenario as any)?.config;
    if (!config) return null;
    
    const configItems = [];
    if (config.timeout) configItems.push(`timeout: ${config.timeout}ms`);
    if (config.retries) configItems.push(`retries: ${config.retries}`);
    if (config.parallel?.enabled) configItems.push('parallel enabled');
    if (config.failFast) configItems.push('fail-fast');
    
    if (configItems.length === 0) return null;
    
    return (
      <Box marginTop={1}>
        <Text bold color="cyan">Configuration: </Text>
        <Text color="white">{configItems.join(', ')}</Text>
      </Box>
    );
  };

  const renderStepsOverview = () => {
    if (!state.currentScenario?.steps) return null;
    
    return (
      <Box flexDirection="column">
        {state.currentScenario?.steps?.map((step, index) => {
          const isSelected = index === state.ui.selectedStepIndex;
          const isCurrent = state.executionProgress?.currentStepIndex === index && state.isRunning;
          
          // Get status from real-time results if available, fallback to last result
          const realTimeResult = state.realTimeStepResults.find(r => r.stepIndex === index);
          let statusIcon = '○';
          let statusColor = 'gray';
          
          if (realTimeResult) {
            switch (realTimeResult.status) {
              case 'running':
                statusIcon = '→';
                statusColor = 'yellow';
                break;
              case 'completed':
                statusIcon = '✓';
                statusColor = 'green';
                break;
              case 'failed':
                statusIcon = '✗';
                statusColor = 'red';
                break;
              default:
                statusIcon = '○';
                statusColor = 'gray';
            }
          } else if (state.lastResult?.stepResults?.[index]) {
            statusIcon = state.lastResult.stepResults[index].success ? '✓' : '✗';
            statusColor = state.lastResult.stepResults[index].success ? 'green' : 'red';
          }
          
          return (
            <Box key={index} flexDirection="row" marginBottom={0}>
              <Text color={statusColor} bold>
                {statusIcon}
              </Text>
              <Text color={isSelected ? 'yellow' : 'white'} bold={isSelected} marginLeft={1}>
                {index + 1}. {step.name}
              </Text>
              <Text color="gray" marginLeft={1}>
                [{step.type}]
              </Text>
              {isCurrent && (
                <Text color="yellow" marginLeft={1}>
                  ← Active
                </Text>
              )}
              {realTimeResult?.duration && (
                <Text color="cyan" marginLeft={1}>
                  ({realTimeResult.duration}ms)
                </Text>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  // Enhanced steps view - cleaner and more intuitive
  const renderNewStepsView = () => {
    return renderEnhancedStepsView();
  };

  const renderStepSummaryView = () => {
    return renderStepSummaryView_Internal();
  };

  const renderStepNavigatorView = () => {
    return renderStepNavigatorView_Internal();
  };

  // Clean, scannable steps list with better UX
  const renderEnhancedStepsView = () => {
    if (!state.currentScenario?.steps) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
          <Text color="gray" bold>📝 No Steps Available</Text>
          <Text color="gray" dimColor marginTop={1}>
            This scenario doesn't contain any steps
          </Text>
        </Box>
      );
    }

    const steps = state.currentScenario.steps;
    
    return (
      <Box flexDirection="column" height="100%">
        {/* Clean header with summary */}
        <Box paddingX={1} paddingY={1} borderBottom>
          <Text bold color="cyan">📋 {steps.length} Steps</Text>
          <Box marginTop={1}>
            <Text color="gray">
              {steps.filter(s => s.type === 'api').length > 0 && <Text color="blue">🌐 {steps.filter(s => s.type === 'api').length} API</Text>}
              {steps.filter(s => s.type === 'api').length > 0 && steps.filter(s => s.type === 'ui').length > 0 && <Text> • </Text>}
              {steps.filter(s => s.type === 'ui').length > 0 && <Text color="green">🖥️ {steps.filter(s => s.type === 'ui').length} UI</Text>}
            </Text>
          </Box>
          {state.lastResult?.stepResults && (
            <Box marginTop={1}>
              <Text>
                <Text color="green">✅ {state.lastResult.stepResults.filter(r => r.success).length}</Text>
                <Text> • </Text>
                <Text color="red">❌ {state.lastResult.stepResults.filter(r => !r.success).length}</Text>
                <Text color="gray"> / {state.lastResult.stepResults.length}</Text>
              </Text>
            </Box>
          )}
        </Box>

        {/* Enhanced steps list */}
        <Box flexDirection="column" flexGrow={1} paddingX={1}>
          {steps.map((step, index) => {
            const isSelected = index === state.ui.selectedStepIndex;
            const isCurrent = index === state.executionProgress?.currentStepIndex && state.isRunning;
            const result = state.lastResult?.stepResults?.[index];
            const statusDisplay = getEnhancedStepStatus(result, isCurrent);

            return (
              <Box
                key={index}
                flexDirection="column"
                marginBottom={1}
                paddingX={1}
                paddingY={1}
                borderStyle={isSelected ? 'round' : undefined}
                borderColor={isSelected ? 'cyan' : undefined}
              >
                {/* Clean step header */}
                <Box justifyContent="space-between" alignItems="center">
                  <Box>
                    <Text color={statusDisplay.color} bold={isSelected}>
                      {statusDisplay.icon} {index + 1}. {step.name}
                    </Text>
                    {isCurrent && <Text color="yellow" bold> ← Running</Text>}
                  </Box>
                  <Box>
                    <Text color={getTypeColor(step.type)}>{getTypeIcon(step.type)}</Text>
                    {result?.duration && (
                      <Text color="gray" marginLeft={1}>{result.duration}ms</Text>
                    )}
                  </Box>
                </Box>

                {/* Essential step info (clean, scannable) */}
                <Box flexDirection="column" marginTop={1} paddingLeft={2}>
                  {step.type === 'api' && (
                    <Text color="gray">
                      <Text color="cyan">{(step as any).method || 'GET'}</Text>
                      <Text> {truncateUrl((step as any).url || '')}</Text>
                    </Text>
                  )}
                  {step.type === 'ui' && (
                    <Text color="gray">
                      <Text color="green">{(step as any).action || 'click'}</Text>
                      <Text> {truncateText((step as any).selector || (step as any).target || '', 40)}</Text>
                    </Text>
                  )}
                  {step.description && (
                    <Text color="gray" dimColor>
                      {truncateText(step.description, 60)}
                    </Text>
                  )}

                  {/* Progressive disclosure for selected step */}
                  {isSelected && (
                    <Box marginTop={1} paddingLeft={2} borderLeft borderColor="gray">
                      {renderSelectedStepDetails(step, result)}
                    </Box>
                  )}
                </Box>

                {/* Simple status indicator */}
                {isSelected && result && (
                  <Box marginTop={1}>
                    <Text color={result.success ? 'green' : 'red'}>
                      {'▄'.repeat(30)}
                    </Text>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Clean footer */}
        <Box paddingX={1} paddingY={1} borderTop>
          <Text color="gray" dimColor>
            ↑↓ Navigate • Enter Select/Run • Tab Switch
          </Text>
        </Box>
      </Box>
    );
  };

  // Step summary view with grouping
  const renderStepSummaryView_Internal = () => {
    if (!state.currentScenario?.steps) {
      return renderEnhancedStepsView();
    }

    const steps = state.currentScenario.steps;
    const groupedSteps = groupStepsByType(steps);

    return (
      <Box flexDirection="column" height="100%">
        <Box paddingX={1} paddingY={1} borderBottom>
          <Text bold color="cyan">📊 Steps Summary ({steps.length} total)</Text>
        </Box>
        
        <Box flexDirection="column" flexGrow={1} paddingX={1}>
          {Object.entries(groupedSteps).map(([type, typeSteps]) => (
            <Box key={type} flexDirection="column" marginBottom={2}>
              <Text color="blue" bold>
                {getTypeIcon(type)} {type.toUpperCase()} Steps ({typeSteps.length})
              </Text>
              <Box paddingLeft={2} marginTop={1}>
                {typeSteps.map((step, stepIndex) => {
                  const originalIndex = steps.findIndex(s => s === step);
                  const result = state.lastResult?.stepResults?.[originalIndex];
                  const statusDisplay = getEnhancedStepStatus(result);

                  return (
                    <Text key={originalIndex} color={statusDisplay.color}>
                      {statusDisplay.icon} {originalIndex + 1}. {step.name}
                    </Text>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Step navigator view with search
  const renderStepNavigatorView_Internal = () => {
    if (!state.currentScenario?.steps) {
      return renderEnhancedStepsView();
    }

    return (
      <Box flexDirection="column" height="100%">
        <Box paddingX={1} paddingY={1} borderBottom>
          <Text bold color="cyan">🔍 Step Navigator</Text>
          <Text color="gray" marginTop={1}>
            Use keyboard shortcuts to navigate and filter steps
          </Text>
        </Box>
        
        <Box flexGrow={1}>
          {renderEnhancedStepsView()}
        </Box>
      </Box>
    );
  };

  const renderStepsView = () => {
    if (!state.currentScenario?.steps) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
          <Text color="gray" bold>
            No Steps Available
          </Text>
          <Text color="gray" dimColor marginTop={1}>
            This scenario doesn't contain any steps
          </Text>
        </Box>
      );
    }
    
    const maxVisibleSteps = 8;
    const visibleSteps = state.currentScenario?.steps?.slice(scrollOffset, scrollOffset + maxVisibleSteps) || [];
    
    return (
      <Box flexDirection="column" height="100%">
        {renderSectionHeader(`All Steps (${state.currentScenario?.steps?.length || 0})`)}
        
        {/* Scroll indicator */}
        {scrollOffset > 0 && (
          <Text color="gray" dimColor marginBottom={1} paddingLeft={1}>
            ↑ {scrollOffset} steps above (press ↑ to scroll up)
          </Text>
        )}
        
        <Box flexDirection="column" paddingLeft={1}>
          {visibleSteps.map((step, visibleIndex) => {
            const actualIndex = scrollOffset + visibleIndex;
            const isSelected = actualIndex === state.ui.selectedStepIndex;
            const stepResult = state.lastResult?.stepResults?.[actualIndex];
            const statusIcon = stepResult?.success === true ? '✓' : 
                              stepResult?.success === false ? '✗' : '○';
            const statusColor = stepResult?.success === true ? 'green' : 
                               stepResult?.success === false ? 'red' : 'gray';
            
            return (
              <Box key={actualIndex} flexDirection="column" marginBottom={2} paddingX={1} 
                   borderStyle={isSelected ? 'single' : 'single'} 
                   borderColor={isSelected ? 'cyan' : 'gray'}>
                {/* Step Header */}
                <Box flexDirection="row" marginBottom={1}>
                  <Text color={statusColor} bold>
                    {statusIcon}
                  </Text>
                  <Text color={isSelected ? 'yellow' : 'white'} bold={isSelected} marginLeft={1}>
                    {actualIndex + 1}. {step.name}
                  </Text>
                  <Text color="gray" marginLeft={1}>
                    [{step.type}]
                  </Text>
                </Box>
                
                {/* Step Details */}
                <Box paddingLeft={1} flexDirection="column">
                  <Text color="cyan">
                    <Text bold>Type:</Text> {step.type}
                  </Text>
                  
                  {/* API-specific details */}
                  {step.type === 'api' && (
                    <>
                      <Text color="green">
                        <Text bold>Method:</Text> {(step as any).method || 'GET'}
                      </Text>
                      <Text color="green">
                        <Text bold>URL:</Text> {(step as any).url || 'Not specified'}
                      </Text>
                      
                      {/* Headers */}
                      {(step as any).headers && Object.keys((step as any).headers).length > 0 && (
                        <Box flexDirection="column" marginTop={1}>
                          <Text color="blue" bold>Headers ({Object.keys((step as any).headers).length}):</Text>
                          <Box paddingLeft={2}>
                            {Object.entries((step as any).headers).map(([key, value]) => (
                              <Text key={key} color="gray">
                                {key}: {String(value)}
                              </Text>
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Body */}
                      {(step as any).body && (
                        <Box flexDirection="column" marginTop={1}>
                          <Text color="blue" bold>Body:</Text>
                          <Box paddingLeft={2}>
                            {renderStepBodyPreview((step as any).body)}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Auth */}
                      {(step as any).auth && (
                        <Text color="magenta">
                          <Text bold>Auth:</Text> {(step as any).auth.type || 'configured'}
                        </Text>
                      )}
                      
                      {/* Params */}
                      {(step as any).params && Object.keys((step as any).params).length > 0 && (
                        <Text color="blue">
                          <Text bold>Params:</Text> {Object.keys((step as any).params).length} defined
                        </Text>
                      )}
                    </>
                  )}
                  
                  {/* UI-specific details */}
                  {step.type === 'ui' && (
                    <>
                      <Text color="green">
                        <Text bold>Action:</Text> {(step as any).action || 'Not specified'}
                      </Text>
                      <Text color="green">
                        <Text bold>Target:</Text> {(step as any).target || (step as any).selector || 'Not specified'}
                      </Text>
                      {(step as any).value && (
                        <Text color="green">
                          <Text bold>Value:</Text> {String((step as any).value)}
                        </Text>
                      )}
                    </>
                  )}
                  
                  {/* Expectations */}
                  {step.expect && (
                    <Box flexDirection="column" marginTop={1}>
                      <Text color="yellow" bold>
                        Expectations ({Array.isArray(step.expect) ? step.expect.length : 1}):
                      </Text>
                      <Box paddingLeft={2}>
                        {(Array.isArray(step.expect) ? step.expect : [step.expect]).map((expectation, expIndex) => (
                          <Text key={expIndex} color="blue">
                            • {(expectation as any).operator || 'unknown'}: {(expectation as any).value !== undefined ? String((expectation as any).value) : ''}
                            {(expectation as any).path && <Text color="gray"> (path: {(expectation as any).path})</Text>}
                          </Text>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Dependencies */}
                  {(step as any).depends_on && (
                    <Text color="purple" marginTop={1}>
                      <Text bold>Dependencies:</Text> {Array.isArray((step as any).depends_on) ? (step as any).depends_on.join(', ') : (step as any).depends_on}
                    </Text>
                  )}
                  
                  {/* Configuration */}
                  <Box flexDirection="row" marginTop={1}>
                    {step.timeout && (
                      <Text color="orange" marginRight={2}>
                        <Text bold>Timeout:</Text> {step.timeout}ms
                      </Text>
                    )}
                    {step.retries && (
                      <Text color="orange" marginRight={2}>
                        <Text bold>Retries:</Text> {step.retries}
                      </Text>
                    )}
                    {(step as any).continueOnFailure && (
                      <Text color="orange" marginRight={2}>
                        <Text bold>Continue on failure</Text>
                      </Text>
                    )}
                  </Box>
                  
                  {/* Save Response */}
                  {(step as any).saveResponse && (
                    <Text color="cyan" marginTop={1}>
                      <Text bold>Saves:</Text> {Object.keys((step as any).saveResponse).join(', ')}
                    </Text>
                  )}
                  
                  {/* Step Result */}
                  {stepResult && (
                    <Box flexDirection="column" marginTop={1} paddingTop={1} borderTop borderColor="gray">
                      <Text color={stepResult.success ? 'green' : 'red'} bold>
                        {stepResult.success ? '✓ PASSED' : '✗ FAILED'} ({stepResult.duration || 0}ms)
                      </Text>
                      {stepResult.error && (
                        <Text color="red">
                          Error: {stepResult.error}
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
        
        {/* Bottom scroll indicator */}
        {(state.currentScenario?.steps?.length || 0) > scrollOffset + maxVisibleSteps && (
          <Text color="gray" dimColor marginTop={1} paddingLeft={1}>
            ↓ {(state.currentScenario?.steps?.length || 0) - (scrollOffset + maxVisibleSteps)} more steps (press ↓ to scroll down)
          </Text>
        )}
      </Box>
    );
  };

  const renderCurrentStepDetails = () => {
    const currentStep = state.currentScenario?.steps?.[state.ui.selectedStepIndex];
    if (!currentStep) {
      return (
        <Box>
          <Text color="gray" dimColor>No step selected</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        {/* Basic Information */}
        <Box marginBottom={2}>
          <Text bold color="cyan">Name: </Text>
          <Text>{currentStep.name || 'Unnamed step'}</Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text bold color="cyan">Type: </Text>
          <Text color="white">{currentStep.type || 'unknown'}</Text>
        </Box>
        
        {currentStep.description && (
          <Box marginBottom={2}>
            <Text bold color="cyan">Description: </Text>
            <Text>{currentStep.description}</Text>
          </Box>
        )}
        
        {/* Type-specific Configuration */}
        {renderStepTypeSpecificDetails(currentStep)}
        
        {/* Execution Configuration */}
        {renderStepExecutionConfig(currentStep)}
        
        {/* Validation Rules */}
        {currentStep.expect && renderStepExpectations(currentStep)}
        
        {/* Dependencies & Relationships */}
        {((currentStep as any).depends_on || currentStep.dependsOn) && renderStepDependencies(currentStep)}
        
        {/* Data Management */}
        {renderStepDataManagement(currentStep)}
        
        {/* Execution Results */}
        {state.lastResult?.stepResults && renderStepExecutionResult(currentStep.name)}
      </Box>
    );
  };

  const renderStepTypeSpecificDetails = (step: any) => {
    if (step.type === 'api') {
      return (
        <Box flexDirection="column" marginBottom={2}>
          <Text bold color="white" marginBottom={1}>API Configuration</Text>
          
          <Box flexDirection="row" marginBottom={1}>
            <Text bold color="cyan">Method: </Text>
            <Text color="green">{step.method || 'GET'}</Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text bold color="cyan">URL: </Text>
            <Text>{step.url || 'Not specified'}</Text>
          </Box>
          
          {step.headers && Object.keys(step.headers).length > 0 && (
            <Box marginBottom={1}>
              <Text bold color="cyan">Headers ({Object.keys(step.headers).length}): </Text>
              <Box paddingLeft={2} marginTop={1}>
                {Object.entries(step.headers).slice(0, 3).map(([key, value]) => (
                  <Text key={key} color="gray">
                    {key}: {String(value)}
                  </Text>
                ))}
                {Object.keys(step.headers).length > 3 && (
                  <Text color="gray" dimColor>
                    ... {Object.keys(step.headers).length - 3} more
                  </Text>
                )}
              </Box>
            </Box>
          )}
          
          {step.body && (
            <Box marginBottom={1}>
              <Text bold color="cyan">Request Body: </Text>
              <Box paddingLeft={2} marginTop={1}>
                {renderStepBodyPreview(step.body)}
              </Box>
            </Box>
          )}
          
          {step.auth && (
            <Box marginBottom={1}>
              <Text bold color="cyan">Authentication: </Text>
              <Text color="white">{step.auth.type || 'configured'}</Text>
            </Box>
          )}
        </Box>
      );
    }
    
    if (step.type === 'ui') {
      return (
        <Box flexDirection="column" marginBottom={2}>
          <Text bold color="white" marginBottom={1}>UI Interaction</Text>
          
          <Box marginBottom={1}>
            <Text bold color="cyan">Action: </Text>
            <Text color="white">{step.action || 'Not specified'}</Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text bold color="cyan">Target: </Text>
            <Text color="white">{step.target || step.selector || 'Not specified'}</Text>
          </Box>
          
          {step.value && (
            <Box marginBottom={1}>
              <Text bold color="cyan">Value: </Text>
              <Text color="white">{String(step.value)}</Text>
            </Box>
          )}
        </Box>
      );
    }
    
    return null;
  };

  const renderStepExecutionConfig = (step: any) => {
    const hasConfig = step.timeout || step.retries || step.continueOnFailure || step.skip || step.condition;
    if (!hasConfig) return null;

    return (
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="white" marginBottom={1}>Execution Configuration</Text>
        
        <Box flexDirection="row" gap={2}>
          {step.timeout && (
            <Box>
              <Text bold color="cyan">Timeout: </Text>
              <Text color="white">{step.timeout}ms</Text>
            </Box>
          )}
          
          {step.retries && (
            <Box>
              <Text bold color="cyan">Retries: </Text>
              <Text color="white">{step.retries}</Text>
            </Box>
          )}
        </Box>
        
        {step.continueOnFailure && (
          <Box marginTop={1}>
            <Text color="yellow">Continue on failure enabled</Text>
          </Box>
        )}
        
        {step.skip && (
          <Box marginTop={1}>
            <Text bold color="cyan">Skip Condition: </Text>
            <Text color="yellow">{typeof step.skip === 'boolean' ? 'conditional' : step.skip}</Text>
          </Box>
        )}
        
        {step.condition && (
          <Box marginTop={1}>
            <Text bold color="cyan">Run Condition: </Text>
            <Text color="yellow">{step.condition}</Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderStepExpectations = (step: any) => (
    <Box flexDirection="column" marginBottom={2}>
      <Text bold color="white" marginBottom={1}>
        Validation Rules ({Array.isArray(step.expect) ? step.expect.length : 1})
      </Text>
      
      <Box paddingLeft={1}>
        {(Array.isArray(step.expect) ? step.expect : [step.expect]).map((expectation, index) => (
          <Box key={index} marginBottom={1}>
            <Text color="blue">
              • {(expectation as any).operator || 'unknown'}: 
            </Text>
            <Text color="white" marginLeft={1}>
              {(expectation as any).value !== undefined ? String((expectation as any).value) : ''}
            </Text>
            {(expectation as any).path && (
              <Text color="gray" marginLeft={1}>
                (path: {(expectation as any).path})
              </Text>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderStepDependencies = (step: any) => (
    <Box flexDirection="column" marginBottom={2}>
      <Text bold color="white" marginBottom={1}>Dependencies</Text>
      
      <Box paddingLeft={1}>
        {Array.isArray((step as any).depends_on || step.dependsOn) ? 
          ((step as any).depends_on || step.dependsOn).map((dep: string, index: number) => (
            <Text key={index} color="purple">• {dep}</Text>
          )) : 
          <Text color="purple">• {(step as any).depends_on || step.dependsOn}</Text>
        }
      </Box>
    </Box>
  );

  const renderStepDataManagement = (step: any) => {
    const hasSaveResponse = step.saveResponse && Object.keys(step.saveResponse).length > 0;
    const hasVariables = step.variables && Object.keys(step.variables).length > 0;
    
    if (!hasSaveResponse && !hasVariables) return null;

    return (
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="white" marginBottom={1}>Data Management</Text>
        
        {hasSaveResponse && (
          <Box marginBottom={1}>
            <Text bold color="cyan">Save Response: </Text>
            <Box paddingLeft={1} marginTop={1}>
              {Object.entries(step.saveResponse).map(([key, path]) => (
                <Text key={key} color="white">
                  {key} → {String(path)}
                </Text>
              ))}
            </Box>
          </Box>
        )}
        
        {hasVariables && (
          <Box>
            <Text bold color="cyan">Variables: </Text>
            <Box paddingLeft={1} marginTop={1}>
              {Object.entries(step.variables).map(([key, value]) => (
                <Text key={key} color="white">
                  {key}: {String(value)}
                </Text>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderStepExecutionResult = (stepName: string) => {
    const stepResult = state.lastResult?.stepResults?.find(sr => sr.stepName === stepName);
    if (!stepResult) return null;

    const statusColor = stepResult.success ? 'green' : 'red';
    const statusIcon = stepResult.success ? '✓' : '✗';

    return (
      <Box flexDirection="column" paddingTop={1} borderTop borderColor="gray">
        <Text bold color="white" marginBottom={1}>Execution Result</Text>
        
        <Box flexDirection="row" marginBottom={1}>
          <Text color={statusColor} bold>
            {statusIcon} {stepResult.success ? 'PASSED' : 'FAILED'}
          </Text>
          <Text color="gray" marginLeft={2}>
            ({stepResult.duration || 0}ms)
          </Text>
        </Box>
        
        {stepResult.error && (
          <Box>
            <Text bold color="red">Error: </Text>
            <Text color="red">{stepResult.error}</Text>
          </Box>
        )}
      </Box>
    );
  };

  // Consolidated into renderStepExecutionResult above
  const renderStepResult = renderStepExecutionResult;

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
          const isSelected = index === state.ui.selectedStepIndex;
          
          return (
            <Box key={stepResult.stepName || index} flexDirection="column" marginBottom={2}>
              <Text color={statusColor} bold>
                {statusIcon} {stepResult.stepName} {isSelected && '← Current'}
              </Text>
              <Box paddingLeft={2}>
                <Text color="gray">
                  Duration: {stepResult.duration || 0}ms
                </Text>
                
                {/* Error details */}
                {stepResult.error && (
                  <Box marginTop={1}>
                    <Text color="red" bold>❌ Error:</Text>
                    <Text color="red" paddingLeft={2}>{stepResult.error}</Text>
                  </Box>
                )}
                
                {/* Request details */}
                {stepResult.response && (
                  <Box marginTop={1}>
                    <Text color="cyan" bold>🌐 Response:</Text>
                    <Box paddingLeft={2}>
                      <Text color="cyan">
                        Status: <Text color={stepResult.response.status && stepResult.response.status < 400 ? 'green' : 'red'}>
                          {stepResult.response.status || 'N/A'} {stepResult.response.statusText || ''}
                        </Text>
                      </Text>
                      
                      {/* Response headers */}
                      {stepResult.response.headers && Object.keys(stepResult.response.headers).length > 0 && (
                        <Box marginTop={1}>
                          <Text color="blue">Headers:</Text>
                          <Box paddingLeft={2}>
                            {Object.entries(stepResult.response.headers).slice(0, 3).map(([key, value]) => (
                              <Text key={key} color="gray">
                                {key}: {String(value)}
                              </Text>
                            ))}
                            {Object.keys(stepResult.response.headers).length > 3 && (
                              <Text color="gray" dimColor>
                                ... {Object.keys(stepResult.response.headers).length - 3} more headers
                              </Text>
                            )}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Response body preview */}
                      {stepResult.response.body && (
                        <Box marginTop={1}>
                          <Text color="blue">Body Preview:</Text>
                          <Box paddingLeft={2}>
                            {renderResponseBodyPreview(stepResult.response.body)}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Validation results if available */}
                {(stepResult as any).validation && (
                  <Box marginTop={1}>
                    <Text color="blue" bold>
                      ✓ Validations: {(stepResult as any).validation.passed ? 'PASSED' : 'FAILED'}
                    </Text>
                    {(stepResult as any).validation.results && (
                      <Box paddingLeft={2}>
                        {(stepResult as any).validation.results.slice(0, 3).map((validation: any, vIndex: number) => (
                          <Text key={vIndex} color={validation.passed ? 'green' : 'red'}>
                            {validation.passed ? '✓' : '✗'} {validation.message || validation.operator}
                          </Text>
                        ))}
                        {(stepResult as any).validation.results.length > 3 && (
                          <Text color="gray" dimColor>
                            ... {(stepResult as any).validation.results.length - 3} more validations
                          </Text>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };
  
  const renderResponseBodyPreview = (body: any) => {
    if (!body) return <Text color="gray">Empty</Text>;
    
    if (typeof body === 'string') {
      const preview = body.length > 100 ? body.substring(0, 100) + '...' : body;
      return <Text color="white">{preview}</Text>;
    }
    
    if (typeof body === 'object') {
      try {
        const jsonString = JSON.stringify(body, null, 2);
        const lines = jsonString.split('\n').slice(0, 5);
        const preview = lines.join('\n') + (jsonString.split('\n').length > 5 ? '\n...' : '');
        return (
          <Box flexDirection="column">
            {lines.map((line, index) => (
              <Text key={index} color="white">{line}</Text>
            ))}
            {jsonString.split('\n').length > 5 && (
              <Text color="gray" dimColor>... {jsonString.split('\n').length - 5} more lines</Text>
            )}
          </Box>
        );
      } catch {
        return <Text color="gray">Invalid JSON object</Text>;
      }
    }
    
    return <Text color="white">{String(body)}</Text>;
  };
  
  const renderStepBodyPreview = (body: any) => {
    if (!body) return <Text color="gray">Empty</Text>;
    
    if (typeof body === 'string') {
      const preview = body.length > 80 ? body.substring(0, 80) + '...' : body;
      return <Text color="white">{preview}</Text>;
    }
    
    if (typeof body === 'object') {
      try {
        const jsonString = JSON.stringify(body, null, 2);
        const lines = jsonString.split('\n').slice(0, 3);
        return (
          <Box flexDirection="column">
            {lines.map((line, index) => (
              <Text key={index} color="white">{line}</Text>
            ))}
            {jsonString.split('\n').length > 3 && (
              <Text color="gray" dimColor>... {jsonString.split('\n').length - 3} more lines</Text>
            )}
          </Box>
        );
      } catch {
        return <Text color="gray">Invalid JSON object</Text>;
      }
    }
    
    return <Text color="white">{String(body)}</Text>;
  };
  
  const renderFormattedContent = (isYaml: boolean = false) => {
    let content = state.ui.editorContent;
    
    // If no editor content, try to reconstruct from current scenario
    if (!content && state.currentScenario) {
      try {
        if (isYaml) {
          // Basic YAML serialization - would need a proper YAML library for full support
          content = convertToBasicYaml(state.currentScenario);
        } else {
          content = JSON.stringify(state.currentScenario, null, 2);
        }
      } catch (error) {
        content = '// Error serializing scenario data';
      }
    }
    
    if (!content) {
      return (
        <Box justifyContent="center" paddingY={2}>
          <Text color="gray" dimColor>No content available</Text>
        </Box>
      );
    }
    
    const lines = content.split('\n');
    const maxVisibleLines = 15;
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
              <Text> {highlightSyntax(line, isYaml)}</Text>
            </Box>
          );
        })}
        
        {lines.length > scrollOffset + maxVisibleLines && (
          <Text color="gray" dimColor marginTop={1}>
            ... {lines.length - (scrollOffset + maxVisibleLines)} more lines (↓ to scroll down)
          </Text>
        )}
        
        {/* File info footer */}
        <Box marginTop={1} paddingTop={1}>
          <Text color="gray" dimColor>
            {lines.length} lines | {isYaml ? 'YAML' : 'JSON'} format
            {state.currentScenarioPath && <Text> | {state.currentScenarioPath.split('/').pop()}</Text>}
          </Text>
        </Box>
      </Box>
    );
  };

  const highlightSyntax = (line: string, isYaml: boolean = false) => {
    // Basic syntax highlighting - simplified approach for terminal
    const trimmed = line.trim();
    
    if (isYaml) {
      // YAML highlighting
      if (trimmed.startsWith('#')) {
        return <Text color="gray" dimColor>{line}</Text>;
      }
      if (trimmed.includes(': ')) {
        const [key, ...rest] = line.split(': ');
        return (
          <>
            <Text color="cyan">{key}:</Text>
            <Text> {rest.join(': ')}</Text>
          </>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <>
            <Text color="yellow">-</Text>
            <Text> {line.substring(line.indexOf('- ') + 2)}</Text>
          </>
        );
      }
    } else {
      // JSON highlighting
      if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        return <Text color="gray" dimColor>{line}</Text>;
      }
      if (trimmed.includes('": ')) {
        const parts = line.split('": ');
        return (
          <>
            <Text color="cyan">{parts[0]}":</Text>
            <Text> {parts.slice(1).join('": ')}</Text>
          </>
        );
      }
      if (trimmed.match(/^[{}[\],]/)) {
        return <Text color="yellow">{line}</Text>;
      }
    }
    
    return <Text>{line}</Text>;
  };

  const convertToBasicYaml = (obj: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);
    let result = '';
    
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (typeof item === 'object') {
            result += `${spaces}- `;
            const itemYaml = convertToBasicYaml(item, indent + 1);
            result += itemYaml.substring(itemYaml.indexOf(': ') !== -1 ? 0 : 2) + '\n';
          } else {
            result += `${spaces}- ${item}\n`;
          }
        }
      } else {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            result += `${spaces}${key}:\n`;
            result += convertToBasicYaml(value, indent + 1);
          } else {
            result += `${spaces}${key}: ${value}\n`;
          }
        }
      }
    } else {
      result = String(obj);
    }
    
    return result;
  };

  const renderLiveExecutionStatus = () => {
    if (!state.executionProgress) return null;
    
    const { currentStepIndex, totalSteps, completedSteps, passedSteps, failedSteps } = state.executionProgress;
    const currentStep = state.currentScenario?.steps?.[currentStepIndex];
    const currentRealTimeResult = state.realTimeStepResults.find(r => r.stepIndex === currentStepIndex);
    
    return (
      <Box flexDirection="column" paddingLeft={2}>
        <Text>
          <Text color="yellow">⚡ Status:</Text> Running step {currentStepIndex + 1} of {totalSteps}
        </Text>
        <Text>
          <Text color="cyan">🎯 Current:</Text> {currentStep?.name || 'Unknown step'}
        </Text>
        <Text>
          <Text color="green">✅ Completed:</Text> {completedSteps} • 
          <Text color="green">Passed:</Text> {passedSteps} • 
          <Text color="red">Failed:</Text> {failedSteps}
        </Text>
        
        {/* Current step details */}
        {currentRealTimeResult?.request && (
          <Box marginTop={1}>
            <Text color="blue">🌐 Current Request:</Text>
            <Text color="gray" paddingLeft={2}>
              {currentRealTimeResult.request.method} {currentRealTimeResult.request.url}
            </Text>
          </Box>
        )}
        
        {/* Real-time timing */}
        {currentRealTimeResult?.startTime && (
          <Text color="gray">
            ⏱️ Started: {currentRealTimeResult.startTime.toLocaleTimeString()}
            {currentRealTimeResult.status === 'running' && (
              <Text> (running for {Math.round((Date.now() - currentRealTimeResult.startTime.getTime()) / 1000)}s)</Text>
            )}
          </Text>
        )}
      </Box>
    );
  };

  const renderRealTimeExecution = () => {
    if (!state.isRunning && state.realTimeStepResults.length === 0) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%" flexDirection="column">
          <Text color="gray" bold>
            ⚡ No Live Execution
          </Text>
          <Text color="gray" dimColor marginTop={1}>
            Run a scenario to see real-time execution feedback
          </Text>
        </Box>
      );
    }
    
    return (
      <Box flexDirection="column" height="100%">
        <Text color="yellow" bold marginBottom={1}>
          ⚡ Real-Time Execution Monitor
        </Text>
        
        {/* Execution progress bar */}
        {state.executionProgress && (
          <Box flexDirection="column" marginBottom={2}>
            {renderExecutionProgressBar()}
          </Box>
        )}
        
        {/* Real-time step results */}
        <Box flexDirection="column" flexGrow={1}>
          {state.realTimeStepResults
            .sort((a, b) => a.stepIndex - b.stepIndex)
            .map((stepResult, index) => renderRealTimeStepResult(stepResult, index))}
        </Box>
        
        {/* Auto-scroll toggle */}
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Auto-scroll: {state.autoScrollToCurrentStep ? 'ON' : 'OFF'} • A to toggle
          </Text>
        </Box>
      </Box>
    );
  };
  
  const renderExecutionProgressBar = () => {
    if (!state.executionProgress) return null;
    
    const { totalSteps, completedSteps, passedSteps, failedSteps, currentStepIndex } = state.executionProgress;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
    
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="cyan">Progress:</Text> {completedSteps}/{totalSteps} steps ({progressPercentage}%)
        </Text>
        <Text>
          <Text color="green">✅ Passed:</Text> {passedSteps} • <Text color="red">❌ Failed:</Text> {failedSteps}
        </Text>
        {state.isRunning && (
          <Text>
            <Text color="yellow">⏳ Current:</Text> Step {currentStepIndex + 1} - {state.currentScenario?.steps?.[currentStepIndex]?.name || 'Unknown'}
          </Text>
        )}
        
        {/* Visual progress bar */}
        <Box marginTop={1}>
          <Text>
            {'█'.repeat(Math.floor(progressPercentage / 5))}
            {'░'.repeat(20 - Math.floor(progressPercentage / 5))}
            <Text color="cyan"> {progressPercentage}%</Text>
          </Text>
        </Box>
      </Box>
    );
  };
  
  const renderRealTimeStepResult = (stepResult: any, index: number) => {
    const isCurrentStep = state.executionProgress?.currentStepIndex === stepResult.stepIndex && state.isRunning;
    const isSelected = state.ui.selectedStepIndex === stepResult.stepIndex;
    
    let statusIcon = '⏸️';
    let statusColor = 'gray';
    let statusText = 'Pending';
    
    switch (stepResult.status) {
      case 'running':
        statusIcon = '⏳';
        statusColor = 'yellow';
        statusText = 'Running';
        break;
      case 'completed':
        statusIcon = '✅';
        statusColor = 'green';
        statusText = 'Completed';
        break;
      case 'failed':
        statusIcon = '❌';
        statusColor = 'red';
        statusText = 'Failed';
        break;
    }
    
    return (
      <Box key={stepResult.stepIndex} flexDirection="column" marginBottom={2}>
        {/* Step header */}
        <Text bold color={isSelected ? 'yellow' : statusColor}>
          {statusIcon} {stepResult.stepIndex + 1}. {stepResult.stepName}
          {isCurrentStep && <Text color="yellow"> ← Currently Running</Text>}
          {stepResult.duration && (
            <Text color="cyan"> ({stepResult.duration}ms)</Text>
          )}
        </Text>
        
        {/* Request details (for running/completed steps) */}
        {stepResult.request && (
          <Box paddingLeft={2} marginTop={1}>
            <Text color="blue" bold>📤 Request:</Text>
            <Text color="white">
              <Text color="cyan">{stepResult.request.method}</Text> {stepResult.request.url}
            </Text>
            {Object.keys(stepResult.request.headers || {}).length > 0 && (
              <Text color="gray">
                Headers: {Object.keys(stepResult.request.headers).length} defined
              </Text>
            )}
            {stepResult.request.body && (
              <Text color="gray">
                Body: {typeof stepResult.request.body === 'object' ? 'JSON' : 'Text'}
              </Text>
            )}
          </Box>
        )}
        
        {/* Response details (for completed steps) */}
        {stepResult.response && (
          <Box paddingLeft={2} marginTop={1}>
            <Text color="green" bold>📥 Response:</Text>
            <Text>
              <Text color="cyan">Status:</Text> 
              <Text color={stepResult.response.status < 400 ? 'green' : 'red'}>
                {stepResult.response.status} {stepResult.response.statusText}
              </Text>
            </Text>
            {stepResult.response.size && (
              <Text color="gray">
                Size: {stepResult.response.size} bytes
              </Text>
            )}
            
            {/* Response headers preview */}
            {stepResult.response.headers && Object.keys(stepResult.response.headers).length > 0 && (
              <Box marginTop={1}>
                <Text color="blue">Headers ({Object.keys(stepResult.response.headers).length}):</Text>
                <Box paddingLeft={2}>
                  {Object.entries(stepResult.response.headers).slice(0, 2).map(([key, value]) => (
                    <Text key={key} color="gray">
                      {key}: {String(value).substring(0, 40)}...
                    </Text>
                  ))}
                  {Object.keys(stepResult.response.headers).length > 2 && (
                    <Text color="gray" dimColor>
                      ... {Object.keys(stepResult.response.headers).length - 2} more
                    </Text>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Response body preview */}
            {stepResult.response.body && (
              <Box marginTop={1}>
                <Text color="blue">Body Preview:</Text>
                <Box paddingLeft={2}>
                  {renderResponseBodyPreview(stepResult.response.body)}
                </Box>
              </Box>
            )}
          </Box>
        )}
        
        {/* Validation results */}
        {stepResult.validationResults && stepResult.validationResults.length > 0 && (
          <Box paddingLeft={2} marginTop={1}>
            <Text color="purple" bold>
              ✓ Validations ({stepResult.validationResults.filter((v: any) => v.passed).length}/{stepResult.validationResults.length} passed):
            </Text>
            <Box paddingLeft={2}>
              {stepResult.validationResults.slice(0, 3).map((validation: any, vIndex: number) => (
                <Text key={vIndex} color={validation.passed ? 'green' : 'red'}>
                  {validation.passed ? '✓' : '✗'} {validation.message}
                </Text>
              ))}
              {stepResult.validationResults.length > 3 && (
                <Text color="gray" dimColor>
                  ... {stepResult.validationResults.length - 3} more validations
                </Text>
              )}
            </Box>
          </Box>
        )}
        
        {/* Error details */}
        {stepResult.error && (
          <Box paddingLeft={2} marginTop={1}>
            <Text color="red" bold>❌ Error:</Text>
            <Text color="red">{stepResult.error}</Text>
          </Box>
        )}
        
        {/* Timing details */}
        {stepResult.startTime && (
          <Box paddingLeft={2} marginTop={1}>
            <Text color="gray" dimColor>
              Started: {stepResult.startTime.toLocaleTimeString()}
              {stepResult.endTime && (
                <Text> • Ended: {stepResult.endTime.toLocaleTimeString()}</Text>
              )}
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  // Helper functions for enhanced steps UI
  const getEnhancedStepStatus = (result?: any, isCurrent?: boolean): { icon: string; color: string } => {
    if (isCurrent) {
      return { icon: '⏳', color: 'yellow' };
    }
    
    if (!result) {
      return { icon: '⚪', color: 'gray' };
    }
    
    return result.success 
      ? { icon: '✅', color: 'green' }
      : { icon: '❌', color: 'red' };
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

  const getTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      api: 'blue',
      ui: 'green',
      validation: 'yellow',
      setup: 'cyan',
      teardown: 'magenta'
    };
    return colorMap[type] || 'white';
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const truncateUrl = (url: string): string => {
    if (url.length <= 40) return url;
    
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname.substring(0, 20)}...`;
    } catch {
      return truncateText(url, 40);
    }
  };

  const groupStepsByType = (steps: any[]) => {
    return steps.reduce((acc, step) => {
      const type = step.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(step);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const renderSelectedStepDetails = (step: any, result?: any) => {
    return (
      <Box flexDirection="column">
        {/* API details */}
        {step.type === 'api' && (
          <Box flexDirection="column">
            {step.headers && Object.keys(step.headers).length > 0 && (
              <Text color="blue">📜 {Object.keys(step.headers).length} headers</Text>
            )}
            {step.body && (
              <Text color="blue">📦 Body: {typeof step.body === 'object' ? 'JSON' : 'Text'}</Text>
            )}
            {step.auth && (
              <Text color="magenta">🔐 Auth: {step.auth.type}</Text>
            )}
          </Box>
        )}
        
        {/* UI details */}
        {step.type === 'ui' && (
          <Box flexDirection="column">
            {step.value && (
              <Text color="green">📝 Value: {truncateText(String(step.value), 30)}</Text>
            )}
            {step.wait && (
              <Text color="yellow">⏰ Wait: {step.wait.type}</Text>
            )}
          </Box>
        )}
        
        {/* Expectations */}
        {step.expect && (
          <Text color="yellow">✅ {Array.isArray(step.expect) ? step.expect.length : 1} expectations</Text>
        )}
        
        {/* Configuration */}
        <Box>
          {step.timeout && (
            <Text color="orange" marginRight={2}>⏱️ {step.timeout}ms</Text>
          )}
          {step.retries && (
            <Text color="orange" marginRight={2}>🔄 {step.retries}x</Text>
          )}
        </Box>
        
        {/* Result summary */}
        {result && (
          <Box marginTop={1} paddingTop={1} borderTop borderColor="gray">
            <Text color={result.success ? 'green' : 'red'} bold>
              {result.success ? '✅ Passed' : '❌ Failed'}
              {result.duration && <Text color="gray"> ({result.duration}ms)</Text>}
            </Text>
            {result.error && (
              <Text color="red" dimColor>
                {truncateText(result.error.toString(), 60)}
              </Text>
            )}
            {result.response && (
              <Text color="cyan" dimColor>
                {result.response.status} {result.response.statusText}
              </Text>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const { title, color, indicator } = getPanelTitle();
  
  return (
    <Box flexDirection="column" height="100%">
      {/* Professional Header */}
      <Box paddingX={1} paddingY={0} height={state.currentScenario ? 3 : 2} 
           borderBottom borderColor={state.ui.activePane === 'details' ? 'cyan' : 'gray'}>
        <Box flexDirection="row">
          <Text color={color} bold>{title}</Text>
          {indicator && <Text color="yellow">{indicator}</Text>}
          {state.ui.activePane === 'details' && (
            <Text color="cyan" marginLeft={2}>[ACTIVE]</Text>
          )}
        </Box>
        {state.currentScenario && renderViewModeSelector()}
      </Box>

      {/* Content Area */}
      <Box flexGrow={1} paddingX={1} overflow="hidden">
        {renderContent()}
      </Box>

      {/* Professional Footer */}
      <Box paddingX={1} height={2} borderTop borderColor="gray">
        <Text color="gray" dimColor>
          {state.ui.activePane === 'details' ? 
            'ACTIVE: ↑↓ Scroll | ←→ Views | 1-5 Quick Switch | Enter Run | Tab Switch Pane' : 
            'Tab Activate | 1-5 Quick Views | R Run | Enter Select'
          }
        </Text>
      </Box>
    </Box>
  );
};