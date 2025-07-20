/**
 * Step Navigator - Enhanced navigation, search, and filtering for steps
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../state/app-context';
import type { Step } from '@vibraniumjs/types';

export interface StepNavigatorProps {
  onStepSelect?: (stepIndex: number) => void;
  onClose?: () => void;
}

export const StepNavigator: React.FC<StepNavigatorProps> = ({ 
  onStepSelect, 
  onClose 
}) => {
  const { state } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const steps = state.currentScenario?.steps || [];
  const filteredSteps = getFilteredSteps(steps, searchQuery, filterType);

  // Keyboard navigation
  useInput((input, key) => {
    if (isSearchMode) {
      if (key.return) {
        setIsSearchMode(false);
        if (filteredSteps.length > 0) {
          const originalIndex = steps.findIndex(s => s === filteredSteps[selectedIndex]);
          onStepSelect?.(originalIndex);
        }
      } else if (key.escape) {
        setIsSearchMode(false);
        setSearchQuery('');
      } else if (key.backspace) {
        setSearchQuery(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setSearchQuery(prev => prev + input);
      }
    } else {
      if (key.upArrow && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      } else if (key.downArrow && selectedIndex < filteredSteps.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      } else if (key.return) {
        if (filteredSteps.length > 0) {
          const originalIndex = steps.findIndex(s => s === filteredSteps[selectedIndex]);
          onStepSelect?.(originalIndex);
        }
      } else if (input === '/') {
        setIsSearchMode(true);
      } else if (input === 'a') {
        setFilterType(filterType === 'api' ? null : 'api');
        setSelectedIndex(0);
      } else if (input === 'u') {
        setFilterType(filterType === 'ui' ? null : 'ui');
        setSelectedIndex(0);
      } else if (input === 'f') {
        setFilterType(filterType === 'failed' ? null : 'failed');
        setSelectedIndex(0);
      } else if (input === 'p') {
        setFilterType(filterType === 'passed' ? null : 'passed');
        setSelectedIndex(0);
      } else if (input === 'c') {
        setSearchQuery('');
        setFilterType(null);
        setSelectedIndex(0);
      } else if (key.escape) {
        onClose?.();
      }
    }
  });

  // Reset selection when filtered results change
  useEffect(() => {
    if (selectedIndex >= filteredSteps.length) {
      setSelectedIndex(Math.max(0, filteredSteps.length - 1));
    }
  }, [filteredSteps.length, selectedIndex]);

  return (
    <Box flexDirection="column" height="100%" borderStyle="round" borderColor="cyan">
      <NavigatorHeader 
        totalSteps={steps.length}
        filteredSteps={filteredSteps.length}
        searchQuery={searchQuery}
        filterType={filterType}
        isSearchMode={isSearchMode}
      />
      
      <NavigatorFilters 
        filterType={filterType}
        stepStats={getStepStats(steps)}
      />
      
      <NavigatorStepsList 
        steps={filteredSteps}
        originalSteps={steps}
        selectedIndex={selectedIndex}
        searchQuery={searchQuery}
      />
      
      <NavigatorFooter isSearchMode={isSearchMode} />
    </Box>
  );
};

// Navigator header with search and status
const NavigatorHeader: React.FC<{
  totalSteps: number;
  filteredSteps: number;
  searchQuery: string;
  filterType: string | null;
  isSearchMode: boolean;
}> = ({ totalSteps, filteredSteps, searchQuery, filterType, isSearchMode }) => {
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} borderBottom>
      <Text bold color="cyan">
        🔍 Step Navigator
      </Text>
      
      <Box marginTop={1}>
        <Text color="gray">
          Showing {filteredSteps} of {totalSteps} steps
          {filterType && <Text color="yellow"> • Filter: {filterType}</Text>}
        </Text>
      </Box>
      
      {/* Search input */}
      <Box marginTop={1}>
        <Text color={isSearchMode ? 'yellow' : 'gray'}>
          🔍 Search: 
        </Text>
        <Text color={isSearchMode ? 'white' : 'gray'} bold={isSearchMode}>
          {searchQuery || (isSearchMode ? '|' : 'Press / to search')}
        </Text>
      </Box>
    </Box>
  );
};

// Quick filter buttons
const NavigatorFilters: React.FC<{
  filterType: string | null;
  stepStats: { api: number; ui: number; custom: number; failed: number; passed: number };
}> = ({ filterType, stepStats }) => {
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} borderBottom>
      <Text color="gray" dimColor>Quick Filters:</Text>
      <Box marginTop={1}>
        <FilterButton 
          key="a" 
          letter="A" 
          label={`API (${stepStats.api})`} 
          isActive={filterType === 'api'}
          color="blue"
        />
        <FilterButton 
          key="u" 
          letter="U" 
          label={`UI (${stepStats.ui})`} 
          isActive={filterType === 'ui'}
          color="green"
        />
        <FilterButton 
          key="f" 
          letter="F" 
          label={`Failed (${stepStats.failed})`} 
          isActive={filterType === 'failed'}
          color="red"
        />
        <FilterButton 
          key="p" 
          letter="P" 
          label={`Passed (${stepStats.passed})`} 
          isActive={filterType === 'passed'}
          color="green"
        />
      </Box>
    </Box>
  );
};

const FilterButton: React.FC<{
  letter: string;
  label: string;
  isActive: boolean;
  color: string;
}> = ({ letter, label, isActive, color }) => (
  <Box marginRight={2}>
    <Text color={isActive ? color : 'gray'} bold={isActive}>
      [{letter}] {label}
    </Text>
  </Box>
);

// Filtered steps list
const NavigatorStepsList: React.FC<{
  steps: Step[];
  originalSteps: Step[];
  selectedIndex: number;
  searchQuery: string;
}> = ({ steps, originalSteps, selectedIndex, searchQuery }) => {
  const { state } = useAppContext();
  
  if (steps.length === 0) {
    return (
      <Box justifyContent="center" alignItems="center" flexGrow={1}>
        <Text color="gray">No steps match your criteria</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {steps.slice(0, 10).map((step, index) => {
        const originalIndex = originalSteps.findIndex(s => s === step);
        const isSelected = index === selectedIndex;
        const result = state.lastResult?.stepResults?.[originalIndex];
        
        return (
          <NavigatorStepItem
            key={originalIndex}
            step={step}
            index={originalIndex + 1}
            isSelected={isSelected}
            result={result}
            searchQuery={searchQuery}
          />
        );
      })}
      
      {steps.length > 10 && (
        <Text color="gray" dimColor marginTop={1}>
          ... {steps.length - 10} more steps (refine search to see more)
        </Text>
      )}
    </Box>
  );
};

// Individual step item in navigator
const NavigatorStepItem: React.FC<{
  step: Step;
  index: number;
  isSelected: boolean;
  result?: any;
  searchQuery: string;
}> = ({ step, index, isSelected, result, searchQuery }) => {
  const getStatusIcon = () => {
    if (!result) return '⚪';
    return result.success ? '✅' : '❌';
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => (
      <Text key={i} color={part.toLowerCase() === query.toLowerCase() ? 'yellow' : undefined}>
        {part}
      </Text>
    ));
  };

  return (
    <Box
      flexDirection="column"
      paddingY={1}
      paddingX={1}
      marginBottom={1}
      borderStyle={isSelected ? 'round' : undefined}
      borderColor={isSelected ? 'yellow' : undefined}
    >
      <Box justifyContent="space-between">
        <Box>
          <Text color={isSelected ? 'yellow' : 'white'} bold={isSelected}>
            {getStatusIcon()} {index}. {highlightText(step.name, searchQuery)}
          </Text>
        </Box>
        <Text color="gray">
          {step.type}
        </Text>
      </Box>
      
      {isSelected && (
        <Box marginTop={1} paddingLeft={2}>
          <StepQuickInfo step={step} />
        </Box>
      )}
    </Box>
  );
};

// Quick step info for selected item
const StepQuickInfo: React.FC<{ step: Step }> = ({ step }) => {
  const apiStep = step as any;
  
  return (
    <Box flexDirection="column">
      {step.description && (
        <Text color="gray" dimColor>
          {step.description.substring(0, 80)}...
        </Text>
      )}
      
      {step.type === 'api' && (
        <Text color="blue">
          {apiStep.method || 'GET'} {apiStep.url}
        </Text>
      )}
      
      {step.type === 'ui' && (
        <Text color="green">
          {apiStep.action} {apiStep.selector || apiStep.target}
        </Text>
      )}
      
      {step.expect && (
        <Text color="yellow">
          ✅ {Array.isArray(step.expect) ? step.expect.length : 1} expectations
        </Text>
      )}
    </Box>
  );
};

// Navigator footer with shortcuts
const NavigatorFooter: React.FC<{ isSearchMode: boolean }> = ({ isSearchMode }) => {
  if (isSearchMode) {
    return (
      <Box paddingX={1} paddingY={1} borderTop>
        <Text color="yellow">
          🔍 Search Mode: Type to search • Enter to select • Esc to cancel
        </Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1} paddingY={1} borderTop>
      <Text color="gray" dimColor>
        ↑↓ Navigate • Enter Select • / Search • A/U/F/P Filter • C Clear • Esc Close
      </Text>
    </Box>
  );
};

// Helper functions
function getFilteredSteps(steps: Step[], searchQuery: string, filterType: string | null): Step[] {
  let filtered = [...steps];
  
  // Apply text search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(step => 
      step.name.toLowerCase().includes(query) ||
      step.description?.toLowerCase().includes(query) ||
      step.type.toLowerCase().includes(query) ||
      ((step as any).url?.toLowerCase().includes(query)) ||
      ((step as any).method?.toLowerCase().includes(query))
    );
  }
  
  // Apply type filter
  if (filterType && ['api', 'ui'].includes(filterType)) {
    filtered = filtered.filter(step => step.type === filterType);
  }
  
  // Note: Failed/Passed filtering would need execution results context
  // This would be implemented when integrated with the main app state
  
  return filtered;
}

function getStepStats(steps: Step[]) {
  return {
    api: steps.filter(s => s.type === 'api').length,
    ui: steps.filter(s => s.type === 'ui').length,
    custom: steps.filter(s => !['api', 'ui'].includes(s.type)).length,
    failed: 0, // Would be calculated from execution results
    passed: 0  // Would be calculated from execution results
  };
}