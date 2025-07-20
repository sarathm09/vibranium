/**
 * Execution context types
 */

import type { Scenario } from '../scenario/scenario';
import type { Environment } from '../environment/environment';
import type { VariableContext } from '../variable/context';
import type { StepResult } from '../scenario/step';
import type { DependencyResult } from '../scenario/dependency';
import type { ExecutionError, ReportFormat } from './result';
import type { RetryConfig } from '../http';
import type { PluginRegistry } from '../plugin';

/**
 * Core execution context
 */
export interface ExecutionContext {
  /** Unique execution ID */
  id: string;
  
  /** Scenario being executed */
  scenario: Scenario;
  
  /** Active environment */
  environment: Environment;
  
  /** Variable context */
  variables: VariableContext;
  
  /** Execution metadata */
  metadata: ExecutionMetadata;
  
  /** Step results */
  results: Map<string, StepResult>;
  
  /** Dependency results */
  dependencies: Map<string, DependencyResult>;
  
  /** Current step index */
  currentStepIndex?: number;
  
  /** Execution state */
  state: ExecutionState;
  
  /** Error information */
  error?: ExecutionError;
  
  /** Execution configuration */
  config: ExecutionConfig;
  
  /** Logger instance */
  logger: Logger;
  
  /** Plugin registry */
  plugins: PluginRegistry;
}

/**
 * Execution metadata
 */
export interface ExecutionMetadata {
  /** Start time */
  startedAt: Date;
  
  /** End time */
  endedAt?: Date;
  
  /** Total duration (ms) */
  duration?: number;
  
  /** Execution mode */
  mode: ExecutionMode;
  
  /** User/system that initiated execution */
  initiator?: string;
  
  /** Execution tags */
  tags?: string[];
  
  /** Parent execution ID (for nested executions) */
  parentId?: string;
  
  /** Child execution IDs */
  childIds?: string[];
  
  /** Resource usage */
  resources?: ResourceUsage;
}

/**
 * Execution modes
 */
export type ExecutionMode = 
  | 'interactive'  // Interactive CLI mode
  | 'batch'        // Batch execution
  | 'headless'     // Headless execution
  | 'debug'        // Debug mode
  | 'dryrun'       // Dry run (validate only)
  | 'parallel'     // Parallel execution
  | 'sequential';  // Sequential execution

/**
 * Execution state
 */
export type ExecutionState = 
  | 'pending'      // Not started
  | 'initializing' // Setting up
  | 'running'      // In progress
  | 'paused'       // Paused (interactive)
  | 'completed'    // Finished successfully
  | 'failed'       // Failed with errors
  | 'cancelled'    // Cancelled by user
  | 'timeout';     // Timed out

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  /** Global timeout (ms) */
  timeout?: number;
  
  /** Retry configuration */
  retries?: RetryConfig;
  
  /** Parallel execution settings */
  parallel?: ParallelConfig;
  
  /** Fail-fast behavior */
  failFast?: boolean;
  
  /** Continue on step failure */
  continueOnFailure?: boolean;
  
  /** Generate reports */
  reporting?: ReportingConfig;
  
  /** Debug configuration */
  debug?: DebugConfig;
  
  /** Performance monitoring */
  performance?: PerformanceConfig;
}

// RetryConfig is defined in http.ts to avoid duplication

/**
 * Parallel execution configuration
 */
export interface ParallelConfig {
  /** Enable parallel execution */
  enabled: boolean;
  
  /** Maximum concurrent steps */
  maxConcurrency: number;
  
  /** Batch size for parallel execution */
  batchSize?: number;
  
  /** Dependency resolution strategy */
  dependencyStrategy?: 'strict' | 'optimistic';
}

/**
 * Reporting configuration
 */
export interface ReportingConfig {
  /** Enable reporting */
  enabled: boolean;
  
  /** Report formats */
  formats: ReportFormat[];
  
  /** Output directory */
  outputDir?: string;
  
  /** Include screenshots */
  includeScreenshots?: boolean;
  
  /** Include request/response data */
  includeData?: boolean;
}

// ReportFormat is defined in result.ts to avoid duplication

/**
 * Debug configuration
 */
export interface DebugConfig {
  /** Enable debug mode */
  enabled: boolean;
  
  /** Debug level */
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  
  /** Pause on failure */
  pauseOnFailure?: boolean;
  
  /** Pause on specific steps */
  pauseOnSteps?: string[];
  
  /** Save debug artifacts */
  saveArtifacts?: boolean;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enabled: boolean;
  
  /** Collect memory usage */
  collectMemory?: boolean;
  
  /** Collect CPU usage */
  collectCpu?: boolean;
  
  /** Collect network metrics */
  collectNetwork?: boolean;
  
  /** Sampling interval (ms) */
  samplingInterval?: number;
}

/**
 * Resource usage metrics
 */
export interface ResourceUsage {
  /** Memory usage (bytes) */
  memory?: {
    peak: number;
    average: number;
    current: number;
  };
  
  /** CPU usage (%) */
  cpu?: {
    peak: number;
    average: number;
    current: number;
  };
  
  /** Network usage */
  network?: {
    bytesIn: number;
    bytesOut: number;
    requests: number;
  };
}

// ExecutionError is defined in result.ts to avoid duplication

/**
 * Logger interface
 */
export interface Logger {
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  trace(message: string, ...args: any[]): void;
}

/**
 * Plugin registry interface
 */
// PluginRegistry is defined in plugin.ts to avoid duplication

/**
 * Plugin interface (simplified)
 */
export interface Plugin {
  name: string;
  version: string;
  stepTypes: string[];
}