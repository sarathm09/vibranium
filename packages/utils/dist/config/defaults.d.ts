/**
 * Default configuration values and presets
 */
import type { VibraniumConfig } from './config-manager';
/**
 * Base default configuration
 */
export declare const defaultConfig: VibraniumConfig;
/**
 * Development environment preset
 */
export declare const devConfig: Partial<VibraniumConfig>;
/**
 * Production environment preset
 */
export declare const prodConfig: Partial<VibraniumConfig>;
/**
 * CI/CD environment preset
 */
export declare const ciConfig: Partial<VibraniumConfig>;
/**
 * Testing/QA environment preset
 */
export declare const testConfig: Partial<VibraniumConfig>;
/**
 * Load testing preset
 */
export declare const loadTestConfig: Partial<VibraniumConfig>;
/**
 * Configuration presets
 */
export declare const configPresets: {
    default: VibraniumConfig;
    dev: Partial<VibraniumConfig>;
    development: Partial<VibraniumConfig>;
    prod: Partial<VibraniumConfig>;
    production: Partial<VibraniumConfig>;
    ci: Partial<VibraniumConfig>;
    test: Partial<VibraniumConfig>;
    testing: Partial<VibraniumConfig>;
    qa: Partial<VibraniumConfig>;
    load: Partial<VibraniumConfig>;
    'load-test': Partial<VibraniumConfig>;
};
/**
 * Get configuration preset by name
 */
export declare function getConfigPreset(name: string): Partial<VibraniumConfig> | null;
/**
 * Get all available preset names
 */
export declare function getAvailablePresets(): string[];
/**
 * Merge base config with preset
 */
export declare function applyPreset(baseConfig: VibraniumConfig, presetName: string): VibraniumConfig;
/**
 * Deep merge configuration objects
 */
export declare function mergeConfigs(base: any, override: any): any;
/**
 * Create minimal configuration for quick setup
 */
export declare function createMinimalConfig(overrides?: Partial<VibraniumConfig>): VibraniumConfig;
/**
 * Environment-specific configuration helpers
 */
export declare class ConfigPresets {
    /**
     * Get configuration for development environment
     */
    static forDevelopment(overrides?: Partial<VibraniumConfig>): VibraniumConfig;
    /**
     * Get configuration for production environment
     */
    static forProduction(overrides?: Partial<VibraniumConfig>): VibraniumConfig;
    /**
     * Get configuration for CI/CD environment
     */
    static forCI(overrides?: Partial<VibraniumConfig>): VibraniumConfig;
    /**
     * Get configuration for testing environment
     */
    static forTesting(overrides?: Partial<VibraniumConfig>): VibraniumConfig;
    /**
     * Get configuration for load testing
     */
    static forLoadTesting(overrides?: Partial<VibraniumConfig>): VibraniumConfig;
    /**
     * Create custom configuration from base
     */
    static custom(base: keyof typeof configPresets, overrides?: Partial<VibraniumConfig>): VibraniumConfig;
}
//# sourceMappingURL=defaults.d.ts.map