/**
 * @deprecated Use ./config exports instead
 * Global configuration management - Legacy compatibility
 */
export interface VibraniumConfig {
    defaultEnvironment?: string;
    httpClient?: 'got' | 'axios' | 'fetch';
    timeout?: number;
    retries?: number;
    colors?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    outputFormat?: 'json' | 'html' | 'junit';
    reportPath?: string;
    plugins?: string[];
}
export interface ConfigManager {
    load(): Promise<VibraniumConfig>;
    save(config: VibraniumConfig): Promise<void>;
    get<K extends keyof VibraniumConfig>(key: K): VibraniumConfig[K];
    set<K extends keyof VibraniumConfig>(key: K, value: VibraniumConfig[K]): void;
    reset(): Promise<void>;
}
/**
 * @deprecated Use ConfigManager from ./config instead
 */
export declare class GlobalConfigManager implements ConfigManager {
    private configManager;
    constructor();
    load(): Promise<VibraniumConfig>;
    save(config: VibraniumConfig): Promise<void>;
    get<K extends keyof VibraniumConfig>(key: K): VibraniumConfig[K];
    set<K extends keyof VibraniumConfig>(key: K, value: VibraniumConfig[K]): void;
    reset(): Promise<void>;
}
//# sourceMappingURL=config.d.ts.map