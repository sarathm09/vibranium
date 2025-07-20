/**
 * Quick environment switcher component
 * Simple overlay for fast environment switching
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../state/app-context';

export interface EnvironmentSwitcherProps {
  isVisible: boolean;
  onClose: () => void;
}

export const EnvironmentSwitcher: React.FC<EnvironmentSwitcherProps> = ({ isVisible, onClose }) => {
  const { state, actions } = useAppContext();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    return state.environments.findIndex(env => env.name === state.currentEnvironment);
  });

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
      const selectedEnv = state.environments[selectedIndex];
      if (selectedEnv && selectedEnv.name !== state.currentEnvironment) {
        actions.switchEnvironment(selectedEnv.name);
        actions.setStatus(`Switched to environment: ${selectedEnv.name}`, 'success');
      }
      onClose();
    } else if (input >= '1' && input <= '9') {
      const index = parseInt(input) - 1;
      if (index >= 0 && index < state.environments.length) {
        const selectedEnv = state.environments[index];
        if (selectedEnv.name !== state.currentEnvironment) {
          actions.switchEnvironment(selectedEnv.name);
          actions.setStatus(`Quick switched to: ${selectedEnv.name}`, 'success');
        }
        onClose();
      }
    }
  });

  if (!isVisible || state.environments.length === 0) return null;

  return (
    <Box 
      position="absolute" 
      top={3} 
      right={2} 
      width={40} 
      borderStyle="single" 
      borderColor="cyan"
      backgroundColor="black"
      padding={1}
      flexDirection="column"
    >
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color="cyan">Switch Environment</Text>
        <Text color="gray">ESC to cancel</Text>
      </Box>

      {/* Environment list */}
      <Box flexDirection="column">
        {state.environments.map((env, index) => {
          const isCurrent = env.name === state.currentEnvironment;
          const isSelected = index === selectedIndex;
          
          return (
            <Box key={env.name}>
              <Text color={isCurrent ? 'green' : isSelected ? 'cyan' : 'white'}>
                {isSelected ? '▶' : ' '} {index + 1}. {env.name}
                {isCurrent && <Text color="green" dimColor> (current)</Text>}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Help */}
      <Box marginTop={1}>
        <Text color="gray">
          ↑↓: Navigate • Enter: Switch • 1-{Math.min(9, state.environments.length)}: Quick select
        </Text>
      </Box>
    </Box>
  );
};

export default EnvironmentSwitcher;