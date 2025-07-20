/**
 * Advanced Filter Panel Component
 * Provides sophisticated filtering options for search results
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { SearchFilters } from '../../search/SearchEngine';

interface FilterPanelProps {
  onFiltersChange: (filters: SearchFilters) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onFiltersChange }) => {
  const [activeFilter, setActiveFilter] = useState<number>(0);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPerformancePicker, setShowPerformancePicker] = useState(false);

  const filterOptions = [
    { id: 'fileTypes', label: 'File Types', type: 'multiselect' },
    { id: 'environments', label: 'Environments', type: 'multiselect' },
    { id: 'tags', label: 'Tags', type: 'multiselect' },
    { id: 'status', label: 'Status', type: 'multiselect' },
    { id: 'stepTypes', label: 'Step Types', type: 'multiselect' },
    { id: 'executionDateRange', label: 'Date Range', type: 'daterange' },
    { id: 'performanceThreshold', label: 'Performance', type: 'range' },
    { id: 'hasErrors', label: 'Has Errors', type: 'boolean' },
    { id: 'favorites', label: 'Favorites Only', type: 'boolean' }
  ];

  const fileTypeOptions = ['json', 'yaml', 'yml', 'js', 'ts'];
  const environmentOptions = ['local', 'staging', 'production', 'development', 'test'];
  const tagOptions = ['api-testing', 'performance', 'security', 'regression', 'integration', 'critical'];
  const statusOptions = ['passed', 'failed', 'pending'];
  const stepTypeOptions = ['api', 'http', 'database', 'ui', 'validation', 'setup', 'teardown'];

  useInput((input, key) => {
    // Navigate filters
    if (key.upArrow) {
      setActiveFilter(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setActiveFilter(prev => Math.min(filterOptions.length - 1, prev + 1));
    }
    
    // Handle Enter to toggle or modify filter
    else if (key.return) {
      const selectedFilter = filterOptions[activeFilter];
      handleFilterAction(selectedFilter.id as keyof SearchFilters);
    }
    
    // Handle space to toggle boolean filters
    else if (input === ' ') {
      const selectedFilter = filterOptions[activeFilter];
      if (selectedFilter.type === 'boolean') {
        toggleBooleanFilter(selectedFilter.id as keyof SearchFilters);
      }
    }
    
    // Clear all filters
    else if (key.escape) {
      setFilters({});
      onFiltersChange({});
    }
  });

  const handleFilterAction = (filterId: keyof SearchFilters) => {
    const filterOption = filterOptions.find(f => f.id === filterId);
    if (!filterOption) return;

    switch (filterOption.type) {
      case 'boolean':
        toggleBooleanFilter(filterId);
        break;
      case 'multiselect':
        // For simplicity, we'll cycle through some predefined options
        toggleMultiselectFilter(filterId);
        break;
      case 'daterange':
        setShowDatePicker(true);
        break;
      case 'range':
        setShowPerformancePicker(true);
        break;
    }
  };

  const toggleBooleanFilter = (filterId: keyof SearchFilters) => {
    const newFilters = { ...filters };
    if (filterId === 'hasErrors' || filterId === 'favorites') {
      newFilters[filterId] = !newFilters[filterId];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleMultiselectFilter = (filterId: keyof SearchFilters) => {
    const newFilters = { ...filters };
    let options: string[] = [];
    
    switch (filterId) {
      case 'fileTypes':
        options = fileTypeOptions;
        break;
      case 'environments':
        options = environmentOptions;
        break;
      case 'tags':
        options = tagOptions;
        break;
      case 'status':
        options = statusOptions;
        break;
      case 'stepTypes':
        options = stepTypeOptions;
        break;
    }

    // Simple toggle - cycle through adding options
    const currentValues = (newFilters[filterId] as string[]) || [];
    if (currentValues.length === 0) {
      newFilters[filterId] = [options[0]] as any;
    } else if (currentValues.length < options.length) {
      const nextOption = options.find(opt => !currentValues.includes(opt));
      if (nextOption) {
        newFilters[filterId] = [...currentValues, nextOption] as any;
      }
    } else {
      delete newFilters[filterId];
    }

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const renderFilterValue = (filterId: keyof SearchFilters) => {
    const value = filters[filterId];
    
    if (value === undefined || value === null) {
      return <Text color="gray">None</Text>;
    }

    if (typeof value === 'boolean') {
      return <Text color={value ? 'green' : 'red'}>{value ? 'Yes' : 'No'}</Text>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <Text color="gray">None</Text>;
      }
      return <Text color="cyan">{value.join(', ')}</Text>;
    }

    if (filterId === 'executionDateRange' && typeof value === 'object' && 'start' in value) {
      const range = value as { start: Date; end: Date };
      return (
        <Text color="cyan">
          {range.start.toLocaleDateString()} - {range.end.toLocaleDateString()}
        </Text>
      );
    }

    if (filterId === 'performanceThreshold' && typeof value === 'object') {
      const threshold = value as { min?: number; max?: number };
      const parts = [];
      if (threshold.min !== undefined) parts.push(`min: ${threshold.min}ms`);
      if (threshold.max !== undefined) parts.push(`max: ${threshold.max}ms`);
      return <Text color="cyan">{parts.join(', ')}</Text>;
    }

    return <Text color="white">{String(value)}</Text>;
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return value !== null;
      return value !== undefined && value !== null;
    }).length;
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="single" paddingX={1}>
        <Text bold color="cyan">Advanced Filters</Text>
        <Box marginLeft="auto">
          <Text color="gray">Active: </Text>
          <Text color="yellow">{getActiveFilterCount()}</Text>
        </Box>
      </Box>

      {/* Filter Options */}
      <Box flexDirection="column" marginTop={1}>
        {filterOptions.map((option, index) => (
          <Box
            key={option.id}
            paddingX={1}
            borderStyle={index === activeFilter ? 'double' : undefined}
            borderColor={index === activeFilter ? 'yellow' : undefined}
          >
            <Box width={20}>
              <Text color={index === activeFilter ? 'yellow' : 'white'}>
                {option.label}:
              </Text>
            </Box>
            <Box flexGrow={1}>
              {renderFilterValue(option.id as keyof SearchFilters)}
            </Box>
            <Box width={15}>
              <Text color="gray">
                {option.type === 'boolean' ? '[Space]' : '[Enter]'}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Filter Presets */}
      <Box marginTop={2} borderStyle="single" paddingX={1}>
        <Text bold color="cyan">Quick Filters</Text>
      </Box>
      
      <Box flexDirection="column" marginTop={1}>
        <FilterPreset
          name="Failed Tests"
          description="Recent failed scenarios"
          onApply={() => {
            const preset: SearchFilters = {
              status: ['failed'],
              executionDateRange: {
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                end: new Date()
              }
            };
            setFilters(preset);
            onFiltersChange(preset);
          }}
        />
        
        <FilterPreset
          name="API Tests"
          description="HTTP API scenarios"
          onApply={() => {
            const preset: SearchFilters = {
              stepTypes: ['api', 'http'],
              tags: ['api-testing']
            };
            setFilters(preset);
            onFiltersChange(preset);
          }}
        />
        
        <FilterPreset
          name="Performance Issues"
          description="Slow scenarios"
          onApply={() => {
            const preset: SearchFilters = {
              performanceThreshold: { min: 3000 },
              hasErrors: false
            };
            setFilters(preset);
            onFiltersChange(preset);
          }}
        />
        
        <FilterPreset
          name="Favorites"
          description="Bookmarked scenarios"
          onApply={() => {
            const preset: SearchFilters = {
              favorites: true
            };
            setFilters(preset);
            onFiltersChange(preset);
          }}
        />
      </Box>

      {/* Instructions */}
      <Box marginTop={2} borderStyle="single" paddingX={1}>
        <Text color="gray">
          ↑↓: Navigate | Enter: Modify | Space: Toggle | Esc: Clear all
        </Text>
      </Box>

      {/* Active Filters Summary */}
      {getActiveFilterCount() > 0 && (
        <Box marginTop={1} borderStyle="single" paddingX={1}>
          <Text bold color="green">
            {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
          </Text>
          <Box marginTop={1}>
            <Text color="gray">Press Esc to clear all filters</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

interface FilterPresetProps {
  name: string;
  description: string;
  onApply: () => void;
}

const FilterPreset: React.FC<FilterPresetProps> = ({ name, description, onApply }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      paddingX={1}
      borderStyle={isHovered ? 'single' : undefined}
      borderColor={isHovered ? 'blue' : undefined}
    >
      <Box width={15}>
        <Text color="blue">{name}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text color="gray">{description}</Text>
      </Box>
    </Box>
  );
};