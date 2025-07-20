/**
 * Default configuration values and presets
 */
/**
 * Base default configuration
 */
export const defaultConfig = {
    version: '1.0.0',
    defaultEnvironment: 'local',
    httpClient: 'got',
    timeout: 30000,
    retries: 3,
    environments: {
        directory: './environments',
        default: 'local'
    },
    logging: {
        level: 'info',
        colors: true,
        format: 'simple',
        outputs: ['console']
    },
    output: {
        format: 'json',
        directory: './reports',
        filename: 'test-results'
    },
    plugins: {
        directory: './plugins',
        enabled: [],
        disabled: []
    },
    globals: {},
    performance: {
        maxConcurrency: 10,
        requestsPerSecond: 100,
        enableMetrics: true
    },
    security: {
        encryptSecrets: false,
        allowUnsafeEval: false,
        trustedDomains: []
    }
};
/**
 * Development environment preset
 */
export const devConfig = {
    logging: {
        level: 'debug',
        colors: true,
        format: 'simple'
    },
    performance: {
        maxConcurrency: 5,
        requestsPerSecond: 50,
        enableMetrics: true
    },
    security: {
        allowUnsafeEval: true,
        trustedDomains: ['localhost', '127.0.0.1', '*.local']
    }
};
/**
 * Production environment preset
 */
export const prodConfig = {
    logging: {
        level: 'warn',
        colors: false,
        format: 'json'
    },
    performance: {
        maxConcurrency: 20,
        requestsPerSecond: 200,
        enableMetrics: false
    },
    security: {
        encryptSecrets: true,
        allowUnsafeEval: false,
        trustedDomains: []
    }
};
/**
 * CI/CD environment preset
 */
export const ciConfig = {
    logging: {
        level: 'info',
        colors: false,
        format: 'json'
    },
    output: {
        format: 'junit',
        directory: './test-results',
        filename: 'results'
    },
    performance: {
        maxConcurrency: 15,
        requestsPerSecond: 150,
        enableMetrics: true
    },
    security: {
        encryptSecrets: false,
        allowUnsafeEval: false
    }
};
/**
 * Testing/QA environment preset
 */
export const testConfig = {
    timeout: 60000,
    retries: 5,
    logging: {
        level: 'info',
        colors: true,
        format: 'detailed'
    },
    output: {
        format: 'html',
        directory: './test-reports'
    },
    performance: {
        maxConcurrency: 8,
        requestsPerSecond: 80,
        enableMetrics: true
    }
};
/**
 * Load testing preset
 */
export const loadTestConfig = {
    timeout: 120000,
    retries: 1,
    logging: {
        level: 'warn',
        colors: false,
        format: 'json'
    },
    performance: {
        maxConcurrency: 100,
        requestsPerSecond: 1000,
        enableMetrics: true
    }
};
/**
 * Configuration presets
 */
export const configPresets = {
    default: defaultConfig,
    dev: devConfig,
    development: devConfig,
    prod: prodConfig,
    production: prodConfig,
    ci: ciConfig,
    test: testConfig,
    testing: testConfig,
    qa: testConfig,
    load: loadTestConfig,
    'load-test': loadTestConfig
};
/**
 * Get configuration preset by name
 */
export function getConfigPreset(name) {
    return configPresets[name] || null;
}
/**
 * Get all available preset names
 */
export function getAvailablePresets() {
    return Object.keys(configPresets);
}
/**
 * Merge base config with preset
 */
export function applyPreset(baseConfig, presetName) {
    const preset = getConfigPreset(presetName);
    if (!preset) {
        throw new Error(`Unknown configuration preset: ${presetName}`);
    }
    return mergeConfigs(baseConfig, preset);
}
/**
 * Deep merge configuration objects
 */
export function mergeConfigs(base, override) {
    const result = { ...base };
    for (const key in override) {
        if (override[key] !== undefined) {
            if (typeof override[key] === 'object' &&
                override[key] !== null &&
                !Array.isArray(override[key]) &&
                typeof base[key] === 'object' &&
                base[key] !== null &&
                !Array.isArray(base[key])) {
                result[key] = mergeConfigs(base[key], override[key]);
            }
            else {
                result[key] = override[key];
            }
        }
    }
    return result;
}
/**
 * Create minimal configuration for quick setup
 */
export function createMinimalConfig(overrides = {}) {
    const minimal = {
        defaultEnvironment: 'local',
        httpClient: 'got',
        timeout: 30000,
        retries: 3,
        logging: {
            level: 'info',
            colors: true
        },
        ...overrides
    };
    return minimal;
}
/**
 * Environment-specific configuration helpers
 */
export class ConfigPresets {
    /**
     * Get configuration for development environment
     */
    static forDevelopment(overrides = {}) {
        return mergeConfigs(defaultConfig, mergeConfigs(devConfig, overrides));
    }
    /**
     * Get configuration for production environment
     */
    static forProduction(overrides = {}) {
        return mergeConfigs(defaultConfig, mergeConfigs(prodConfig, overrides));
    }
    /**
     * Get configuration for CI/CD environment
     */
    static forCI(overrides = {}) {
        return mergeConfigs(defaultConfig, mergeConfigs(ciConfig, overrides));
    }
    /**
     * Get configuration for testing environment
     */
    static forTesting(overrides = {}) {
        return mergeConfigs(defaultConfig, mergeConfigs(testConfig, overrides));
    }
    /**
     * Get configuration for load testing
     */
    static forLoadTesting(overrides = {}) {
        return mergeConfigs(defaultConfig, mergeConfigs(loadTestConfig, overrides));
    }
    /**
     * Create custom configuration from base
     */
    static custom(base, overrides = {}) {
        const baseConfig = configPresets[base];
        if (!baseConfig) {
            throw new Error(`Unknown base configuration: ${base}`);
        }
        return mergeConfigs(defaultConfig, mergeConfigs(baseConfig, overrides));
    }
}
//# sourceMappingURL=defaults.js.map