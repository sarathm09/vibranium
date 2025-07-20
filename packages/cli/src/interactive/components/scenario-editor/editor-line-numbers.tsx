/**
 * Editor Line Numbers Component
 * 
 * Renders line numbers with highlighting for current line,
 * errors, warnings, and breakpoints.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { ValidationResult, EditorPosition } from './types';

interface EditorLineNumbersProps {
  totalLines: number;
  currentLine: number;
  validationResults: ValidationResult[];
  width: number;
  scrollOffset: number;
  visibleLines: number;
}

export const EditorLineNumbers: React.FC<EditorLineNumbersProps> = ({
  totalLines,
  currentLine,
  validationResults,
  width,
  scrollOffset,
  visibleLines
}) => {
  const renderLineNumber = (lineNumber: number) => {
    const isCurrentLine = lineNumber === currentLine;
    const hasError = validationResults.some(v => v.line === lineNumber && v.level === 'error');
    const hasWarning = validationResults.some(v => v.line === lineNumber && v.level === 'warning');
    
    let color = 'gray';
    let backgroundColor = undefined;
    
    if (isCurrentLine) {
      color = 'cyan';
      backgroundColor = 'gray';
    } else if (hasError) {
      color = 'red';
    } else if (hasWarning) {
      color = 'yellow';
    }
    
    const lineNumberText = (lineNumber + 1).toString().padStart(width - 1, ' ');
    
    return (
      <Text key={lineNumber} color={color} backgroundColor={backgroundColor}>
        {lineNumberText}
      </Text>
    );
  };

  const visibleStartLine = Math.max(0, scrollOffset);
  const visibleEndLine = Math.min(totalLines, visibleStartLine + visibleLines);
  
  const lineNumbers = [];
  for (let i = visibleStartLine; i < visibleEndLine; i++) {
    lineNumbers.push(renderLineNumber(i));
  }

  return (
    <Box flexDirection="column" width={width}>
      {lineNumbers}
    </Box>
  );
};