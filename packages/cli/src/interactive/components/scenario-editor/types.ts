/**
 * TypeScript definitions for Scenario Editor components
 */

export type EditorMode = 'text' | 'visual' | 'split' | 'preview';

export type EditorTheme = 'dark' | 'light' | 'vibranium';

export type ValidationLevel = 'error' | 'warning' | 'info' | 'hint';

export interface ValidationResult {
  line: number;
  column: number;
  message: string;
  level: ValidationLevel;
  rule?: string;
  suggestions?: string[];
}

export interface SearchOptions {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  replaceWith?: string;
}

export interface EditorPosition {
  line: number;
  column: number;
}

export interface EditorSelection {
  start: EditorPosition;
  end: EditorPosition;
}

export interface StepTemplate {
  id: string;
  name: string;
  description: string;
  category: 'api' | 'ui' | 'validation' | 'flow' | 'custom';
  template: string;
  variables?: string[];
  dependencies?: string[];
}

export interface EditorState {
  content: string;
  fileName: string;
  fileType: 'yaml' | 'json';
  isDirty: boolean;
  isReadOnly: boolean;
  cursor: EditorPosition;
  selection?: EditorSelection;
  scrollTop: number;
  scrollLeft: number;
  validationResults: ValidationResult[];
  searchResults: EditorPosition[];
  isAutoSaveEnabled: boolean;
  lastSaved?: Date;
  history: EditorHistoryEntry[];
  historyIndex: number;
}

export interface EditorHistoryEntry {
  content: string;
  cursor: EditorPosition;
  timestamp: Date;
  operation: string;
}

export interface FileSystemNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  isScenario?: boolean;
  children?: FileSystemNode[];
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: Date;
  pinned?: boolean;
}

export interface EditorPreferences {
  theme: EditorTheme;
  fontSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  autoIndent: boolean;
  autoComplete: boolean;
  minimap: boolean;
  folding: boolean;
  matchBrackets: boolean;
  highlightCurrentLine: boolean;
  showWhitespace: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface SyntaxToken {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'operator' | 'variable' | 'property';
  start: number;
  end: number;
  value: string;
}

export interface AutoCompleteItem {
  label: string;
  detail?: string;
  documentation?: string;
  insertText: string;
  kind: 'property' | 'value' | 'snippet' | 'keyword' | 'function';
  sortText?: string;
}

export interface EditorCommand {
  id: string;
  name: string;
  description: string;
  keybinding?: string[];
  handler: (editor: EditorState) => void | Promise<void>;
}

export interface VisualStepNode {
  id: string;
  type: string;
  name: string;
  description?: string;
  position: { x: number; y: number };
  inputs: VisualStepConnection[];
  outputs: VisualStepConnection[];
  status?: 'pending' | 'running' | 'success' | 'error';
  config: Record<string, any>;
}

export interface VisualStepConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'data' | 'control' | 'error';
  label?: string;
}

export interface VisualFlowDiagram {
  nodes: VisualStepNode[];
  connections: VisualStepConnection[];
  selectedNode?: string;
  draggedNode?: string;
  zoomLevel: number;
  panOffset: { x: number; y: number };
}

export interface ScenarioMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];
  created?: Date;
  modified?: Date;
  dependencies?: string[];
  variables?: string[];
  environments?: string[];
}