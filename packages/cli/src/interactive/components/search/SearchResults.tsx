/**
 * Search Results Display Component
 * Shows search results with highlighting, relevance scoring, and metadata
 */

import React from 'react';
import { Box, Text } from 'ink';
import { SearchResult } from '../../search/SearchEngine';

interface SearchResultsProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  selectedIndex,
  onSelect
}) => {
  if (results.length === 0) {
    return (
      <Box padding={1} justifyContent="center" alignItems="center">
        <Text color="gray">No results found. Try a different search term.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="single" paddingX={1}>
        <Text bold color="cyan">Search Results ({results.length})</Text>
      </Box>

      {results.map((result, index) => (
        <SearchResultItem
          key={result.id}
          result={result}
          isSelected={index === selectedIndex}
          index={index}
          onClick={() => onSelect(result)}
        />
      ))}
    </Box>
  );
};

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  index: number;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isSelected,
  index,
  onClick
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scenario': return '📋';
      case 'step': return '🔧';
      case 'file': return '📄';
      default: return '📍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scenario': return 'blue';
      case 'step': return 'green';
      case 'file': return 'yellow';
      default: return 'gray';
    }
  };

  const formatRelevanceScore = (score: number) => {
    return Math.round(score).toString().padStart(3, ' ');
  };

  const truncatePath = (path: string, maxLength: number = 50) => {
    if (path.length <= maxLength) return path;
    return '...' + path.slice(-(maxLength - 3));
  };

  const highlightMatches = (text: string, matches: typeof result.matches) => {
    if (matches.length === 0) return text;
    
    // Simple highlighting - in a real implementation, this would be more sophisticated
    let highlightedText = text;
    matches.forEach(match => {
      const regex = new RegExp(match.text, 'gi');
      highlightedText = highlightedText.replace(regex, `⟨${match.text}⟩`);
    });
    
    return highlightedText;
  };

  return (
    <Box
      borderStyle={isSelected ? 'double' : 'single'}
      borderColor={isSelected ? 'yellow' : 'gray'}
      paddingX={1}
      marginY={0}
    >
      <Box flexDirection="column" width="100%">
        {/* Header with type, name, and relevance */}
        <Box justifyContent="space-between">
          <Box>
            <Text color={getTypeColor(result.type)}>
              {getTypeIcon(result.type)} {result.name}
            </Text>
            {result.metadata.tags && result.metadata.tags.length > 0 && (
              <Box marginLeft={2}>
                {result.metadata.tags.slice(0, 3).map((tag, tagIndex) => (
                  <React.Fragment key={tag}>
                    <Text color="magenta" backgroundColor="gray">#{tag}</Text>
                    {tagIndex < Math.min(2, result.metadata.tags!.length - 1) && <Text> </Text>}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </Box>
          <Box>
            <Text color="gray">Score: </Text>
            <Text color="yellow">{formatRelevanceScore(result.relevanceScore)}</Text>
            {result.metadata.isFavorite && <Text color="red"> ❤️</Text>}
          </Box>
        </Box>

        {/* Path */}
        <Box>
          <Text color="gray">Path: </Text>
          <Text color="white">{truncatePath(result.path)}</Text>
        </Box>

        {/* Matches */}
        {result.matches.length > 0 && (
          <Box flexDirection="column" marginTop={0}>
            <Text color="cyan">Matches:</Text>
            {result.matches.slice(0, 3).map((match, matchIndex) => (
              <Box key={matchIndex} marginLeft={2}>
                <Text color="gray">{match.field}: </Text>
                <Text color="white">
                  {highlightMatches(match.context.substring(0, 60), [match])}
                  {match.context.length > 60 && <Text color="gray">...</Text>}
                </Text>
                {match.lineNumber && (
                  <Text color="gray"> (line {match.lineNumber})</Text>
                )}
              </Box>
            ))}
            {result.matches.length > 3 && (
              <Box marginLeft={2}>
                <Text color="gray">... and {result.matches.length - 3} more matches</Text>
              </Box>
            )}
          </Box>
        )}

        {/* Metadata */}
        <Box flexDirection="column" marginTop={0}>
          {/* Scenario-specific metadata */}
          {result.type === 'scenario' && result.metadata.scenario && (
            <Box>
              <Text color="gray">Steps: </Text>
              <Text color="white">{result.metadata.scenario.steps.length}</Text>
              {result.metadata.scenario.environments && (
                <>
                  <Text color="gray"> | Envs: </Text>
                  <Text color="white">{result.metadata.scenario.environments.join(', ')}</Text>
                </>
              )}
            </Box>
          )}

          {/* Step-specific metadata */}
          {result.type === 'step' && result.metadata.step && (
            <Box>
              <Text color="gray">Type: </Text>
              <Text color="white">{result.metadata.step.type}</Text>
              {result.metadata.stepIndex !== undefined && (
                <>
                  <Text color="gray"> | Index: </Text>
                  <Text color="white">{result.metadata.stepIndex}</Text>
                </>
              )}
              {result.metadata.parentScenario && (
                <>
                  <Text color="gray"> | Scenario: </Text>
                  <Text color="white">{result.metadata.parentScenario}</Text>
                </>
              )}
            </Box>
          )}

          {/* Performance metrics */}
          {result.metadata.performanceMetrics && (
            <Box>
              <Text color="gray">Avg Duration: </Text>
              <Text color={result.metadata.performanceMetrics.avgDuration > 5000 ? 'red' : 'green'}>
                {result.metadata.performanceMetrics.avgDuration}ms
              </Text>
              <Text color="gray"> | Success Rate: </Text>
              <Text color={result.metadata.performanceMetrics.successRate >= 90 ? 'green' : 'yellow'}>
                {result.metadata.performanceMetrics.successRate}%
              </Text>
              {result.metadata.performanceMetrics.lastExecuted && (
                <>
                  <Text color="gray"> | Last Run: </Text>
                  <Text color="white">
                    {formatRelativeTime(result.metadata.performanceMetrics.lastExecuted)}
                  </Text>
                </>
              )}
            </Box>
          )}

          {/* Collections */}
          {result.metadata.collections && result.metadata.collections.length > 0 && (
            <Box>
              <Text color="gray">Collections: </Text>
              <Text color="cyan">{result.metadata.collections.join(', ')}</Text>
            </Box>
          )}

          {/* Last modified */}
          {result.metadata.lastModified && (
            <Box>
              <Text color="gray">Modified: </Text>
              <Text color="white">{formatRelativeTime(result.metadata.lastModified)}</Text>
            </Box>
          )}
        </Box>

        {/* Selection indicator */}
        {isSelected && (
          <Box justifyContent="center" marginTop={0}>
            <Text color="yellow">Press Enter to open this result</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Utility functions

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};