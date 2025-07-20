/**
 * Dot notation variable resolver ($.env, $.global, $.context, $.response, $.api, $.random, $.<alias>)
 */
export interface ResolverOptions {
    enableCache?: boolean;
    maxDepth?: number;
    allowCircular?: boolean;
    defaultNamespace?: string;
}
export interface ResolverContext {
    env: Record<string, any>;
    global: Record<string, any>;
    context: Record<string, any>;
    response: Record<string, any>;
    api: Record<string, any>;
    random: Record<string, any>;
    [alias: string]: Record<string, any>;
}
export declare class VariableResolver {
    private cache;
    private namespaceManager;
    private options;
    constructor(options?: ResolverOptions);
    /**
     * Resolve a dot notation variable reference
     */
    resolve(reference: string, context: ResolverContext, options?: {
        depth?: number;
        visited?: Set<string>;
    }): any;
    /**
     * Resolve multiple variables in batch
     */
    resolveMultiple(references: string[], context: ResolverContext): Record<string, any>;
    /**
     * Check if a value is resolvable
     */
    isResolvable(reference: string, context: ResolverContext): boolean;
    /**
     * Get all available variable references in context
     */
    getAvailableReferences(context: ResolverContext): string[];
    /**
     * Clear resolver cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        hits: number;
        misses: number;
        size: number;
    };
    /**
     * Parse a dot notation reference
     */
    private parseReference;
    /**
     * Resolve value from parsed reference
     */
    private resolveValue;
    /**
     * Resolve nested variable references in a string
     */
    private resolveNestedReferences;
    /**
     * Recursively collect all available references
     */
    private collectReferences;
}
//# sourceMappingURL=resolver.d.ts.map