/**
 * Variable resolver types
 */

import type { VariableNamespace } from './namespace';

/**
 * Dot notation resolver interface
 */
export interface DotNotationResolver {
  /** Resolve a dot notation expression */
  resolve(expression: string, context: VariableContext): Promise<any>;
  
  /** Set value using dot notation */
  set(path: string, value: any, context: VariableContext): Promise<void>;
  
  /** Check if path exists */
  has(path: string, context: VariableContext): Promise<boolean>;
  
  /** Delete value at path */
  delete(path: string, context: VariableContext): Promise<boolean>;
  
  /** Get all paths in context */
  getPaths(context: VariableContext): string[];
  
  /** Validate path syntax */
  validatePath(path: string): ValidationResult;
}

/**
 * Variable context for resolution
 */
export interface VariableContext {
  /** Available namespaces */
  namespaces: Map<string, VariableNamespace>;
  
  /** Current execution context */
  execution?: ExecutionContext;
  
  /** Resolver configuration */
  config: ResolverConfig;
  
  /** Cache for resolved values */
  cache?: VariableCache;
  
  /** Security policies */
  security?: SecurityPolicy;
}

/**
 * Resolver configuration
 */
export interface ResolverConfig {
  /** Enable caching */
  enableCache: boolean;
  
  /** Cache TTL (ms) */
  cacheTtl?: number;
  
  /** Allow dynamic evaluation */
  allowEval: boolean;
  
  /** Allow function calls */
  allowFunctions: boolean;
  
  /** Maximum recursion depth */
  maxDepth: number;
  
  /** Strict mode (fail on undefined) */
  strictMode: boolean;
  
  /** Custom resolvers */
  customResolvers?: Map<string, CustomResolver>;
}

/**
 * Variable cache interface
 */
export interface VariableCache {
  /** Get cached value */
  get(key: string): CacheEntry | undefined;
  
  /** Set cached value */
  set(key: string, value: any, ttl?: number): void;
  
  /** Check if key exists */
  has(key: string): boolean;
  
  /** Delete cached value */
  delete(key: string): boolean;
  
  /** Clear all cache */
  clear(): void;
  
  /** Get cache stats */
  stats(): CacheStats;
}

/**
 * Cache entry
 */
export interface CacheEntry {
  /** Cached value */
  value: any;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Expiration timestamp */
  expiresAt?: number;
  
  /** Access count */
  accessCount: number;
  
  /** Last access timestamp */
  lastAccessed: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total entries */
  size: number;
  
  /** Cache hits */
  hits: number;
  
  /** Cache misses */
  misses: number;
  
  /** Hit ratio */
  hitRatio: number;
  
  /** Memory usage (bytes) */
  memoryUsage: number;
}

/**
 * Security policy for variable access
 */
export interface SecurityPolicy {
  /** Allowed namespaces */
  allowedNamespaces?: string[];
  
  /** Forbidden paths */
  forbiddenPaths?: string[];
  
  /** Require authentication for access */
  requireAuth?: boolean;
  
  /** Maximum value size (bytes) */
  maxValueSize?: number;
  
  /** Audit access */
  auditAccess?: boolean;
  
  /** Custom validators */
  validators?: SecurityValidator[];
}

/**
 * Security validator
 */
export interface SecurityValidator {
  /** Validator name */
  name: string;
  
  /** Validate access */
  validate(path: string, operation: 'read' | 'write' | 'delete', context: VariableContext): boolean;
  
  /** Error message for failed validation */
  errorMessage?: string;
}

/**
 * Custom resolver for specific patterns
 */
export interface CustomResolver {
  /** Pattern to match */
  pattern: RegExp;
  
  /** Resolver function */
  resolve(match: RegExpMatchArray, context: VariableContext): Promise<any>;
  
  /** Priority (higher = earlier) */
  priority?: number;
  
  /** Cache results */
  cacheable?: boolean;
}

/**
 * Path parser result
 */
export interface ParsedPath {
  /** Root namespace */
  namespace: string;
  
  /** Path segments */
  segments: PathSegment[];
  
  /** Full path */
  fullPath: string;
  
  /** Is array access */
  hasArrayAccess: boolean;
  
  /** Is function call */
  hasFunctionCall: boolean;
}

/**
 * Path segment
 */
export interface PathSegment {
  /** Segment type */
  type: 'property' | 'index' | 'function' | 'expression';
  
  /** Segment value */
  value: string | number;
  
  /** Function arguments (if function) */
  args?: any[];
  
  /** Expression (if dynamic) */
  expression?: string;
}

/**
 * Resolution result
 */
export interface ResolutionResult {
  /** Resolved value */
  value: any;
  
  /** Resolution path */
  path: string;
  
  /** Source namespace */
  namespace: string;
  
  /** Resolution metadata */
  metadata: ResolutionMetadata;
}

/**
 * Resolution metadata
 */
export interface ResolutionMetadata {
  /** Resolution timestamp */
  timestamp: number;
  
  /** Resolution duration (ms) */
  duration: number;
  
  /** Was cached */
  fromCache: boolean;
  
  /** Resolver used */
  resolver: string;
  
  /** Resolution depth */
  depth: number;
  
  /** Any warnings */
  warnings?: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  valid: boolean;
  
  /** Error messages */
  errors: string[];
  
  /** Warning messages */
  warnings: string[];
}

/**
 * Variable watcher interface
 */
export interface VariableWatcher {
  /** Watch for changes */
  watch(path: string, callback: WatchCallback): WatchHandle;
  
  /** Stop watching */
  unwatch(handle: WatchHandle): void;
  
  /** Stop all watches */
  unwatchAll(): void;
}

/**
 * Watch callback
 */
export type WatchCallback = (change: VariableChange) => void;

/**
 * Watch handle
 */
export interface WatchHandle {
  id: string;
  path: string;
  callback: WatchCallback;
}

/**
 * Variable change event
 */
export interface VariableChange {
  /** Change type */
  type: 'set' | 'delete' | 'clear';
  
  /** Changed path */
  path: string;
  
  /** Old value */
  oldValue?: any;
  
  /** New value */
  newValue?: any;
  
  /** Change timestamp */
  timestamp: number;
}

/**
 * Execution context (simplified reference)
 */
export interface ExecutionContext {
  id: string;
  scenario: any;
  environment: any;
  metadata: any;
}