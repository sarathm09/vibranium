/**
 * Scenario definition types
 */

import type { Step } from './step';
import type { LifecycleHooks } from './lifecycle';
import type { DependsOn } from './dependency';
import type { Environment } from '../environment/environment';

/**
 * Core scenario structure
 */
export interface Scenario {
  /** Unique name for the scenario */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** Scenario version for compatibility */
  version?: string;
  
  /** Lifecycle hooks for the scenario */
  lifecycle?: LifecycleHooks;
  
  /** Global dependencies for the scenario */
  dependsOn?: DependsOn[];
  
  /** Array of steps to execute */
  steps: Step[];
  
  /** Environment-specific configurations */
  environments?: Record<string, Partial<Environment>>;
  
  /** Global configuration */
  config?: ScenarioConfig;
  
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Scenario-level configuration
 */
export interface ScenarioConfig {
  /** Global timeout for all steps (ms) */
  timeout?: number;
  
  /** Global retry configuration */
  retries?: number;
  
  /** Parallel execution settings */
  parallel?: {
    enabled: boolean;
    maxConcurrency?: number;
  };
  
  /** Fail-fast behavior */
  failFast?: boolean;
  
  /** Global headers */
  headers?: Record<string, string>;
  
  /** Global variables */
  variables?: Record<string, any>;
}

/**
 * Scenario execution metadata
 */
export interface ScenarioMetadata {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  environment: string;
  createdAt: Date;
  tags?: string[];
  author?: string;
  version?: string;
}