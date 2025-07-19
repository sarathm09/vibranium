/**
 * Environment variable and secret types
 */

/**
 * Environment variable definition
 */
export interface EnvironmentVariable {
  /** Variable value */
  value: any;
  
  /** Variable type */
  type?: VariableType;
  
  /** Variable description */
  description?: string;
  
  /** Is this variable required */
  required?: boolean;
  
  /** Default value if not provided */
  default?: any;
  
  /** Validation pattern/schema */
  validation?: VariableValidation;
  
  /** Variable sensitivity level */
  sensitive?: boolean;
  
  /** Variable scope */
  scope?: VariableScope;
  
  /** Variable metadata */
  metadata?: Record<string, any>;
}

/**
 * Variable types
 */
export type VariableType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'url'
  | 'email'
  | 'json'
  | 'base64'
  | 'file';

/**
 * Variable validation configuration
 */
export interface VariableValidation {
  /** RegExp pattern for string validation */
  pattern?: string;
  
  /** Minimum value/length */
  min?: number;
  
  /** Maximum value/length */
  max?: number;
  
  /** Allowed values */
  enum?: any[];
  
  /** Custom validation function */
  custom?: string; // JavaScript expression
  
  /** JSON schema for complex validation */
  schema?: object;
}

/**
 * Variable scope
 */
export type VariableScope = 
  | 'global'     // Available to all scenarios
  | 'scenario'   // Available to current scenario
  | 'step'       // Available to current step
  | 'session';   // Available during execution session

/**
 * Secret configuration
 */
export interface SecretConfig {
  /** Secret source */
  source: SecretSource;
  
  /** Secret key/path */
  key: string;
  
  /** Secret description */
  description?: string;
  
  /** Is this secret required */
  required?: boolean;
  
  /** Default value if secret not found */
  default?: string;
  
  /** Secret transformation */
  transform?: SecretTransform;
  
  /** Cache configuration */
  cache?: SecretCacheConfig;
}

/**
 * Secret sources
 */
export type SecretSource = 
  | 'env'        // Environment variable
  | 'file'       // File content
  | 'vault'      // HashiCorp Vault
  | 'aws'        // AWS Secrets Manager
  | 'azure'      // Azure Key Vault
  | 'gcp'        // Google Secret Manager
  | 'custom';    // Custom provider

/**
 * Secret transformation
 */
export interface SecretTransform {
  /** Transformation type */
  type: 'base64' | 'json' | 'yaml' | 'trim' | 'custom';
  
  /** Custom transformation function */
  function?: string; // JavaScript expression
}

/**
 * Secret cache configuration
 */
export interface SecretCacheConfig {
  /** Enable caching */
  enabled: boolean;
  
  /** Cache TTL (seconds) */
  ttl?: number;
  
  /** Cache key prefix */
  prefix?: string;
}

/**
 * Variable resolver interface
 */
export interface VariableResolver {
  /** Resolve variable value */
  resolve(name: string, context?: any): Promise<any>;
  
  /** Set variable value */
  set(name: string, value: any, scope?: VariableScope): void;
  
  /** Check if variable exists */
  has(name: string): boolean;
  
  /** Get all variables in scope */
  getAll(scope?: VariableScope): Record<string, any>;
  
  /** Clear variables */
  clear(scope?: VariableScope): void;
  
  /** Validate variable */
  validate(name: string, value: any): ValidationResult;
}

/**
 * Secret manager interface
 */
export interface SecretManager {
  /** Get secret value */
  get(config: SecretConfig): Promise<string | null>;
  
  /** Set secret value */
  set(key: string, value: string, source?: SecretSource): Promise<void>;
  
  /** Check if secret exists */
  has(key: string, source?: SecretSource): Promise<boolean>;
  
  /** List available secrets */
  list(source?: SecretSource): Promise<string[]>;
  
  /** Register custom secret provider */
  registerProvider(name: string, provider: SecretProvider): void;
}

/**
 * Secret provider interface
 */
export interface SecretProvider {
  /** Provider name */
  name: string;
  
  /** Get secret */
  get(key: string, config?: any): Promise<string | null>;
  
  /** Set secret */
  set(key: string, value: string, config?: any): Promise<void>;
  
  /** Check if secret exists */
  has(key: string, config?: any): Promise<boolean>;
  
  /** List secrets */
  list(config?: any): Promise<string[]>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}