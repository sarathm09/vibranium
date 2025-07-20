/**
 * Step definition types
 */

import type { DependsOn } from './dependency';
import type { ExpectBlock } from '../validation/expect';
import type { HttpMethod } from '../http';

/**
 * Base step interface - all step types extend this
 */
export interface Step {
  /** Step name for identification */
  name: string;
  
  /** Step type - determines which plugin executes it */
  type: StepType;
  
  /** Optional description */
  description?: string;
  
  /** Step-specific dependencies */
  dependsOn?: DependsOn[];
  
  /** Skip this step conditionally */
  skip?: boolean | string; // boolean or condition expression
  
  /** Timeout for this step (ms) */
  timeout?: number;
  
  /** Retry configuration */
  retries?: number;
  
  /** Validation expectations */
  expect?: ExpectBlock;
  
  /** Step-specific configuration */
  config?: Record<string, any>;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * API step - HTTP request step
 */
export interface ApiStep extends Step {
  type: 'api';
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  auth?: AuthConfig;
  followRedirects?: boolean;
  validateStatus?: (status: number) => boolean;
}

/**
 * UI step - Browser automation step (future)
 */
export interface UiStep extends Step {
  type: 'ui';
  action: UiAction;
  selector?: string;
  value?: any;
  wait?: WaitConfig;
  screenshot?: boolean;
}

/**
 * Custom step - Plugin-defined step
 */
export interface CustomStep extends Step {
  type: string; // Custom type handled by plugins
  [key: string]: any; // Plugin-specific properties
}

/**
 * Union of all step types
 */
export type AnyStep = ApiStep | UiStep | CustomStep;

/**
 * Step types supported by core and plugins
 */
export type StepType = 'api' | 'ui' | string;

/**
 * HTTP methods for API steps
 */
// HttpMethod is defined in http.ts to avoid duplication

/**
 * Authentication configuration for API steps
 */
export interface AuthConfig {
  type: 'basic' | 'bearer' | 'apikey' | 'oauth2' | 'custom';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  keyName?: string;
  location?: 'header' | 'query' | 'body';
  scheme?: string; // For custom auth schemes
  config?: Record<string, any>; // Type-specific config
}

/**
 * UI actions for browser automation
 */
export type UiAction = 
  | 'goto'
  | 'click'
  | 'type'
  | 'select'
  | 'hover'
  | 'scroll'
  | 'wait'
  | 'screenshot'
  | 'evaluate'
  | 'upload';

/**
 * Wait configuration for UI steps
 */
export interface WaitConfig {
  type: 'time' | 'element' | 'text' | 'url' | 'function';
  value?: any;
  timeout?: number;
  polling?: number;
}

/**
 * Step execution status
 */
export type StepStatus = 
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'blocked';

/**
 * Step result after execution
 */
export interface StepResult {
  /** The executed step */
  step: Step;
  
  /** Execution status */
  status: StepStatus;
  
  /** Start time */
  startTime?: Date;
  
  /** End time */
  endTime?: Date;
  
  /** Execution duration in milliseconds */
  duration?: number;
  
  /** Error if step failed */
  error?: Error;
  
  /** Step output data */
  data?: any;
  
  /** Request data for API steps */
  request?: any;
  
  /** Response data for API steps */
  response?: any;
  
  /** Execution logs */
  logs?: string[];
  
  /** Validation results */
  validationResults?: any[];
  
  /** Screenshots for UI steps */
  screenshots?: string[];
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}