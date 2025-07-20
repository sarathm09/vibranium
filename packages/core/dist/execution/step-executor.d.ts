/**
 * Generic step executor that delegates to appropriate plugins
 */
import type { Step, StepResult } from '../types';
import { ExecutionContext } from './execution-context';
export interface StepExecutorOptions {
    timeout?: number;
    retries?: number;
    skipCondition?: (step: Step, context: ExecutionContext) => boolean;
}
export interface PluginExecutor {
    canExecute(step: Step): boolean;
    execute(step: Step, context: ExecutionContext): Promise<StepResult>;
}
export declare class StepExecutor {
    private plugins;
    private resolver;
    private interpolator;
    /**
     * Register a plugin executor for a step type
     */
    registerPlugin(stepType: string, executor: PluginExecutor): void;
    /**
     * Execute a single step
     */
    executeStep(step: Step, context: ExecutionContext, options?: StepExecutorOptions): Promise<StepResult>;
    /**
     * Get list of supported step types
     */
    getSupportedTypes(): string[];
    /**
     * Check if a step type is supported
     */
    supportsStepType(stepType: string): boolean;
    /**
     * Check if step should be skipped
     */
    private shouldSkipStep;
    /**
     * Interpolate variables in step configuration
     */
    private interpolateStep;
    /**
     * Find plugin executor for step
     */
    private findPlugin;
    /**
     * Execute step with retries and timeout
     */
    private executeWithRetries;
    /**
     * Add timeout to a promise
     */
    private withTimeout;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Create skipped step result
     */
    private createSkippedResult;
    /**
     * Create failed step result
     */
    private createFailedResult;
}
//# sourceMappingURL=step-executor.d.ts.map