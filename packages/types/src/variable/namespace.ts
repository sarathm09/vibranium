/**
 * Variable namespace types
 */

/**
 * Variable namespace interface
 */
export interface VariableNamespace {
  /** Namespace name */
  name: string;
  
  /** Namespace type */
  type: NamespaceType;
  
  /** Namespace data */
  data: NamespaceData;
  
  /** Access permissions */
  permissions: NamespacePermissions;
  
  /** Namespace metadata */
  metadata: NamespaceMetadata;
  
  /** Provider for dynamic data */
  provider?: NamespaceProvider;
}

/**
 * Namespace types
 */
export type NamespaceType = 
  | 'static'    // Static data
  | 'dynamic'   // Dynamic/computed data
  | 'reference' // Reference to other namespace
  | 'function'  // Function-based namespace
  | 'external'; // External data source

/**
 * Namespace data container
 */
export interface NamespaceData {
  /** Raw data */
  raw: Record<string, any>;
  
  /** Computed properties */
  computed?: Map<string, ComputedProperty>;
  
  /** Function definitions */
  functions?: Map<string, NamespaceFunction>;
  
  /** References to other namespaces */
  references?: Map<string, NamespaceReference>;
}

/**
 * Computed property definition
 */
export interface ComputedProperty {
  /** Property name */
  name: string;
  
  /** Computation function */
  compute: (context: any) => any;
  
  /** Dependencies */
  dependencies?: string[];
  
  /** Cache configuration */
  cache?: PropertyCacheConfig;
  
  /** Validation */
  validation?: PropertyValidation;
}

/**
 * Namespace function
 */
export interface NamespaceFunction {
  /** Function name */
  name: string;
  
  /** Function implementation */
  implementation: (...args: any[]) => any;
  
  /** Parameter definitions */
  parameters?: FunctionParameter[];
  
  /** Return type */
  returnType?: string;
  
  /** Function description */
  description?: string;
  
  /** Async function */
  async?: boolean;
}

/**
 * Function parameter definition
 */
export interface FunctionParameter {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: string;
  
  /** Is required */
  required?: boolean;
  
  /** Default value */
  default?: any;
  
  /** Parameter description */
  description?: string;
  
  /** Validation */
  validation?: ParameterValidation;
}

/**
 * Namespace reference
 */
export interface NamespaceReference {
  /** Reference name */
  name: string;
  
  /** Target namespace */
  target: string;
  
  /** Target path */
  path?: string;
  
  /** Transform function */
  transform?: (value: any) => any;
}

/**
 * Namespace permissions
 */
export interface NamespacePermissions {
  /** Read permission */
  read: boolean;
  
  /** Write permission */
  write: boolean;
  
  /** Delete permission */
  delete: boolean;
  
  /** Function execution permission */
  execute: boolean;
  
  /** Access control list */
  acl?: AccessControlEntry[];
}

/**
 * Access control entry
 */
export interface AccessControlEntry {
  /** Principal (user/role) */
  principal: string;
  
  /** Permissions */
  permissions: string[];
  
  /** Conditions */
  conditions?: AccessCondition[];
}

/**
 * Access condition
 */
export interface AccessCondition {
  /** Condition type */
  type: 'time' | 'ip' | 'environment' | 'custom';
  
  /** Condition value */
  value: any;
  
  /** Condition operator */
  operator: 'equals' | 'contains' | 'regex' | 'in' | 'custom';
}

/**
 * Namespace metadata
 */
export interface NamespaceMetadata {
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  modifiedAt: Date;
  
  /** Version */
  version: string;
  
  /** Description */
  description?: string;
  
  /** Tags */
  tags?: string[];
  
  /** Owner */
  owner?: string;
  
  /** Schema */
  schema?: object;
}

/**
 * Namespace provider for dynamic data
 */
export interface NamespaceProvider {
  /** Provider name */
  name: string;
  
  /** Get value by path */
  get(path: string, context?: any): Promise<any>;
  
  /** Set value by path */
  set(path: string, value: any, context?: any): Promise<void>;
  
  /** Check if path exists */
  has(path: string, context?: any): Promise<boolean>;
  
  /** List available paths */
  list(context?: any): Promise<string[]>;
  
  /** Initialize provider */
  initialize?(config: any): Promise<void>;
  
  /** Cleanup provider */
  cleanup?(): Promise<void>;
}

/**
 * Property cache configuration
 */
export interface PropertyCacheConfig {
  /** Enable caching */
  enabled: boolean;
  
  /** TTL in milliseconds */
  ttl: number;
  
  /** Cache key strategy */
  keyStrategy: 'static' | 'dynamic' | 'custom';
  
  /** Custom key function */
  keyFunction?: (context: any) => string;
}

/**
 * Property validation
 */
export interface PropertyValidation {
  /** Validation type */
  type: 'type' | 'range' | 'pattern' | 'custom';
  
  /** Validation config */
  config: any;
  
  /** Error message */
  errorMessage?: string;
}

/**
 * Parameter validation
 */
export interface ParameterValidation {
  /** Validation rules */
  rules: ValidationRule[];
  
  /** Custom validator */
  custom?: (value: any) => boolean | string;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule type */
  type: 'required' | 'type' | 'min' | 'max' | 'pattern' | 'enum';
  
  /** Rule value */
  value?: any;
  
  /** Error message */
  message?: string;
}

/**
 * Namespace registry
 */
export interface NamespaceRegistry {
  /** Register namespace */
  register(namespace: VariableNamespace): void;
  
  /** Unregister namespace */
  unregister(name: string): void;
  
  /** Get namespace */
  get(name: string): VariableNamespace | undefined;
  
  /** List all namespaces */
  list(): string[];
  
  /** Check if namespace exists */
  has(name: string): boolean;
  
  /** Create namespace */
  create(config: NamespaceConfig): VariableNamespace;
}

/**
 * Namespace configuration
 */
export interface NamespaceConfig {
  /** Namespace name */
  name: string;
  
  /** Namespace type */
  type: NamespaceType;
  
  /** Initial data */
  data?: Record<string, any>;
  
  /** Provider configuration */
  provider?: ProviderConfig;
  
  /** Permissions */
  permissions?: Partial<NamespacePermissions>;
  
  /** Metadata */
  metadata?: Partial<NamespaceMetadata>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Provider type */
  type: string;
  
  /** Provider-specific config */
  config: Record<string, any>;
}

/**
 * Built-in namespace types
 */
export const BUILTIN_NAMESPACES = {
  ENV: 'env',           // Environment variables
  GLOBAL: 'global',     // Global configuration
  CONTEXT: 'context',   // Execution context
  RESPONSE: 'response', // Last response data
  REQUEST: 'request',   // Last request data
  API: 'api',          // Current API step
  RANDOM: 'random',    // Random data generators
} as const;

/**
 * Namespace events
 */
export interface NamespaceEvent {
  /** Event type */
  type: 'created' | 'updated' | 'deleted' | 'accessed';
  
  /** Namespace name */
  namespace: string;
  
  /** Event data */
  data?: any;
  
  /** Timestamp */
  timestamp: Date;
  
  /** User/system that triggered the event */
  actor?: string;
}

/**
 * Namespace event listener
 */
export type NamespaceEventListener = (event: NamespaceEvent) => void;

/**
 * Namespace manager
 */
export interface NamespaceManager {
  /** Get namespace registry */
  getRegistry(): NamespaceRegistry;
  
  /** Create built-in namespaces */
  createBuiltins(): void;
  
  /** Subscribe to namespace events */
  subscribe(listener: NamespaceEventListener): void;
  
  /** Unsubscribe from namespace events */
  unsubscribe(listener: NamespaceEventListener): void;
  
  /** Emit namespace event */
  emit(event: NamespaceEvent): void;
}