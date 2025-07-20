/**
 * Lifecycle hooks for scenarios and steps
 */

import type { Step, StepResult } from './step';
import type { ExecutionContext } from '../execution/context';

/**
 * Lifecycle hooks for scenarios
 */
export interface LifecycleHooks {
  /** Execute before scenario starts */
  onStart?: LifecycleHook;
  
  /** Execute after scenario completes */
  onEnd?: LifecycleHook;
  
  /** Execute before each step */
  beforeStep?: LifecycleHook;
  
  /** Execute after each step */
  afterStep?: LifecycleHook;
  
  /** Execute before API calls */
  beforeApi?: LifecycleHook;
  
  /** Execute after API calls */
  afterApi?: LifecycleHook;
  
  /** Execute after dependencies are resolved */
  afterDependencies?: LifecycleHook;
  
  /** Execute when step fails */
  onStepFailure?: LifecycleHook;
  
  /** Execute when scenario fails */
  onScenarioFailure?: LifecycleHook;
}

/**
 * Individual lifecycle hook definition
 */
export interface LifecycleHook {
  /** JavaScript expression or function body */
  script?: string;
  
  /** External script file to execute */
  file?: string;
  
  /** Timeout for hook execution */
  timeout?: number;
  
  /** Continue on hook failure */
  continueOnError?: boolean;
  
  /** Condition to execute hook */
  condition?: string;
}

/**
 * Lifecycle event context
 */
export interface LifecycleEventContext {
  /** Event type */
  event: LifecycleEventType;
  
  /** Execution context */
  context: ExecutionContext;
  
  /** Current step (if applicable) */
  step?: Step;
  
  /** Step result (if applicable) */
  result?: StepResult;
  
  /** Error (if applicable) */
  error?: Error;
  
  /** Additional data */
  data?: Record<string, any>;
}

/**
 * Types of lifecycle events
 */
export type LifecycleEventType =
  | 'scenario.start'
  | 'scenario.end'
  | 'scenario.failure'
  | 'step.before'
  | 'step.after'
  | 'step.failure'
  | 'api.before'
  | 'api.after'
  | 'dependencies.after';

/**
 * Lifecycle hook executor interface
 */
export interface LifecycleExecutor {
  /** Execute a lifecycle hook */
  execute(hook: LifecycleHook, context: LifecycleEventContext): Promise<void>;
  
  /** Register custom lifecycle handlers */
  registerHandler(event: LifecycleEventType, handler: LifecycleHandler): void;
  
  /** Remove lifecycle handler */
  removeHandler(event: LifecycleEventType, handler: LifecycleHandler): void;
}

/**
 * Custom lifecycle handler function
 */
export type LifecycleHandler = (context: LifecycleEventContext) => Promise<void> | void;