/**
 * Comprehensive execution types for the web UI execution engine
 */

import type { 
  ScenarioResult, 
  ExecutionStatus, 
  StepResult, 
  ExecutionSummary,
  ExecutionError,
  ResourceUsage
} from '@vibraniumjs/types';

/**
 * Real-time execution state
 */
export interface ExecutionState {
  /** Current execution session */
  session: ExecutionSession | null;
  
  /** Execution queue */
  queue: QueuedExecution[];
  
  /** Execution history */
  history: ExecutionSession[];
  
  /** Active execution IDs */
  activeExecutions: Set<string>;
  
  /** Execution settings */
  settings: ExecutionSettings;
  
  /** WebSocket connection status */
  connectionStatus: ConnectionStatus;
  
  /** Real-time metrics */
  metrics: ExecutionMetrics;
}

/**
 * Execution session - represents a single test run
 */
export interface ExecutionSession {
  /** Unique session ID */
  id: string;
  
  /** Session name */
  name: string;
  
  /** Execution type */
  type: ExecutionType;
  
  /** Current status */
  status: ExecutionStatus;
  
  /** Target scenarios */
  scenarios: ScenarioTarget[];
  
  /** Environment */
  environment: string;
  
  /** Execution configuration */
  config: SessionConfig;
  
  /** Start time */
  startedAt: Date;
  
  /** End time */
  endedAt?: Date;
  
  /** Current step progress */
  progress: ExecutionProgress;
  
  /** Real-time results */
  results: ScenarioResult[];
  
  /** Live step tracking */
  currentSteps: ActiveStep[];
  
  /** Execution logs */
  logs: ExecutionLog[];
  
  /** Resource usage */
  resources: ResourceUsage;
  
  /** Variables state */
  variables: VariableState;
  
  /** Breakpoints */
  breakpoints: Breakpoint[];
  
  /** Error details */
  error?: ExecutionError;
}

/**
 * Execution types
 */
export type ExecutionType = 
  | 'single'     // Single scenario
  | 'batch'      // Multiple scenarios
  | 'suite'      // Test suite
  | 'debug'      // Debug session
  | 'scheduled'; // Scheduled execution

/**
 * Scenario target for execution
 */
export interface ScenarioTarget {
  /** Scenario file path */
  path: string;
  
  /** Scenario name */
  name: string;
  
  /** Selected steps (for partial execution) */
  selectedSteps?: string[];
  
  /** Skip conditions */
  skipConditions?: string[];
  
  /** Priority */
  priority: number;
  
  /** Dependencies */
  dependencies: string[];
}

/**
 * Session configuration
 */
export interface SessionConfig {
  /** Maximum concurrency */
  maxConcurrency: number;
  
  /** Timeout (ms) */
  timeout: number;
  
  /** Retry policy */
  retryPolicy: RetryPolicy;
  
  /** Stop on failure */
  stopOnFailure: boolean;
  
  /** Continue on error */
  continueOnError: boolean;
  
  /** Generate artifacts */
  generateArtifacts: boolean;
  
  /** Real-time reporting */
  realTimeReporting: boolean;
  
  /** Debug mode */
  debugMode: boolean;
  
  /** Variable overrides */
  variableOverrides: Record<string, any>;
}

/**
 * Retry policy
 */
export interface RetryPolicy {
  /** Enable retries */
  enabled: boolean;
  
  /** Maximum attempts */
  maxAttempts: number;
  
  /** Retry delay (ms) */
  delay: number;
  
  /** Exponential backoff */
  exponentialBackoff: boolean;
  
  /** Retry conditions */
  conditions: RetryCondition[];
}

/**
 * Retry condition
 */
export interface RetryCondition {
  /** Error type to retry on */
  errorType: string;
  
  /** Status codes to retry on */
  statusCodes?: number[];
  
  /** Custom condition function */
  condition?: string;
}

/**
 * Execution progress
 */
export interface ExecutionProgress {
  /** Overall progress percentage */
  overall: number;
  
  /** Current scenario progress */
  currentScenario: number;
  
  /** Total scenarios */
  totalScenarios: number;
  
  /** Completed scenarios */
  completedScenarios: number;
  
  /** Current step progress */
  currentStep: number;
  
  /** Total steps */
  totalSteps: number;
  
  /** Completed steps */
  completedSteps: number;
  
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining: number;
  
  /** Elapsed time (ms) */
  elapsedTime: number;
}

/**
 * Active step - real-time step execution
 */
export interface ActiveStep {
  /** Step ID */
  id: string;
  
  /** Scenario name */
  scenarioName: string;
  
  /** Step name */
  stepName: string;
  
  /** Step type */
  type: string;
  
  /** Execution status */
  status: StepExecutionStatus;
  
  /** Start time */
  startedAt: Date;
  
  /** Progress percentage */
  progress: number;
  
  /** Current operation */
  currentOperation: string;
  
  /** Request details */
  request?: RequestDetails;
  
  /** Response details */
  response?: ResponseDetails;
  
  /** Real-time metrics */
  metrics: StepMetrics;
  
  /** Live logs */
  logs: string[];
}

/**
 * Step execution status
 */
export type StepExecutionStatus = 
  | 'pending'
  | 'preparing'
  | 'executing'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'debugging';

/**
 * Request details for real-time monitoring
 */
export interface RequestDetails {
  /** HTTP method */
  method: string;
  
  /** URL */
  url: string;
  
  /** Headers */
  headers: Record<string, string>;
  
  /** Body */
  body?: any;
  
  /** Size (bytes) */
  size: number;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Response details for real-time monitoring
 */
export interface ResponseDetails {
  /** Status code */
  status: number;
  
  /** Status text */
  statusText: string;
  
  /** Headers */
  headers: Record<string, string>;
  
  /** Body */
  body?: any;
  
  /** Size (bytes) */
  size: number;
  
  /** Response time (ms) */
  responseTime: number;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Step metrics for performance monitoring
 */
export interface StepMetrics {
  /** DNS lookup time (ms) */
  dnsTime: number;
  
  /** Connection time (ms) */
  connectionTime: number;
  
  /** TLS handshake time (ms) */
  tlsTime: number;
  
  /** Request time (ms) */
  requestTime: number;
  
  /** Response time (ms) */
  responseTime: number;
  
  /** Total time (ms) */
  totalTime: number;
  
  /** Bytes sent */
  bytesSent: number;
  
  /** Bytes received */
  bytesReceived: number;
}

/**
 * Execution log entry
 */
export interface ExecutionLog {
  /** Log ID */
  id: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Log level */
  level: LogLevel;
  
  /** Source component */
  source: string;
  
  /** Log message */
  message: string;
  
  /** Additional data */
  data?: any;
  
  /** Associated scenario */
  scenarioName?: string;
  
  /** Associated step */
  stepName?: string;
}

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Variable state tracking
 */
export interface VariableState {
  /** Global variables */
  global: Record<string, any>;
  
  /** Environment variables */
  environment: Record<string, any>;
  
  /** Context variables */
  context: Record<string, any>;
  
  /** Response variables */
  response: Record<string, any>;
  
  /** Request variables */
  request: Record<string, any>;
  
  /** Random variables */
  random: Record<string, any>;
  
  /** Custom alias variables */
  aliases: Record<string, any>;
  
  /** Variable history */
  history: VariableChange[];
}

/**
 * Variable change tracking
 */
export interface VariableChange {
  /** Change ID */
  id: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Variable path */
  path: string;
  
  /** Old value */
  oldValue: any;
  
  /** New value */
  newValue: any;
  
  /** Source step */
  sourceStep?: string;
  
  /** Change reason */
  reason: string;
}

/**
 * Breakpoint for debugging
 */
export interface Breakpoint {
  /** Breakpoint ID */
  id: string;
  
  /** Scenario name */
  scenarioName: string;
  
  /** Step name */
  stepName: string;
  
  /** Breakpoint type */
  type: BreakpointType;
  
  /** Condition */
  condition?: string;
  
  /** Enabled */
  enabled: boolean;
  
  /** Hit count */
  hitCount: number;
  
  /** Max hits */
  maxHits?: number;
}

/**
 * Breakpoint types
 */
export type BreakpointType = 
  | 'step'       // Break at step start
  | 'response'   // Break after response
  | 'validation' // Break at validation
  | 'error'      // Break on error
  | 'condition'; // Break on condition

/**
 * Queued execution
 */
export interface QueuedExecution {
  /** Queue ID */
  id: string;
  
  /** Execution name */
  name: string;
  
  /** Target scenarios */
  scenarios: ScenarioTarget[];
  
  /** Environment */
  environment: string;
  
  /** Configuration */
  config: SessionConfig;
  
  /** Queue priority */
  priority: number;
  
  /** Scheduled time */
  scheduledAt?: Date;
  
  /** Created time */
  createdAt: Date;
  
  /** Queue status */
  status: QueueStatus;
  
  /** Dependencies */
  dependencies: string[];
}

/**
 * Queue status
 */
export type QueueStatus = 
  | 'pending'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Execution settings
 */
export interface ExecutionSettings {
  /** Auto-start queued executions */
  autoStart: boolean;
  
  /** Maximum concurrent executions */
  maxConcurrentExecutions: number;
  
  /** Default timeout (ms) */
  defaultTimeout: number;
  
  /** Real-time updates */
  realTimeUpdates: boolean;
  
  /** Update interval (ms) */
  updateInterval: number;
  
  /** Auto-retry failed executions */
  autoRetry: boolean;
  
  /** Save execution history */
  saveHistory: boolean;
  
  /** Max history entries */
  maxHistoryEntries: number;
  
  /** Notification settings */
  notifications: NotificationSettings;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  /** Enable notifications */
  enabled: boolean;
  
  /** Notify on completion */
  onCompletion: boolean;
  
  /** Notify on failure */
  onFailure: boolean;
  
  /** Notify on error */
  onError: boolean;
  
  /** Sound notifications */
  soundEnabled: boolean;
  
  /** Browser notifications */
  browserNotifications: boolean;
}

/**
 * Connection status for WebSocket
 */
export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  /** Total executions */
  totalExecutions: number;
  
  /** Active executions */
  activeExecutions: number;
  
  /** Queued executions */
  queuedExecutions: number;
  
  /** Success rate */
  successRate: number;
  
  /** Average execution time */
  averageExecutionTime: number;
  
  /** Resource usage */
  resourceUsage: ResourceUsage;
  
  /** Performance stats */
  performance: PerformanceStats;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  /** CPU usage percentage */
  cpuUsage: number;
  
  /** Memory usage (MB) */
  memoryUsage: number;
  
  /** Network throughput (bytes/sec) */
  networkThroughput: number;
  
  /** Active connections */
  activeConnections: number;
  
  /** Request rate (req/sec) */
  requestRate: number;
  
  /** Error rate percentage */
  errorRate: number;
}

/**
 * Execution command for WebSocket communication
 */
export interface ExecutionCommand {
  /** Command type */
  type: CommandType;
  
  /** Command data */
  data: any;
  
  /** Session ID */
  sessionId?: string;
  
  /** Request ID */
  requestId: string;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Command types
 */
export type CommandType = 
  | 'start'          // Start execution
  | 'stop'           // Stop execution
  | 'pause'          // Pause execution
  | 'resume'         // Resume execution
  | 'step'           // Step through execution
  | 'restart'        // Restart execution
  | 'queue'          // Queue execution
  | 'cancel'         // Cancel queued execution
  | 'debug'          // Start debug session
  | 'breakpoint'     // Set/remove breakpoint
  | 'variable'       // Update variable
  | 'environment';   // Switch environment

/**
 * WebSocket event types
 */
export type WebSocketEventType = 
  | 'session_started'
  | 'session_ended'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'progress_update'
  | 'log_entry'
  | 'variable_changed'
  | 'breakpoint_hit'
  | 'error_occurred'
  | 'metrics_update'
  | 'connection_status';

/**
 * WebSocket event
 */
export interface WebSocketEvent {
  /** Event type */
  type: WebSocketEventType;
  
  /** Event data */
  data: any;
  
  /** Session ID */
  sessionId?: string;
  
  /** Timestamp */
  timestamp: Date;
}