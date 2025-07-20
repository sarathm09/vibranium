/**
 * Enhanced variable state management types for interactive mode
 */

import { VibraniumVariableMap } from '@vibraniumjs/types';

/**
 * Variable metadata for tracking state and usage
 */
export interface VariableMetadata {
  /** Variable full path (e.g., $.env.API_URL) */
  path: string;
  
  /** Variable category */
  category: VariableCategory;
  
  /** Variable data type */
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
  
  /** Variable source */
  source: VariableSource;
  
  /** When the variable was created/first set */
  createdAt: Date;
  
  /** When the variable was last updated */
  updatedAt: Date;
  
  /** Variable size in bytes (for objects/arrays) */
  size?: number;
  
  /** Whether the variable is computed/dynamic */
  isComputed: boolean;
  
  /** Dependencies on other variables */
  dependencies: string[];
  
  /** Variables that depend on this one */
  dependents: string[];
  
  /** Usage count */
  usageCount: number;
  
  /** Steps where this variable is used */
  usedInSteps: VariableUsage[];
  
  /** Whether the variable is bookmarked */
  isBookmarked: boolean;
  
  /** Custom tags for organization */
  tags: string[];
  
  /** Variable description/notes */
  description?: string;
}

/**
 * Variable categories for organization
 */
export type VariableCategory = 
  | 'environment'  // $.env.*
  | 'global'       // $.global.*
  | 'context'      // $.context.*
  | 'scenario'     // $.scenario.*
  | 'api'          // $.api.*
  | 'ui'           // $.ui.*
  | 'request'      // $.request.*
  | 'response'     // $.response.*
  | 'random'       // $.random.*
  | 'history'      // $.history.*
  | 'custom';      // Custom namespaces

/**
 * Variable source types
 */
export type VariableSource = 
  | 'environment'    // From environment files
  | 'scenario'       // From scenario definition
  | 'runtime'        // Generated at runtime
  | 'user'           // User input
  | 'system'         // System generated
  | 'response'       // From API responses
  | 'computed';      // Computed from other variables

/**
 * Variable usage tracking
 */
export interface VariableUsage {
  /** Step index where variable is used */
  stepIndex: number;
  
  /** Step name */
  stepName: string;
  
  /** Usage type */
  usageType: 'read' | 'write' | 'reference';
  
  /** Field where variable is used */
  field: string;
  
  /** Usage timestamp */
  timestamp: Date;
}

/**
 * Variable state entry
 */
export interface VariableStateEntry {
  /** Variable metadata */
  metadata: VariableMetadata;
  
  /** Current value */
  value: any;
  
  /** Previous value (for change tracking) */
  previousValue?: any;
  
  /** Value history */
  history: VariableValueHistory[];
  
  /** Whether the variable has changed recently */
  hasRecentChange: boolean;
  
  /** Change timestamp */
  lastChangeTime?: Date;
}

/**
 * Variable value history entry
 */
export interface VariableValueHistory {
  /** Historical value */
  value: any;
  
  /** When this value was set */
  timestamp: Date;
  
  /** Source of the change */
  source: string;
  
  /** Reason for change */
  reason?: string;
}

/**
 * Variable filter options
 */
export interface VariableFilter {
  /** Text search pattern */
  searchPattern?: string;
  
  /** Category filter */
  categories?: VariableCategory[];
  
  /** Source filter */
  sources?: VariableSource[];
  
  /** Data type filter */
  dataTypes?: string[];
  
  /** Show only bookmarked variables */
  bookmarkedOnly?: boolean;
  
  /** Show only recently changed variables */
  recentChangesOnly?: boolean;
  
  /** Show only variables with dependencies */
  withDependenciesOnly?: boolean;
  
  /** Value range filter (for numbers) */
  valueRange?: { min?: number; max?: number };
  
  /** Usage filter */
  usageFilter?: { minUsage?: number; maxUsage?: number };
}

/**
 * Variable sort options
 */
export interface VariableSortOptions {
  /** Sort field */
  field: 'name' | 'category' | 'updatedAt' | 'usageCount' | 'size';
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Variable inspector data
 */
export interface VariableInspectorData {
  /** Variable metadata */
  metadata: VariableMetadata;
  
  /** Current value */
  value: any;
  
  /** Formatted value for display */
  formattedValue: string;
  
  /** JSON path if object/array */
  jsonPath?: string;
  
  /** Dependency tree */
  dependencyTree: VariableDependency[];
  
  /** Usage analysis */
  usageAnalysis: VariableUsageAnalysis;
  
  /** Value statistics */
  statistics?: VariableStatistics;
}

/**
 * Variable dependency information
 */
export interface VariableDependency {
  /** Variable path */
  path: string;
  
  /** Dependency type */
  type: 'direct' | 'indirect' | 'circular';
  
  /** Dependency level (0 = direct) */
  level: number;
  
  /** Whether dependency is currently available */
  isAvailable: boolean;
}

/**
 * Variable usage analysis
 */
export interface VariableUsageAnalysis {
  /** Total usage count */
  totalUsage: number;
  
  /** Usage by step */
  usageByStep: Map<number, number>;
  
  /** Usage types distribution */
  usageTypes: { read: number; write: number; reference: number };
  
  /** First usage timestamp */
  firstUsed?: Date;
  
  /** Last usage timestamp */
  lastUsed?: Date;
  
  /** Most frequent usage context */
  frequentContext?: string;
}

/**
 * Variable statistics
 */
export interface VariableStatistics {
  /** Value changes count */
  changeCount: number;
  
  /** Average value (for numbers) */
  average?: number;
  
  /** Min/max values (for numbers) */
  range?: { min: number; max: number };
  
  /** Value distribution (for strings/enums) */
  distribution?: Map<string, number>;
  
  /** Memory usage */
  memoryUsage: number;
}

/**
 * Variable operation result
 */
export interface VariableOperationResult {
  /** Operation success */
  success: boolean;
  
  /** Result message */
  message: string;
  
  /** Operation data */
  data?: any;
  
  /** Error details if failed */
  error?: string;
}

/**
 * Variable state manager interface
 */
export interface IVariableStateManager {
  /** Get all variables */
  getAllVariables(): Map<string, VariableStateEntry>;
  
  /** Get variable by path */
  getVariable(path: string): VariableStateEntry | undefined;
  
  /** Set variable value */
  setVariable(path: string, value: any, source: VariableSource, reason?: string): void;
  
  /** Update variable metadata */
  updateMetadata(path: string, metadata: Partial<VariableMetadata>): void;
  
  /** Track variable usage */
  trackUsage(path: string, stepIndex: number, stepName: string, usageType: 'read' | 'write' | 'reference', field: string): void;
  
  /** Filter variables */
  filterVariables(filter: VariableFilter): Map<string, VariableStateEntry>;
  
  /** Sort variables */
  sortVariables(variables: Map<string, VariableStateEntry>, sort: VariableSortOptions): [string, VariableStateEntry][];
  
  /** Get variable inspector data */
  getInspectorData(path: string): VariableInspectorData | undefined;
  
  /** Bookmark variable */
  bookmarkVariable(path: string): VariableOperationResult;
  
  /** Copy variable value */
  copyVariable(path: string): VariableOperationResult;
  
  /** Get dependency graph */
  getDependencyGraph(): Map<string, string[]>;
  
  /** Clear variable history */
  clearHistory(path?: string): void;
  
  /** Export variables */
  exportVariables(format: 'json' | 'yaml' | 'csv'): string;
  
  /** Subscribe to variable changes */
  subscribe(callback: (event: VariableChangeEvent) => void): void;
  
  /** Unsubscribe from variable changes */
  unsubscribe(callback: (event: VariableChangeEvent) => void): void;
}

/**
 * Variable change event
 */
export interface VariableChangeEvent {
  /** Event type */
  type: 'created' | 'updated' | 'deleted' | 'accessed';
  
  /** Variable path */
  path: string;
  
  /** New value */
  newValue?: any;
  
  /** Previous value */
  previousValue?: any;
  
  /** Change source */
  source: VariableSource;
  
  /** Change timestamp */
  timestamp: Date;
  
  /** Change reason */
  reason?: string;
  
  /** Step context */
  stepContext?: { index: number; name: string };
}