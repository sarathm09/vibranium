/**
 * Advanced Scenario Editor Component
 * 
 * Professional code editor with syntax highlighting, validation,
 * auto-completion, and advanced editing features for terminal environments.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../../state/app-context';
import { EditorState, EditorMode, ValidationResult, SearchOptions, EditorPosition } from './types';
import { SyntaxHighlighter } from './syntax-highlighter';
import { EditorLineNumbers } from './editor-line-numbers';
import { EditorStatusBar } from './editor-status-bar';
import { EditorValidation } from './editor-validation';
import chalk from 'chalk';

interface ScenarioEditorProps {
  mode?: EditorMode;
  width: number;
  height: number;
  onSave?: (content: string) => void;
  onValidation?: (results: ValidationResult[]) => void;
  readOnly?: boolean;
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  mode = 'text',
  width,
  height,
  onSave,
  onValidation,
  readOnly = false
}) => {
  const { state, actions } = useAppContext();
  const [editorState, setEditorState] = useState<EditorState>({
    content: '',
    fileName: 'untitled.yaml',
    fileType: 'yaml',
    isDirty: false,
    isReadOnly: readOnly,
    cursor: { line: 0, column: 0 },
    scrollTop: 0,
    scrollLeft: 0,
    validationResults: [],
    searchResults: [],
    isAutoSaveEnabled: true,
    history: [],
    historyIndex: -1
  });

  const [isInEditMode, setIsInEditMode] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<SearchOptions | null>(null);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [autoComplete, setAutoComplete] = useState(true);

  // Calculate dimensions for editor components
  const editorDimensions = useMemo(() => {
    const statusBarHeight = 1;
    const headerHeight = 1;
    const lineNumberWidth = showLineNumbers ? 5 : 0;
    
    return {
      contentWidth: width - lineNumberWidth - 2, // borders
      contentHeight: height - statusBarHeight - headerHeight - 2, // borders + spacing
      lineNumberWidth,
      totalHeight: height,
      totalWidth: width
    };
  }, [width, height, showLineNumbers]);

  // Load current scenario content
  useEffect(() => {
    if (state.currentScenario) {
      setEditorState(prev => ({
        ...prev,
        content: state.rawScenarioContent || '',
        fileName: state.currentScenario.name || 'untitled.yaml',
        fileType: state.currentScenario.name?.endsWith('.json') ? 'json' : 'yaml',
        isDirty: false
      }));
    }
  }, [state.currentScenario, state.rawScenarioContent]);

  // Auto-save functionality
  useEffect(() => {
    if (editorState.isAutoSaveEnabled && editorState.isDirty && !readOnly) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [editorState.content, editorState.isAutoSaveEnabled, editorState.isDirty]);

  // Validation
  useEffect(() => {
    const validateContent = async () => {
      const results = await validateScenarioContent(editorState.content, editorState.fileType);
      setEditorState(prev => ({ ...prev, validationResults: results }));
      onValidation?.(results);
    };

    if (editorState.content) {
      validateContent();
    }
  }, [editorState.content, editorState.fileType, onValidation]);

  const handleSave = useCallback(() => {
    if (!readOnly && editorState.isDirty) {
      onSave?.(editorState.content);
      setEditorState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date()
      }));
      actions.setStatus('Scenario saved successfully', 'success');
    }
  }, [editorState.content, editorState.isDirty, onSave, readOnly, actions]);

  const updateContent = useCallback((newContent: string) => {
    setEditorState(prev => {
      const newState = {
        ...prev,
        content: newContent,
        isDirty: newContent !== prev.content,
        history: [
          ...prev.history.slice(0, prev.historyIndex + 1),
          {
            content: prev.content,
            cursor: prev.cursor,
            timestamp: new Date(),
            operation: 'edit'
          }
        ],
        historyIndex: prev.historyIndex + 1
      };

      // Limit history size
      if (newState.history.length > 100) {
        newState.history = newState.history.slice(-50);
        newState.historyIndex = 49;
      }

      return newState;
    });
  }, []);

  const moveCursor = useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end') => {
    setEditorState(prev => {
      const lines = prev.content.split('\n');
      let { line, column } = prev.cursor;

      switch (direction) {
        case 'up':
          line = Math.max(0, line - 1);
          column = Math.min(column, lines[line]?.length || 0);
          break;
        case 'down':
          line = Math.min(lines.length - 1, line + 1);
          column = Math.min(column, lines[line]?.length || 0);
          break;
        case 'left':
          if (column > 0) {
            column--;
          } else if (line > 0) {
            line--;
            column = lines[line]?.length || 0;
          }
          break;
        case 'right':
          if (column < (lines[line]?.length || 0)) {
            column++;
          } else if (line < lines.length - 1) {
            line++;
            column = 0;
          }
          break;
        case 'home':
          column = 0;
          break;
        case 'end':
          column = lines[line]?.length || 0;
          break;
      }

      return { ...prev, cursor: { line, column } };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setEditorState(prev => {
      if (prev.historyIndex > 0) {
        const historyEntry = prev.history[prev.historyIndex - 1];
        return {
          ...prev,
          content: historyEntry.content,
          cursor: historyEntry.cursor,
          historyIndex: prev.historyIndex - 1,
          isDirty: true
        };
      }
      return prev;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setEditorState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const historyEntry = prev.history[prev.historyIndex + 1];
        return {
          ...prev,
          content: historyEntry.content,
          cursor: historyEntry.cursor,
          historyIndex: prev.historyIndex + 1,
          isDirty: true
        };
      }
      return prev;
    });
  }, []);

  // Enhanced keyboard input handling
  useInput((input, key) => {
    if (!isInEditMode) return;

    // Handle special key combinations
    if (key.ctrl) {
      switch (input.toLowerCase()) {
        case 's':
          handleSave();
          return;
        case 'z':
          handleUndo();
          return;
        case 'y':
          handleRedo();
          return;
        case 'f':
          // Toggle search mode
          setCurrentSearch(prev => prev ? null : {
            query: '',
            caseSensitive: false,
            wholeWord: false,
            regex: false
          });
          return;
        case 'l':
          // Toggle line numbers
          setShowLineNumbers(prev => !prev);
          return;
        case 'q':
          // Exit edit mode
          setIsInEditMode(false);
          return;
      }
    }

    // Handle navigation keys
    if (key.upArrow) {
      moveCursor('up');
    } else if (key.downArrow) {
      moveCursor('down');
    } else if (key.leftArrow) {
      moveCursor('left');
    } else if (key.rightArrow) {
      moveCursor('right');
    } else if (key.home) {
      moveCursor('home');
    } else if (key.end) {
      moveCursor('end');
    } else if (key.escape) {
      setIsInEditMode(false);
    } else if (key.return) {
      // Insert new line
      const lines = editorState.content.split('\n');
      const currentLine = lines[editorState.cursor.line] || '';
      const beforeCursor = currentLine.substring(0, editorState.cursor.column);
      const afterCursor = currentLine.substring(editorState.cursor.column);
      
      lines[editorState.cursor.line] = beforeCursor;
      lines.splice(editorState.cursor.line + 1, 0, afterCursor);
      
      updateContent(lines.join('\n'));
      setEditorState(prev => ({
        ...prev,
        cursor: { line: prev.cursor.line + 1, column: 0 }
      }));
    } else if (key.backspace) {
      // Handle backspace
      const lines = editorState.content.split('\n');
      const { line, column } = editorState.cursor;
      
      if (column > 0) {
        // Delete character before cursor
        const currentLine = lines[line] || '';
        lines[line] = currentLine.substring(0, column - 1) + currentLine.substring(column);
        updateContent(lines.join('\n'));
        moveCursor('left');
      } else if (line > 0) {
        // Join with previous line
        const currentLine = lines[line] || '';
        const prevLine = lines[line - 1] || '';
        lines[line - 1] = prevLine + currentLine;
        lines.splice(line, 1);
        updateContent(lines.join('\n'));
        setEditorState(prev => ({
          ...prev,
          cursor: { line: line - 1, column: prevLine.length }
        }));
      }
    } else if (input && !key.ctrl && !key.meta) {
      // Insert character at cursor
      const lines = editorState.content.split('\n');
      const { line, column } = editorState.cursor;
      const currentLine = lines[line] || '';
      
      lines[line] = currentLine.substring(0, column) + input + currentLine.substring(column);
      updateContent(lines.join('\n'));
      moveCursor('right');
    }
  });

  const renderEditorContent = () => {
    const lines = editorState.content.split('\n');
    const visibleStartLine = Math.max(0, editorState.scrollTop);
    const visibleEndLine = Math.min(lines.length, visibleStartLine + editorDimensions.contentHeight);
    const visibleLines = lines.slice(visibleStartLine, visibleEndLine);

    return visibleLines.map((line, index) => {
      const lineNumber = visibleStartLine + index;
      const isCurrentLine = lineNumber === editorState.cursor.line;
      const hasError = editorState.validationResults.some(v => v.line === lineNumber && v.level === 'error');
      const hasWarning = editorState.validationResults.some(v => v.line === lineNumber && v.level === 'warning');

      return (
        <Box key={lineNumber} flexDirection="row">
          {showLineNumbers && (
            <Box width={editorDimensions.lineNumberWidth} justifyContent="flex-end" paddingRight={1}>
              <Text color={isCurrentLine ? 'cyan' : 'gray'}>
                {(lineNumber + 1).toString().padStart(3, ' ')}
              </Text>
            </Box>
          )}
          <Box flexGrow={1}>
            <Text color={hasError ? 'red' : hasWarning ? 'yellow' : 'white'}>
              <SyntaxHighlighter
                content={line}
                language={editorState.fileType}
                lineNumber={lineNumber}
                currentLine={isCurrentLine}
                cursor={isCurrentLine ? editorState.cursor : undefined}
                searchResults={currentSearch ? editorState.searchResults : []}
              />
            </Text>
          </Box>
        </Box>
      );
    });
  };

  const renderHeader = () => (
    <Box borderStyle="single" borderBottom={false} paddingX={1} height={1}>
      <Box justifyContent="space-between" width="100%">
        <Text bold color="cyan">
          {editorState.fileName}{editorState.isDirty ? ' •' : ''}
        </Text>
        <Text color="gray">
          {isInEditMode ? 'EDIT' : 'VIEW'} | {editorState.fileType.toUpperCase()}
        </Text>
      </Box>
    </Box>
  );

  const renderStatusBar = () => (
    <EditorStatusBar
      editorState={editorState}
      mode={mode}
      isInEditMode={isInEditMode}
      onToggleEditMode={() => setIsInEditMode(!isInEditMode)}
      width={editorDimensions.totalWidth}
    />
  );

  return (
    <Box flexDirection="column" width={width} height={height}>
      {renderHeader()}
      
      <Box 
        flexGrow={1} 
        borderStyle="single" 
        borderTop={false} 
        borderBottom={false}
        flexDirection="column"
      >
        <Box flexGrow={1} overflow="hidden">
          {renderEditorContent()}
        </Box>
        
        {editorState.validationResults.length > 0 && (
          <EditorValidation
            results={editorState.validationResults}
            currentLine={editorState.cursor.line}
            width={editorDimensions.totalWidth - 2}
          />
        )}
      </Box>

      {renderStatusBar()}

      {!isInEditMode && (
        <Box paddingX={1} borderStyle="single" borderTop={false}>
          <Text color="gray" dimColor>
            Press E to edit, ↑↓ to scroll, Ctrl+F to search, Ctrl+L for line numbers
          </Text>
        </Box>
      )}

      {isInEditMode && (
        <Box paddingX={1} borderStyle="single" borderTop={false}>
          <Text color="yellow">
            EDIT MODE | Ctrl+S: Save | Ctrl+Z: Undo | Ctrl+Y: Redo | Esc: Exit Edit
          </Text>
        </Box>
      )}
    </Box>
  );
};

// Validation function for scenario content
async function validateScenarioContent(content: string, fileType: 'yaml' | 'json'): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  try {
    if (fileType === 'yaml') {
      const yaml = await import('yaml');
      yaml.parse(content);
    } else {
      JSON.parse(content);
    }
  } catch (error: any) {
    results.push({
      line: 0,
      column: 0,
      message: `Syntax error: ${error.message}`,
      level: 'error',
      rule: 'syntax'
    });
  }

  // Additional scenario-specific validation can be added here
  
  return results;
}