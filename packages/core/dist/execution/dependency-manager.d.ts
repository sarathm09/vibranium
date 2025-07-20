/**
 * Dependency manager for step execution ordering
 * Analyzes step dependencies and builds execution graph
 */
import type { Step } from '../types';
export interface DependencyNode {
    step: Step;
    dependencies: string[];
    dependents: string[];
    level: number;
    visited: boolean;
}
export interface ExecutionGraph {
    nodes: Map<string, DependencyNode>;
    levels: string[][];
    hasCycles: boolean;
    cycles: string[][];
}
export interface ExecutionPlan {
    batches: Step[][];
    totalSteps: number;
    maxParallelism: number;
    dependencies: Map<string, string[]>;
}
export declare class DependencyManager {
    /**
     * Analyze dependencies and create execution graph
     */
    analyzeDependencies(steps: Step[]): ExecutionGraph;
    /**
     * Create execution plan with batches for parallel execution
     */
    createExecutionPlan(steps: Step[]): ExecutionPlan;
    /**
     * Validate dependencies (check if all referenced steps exist)
     */
    validateDependencies(steps: Step[]): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get steps that can be executed next based on completed steps
     */
    getExecutableSteps(allSteps: Step[], completedSteps: Set<string>, runningSteps?: Set<string>): Step[];
    /**
     * Extract dependencies from a step
     */
    private extractDependencies;
    /**
     * Build dependency graph with dependents
     */
    private buildDependencyGraph;
    /**
     * Detect circular dependencies using DFS
     */
    private detectCycles;
    /**
     * Calculate execution levels using topological sorting
     */
    private calculateLevels;
}
//# sourceMappingURL=dependency-manager.d.ts.map