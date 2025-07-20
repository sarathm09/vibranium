/**
 * Main orchestrator for scenario execution
 */
import type { Scenario, ScenarioResult } from '../types';
import { PluginExecutor } from './step-executor';
import { ResolverContext } from '../variable/resolver';
export interface OrchestrationOptions {
    maxConcurrency?: number;
    timeout?: number;
    failFast?: boolean;
    skipOnError?: boolean;
    retries?: number;
}
export interface ExecutionProgress {
    totalSteps: number;
    completedSteps: number;
    passedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    currentBatch: number;
    totalBatches: number;
}
export declare class ScenarioOrchestrator {
    private stepExecutor;
    private dependencyManager;
    /**
     * Register a plugin executor
     */
    registerPlugin(stepType: string, executor: PluginExecutor): void;
    /**
     * Execute a complete scenario
     */
    executeScenario(scenario: Scenario, initialVariables?: Partial<ResolverContext>, options?: OrchestrationOptions): Promise<ScenarioResult>;
    /**
     * Execute a batch of steps in parallel
     */
    private executeBatch;
    /**
     * Execute steps with concurrency control
     */
    private executeConcurrently;
    /**
     * Get supported step types
     */
    getSupportedStepTypes(): string[];
    /**
     * Validate scenario can be executed
     */
    validateScenario(scenario: Scenario): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
}
//# sourceMappingURL=orchestrator.d.ts.map