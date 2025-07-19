/**
 * Execution result types
 */

import type { Scenario } from '../scenario/scenario';
import type { Environment } from '../environment/environment';
import type { StepResult } from '../scenario/step';
import type { ValidationResult } from '../validation/result';
import type { ExecutionContext, ExecutionMetadata, ResourceUsage } from './context';

/**
 * Scenario execution result
 */
export interface ScenarioResult {
  /** Execution ID */
  id: string;
  
  /** Executed scenario */
  scenario: Scenario;
  
  /** Environment used */
  environment: Environment;
  
  /** Overall execution status */
  status: ExecutionStatus;
  
  /** Execution metadata */
  metadata: ExecutionMetadata;
  
  /** Individual step results */
  stepResults: StepResult[];
  
  /** Validation results */
  validationResults: ValidationResult[];
  
  /** Execution summary */
  summary: ExecutionSummary;
  
  /** Error information */
  error?: ExecutionError;
  
  /** Artifacts generated */
  artifacts: ExecutionArtifact[];
  
  /** Resource usage */
  resources?: ResourceUsage;
}

/**
 * Execution status
 */
export type ExecutionStatus = 
  | 'passed'    // All steps passed
  | 'failed'    // One or more steps failed
  | 'error'     // Execution error
  | 'cancelled' // Cancelled by user
  | 'timeout'   // Execution timeout
  | 'skipped';  // Scenario was skipped

/**
 * Execution summary
 */
export interface ExecutionSummary {
  /** Total steps */
  totalSteps: number;
  
  /** Passed steps */
  passedSteps: number;
  
  /** Failed steps */
  failedSteps: number;
  
  /** Skipped steps */
  skippedSteps: number;
  
  /** Total assertions */
  totalAssertions: number;
  
  /** Passed assertions */
  passedAssertions: number;
  
  /** Failed assertions */
  failedAssertions: number;
  
  /** Total execution time (ms) */
  duration: number;
  
  /** Average step duration (ms) */
  averageStepDuration: number;
  
  /** Success rate (%) */
  successRate: number;
}

/**
 * Execution artifacts
 */
export interface ExecutionArtifact {
  /** Artifact type */
  type: ArtifactType;
  
  /** Artifact name */
  name: string;
  
  /** File path */
  path: string;
  
  /** Artifact size (bytes) */
  size: number;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Associated step */
  stepName?: string;
  
  /** Artifact metadata */
  metadata?: Record<string, any>;
}

/**
 * Artifact types
 */
export type ArtifactType = 
  | 'screenshot'    // UI screenshots
  | 'video'         // Screen recordings
  | 'log'           // Execution logs
  | 'request'       // HTTP request data
  | 'response'      // HTTP response data
  | 'report'        // Test reports
  | 'trace'         // Execution traces
  | 'dump'          // Memory/state dumps
  | 'custom';       // Plugin-specific artifacts

/**
 * Batch execution result
 */
export interface BatchResult {
  /** Batch execution ID */
  id: string;
  
  /** Batch metadata */
  metadata: BatchMetadata;
  
  /** Individual scenario results */
  scenarioResults: ScenarioResult[];
  
  /** Batch summary */
  summary: BatchSummary;
  
  /** Batch artifacts */
  artifacts: ExecutionArtifact[];
  
  /** Overall status */
  status: ExecutionStatus;
}

/**
 * Batch execution metadata
 */
export interface BatchMetadata {
  /** Start time */
  startedAt: Date;
  
  /** End time */
  endedAt?: Date;
  
  /** Total duration (ms) */
  duration?: number;
  
  /** Environment used */
  environment: string;
  
  /** Execution mode */
  mode: 'sequential' | 'parallel';
  
  /** Initiator */
  initiator?: string;
  
  /** Configuration */
  config: BatchConfig;
}

/**
 * Batch execution configuration
 */
export interface BatchConfig {
  /** Maximum parallel scenarios */
  maxConcurrency?: number;
  
  /** Stop on first failure */
  failFast?: boolean;
  
  /** Retry failed scenarios */
  retryFailures?: boolean;
  
  /** Generate consolidated report */
  generateReport?: boolean;
  
  /** Output directory */
  outputDir?: string;
}

/**
 * Batch execution summary
 */
export interface BatchSummary {
  /** Total scenarios */
  totalScenarios: number;
  
  /** Passed scenarios */
  passedScenarios: number;
  
  /** Failed scenarios */
  failedScenarios: number;
  
  /** Skipped scenarios */
  skippedScenarios: number;
  
  /** Total steps across all scenarios */
  totalSteps: number;
  
  /** Passed steps across all scenarios */
  passedSteps: number;
  
  /** Failed steps across all scenarios */
  failedSteps: number;
  
  /** Total execution time (ms) */
  duration: number;
  
  /** Success rate (%) */
  successRate: number;
}

/**
 * Execution error details
 */
export interface ExecutionError {
  /** Error type */
  type: ErrorType;
  
  /** Error message */
  message: string;
  
  /** Error code */
  code?: string;
  
  /** Stack trace */
  stack?: string;
  
  /** Step that caused the error */
  stepName?: string;
  
  /** Error context */
  context?: Record<string, any>;
  
  /** Original error */
  originalError?: any;
  
  /** Recovery suggestions */
  suggestions?: string[];
}

/**
 * Error types
 */
export type ErrorType = 
  | 'validation'     // Validation failure
  | 'network'        // Network error
  | 'timeout'        // Timeout error
  | 'authentication'// Auth failure
  | 'configuration'  // Config error
  | 'dependency'     // Dependency error
  | 'plugin'         // Plugin error
  | 'system'         // System error
  | 'user'           // User error
  | 'unknown';       // Unknown error

/**
 * Result processor interface
 */
export interface ResultProcessor {
  /** Process scenario result */
  processScenario(result: ScenarioResult): Promise<void>;
  
  /** Process batch result */
  processBatch(result: BatchResult): Promise<void>;
  
  /** Generate report */
  generateReport(results: ScenarioResult[], format: ReportFormat): Promise<string>;
  
  /** Export results */
  export(results: ScenarioResult[], format: string, output: string): Promise<void>;
}

/**
 * Report formats
 */
export type ReportFormat = 'html' | 'json' | 'junit' | 'markdown' | 'csv' | 'pdf';

/**
 * Result filter for querying
 */
export interface ResultFilter {
  /** Filter by status */
  status?: ExecutionStatus[];
  
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Filter by environment */
  environment?: string;
  
  /** Filter by scenario name */
  scenarioName?: string;
  
  /** Filter by step name */
  stepName?: string;
  
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by duration range */
  durationRange?: {
    min: number;
    max: number;
  };
}

/**
 * Result aggregation
 */
export interface ResultAggregation {
  /** Group by field */
  groupBy: 'status' | 'environment' | 'date' | 'scenario';
  
  /** Aggregation functions */
  aggregations: {
    count?: boolean;
    sum?: string[];
    avg?: string[];
    min?: string[];
    max?: string[];
  };
}

/**
 * Result store interface
 */
export interface ResultStore {
  /** Save result */
  save(result: ScenarioResult): Promise<void>;
  
  /** Get result by ID */
  get(id: string): Promise<ScenarioResult | null>;
  
  /** Query results */
  query(filter: ResultFilter): Promise<ScenarioResult[]>;
  
  /** Aggregate results */
  aggregate(filter: ResultFilter, aggregation: ResultAggregation): Promise<any>;
  
  /** Delete result */
  delete(id: string): Promise<void>;
  
  /** Clean up old results */
  cleanup(olderThan: Date): Promise<number>;
}