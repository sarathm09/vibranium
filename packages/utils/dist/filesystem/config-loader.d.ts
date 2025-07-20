/**
 * Configuration file loading and parsing utilities
 */
import type { Scenario } from '@vibraniumjs/types';
export interface LoadOptions {
    encoding?: BufferEncoding;
    validate?: boolean;
    schema?: object;
}
export declare class ConfigLoader {
    /**
     * Load and parse a scenario file (YAML or JSON)
     */
    static loadScenario(filePath: string, options?: LoadOptions): Promise<Scenario>;
    /**
     * Load a configuration file (JSON or YAML)
     */
    static loadConfig<T = Record<string, any>>(filePath: string, options?: LoadOptions): Promise<T>;
    /**
     * Save configuration to file
     */
    static saveConfig<T>(filePath: string, config: T, options?: {
        format?: 'json' | 'yaml';
        indent?: number;
    }): Promise<void>;
    /**
     * Load environment file (.env, JSON, or YAML)
     */
    static loadEnvironmentFile(filePath: string): Promise<Record<string, any>>;
    /**
     * Load .env file
     */
    private static loadEnvFile;
    /**
     * Basic scenario validation
     */
    private static validateScenario;
}
//# sourceMappingURL=config-loader.d.ts.map