/**
 * Editor Status Bar Component
 * 
 * Displays editor state, cursor position, validation status,
 * file information, and available actions.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { EditorState, EditorMode } from './types';

interface EditorStatusBarProps {
  editorState: EditorState;
  mode: EditorMode;
  isInEditMode: boolean;
  onToggleEditMode: () => void;
  width: number;
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  editorState,
  mode,
  isInEditMode,
  onToggleEditMode,
  width
}) => {
  const renderLeftSection = () => {
    const errors = editorState.validationResults.filter(r => r.level === 'error').length;
    const warnings = editorState.validationResults.filter(r => r.level === 'warning').length;

    return (
      <Box flexDirection="row">
        {/* File status */}
        <Text color={editorState.isDirty ? 'yellow' : 'green'}>
          {editorState.isDirty ? '●' : '✓'} {editorState.fileName}
        </Text>
        
        {/* Validation status */}
        {errors > 0 && (
          <Text color="red" marginLeft={1}>
            ✗ {errors}
          </Text>
        )}
        {warnings > 0 && (
          <Text color="yellow" marginLeft={1}>
            ⚠ {warnings}
          </Text>
        )}
        
        {/* Auto-save indicator */}
        {editorState.isAutoSaveEnabled && (
          <Text color="gray" marginLeft={1}>
            Auto
          </Text>
        )}
      </Box>
    );
  };

  const renderCenterSection = () => {
    const { line, column } = editorState.cursor;
    const totalLines = editorState.content.split('\n').length;
    const charCount = editorState.content.length;
    
    return (
      <Box flexDirection="row" justifyContent="center">
        <Text color="cyan">
          Ln {line + 1}, Col {column + 1}
        </Text>
        <Text color="gray" marginLeft={2}>
          {totalLines} lines, {charCount} chars
        </Text>
      </Box>
    );
  };

  const renderRightSection = () => {
    return (
      <Box flexDirection="row">
        {/* File type */}
        <Text color="blue" bold>
          {editorState.fileType.toUpperCase()}
        </Text>
        
        {/* Editor mode */}
        <Text color={isInEditMode ? 'yellow' : 'gray'} marginLeft={2}>
          {isInEditMode ? 'EDIT' : 'VIEW'}
        </Text>
        
        {/* Last saved time */}
        {editorState.lastSaved && (
          <Text color="gray" marginLeft={2}>
            {formatTime(editorState.lastSaved)}
          </Text>
        )}
      </Box>
    );
  };

  const renderShortcuts = () => {
    if (isInEditMode) {
      return (
        <Box marginTop={1} paddingX={1}>
          <Text color="gray" dimColor>
            Ctrl+S: Save | Ctrl+Z: Undo | Ctrl+Y: Redo | Ctrl+F: Find | Esc: Exit Edit
          </Text>
        </Box>
      );
    } else {
      return (
        <Box marginTop={1} paddingX={1}>
          <Text color="gray" dimColor>
            E: Edit | ↑↓: Scroll | Ctrl+F: Find | F: Format | D: Duplicate | Del: Delete
          </Text>
        </Box>
      );
    }
  };

  return (
    <Box flexDirection="column" borderStyle="single" borderBottom={false} height={3}>
      <Box paddingX={1} justifyContent="space-between" width={width - 2}>
        {renderLeftSection()}
        {renderCenterSection()}
        {renderRightSection()}
      </Box>
      {renderShortcuts()}
    </Box>
  );
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now';
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}