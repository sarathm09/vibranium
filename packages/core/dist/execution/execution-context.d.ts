/**
 * Execution context management for scenario runs
 */
import type { Scenario, Step, StepResult, ExecutionContext as IExecutionContext } from '../types';
import { EventEmitter } from 'events';
import { ResolverContext } from '../variable/resolver';
export interface ExecutionMetrics {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    stepCount: number;
    passedSteps: number;
    failedSteps: number;
    skippedSteps: number;
}
export interface ExecutionState {
    scenario: Scenario;
    currentStep?: Step;
    stepResults: Map<string, StepResult>;
    variables: ResolverContext;
    metrics: ExecutionMetrics;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    error?: Error;
}
export declare class ExecutionContext extends EventEmitter implements IExecutionContext {
    private state;
    private stepIndex;
    private hooks;
    constructor(scenario: Scenario, initialVariables?: Partial<ResolverContext>);
    /**
     * Get current scenario
     */
    getScenario(): Scenario;
    /**
     * Get current execution status
     */
    getStatus(): ExecutionState['status'];
    /**
     * Set execution status
     */
    setStatus(status: ExecutionState['status'], error?: Error): void;
    /**
     * Get current step
     */
    getCurrentStep(): Step | undefined;
    /**
     * Set current step
     */
    setCurrentStep(step: Step): void;
    /**
     * Get step result
     */
    getStepResult(stepName: string): StepResult | undefined;
    /**
     * Set step result
     */
    setStepResult(stepName: string, result: StepResult): void;
    /**
     * Get all step results
     */
    getAllStepResults(): StepResult[];
    /**
     * Get variable context for resolution
     */
    getVariableContext(): ResolverContext;
    /**
     * Update variables in a namespace
     */
    updateVariables(namespace: string, variables: Record<string, any>): void;
    /**
     * Set variables for a namespace
     */
    setVariables(namespace: string, variables: Record<string, any>): void;
    /**
     * Get execution metrics
     */
    getMetrics(): ExecutionMetrics;
    /**
     * Get execution error if any
     */
    getError(): Error | undefined;
    /**
     * Register a lifecycle hook
     */
    registerHook(event: string, handler: Function): void;
    /**
     * Execute lifecycle hooks
     */
    executeHook(event: string, data?: any): Promise<void>;
    /**
     * Create a snapshot of current execution state
     */
    createSnapshot(): ExecutionState;
    /**
     * Clean up resources
     */
    cleanup(): void;
}
//# sourceMappingURL=execution-context.d.ts.map