/**
 * Editor Minimap Component
 * 
 * Terminal-based minimap showing overview of large files
 * with current viewport indicator and navigation support.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { EditorState, ValidationResult } from './types';

interface EditorMinimapProps {
  editorState: EditorState;
  width: number;
  height: number;
  onScrollTo: (line: number) => void;
}

export const EditorMinimap: React.FC<EditorMinimapProps> = ({
  editorState,
  width,
  height,
  onScrollTo
}) => {
  const lines = editorState.content.split('\n');
  const totalLines = lines.length;
  
  if (totalLines <= height) {
    return null; // Don't show minimap for small files
  }

  const renderMinimap = () => {
    const minimapLines: React.ReactNode[] = [];
    const linesPerChar = Math.max(1, Math.ceil(totalLines / height));
    
    for (let i = 0; i < height; i++) {
      const startLine = i * linesPerChar;
      const endLine = Math.min(startLine + linesPerChar, totalLines);
      
      // Check if this section has content, errors, or warnings
      let hasContent = false;
      let hasError = false;
      let hasWarning = false;
      let isCurrentViewport = false;
      
      for (let lineNum = startLine; lineNum < endLine; lineNum++) {
        if (lines[lineNum]?.trim()) {
          hasContent = true;
        }
        
        // Check for validation issues
        const hasValidationError = editorState.validationResults.some(
          v => v.line === lineNum && v.level === 'error'
        );
        const hasValidationWarning = editorState.validationResults.some(
          v => v.line === lineNum && v.level === 'warning'
        );
        
        if (hasValidationError) hasError = true;
        if (hasValidationWarning) hasWarning = true;
        
        // Check if this is the current viewport
        if (lineNum >= editorState.scrollTop && 
            lineNum < editorState.scrollTop + height) {
          isCurrentViewport = true;
        }
      }
      
      // Determine the character and color to display
      let char = ' ';
      let color = 'gray';
      
      if (hasError) {
        char = '█';
        color = 'red';
      } else if (hasWarning) {
        char = '█';
        color = 'yellow';
      } else if (hasContent) {
        char = isCurrentViewport ? '█' : '▓';
        color = isCurrentViewport ? 'cyan' : 'white';
      } else if (isCurrentViewport) {
        char = '░';
        color = 'cyan';
      }
      
      minimapLines.push(
        <Text key={i} color={color}>
          {char}
        </Text>
      );
    }
    
    return minimapLines;
  };

  const renderScrollIndicator = () => {
    const scrollPercentage = totalLines > height ? 
      (editorState.scrollTop / (totalLines - height)) : 0;
    const indicatorPosition = Math.floor(scrollPercentage * (height - 1));
    
    const indicators: React.ReactNode[] = [];
    
    for (let i = 0; i < height; i++) {
      indicators.push(
        <Text key={i} color={i === indicatorPosition ? 'cyan' : 'gray'}>
          {i === indicatorPosition ? '▶' : ' '}
        </Text>
      );
    }
    
    return indicators;
  };

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box justifyContent="center" borderStyle="single" borderBottom={false}>
        <Text color="gray" dimColor>
          Map
        </Text>
      </Box>
      
      <Box flexDirection="row" flexGrow={1} borderStyle="single" borderTop={false} borderBottom={false}>
        <Box flexDirection="column" width={1}>
          {renderScrollIndicator()}
        </Box>
        
        <Box flexDirection="column" width={width - 3} paddingLeft={1}>
          {renderMinimap()}
        </Box>
      </Box>
      
      <Box justifyContent="center" borderStyle="single" borderTop={false}>
        <Text color="gray" dimColor>
          {totalLines}L
        </Text>
      </Box>
    </Box>
  );
};