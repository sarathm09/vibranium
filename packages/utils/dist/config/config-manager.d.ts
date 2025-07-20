/**
 * Configuration management with validation and discovery
 */
import type { LogLevel } from '../logging/logger';
export interface VibraniumConfig {
    version?: string;
    defaultEnvironment?: string;
    httpClient?: 'got' | 'axios' | 'fetch';
    timeout?: number;
    retries?: number;
    environments?: {
        directory?: string;
        default?: string;
    };
    logging?: {
        level?: LogLevel;
        colors?: boolean;
        format?: 'simple' | 'detailed' | 'json';
        outputs?: string[];
    };
    output?: {
        format?: 'json' | 'html' | 'junit';
        directory?: string;
        filename?: string;
    };
    plugins?: {
        directory?: string;
        enabled?: string[];
        disabled?: string[];
    };
    globals?: Record<string, any>;
    performance?: {
        maxConcurrency?: number;
        requestsPerSecond?: number;
        enableMetrics?: boolean;
    };
    security?: {
        encryptSecrets?: boolean;
        allowUnsafeEval?: boolean;
        trustedDomains?: string[];
    };
}
export interface ConfigManagerOptions {
    configFile?: string;
    searchPaths?: string[];
    defaults?: Partial<VibraniumConfig>;
    validate?: boolean;
}
export declare class ConfigManager {
    private config;
    private configFile;
    private options;
    private defaults;
    constructor(options?: ConfigManagerOptions);
    /**
     * Initialize configuration manager
     */
    initialize(): Promise<void>;
    /**
     * Load configuration from file or defaults
     */
    load(): Promise<VibraniumConfig>;
    /**
     * Save configuration to file
     */
    save(config?: VibraniumConfig): Promise<void>;
    /**
     * Get configuration value by key
     */
    get<K extends keyof VibraniumConfig>(key: K): VibraniumConfig[K];
    /**
     * Set configuration value by key
     */
    set<K extends keyof VibraniumConfig>(key: K, value: VibraniumConfig[K]): void;
    /**
     * Get nested configuration value
     */
    getNested(path: string): any;
    /**
     * Set nested configuration value
     */
    setNested(path: string, value: any): void;
    /**
     * Reset configuration to defaults
     */
    reset(): Promise<void>;
    /**
     * Merge configurations with the current one
     */
    merge(updates: Partial<VibraniumConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): VibraniumConfig;
    /**
     * Get configuration file path
     */
    getConfigFile(): string | null;
    /**
     * Check if configuration file exists
     */
    hasConfigFile(): boolean;
    /**
     * Create default configuration file
     */
    createDefaultConfig(filePath?: string): Promise<string>;
    /**
     * Validate configuration
     */
    validateConfig(config: VibraniumConfig): void;
    /**
     * Discover configuration file
     */
    private discoverConfig;
    /**
     * Load configuration
     */
    private loadConfig;
    /**
     * Setup default configuration
     */
    private setupDefaults;
    /**
     * Deep merge two configuration objects
     */
    private mergeConfigs;
}
//# sourceMappingURL=config-manager.d.ts.map