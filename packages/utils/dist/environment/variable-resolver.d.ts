/**
 * Variable resolution and interpolation for dot notation system
 */
import type { VariableMap, Environment } from '@vibraniumjs/types';
export interface ResolverContext {
    env?: VariableMap;
    global?: VariableMap;
    context?: VariableMap;
    request?: VariableMap;
    response?: VariableMap;
    api?: VariableMap;
    random?: VariableMap;
    [alias: string]: VariableMap | undefined;
}
export declare class VariableResolver {
    private context;
    private randomGenerators;
    constructor(initialContext?: ResolverContext);
    /**
     * Update the resolver context
     */
    updateContext(updates: Partial<ResolverContext>): void;
    /**
     * Set environment variables
     */
    setEnvironment(environment: Environment): void;
    /**
     * Set global variables
     */
    setGlobal(variables: VariableMap): void;
    /**
     * Set context variables (execution metadata)
     */
    setContext(variables: VariableMap): void;
    /**
     * Set request variables
     */
    setRequest(variables: VariableMap): void;
    /**
     * Set response variables
     */
    setResponse(variables: VariableMap): void;
    /**
     * Set API step variables
     */
    setApi(variables: VariableMap): void;
    /**
     * Set alias variables (from step dependencies)
     */
    setAlias(alias: string, variables: VariableMap): void;
    /**
     * Resolve a dot notation variable (e.g., $.env.API_URL)
     */
    resolve(variable: string): any;
    /**
     * Interpolate template string with variables
     */
    interpolate(template: string): string;
    /**
     * Interpolate all variables in an object recursively
     */
    interpolateObject<T>(obj: T): T;
    /**
     * Check if a string contains variables
     */
    hasVariables(str: string): boolean;
    /**
     * Extract all variables from a template string
     */
    extractVariables(template: string): string[];
    /**
     * Validate that all variables in a template can be resolved
     */
    validateTemplate(template: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get all available variables in current context
     */
    getAvailableVariables(): Record<string, string[]>;
    /**
     * Navigate object path (supports array indices and object properties)
     */
    private navigatePath;
    /**
     * Resolve random variable ($.random.function or $.random.category.function)
     */
    private resolveRandomVariable;
    /**
     * Setup random data generators
     */
    private setupRandomGenerators;
    /**
     * Get all possible paths in an object
     */
    private getObjectPaths;
}
//# sourceMappingURL=variable-resolver.d.ts.map