/**
 * Environment configuration types
 */

import type { EnvironmentVariable, SecretConfig } from './variable';

/**
 * Environment configuration
 */
export interface Environment {
  /** Environment name */
  name: string;
  
  /** Environment description */
  description?: string;
  
  /** Base URL for API calls */
  baseUrl?: string;
  
  /** Default timeout (ms) */
  timeout?: number;
  
  /** Default retry count */
  retries?: number;
  
  /** Environment variables */
  variables: Record<string, EnvironmentVariable>;
  
  /** Secret configurations */
  secrets?: Record<string, SecretConfig>;
  
  /** Default headers */
  headers?: Record<string, string>;
  
  /** SSL/TLS configuration */
  ssl?: SslConfig;
  
  /** Proxy configuration */
  proxy?: ProxyConfig;
  
  /** Authentication defaults */
  auth?: DefaultAuthConfig;
  
  /** Rate limiting */
  rateLimit?: RateLimitConfig;
  
  /** Environment-specific plugins */
  plugins?: PluginConfig[];
  
  /** Custom configuration */
  config?: Record<string, any>;
  
  /** Environment metadata */
  metadata?: EnvironmentMetadata;
}

/**
 * SSL/TLS configuration
 */
export interface SslConfig {
  /** Verify SSL certificates */
  verify?: boolean;
  
  /** Custom CA certificates */
  ca?: string | string[];
  
  /** Client certificate */
  cert?: string;
  
  /** Client private key */
  key?: string;
  
  /** Passphrase for private key */
  passphrase?: string;
  
  /** Minimum TLS version */
  minVersion?: 'TLSv1' | 'TLSv1.1' | 'TLSv1.2' | 'TLSv1.3';
  
  /** Maximum TLS version */
  maxVersion?: 'TLSv1' | 'TLSv1.1' | 'TLSv1.2' | 'TLSv1.3';
}

/**
 * Proxy configuration
 */
export interface ProxyConfig {
  /** Proxy URL */
  url: string;
  
  /** Proxy authentication */
  auth?: {
    username: string;
    password: string;
  };
  
  /** Bypass proxy for these hosts */
  bypass?: string[];
}

/**
 * Default authentication configuration
 */
export interface DefaultAuthConfig {
  /** Default auth type */
  type: 'basic' | 'bearer' | 'apikey' | 'oauth2';
  
  /** Default credentials */
  credentials?: Record<string, any>;
  
  /** Token refresh configuration */
  refresh?: {
    url: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
  };
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  
  /** Time window (ms) */
  windowMs: number;
  
  /** Delay between requests (ms) */
  delay?: number;
  
  /** Skip rate limiting for certain requests */
  skip?: (request: any) => boolean;
}

/**
 * Plugin configuration for environment
 */
export interface PluginConfig {
  /** Plugin name */
  name: string;
  
  /** Plugin configuration */
  config?: Record<string, any>;
  
  /** Plugin enabled */
  enabled?: boolean;
}

/**
 * Environment metadata
 */
export interface EnvironmentMetadata {
  /** Environment type */
  type?: 'development' | 'testing' | 'staging' | 'production' | 'custom';
  
  /** Environment owner */
  owner?: string;
  
  /** Creation date */
  createdAt?: Date;
  
  /** Last modified date */
  modifiedAt?: Date;
  
  /** Environment version */
  version?: string;
  
  /** Tags for organization */
  tags?: string[];
  
  /** Notes */
  notes?: string;
}

/**
 * Environment manager interface
 */
export interface EnvironmentManager {
  /** Load environment by name */
  load(name: string): Promise<Environment>;
  
  /** Save environment */
  save(environment: Environment): Promise<void>;
  
  /** List available environments */
  list(): Promise<string[]>;
  
  /** Get current environment */
  getCurrent(): Environment | null;
  
  /** Set current environment */
  setCurrent(name: string): Promise<void>;
  
  /** Validate environment configuration */
  validate(environment: Environment): ValidationResult[];
  
  /** Merge environments */
  merge(base: Environment, override: Partial<Environment>): Environment;
}

/**
 * Environment validation result
 */
export interface ValidationResult {
  /** Validation passed */
  valid: boolean;
  
  /** Error messages */
  errors: string[];
  
  /** Warning messages */
  warnings: string[];
}