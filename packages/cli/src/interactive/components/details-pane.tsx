/**
 * Details pane component with YAML/JSON editor and scenario information
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../state/app-context';
import chalk from 'chalk';

export const DetailsPane: React.FC = () => {
  const { state, actions } = useAppContext();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'overview' | 'steps' | 'raw' | 'execution'>('overview');
  
  // Reset scroll when scenario changes
  useEffect(() => {
    setScrollOffset(0);
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
      default:
        return renderOverview();
    }
  };
  
  const renderViewModeSelector = () => {
    const modes = [
      { key: 'overview', label: '📋 Overview' }, 
      { key: 'steps', label: '🔢 Steps' },
      { key: 'raw', label: '📜 Raw' }, 
      { key: 'execution', label: '🏃 Execution' }
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
            <Text color="cyan">🏷️ Name:</Text> {state.currentScenario.name}
          </Text>
          {state.currentScenario.description && (
            <Text marginTop={1}>
              <Text color="cyan">📋 Description:</Text> {state.currentScenario.description}
            </Text>
          )}
          {state.currentScenario.version && (
            <Text marginTop={1}>
              <Text color="cyan">🔖 Version:</Text> {state.currentScenario.version}
            </Text>
          )}
          <Text marginTop={1}>
            <Text color="cyan">🔢 Steps:</Text> {state.currentScenario.steps?.length || 0}
          </Text>
          {state.currentScenario.environments && (
            <Text marginTop={1}>
              <Text color="cyan">🌍 Environments:</Text> {Array.isArray(state.currentScenario.environments) ? state.currentScenario.environments.join(', ') : Object.keys(state.currentScenario.environments).join(', ')}
            </Text>
          )}
          {renderGlobalVariables()}
          {renderGlobalConfiguration()}
        </Box>

        {/* Steps overview */}
        {state.currentScenario.steps && state.currentScenario.steps.length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Text color="yellow" bold>
              🎯 Steps Overview
            </Text>
            {renderStepsOverview()}
          </Box>
        )}

        {/* Current step details */}
        {state.currentScenario.steps && state.currentScenario.steps.length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Text color="yellow" bold>
              🎯 Current Step ({state.ui.selectedStepIndex + 1}/{state.currentScenario.steps.length})
            </Text>
            {renderCurrentStepDetails()}
          </Box>
        )}
        
        {/* Execution summary */}
        {state.lastResult && (
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
    const variables = state.currentScenario?.variables || (state.currentScenario as any)?.config?.variables;
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
        {state.currentScenario.steps.slice(0, 3).map((step, index) => {
          const isSelected = index === state.ui.selectedStepIndex;
          const statusIcon = state.lastResult?.stepResults?.[index]?.success === true ? '✓' : 
                           state.lastResult?.stepResults?.[index]?.success === false ? '✗' : '○';
          const statusColor = state.lastResult?.stepResults?.[index]?.success === true ? 'green' : 
                             state.lastResult?.stepResults?.[index]?.success === false ? 'red' : 'gray';
          
          return (
            <Text key={index} color={isSelected ? 'yellow' : 'white'} bold={isSelected}>
              <Text color={statusColor}>{statusIcon}</Text> {index + 1}. {step.name} 
              <Text color="gray"> ({step.type})</Text>
            </Text>
          );
        })}
        {state.currentScenario.steps.length > 3 && (
          <Text color="gray" dimColor>
            ... and {state.currentScenario.steps.length - 3} more steps
          </Text>
        )}
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
    
    return (
      <Box flexDirection="column" height="100%">
        <Text color="yellow" bold marginBottom={1}>
          🔢 All Steps ({state.currentScenario.steps.length})
        </Text>
        <Box flexDirection="column">
          {state.currentScenario.steps.map((step, index) => {
            const isSelected = index === state.ui.selectedStepIndex;
            const stepResult = state.lastResult?.stepResults?.[index];
            const statusIcon = stepResult?.success === true ? '✓' : 
                              stepResult?.success === false ? '✗' : '○';
            const statusColor = stepResult?.success === true ? 'green' : 
                               stepResult?.success === false ? 'red' : 'gray';
            
            return (
              <Box key={index} flexDirection="column" marginBottom={1}>
                <Text color={isSelected ? 'yellow' : 'white'} bold={isSelected}>
                  <Text color={statusColor}>{statusIcon}</Text> {index + 1}. {step.name}
                </Text>
                <Box paddingLeft={3}>
                  <Text color="gray">
                    Type: {step.type}
                    {step.type === 'api' && (
                      <Text> | Method: {(step as any).method || 'GET'} | URL: {(step as any).url?.substring(0, 40)}...</Text>
                    )}
                  </Text>
                  {step.expect && (
                    <Text color="blue">
                      Expects: {Array.isArray(step.expect) ? step.expect.length : 1} validation(s)
                    </Text>
                  )}
                  {stepResult && (
                    <Text color={stepResult.success ? 'green' : 'red'}>
                      {stepResult.success ? 'PASSED' : 'FAILED'} 
                      {stepResult.duration && <Text> ({stepResult.duration}ms)</Text>}
                    </Text>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
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
            {(currentStep as any).headers && (
              <Box marginTop={1}>
                <Text color="green">📜 Headers:</Text>
                <Box paddingLeft={2}>
                  {Object.entries((currentStep as any).headers).slice(0, 3).map(([key, value]) => (
                    <Text key={key} color="gray">
                      {key}: {String(value)}
                    </Text>
                  ))}
                  {Object.keys((currentStep as any).headers).length > 3 && (
                    <Text color="gray" dimColor>... and {Object.keys((currentStep as any).headers).length - 3} more</Text>
                  )}
                </Box>
              </Box>
            )}
            {(currentStep as any).body && (
              <Text>
                <Text color="green">📦 Body:</Text> {typeof (currentStep as any).body === 'object' ? 'JSON object' : 'defined'}
              </Text>
            )}
            {(currentStep as any).params && (
              <Text>
                <Text color="green">🔍 Params:</Text> {Object.keys((currentStep as any).params).length} defined
              </Text>
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
        {currentStep.timeout && (
          <Text>
            <Text color="green">⏱️ Timeout:</Text> {currentStep.timeout}ms
          </Text>
        )}
        {currentStep.retries && (
          <Text>
            <Text color="green">🔄 Retries:</Text> {currentStep.retries}
          </Text>
        )}
        {currentStep.skip && (
          <Text>
            <Text color="yellow">⏭️ Skip:</Text> {typeof currentStep.skip === 'boolean' ? 'conditional' : currentStep.skip}
          </Text>
        )}
        
        {/* Expectations */}
        {currentStep.expect && (
          <Box marginTop={1}>
            <Text color="green">✓ Expectations ({Array.isArray(currentStep.expect) ? currentStep.expect.length : 1}):</Text>
            <Box paddingLeft={2}>
              {(Array.isArray(currentStep.expect) ? currentStep.expect : [currentStep.expect]).slice(0, 3).map((expectation, index) => (
                <Text key={index} color="blue" dimColor>
                  {(expectation as any).operator || (expectation as any).field}: {(expectation as any).value || (expectation as any).path}
                </Text>
              ))}
              {Array.isArray(currentStep.expect) && currentStep.expect.length > 3 && (
                <Text color="gray" dimColor>... and {currentStep.expect.length - 3} more</Text>
              )}
            </Box>
          </Box>
        )}
        
        {/* Dependencies */}
        {currentStep.dependsOn && (
          <Text>
            <Text color="green">🔗 Dependencies:</Text> {Array.isArray(currentStep.dependsOn) ? currentStep.dependsOn.length : 1} defined
          </Text>
        )}
        
        {/* Variables used */}
        {(currentStep as any).variables && (
          <Text>
            <Text color="green">🔢 Variables:</Text> {Object.keys((currentStep as any).variables).length} defined
          </Text>
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
            '🎯 1-3 Mode • ↑↓ Scroll • R Run' : 
            'Tab • R Run'
          }
        </Text>
      </Box>
    </Box>
  );
};