/**
 * Dependency management types
 */
/**
 * Step dependency configuration
 */
export interface DependsOn {
    /** Type of dependency */
    type?: 'api' | 'step' | 'scenario';
    /** Name/ID of the dependency */
    api?: string;
    step?: string;
    scenario?: string;
    /** Alias to store dependency result */
    as: string;
    /** Source file/location (for external dependencies) */
    from?: string;
    /** Condition for dependency execution */
    condition?: string;
    /** Dependency execution mode */
    mode?: DependencyMode;
    /** Timeout for dependency execution */
    timeout?: number;
    /** Data extraction from dependency result */
    extract?: ExtractConfig;
}
/**
 * Dependency execution modes
 */
export type DependencyMode = 'blocking' | 'async' | 'lazy' | 'cached';
/**
 * Data extraction configuration
 */
export interface ExtractConfig {
    /** JSONPath/XPath expression for data extraction */
    path?: string;
    /** Transform extracted data */
    transform?: string;
    /** Default value if extraction fails */
    default?: any;
    /** Validation for extracted data */
    validate?: string;
}
/**
 * Dependency resolution result
 */
export interface DependencyResult {
    /** Dependency configuration */
    dependency: DependsOn;
    /** Resolution status */
    status: 'pending' | 'resolved' | 'failed' | 'skipped';
    /** Resolved data */
    data?: any;
    /** Execution time */
    duration?: number;
    /** Error if resolution failed */
    error?: Error;
    /** Resolution timestamp */
    resolvedAt?: Date;
}
/**
 * Dependency graph node
 */
export interface DependencyNode {
    /** Node ID */
    id: string;
    /** Node type */
    type: 'step' | 'scenario';
    /** Dependencies */
    dependencies: string[];
    /** Dependents */
    dependents: string[];
    /** Execution order */
    order?: number;
    /** Status */
    status: 'pending' | 'ready' | 'running' | 'completed' | 'failed';
}
/**
 * Dependency resolver interface
 */
export interface DependencyResolver {
    /** Build dependency graph */
    buildGraph(steps: any[]): DependencyGraph;
    /** Resolve dependencies for a step */
    resolve(dependency: DependsOn): Promise<DependencyResult>;
    /** Get execution order */
    getExecutionOrder(graph: DependencyGraph): string[];
    /** Check for circular dependencies */
    hasCircularDependencies(graph: DependencyGraph): boolean;
}
/**
 * Dependency graph
 */
export interface DependencyGraph {
    /** Graph nodes */
    nodes: Map<string, DependencyNode>;
    /** Execution order */
    executionOrder: string[];
    /** Has circular dependencies */
    hasCircularDependencies: boolean;
}
//# sourceMappingURL=dependency.d.ts.map