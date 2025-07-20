/**
 * Editor Validation Component
 * 
 * Displays validation errors, warnings, and suggestions
 * with inline error indicators and detailed problem descriptions.
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { ValidationResult, ValidationLevel } from './types';

interface EditorValidationProps {
  results: ValidationResult[];
  currentLine: number;
  width: number;
}

export const EditorValidation: React.FC<EditorValidationProps> = ({
  results,
  currentLine,
  width
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (results.length === 0) {
    return null;
  }

  // Sort results by severity and line number
  const sortedResults = [...results].sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2, hint: 3 };
    const severityDiff = severityOrder[a.level] - severityOrder[b.level];
    if (severityDiff !== 0) return severityDiff;
    return a.line - b.line;
  });

  // Group results by severity
  const groupedResults = sortedResults.reduce((groups, result) => {
    if (!groups[result.level]) {
      groups[result.level] = [];
    }
    groups[result.level].push(result);
    return groups;
  }, {} as Record<ValidationLevel, ValidationResult[]>);

  const renderSummary = () => {
    const errors = groupedResults.error?.length || 0;
    const warnings = groupedResults.warning?.length || 0;
    const infos = groupedResults.info?.length || 0;
    const hints = groupedResults.hint?.length || 0;

    return (
      <Box flexDirection="row" paddingX={1}>
        <Text color="gray">Problems:</Text>
        {errors > 0 && (
          <Text color="red" marginLeft={1}>
            ✗ {errors} error{errors > 1 ? 's' : ''}
          </Text>
        )}
        {warnings > 0 && (
          <Text color="yellow" marginLeft={1}>
            ⚠ {warnings} warning{warnings > 1 ? 's' : ''}
          </Text>
        )}
        {infos > 0 && (
          <Text color="blue" marginLeft={1}>
            ℹ {infos} info
          </Text>
        )}
        {hints > 0 && (
          <Text color="gray" marginLeft={1}>
            💡 {hints} hint{hints > 1 ? 's' : ''}
          </Text>
        )}
        <Text color="gray" marginLeft={2}>
          Press V to {expanded ? 'collapse' : 'expand'}
        </Text>
      </Box>
    );
  };

  const renderDetailedResults = () => {
    if (!expanded) return null;

    const maxHeight = 6; // Maximum lines to show in detailed view
    const visibleResults = sortedResults.slice(0, maxHeight);

    return (
      <Box flexDirection="column" marginTop={1} maxHeight={maxHeight}>
        {visibleResults.map((result, index) => (
          <Box key={index} flexDirection="row" paddingX={1}>
            <Box width={4}>
              <Text color={getValidationColor(result.level)}>
                {getValidationIcon(result.level)}
              </Text>
            </Box>
            <Box width={8}>
              <Text color="gray">
                {result.line + 1}:{result.column + 1}
              </Text>
            </Box>
            <Box flexGrow={1}>
              <Text color={getValidationColor(result.level)}>
                {result.message}
              </Text>
            </Box>
            {result.rule && (
              <Box width={12}>
                <Text color="gray" dimColor>
                  [{result.rule}]
                </Text>
              </Box>
            )}
          </Box>
        ))}
        
        {sortedResults.length > maxHeight && (
          <Box paddingX={1} marginTop={1}>
            <Text color="gray" dimColor>
              ... and {sortedResults.length - maxHeight} more problems
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderCurrentLineProblems = () => {
    const currentLineProblems = results.filter(r => r.line === currentLine);
    if (currentLineProblems.length === 0) return null;

    return (
      <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="yellow">
        <Box paddingX={1} backgroundColor="yellow" justifyContent="center">
          <Text color="black" bold>
            Line {currentLine + 1} Problems
          </Text>
        </Box>
        {currentLineProblems.map((problem, index) => (
          <Box key={index} flexDirection="column" paddingX={1}>
            <Box flexDirection="row">
              <Text color={getValidationColor(problem.level)}>
                {getValidationIcon(problem.level)} {problem.message}
              </Text>
            </Box>
            {problem.suggestions && problem.suggestions.length > 0 && (
              <Box flexDirection="column" marginLeft={2} marginTop={1}>
                <Text color="cyan" bold>Suggestions:</Text>
                {problem.suggestions.map((suggestion, sugIndex) => (
                  <Text key={sugIndex} color="cyan" marginLeft={1}>
                    • {suggestion}
                  </Text>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="yellow" maxHeight={12}>
      {renderSummary()}
      {renderDetailedResults()}
      {renderCurrentLineProblems()}
    </Box>
  );
};

function getValidationIcon(level: ValidationLevel): string {
  switch (level) {
    case 'error':
      return '✗';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    case 'hint':
      return '💡';
    default:
      return '•';
  }
}

function getValidationColor(level: ValidationLevel): string {
  switch (level) {
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'info':
      return 'blue';
    case 'hint':
      return 'gray';
    default:
      return 'white';
  }
}