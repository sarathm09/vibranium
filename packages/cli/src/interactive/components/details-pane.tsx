/**
 * Details pane component with YAML/JSON editor and scenario information
 */

import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import chalk from 'chalk';

export const DetailsPane: React.FC = () => {
  const { state, actions } = useAppContext();
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
      case 'steps':
        return renderStepsView();
      case 'raw':
        return renderRawContent();
      case 'execution':
        return renderExecutionDetails();
      case 'realtime':
        return renderExecutionDetails(); // Real-time view uses execution details for now
      default:
        return renderOverview();
    }
  };
  
  const renderViewModeSelector = () => {
    const modes = [
      { key: 'overview', label: '📋 Overview' }, 
      { key: 'steps', label: '🔢 Steps' },
      { key: 'raw', label: '📜 Raw' }, 
      { key: 'execution', label: '🏃 Results' },
      { key: 'realtime', label: '⚡ Live' }
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
  
  const renderOverview = () => {
    return (
      <Box flexDirection="column" height="100%">
        {/* Scenario metadata */}
        <Box flexDirection="column" marginBottom={2}>
          <Text bold>
            <Text color="cyan">🏷️ Name:</Text> {state.currentScenario?.name}
          </Text>
          {state.currentScenario?.description && (
            <Text marginTop={1}>
              <Text color="cyan">📋 Description:</Text> {state.currentScenario.description}
            </Text>
          )}
          {(state.currentScenario as any)?.version && (
            <Text marginTop={1}>
              <Text color="cyan">🔖 Version:</Text> {(state.currentScenario as any).version}
            </Text>
          )}
          <Text marginTop={1}>
            <Text color="cyan">🔢 Steps:</Text> {state.currentScenario?.steps?.length || 0}
          </Text>
          {state.currentScenario?.environments && (
            <Text marginTop={1}>
              <Text color="cyan">🌍 Environments:</Text> {Array.isArray(state.currentScenario.environments) ? state.currentScenario.environments.join(', ') : Object.keys(state.currentScenario.environments).join(', ')}
            </Text>
          )}
          {renderGlobalVariables()}
          {renderGlobalConfiguration()}
        </Box>

        {/* Steps overview */}
        {state.currentScenario?.steps && state.currentScenario.steps.length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Text color="yellow" bold>
              🎯 Steps Overview
            </Text>
            {renderStepsOverview()}
          </Box>
        )}

        {/* Current step details */}
        {state.currentScenario?.steps && state.currentScenario.steps.length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Text color="yellow" bold>
              🎯 Current Step ({state.ui.selectedStepIndex + 1}/{state.currentScenario.steps.length})
            </Text>
            {renderCurrentStepDetails()}
          </Box>
        )}
        
        {/* Real-time execution status */}
        {state.isRunning && state.executionProgress && (
          <Box flexDirection="column" marginBottom={2}>
            <Text color="yellow" bold>
              ⚡ Live Execution Status
            </Text>
            {renderLiveExecutionStatus()}
          </Box>
        )}
        
        {/* Execution summary */}
        {state.lastResult && !state.isRunning && (
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
    const isYaml = state.currentScenarioPath?.endsWith('.yaml') || state.currentScenarioPath?.endsWith('.yml');
    const fileType = isYaml ? 'YAML' : 'JSON';
    
    return (
      <Box flexDirection="column" height="100%">
        <Text color="yellow" bold marginBottom={1}>
          📜 Raw {fileType} {state.ui.editorChanged ? '(• Modified)' : '(Read-only)'}
        </Text>
        {renderFormattedContent(isYaml)}
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

  const renderGlobalVariables = () => {
    const variables = (state.currentScenario as any)?.variables || (state.currentScenario as any)?.config?.variables;
    if (!variables || Object.keys(variables).length === 0) return null;
    
    return (
      <Text marginTop={1}>
        <Text color="cyan">🔢 Variables:</Text> {Object.keys(variables).length} defined
      </Text>
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
      <Text marginTop={1}>
        <Text color="cyan">⚙️ Config:</Text> {configItems.join(', ')}
      </Text>
    );
  };

  const renderStepsOverview = () => {
    if (!state.currentScenario?.steps) return null;
    
    return (
      <Box flexDirection="column" paddingLeft={2}>
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
                statusIcon = '⏳';
                statusColor = 'yellow';
                break;
              case 'completed':
                statusIcon = '✅';
                statusColor = 'green';
                break;
              case 'failed':
                statusIcon = '❌';
                statusColor = 'red';
                break;
              default:
                statusIcon = '⏸️';
                statusColor = 'gray';
            }
          } else if (state.lastResult?.stepResults?.[index]) {
            statusIcon = state.lastResult.stepResults[index].success ? '✓' : '✗';
            statusColor = state.lastResult.stepResults[index].success ? 'green' : 'red';
          }
          
          return (
            <Text key={index} color={isSelected ? 'yellow' : 'white'} bold={isSelected || isCurrent}>
              <Text color={statusColor}>{statusIcon}</Text> {index + 1}. {step.name} 
              <Text color="gray"> ({step.type})</Text>
              {isCurrent && <Text color="yellow"> ← Running</Text>}
              {realTimeResult?.duration && (
                <Text color="cyan"> ({realTimeResult.duration}ms)</Text>
              )}
            </Text>
          );
        })}
      </Box>
    );
  };

  const renderStepsView = () => {
    if (!state.currentScenario?.steps) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%">
          <Text color="gray">No steps available</Text>
        </Box>
      );
    }
    
    const maxVisibleSteps = 8; // Adjust based on available space
    const visibleSteps = state.currentScenario?.steps?.slice(scrollOffset, scrollOffset + maxVisibleSteps) || [];
    
    return (
      <Box flexDirection="column" height="100%">
        <Text color="yellow" bold marginBottom={1}>
          🔢 All Steps ({state.currentScenario?.steps?.length || 0})
        </Text>
        
        {/* Scroll indicator */}
        {scrollOffset > 0 && (
          <Text color="gray" dimColor marginBottom={1}>
            ↑ {scrollOffset} steps above (press ↑ to scroll up)
          </Text>
        )}
        
        <Box flexDirection="column">
          {visibleSteps.map((step, visibleIndex) => {
            const actualIndex = scrollOffset + visibleIndex;
            const isSelected = actualIndex === state.ui.selectedStepIndex;
            const stepResult = state.lastResult?.stepResults?.[actualIndex];
            const statusIcon = stepResult?.success === true ? '✓' : 
                              stepResult?.success === false ? '✗' : '○';
            const statusColor = stepResult?.success === true ? 'green' : 
                               stepResult?.success === false ? 'red' : 'gray';
            
            return (
              <Box key={actualIndex} flexDirection="column" marginBottom={2} paddingX={1} borderStyle="single" borderColor={isSelected ? 'yellow' : 'gray'}>
                {/* Step Header */}
                <Text color={isSelected ? 'yellow' : 'white'} bold={isSelected}>
                  <Text color={statusColor}>{statusIcon}</Text> {actualIndex + 1}. {step.name}
                </Text>
                
                {/* Step Details */}
                <Box paddingLeft={2} flexDirection="column">
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
          <Text color="gray" dimColor marginTop={1}>
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
        {currentStep.description && (
          <Text>
            <Text color="green">📝 Description:</Text> {currentStep.description}
          </Text>
        )}
        
        {/* API-specific details */}
        {currentStep.type === 'api' && (
          <>
            <Text>
              <Text color="green">🌐 Method:</Text> {(currentStep as any).method || 'GET'}
            </Text>
            <Text>
              <Text color="green">🔗 URL:</Text> {(currentStep as any).url || 'Not specified'}
            </Text>
            {(currentStep as any).headers && Object.keys((currentStep as any).headers).length > 0 && (
              <Box marginTop={1}>
                <Text color="green">📜 Headers ({Object.keys((currentStep as any).headers).length}):</Text>
                <Box paddingLeft={2}>
                  {Object.entries((currentStep as any).headers).map(([key, value]) => (
                    <Text key={key} color="gray">
                      {key}: {String(value)}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
            {(currentStep as any).body && (
              <Box marginTop={1}>
                <Text color="green">📦 Body:</Text>
                <Box paddingLeft={2}>
                  {renderStepBodyPreview((currentStep as any).body)}
                </Box>
              </Box>
            )}
            {(currentStep as any).params && Object.keys((currentStep as any).params).length > 0 && (
              <Box marginTop={1}>
                <Text color="green">🔍 Params ({Object.keys((currentStep as any).params).length}):</Text>
                <Box paddingLeft={2}>
                  {Object.entries((currentStep as any).params).map(([key, value]) => (
                    <Text key={key} color="gray">
                      {key}: {String(value)}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
            {(currentStep as any).auth && (
              <Text>
                <Text color="green">🔐 Auth:</Text> {(currentStep as any).auth.type || 'configured'}
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
              <Text color="green">🎯 Target:</Text> {(currentStep as any).target || (currentStep as any).selector || 'Not specified'}
            </Text>
            {(currentStep as any).value && (
              <Text>
                <Text color="green">📝 Value:</Text> {String((currentStep as any).value)}
              </Text>
            )}
            {(currentStep as any).wait && (
              <Text>
                <Text color="green">⏰ Wait:</Text> {(currentStep as any).wait.type || 'configured'}
              </Text>
            )}
          </>
        )}
        
        {/* Common step properties */}
        <Box flexDirection="row" marginTop={1}>
          {currentStep.timeout && (
            <Text color="orange" marginRight={2}>
              <Text color="green">⏱️ Timeout:</Text> {currentStep.timeout}ms
            </Text>
          )}
          {currentStep.retries && (
            <Text color="orange" marginRight={2}>
              <Text color="green">🔄 Retries:</Text> {currentStep.retries}
            </Text>
          )}
          {(currentStep as any).continueOnFailure && (
            <Text color="orange" marginRight={2}>
              <Text color="green">⚠️ Continue on failure</Text>
            </Text>
          )}
        </Box>
        {currentStep.skip && (
          <Text marginTop={1}>
            <Text color="yellow">⏭️ Skip:</Text> {typeof currentStep.skip === 'boolean' ? 'conditional' : currentStep.skip}
          </Text>
        )}
        {(currentStep as any).condition && (
          <Text marginTop={1}>
            <Text color="yellow">🔀 Condition:</Text> {(currentStep as any).condition}
          </Text>
        )}
        {(currentStep as any).iterations && (
          <Text marginTop={1}>
            <Text color="green">🔁 Iterations:</Text> {(currentStep as any).iterations}
          </Text>
        )}
        
        {/* Expectations */}
        {currentStep.expect && (
          <Box marginTop={1}>
            <Text color="green">✓ Expectations ({Array.isArray(currentStep.expect) ? currentStep.expect.length : 1}):</Text>
            <Box paddingLeft={2}>
              {(Array.isArray(currentStep.expect) ? currentStep.expect : [currentStep.expect]).map((expectation, index) => (
                <Text key={index} color="blue">
                  • {(expectation as any).operator || 'unknown'}: {(expectation as any).value !== undefined ? String((expectation as any).value) : ''}
                  {(expectation as any).path && <Text color="gray"> (path: {(expectation as any).path})</Text>}
                </Text>
              ))}
            </Box>
          </Box>
        )}
        
        {/* Dependencies */}
        {((currentStep as any).depends_on || currentStep.dependsOn) && (
          <Box marginTop={1}>
            <Text color="green">🔗 Dependencies:</Text>
            <Box paddingLeft={2}>
              {Array.isArray((currentStep as any).depends_on || currentStep.dependsOn) ? 
                ((currentStep as any).depends_on || currentStep.dependsOn).map((dep: string, index: number) => (
                  <Text key={index} color="purple">• {dep}</Text>
                )) : 
                <Text color="purple">• {(currentStep as any).depends_on || currentStep.dependsOn}</Text>
              }
            </Box>
          </Box>
        )}
        
        {/* Save Response */}
        {(currentStep as any).saveResponse && Object.keys((currentStep as any).saveResponse).length > 0 && (
          <Box marginTop={1}>
            <Text color="green">💾 Save Response:</Text>
            <Box paddingLeft={2}>
              {Object.entries((currentStep as any).saveResponse).map(([key, path]) => (
                <Text key={key} color="cyan">
                  {key}: {String(path)}
                </Text>
              ))}
            </Box>
          </Box>
        )}
        
        {/* Variables used */}
        {(currentStep as any).variables && Object.keys((currentStep as any).variables).length > 0 && (
          <Box marginTop={1}>
            <Text color="green">🔢 Variables:</Text>
            <Box paddingLeft={2}>
              {Object.entries((currentStep as any).variables).map(([key, value]) => (
                <Text key={key} color="cyan">
                  {key}: {String(value)}
                </Text>
              ))}
            </Box>
          </Box>
        )}
        
        {/* Metadata */}
        {currentStep.metadata && Object.keys(currentStep.metadata).length > 0 && (
          <Text>
            <Text color="green">📋 Metadata:</Text> {Object.keys(currentStep.metadata).length} entries
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
            '🎯 ACTIVE: ↑↓ Scroll • ←→ Views • 1-5 Quick Views • Enter Run • Tab Switch' : 
            'Tab: Activate • 1-5: Quick Views • R: Run'
          }
        </Text>
      </Box>
    </Box>
  );
};