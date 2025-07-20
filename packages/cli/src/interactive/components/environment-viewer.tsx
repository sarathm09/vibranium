/**
 * Environment viewer and management component
 * Shows current environment, allows switching, and displays environment details
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../state/app-context';
import chalk from 'chalk';

export interface EnvironmentViewerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const EnvironmentViewer: React.FC<EnvironmentViewerProps> = ({ isVisible, onClose }) => {
  const { state, actions } = useAppContext();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    return state.environments.findIndex(env => env.name === state.currentEnvironment);
  });
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'compare'>('list');
  const [compareEnvironment, setCompareEnvironment] = useState<string | null>(null);

  useInput((input, key) => {
    if (!isVisible) return;

    if (key.escape || input.toLowerCase() === 'q') {
      onClose();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(state.environments.length - 1, prev + 1));
    } else if (key.return) {
      if (viewMode === 'list') {
        const selectedEnv = state.environments[selectedIndex];
        if (selectedEnv) {
          actions.switchEnvironment(selectedEnv.name);
          actions.setStatus(`Switched to environment: ${selectedEnv.name}`, 'success');
          onClose();
        }
      } else if (viewMode === 'compare') {
        const selectedEnv = state.environments[selectedIndex];
        if (selectedEnv && selectedEnv.name !== state.currentEnvironment) {
          setCompareEnvironment(selectedEnv.name);
        }
      }
    } else if (input === 'v' || input === 'V') {
      setViewMode(prev => {
        const modes: Array<'list' | 'details' | 'compare'> = ['list', 'details', 'compare'];
        const currentIndex = modes.indexOf(prev);
        return modes[(currentIndex + 1) % modes.length];
      });
    } else if (input === 'c' || input === 'C') {
      setViewMode('compare');
      if (compareEnvironment === null) {
        const nonCurrentEnvs = state.environments.filter(e => e.name !== state.currentEnvironment);
        if (nonCurrentEnvs.length > 0) {
          setCompareEnvironment(nonCurrentEnvs[0].name);
        }
      }
    } else if (input >= '1' && input <= '9') {
      const index = parseInt(input) - 1;
      if (index >= 0 && index < state.environments.length) {
        const selectedEnv = state.environments[index];
        actions.switchEnvironment(selectedEnv.name);
        actions.setStatus(`Quick switched to: ${selectedEnv.name}`, 'success');
        onClose();
      }
    }
  });

  if (!isVisible) return null;

  const currentEnv = state.environments.find(env => env.name === state.currentEnvironment);
  const selectedEnv = state.environments[selectedIndex];
  const compareEnv = compareEnvironment ? state.environments.find(env => env.name === compareEnvironment) : null;

  const renderEnvironmentItem = (env: any, index: number, isCurrent: boolean, isSelected: boolean) => {
    const prefix = isCurrent ? '●' : isSelected ? '▶' : ' ';
    const color = isCurrent ? 'green' : isSelected ? 'cyan' : 'white';
    
    return (
      <Box key={env.name}>
        <Text color={color}>
          {prefix} {index + 1}. {env.name}
          {isCurrent && <Text color="green" dimColor> (current)</Text>}
          {env.metadata?.type && <Text color="gray" dimColor> ({env.metadata.type})</Text>}
        </Text>
      </Box>
    );
  };

  const renderEnvironmentDetails = (env: any, title: string) => {
    if (!env) return null;

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">{title}</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text><Text color="yellow">Name:</Text> {env.name}</Text>
          {env.description && <Text><Text color="yellow">Description:</Text> {env.description}</Text>}
          {env.baseUrl && <Text><Text color="yellow">Base URL:</Text> {env.baseUrl}</Text>}
          {env.timeout && <Text><Text color="yellow">Timeout:</Text> {env.timeout}ms</Text>}
          
          {env.variables && Object.keys(env.variables).length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text color="yellow">Variables:</Text>
              {Object.entries(env.variables).slice(0, 5).map(([key, value]) => (
                <Text key={key} marginLeft={2}>
                  <Text color="blue">{key}:</Text> {String(value).slice(0, 50)}
                  {String(value).length > 50 && <Text color="gray">...</Text>}
                </Text>
              ))}
              {Object.keys(env.variables).length > 5 && (
                <Text color="gray" marginLeft={2}>... and {Object.keys(env.variables).length - 5} more</Text>
              )}
            </Box>
          )}
          
          {env.secrets && Object.keys(env.secrets).length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text color="yellow">Secrets:</Text>
              {Object.keys(env.secrets).map(key => (
                <Text key={key} marginLeft={2}>
                  <Text color="blue">{key}:</Text> <Text color="gray">***</Text>
                </Text>
              ))}
            </Box>
          )}

          {env.metadata && (
            <Box flexDirection="column" marginTop={1}>
              <Text color="yellow">Metadata:</Text>
              {env.metadata.type && <Text marginLeft={2}><Text color="blue">Type:</Text> {env.metadata.type}</Text>}
              {env.metadata.version && <Text marginLeft={2}><Text color="blue">Version:</Text> {env.metadata.version}</Text>}
              {env.metadata.owner && <Text marginLeft={2}><Text color="blue">Owner:</Text> {env.metadata.owner}</Text>}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderComparison = () => {
    if (!currentEnv || !compareEnv) return null;

    const currentVars = currentEnv.variables || {};
    const compareVars = compareEnv.variables || {};
    const allKeys = new Set([...Object.keys(currentVars), ...Object.keys(compareVars)]);

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Environment Comparison</Text>
        <Box marginTop={1}>
          <Box width="50%" flexDirection="column">
            <Text bold color="green">{currentEnv.name} (current)</Text>
            <Text><Text color="yellow">Base URL:</Text> {currentEnv.baseUrl || 'N/A'}</Text>
            <Text color="yellow" marginTop={1}>Variables:</Text>
            {Array.from(allKeys).slice(0, 8).map(key => {
              const value = currentVars[key];
              const hasValue = value !== undefined;
              const isDifferent = currentVars[key] !== compareVars[key];
              
              return (
                <Text key={key} marginLeft={2}>
                  <Text color={isDifferent ? 'red' : 'blue'}>{key}:</Text>
                  <Text color={hasValue ? (isDifferent ? 'red' : 'white') : 'gray'}>
                    {hasValue ? ` ${String(value).slice(0, 30)}` : ' (not set)'}
                  </Text>
                  {String(value || '').length > 30 && <Text color="gray">...</Text>}
                </Text>
              );
            })}
          </Box>
          
          <Box width="50%" flexDirection="column" marginLeft={2}>
            <Text bold color="cyan">{compareEnv.name}</Text>
            <Text><Text color="yellow">Base URL:</Text> {compareEnv.baseUrl || 'N/A'}</Text>
            <Text color="yellow" marginTop={1}>Variables:</Text>
            {Array.from(allKeys).slice(0, 8).map(key => {
              const value = compareVars[key];
              const hasValue = value !== undefined;
              const isDifferent = currentVars[key] !== compareVars[key];
              
              return (
                <Text key={key} marginLeft={2}>
                  <Text color={isDifferent ? 'red' : 'blue'}>{key}:</Text>
                  <Text color={hasValue ? (isDifferent ? 'red' : 'white') : 'gray'}>
                    {hasValue ? ` ${String(value).slice(0, 30)}` : ' (not set)'}
                  </Text>
                  {String(value || '').length > 30 && <Text color="gray">...</Text>}
                </Text>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box 
      position="absolute" 
      top={1} 
      left={2} 
      width={80} 
      height={20}
      borderStyle="double" 
      borderColor="blue"
      backgroundColor="black"
      padding={1}
      flexDirection="column"
    >
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color="cyan">Environment Manager</Text>
        <Text color="gray">Mode: {viewMode} | ESC to close</Text>
      </Box>

      {/* Mode selection help */}
      <Box marginBottom={1}>
        <Text color="gray">
          V: View mode • C: Compare • 1-9: Quick switch • ↑↓: Navigate • Enter: Select
        </Text>
      </Box>

      {viewMode === 'list' && (
        <Box flexDirection="column">
          <Text bold color="yellow">Available Environments ({state.environments.length}):</Text>
          {state.environments.map((env, index) => 
            renderEnvironmentItem(
              env, 
              index, 
              env.name === state.currentEnvironment,
              index === selectedIndex
            )
          )}
        </Box>
      )}

      {viewMode === 'details' && selectedEnv && (
        <Box flexDirection="column">
          {renderEnvironmentDetails(selectedEnv, `Environment Details: ${selectedEnv.name}`)}
        </Box>
      )}

      {viewMode === 'compare' && (
        <Box flexDirection="column">
          {renderComparison()}
          {compareEnv && (
            <Box marginTop={1}>
              <Text color="gray">
                Showing differences between {currentEnv?.name} and {compareEnv.name}
                • Red: Different values • Gray: Not set
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} justifyContent="space-between">
        <Text color="green">Current: {state.currentEnvironment}</Text>
        <Text color="gray">{state.environments.length} environments available</Text>
      </Box>
    </Box>
  );
};

export default EnvironmentViewer;