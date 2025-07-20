/**
 * File discovery utilities for finding scenarios and configuration files
 */
export interface FileDiscoveryOptions {
    extensions?: string[];
    recursive?: boolean;
    maxDepth?: number;
    ignorePatterns?: string[];
}
export declare class FileDiscovery {
    private static readonly DEFAULT_SCENARIO_EXTENSIONS;
    private static readonly DEFAULT_IGNORE_PATTERNS;
    /**
     * Discover scenario files in a directory
     */
    static discoverScenarios(directory: string, options?: FileDiscoveryOptions): Promise<string[]>;
    /**
     * Find configuration files in a directory hierarchy
     */
    static findConfigFiles(startDirectory: string, configNames?: string[]): Promise<string[]>;
    /**
     * Find environment files in a directory
     */
    static findEnvironmentFiles(directory: string): Promise<string[]>;
    /**
     * Filter files to only include those that appear to be scenario files
     */
    private static filterScenarioFiles;
    /**
     * Check if file should be excluded from scenario detection
     */
    private static isExcludedFile;
    /**
     * Enhanced validation to determine if content is a valid scenario
     */
    private static isValidScenarioContent;
    /**
     * Basic heuristic to determine if a file looks like a scenario (fallback)
     */
    private static looksLikeScenario;
    /**
     * Watch directory for file changes
     */
    static watchDirectory(directory: string, callback: (event: 'add' | 'change' | 'unlink', path: string) => void, options?: {
        extensions?: string[];
    }): Promise<() => void>;
}
//# sourceMappingURL=file-discovery.d.ts.map