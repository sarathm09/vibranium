/**
 * Namespace manager for variable resolution system
 * Manages built-in namespaces (env, global, context, response, api, random) and custom aliases
 */
export interface NamespaceConfig {
    name: string;
    description?: string;
    readonly?: boolean;
    builtin?: boolean;
    validator?: (data: any) => boolean;
    transformer?: (data: any) => any;
}
export declare class NamespaceManager {
    private namespaces;
    private aliases;
    constructor();
    /**
     * Register a new namespace or alias
     */
    register(config: NamespaceConfig): void;
    /**
     * Create an alias for an existing namespace
     */
    createAlias(alias: string, target: string): void;
    /**
     * Resolve namespace name (handle aliases)
     */
    resolveNamespace(name: string): string;
    /**
     * Check if a namespace exists
     */
    hasNamespace(name: string): boolean;
    /**
     * Get namespace configuration
     */
    getNamespace(name: string): NamespaceConfig | undefined;
    /**
     * Get all registered namespaces
     */
    getAllNamespaces(): NamespaceConfig[];
    /**
     * Get all aliases
     */
    getAllAliases(): Array<{
        alias: string;
        target: string;
    }>;
    /**
     * Validate data for a namespace
     */
    validateNamespaceData(name: string, data: any): boolean;
    /**
     * Transform data for a namespace
     */
    transformNamespaceData(name: string, data: any): any;
    /**
     * Remove a namespace (only non-builtin ones)
     */
    remove(name: string): boolean;
    /**
     * Remove an alias
     */
    removeAlias(alias: string): boolean;
    /**
     * Initialize built-in namespaces
     */
    private initializeBuiltinNamespaces;
}
//# sourceMappingURL=namespace-manager.d.ts.map