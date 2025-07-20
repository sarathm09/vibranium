/**
 * Configuration validation with schema checking
 */
import Ajv from 'ajv';
export class ConfigValidator {
    ajv;
    schema;
    constructor() {
        this.ajv = new Ajv({ allErrors: true });
        this.setupSchema();
    }
    /**
     * Validate configuration against schema
     */
    validate(config) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };
        // Schema validation
        const valid = this.ajv.validate(this.schema, config);
        if (!valid && this.ajv.errors) {
            result.errors.push(...this.ajv.errors.map(err => `${err.instancePath || 'root'}: ${err.message}`));
        }
        // Custom validation rules
        const customResult = this.validateCustomRules(config);
        result.errors.push(...customResult.errors);
        result.warnings.push(...customResult.warnings);
        result.valid = result.errors.length === 0;
        return result;
    }
    /**
     * Validate configuration file structure
     */
    validateStructure(config) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };
        if (!config || typeof config !== 'object') {
            result.errors.push('Configuration must be an object');
            return result;
        }
        // Check for unknown top-level properties
        const knownProperties = [
            'version', 'defaultEnvironment', 'httpClient', 'timeout', 'retries',
            'environments', 'logging', 'output', 'plugins', 'globals',
            'performance', 'security'
        ];
        for (const key of Object.keys(config)) {
            if (!knownProperties.includes(key)) {
                result.warnings.push(`Unknown configuration property: ${key}`);
            }
        }
        result.valid = result.errors.length === 0;
        return result;
    }
    /**
     * Validate environment-specific rules
     */
    validateCustomRules(config) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };
        // Timeout validation
        if (config.timeout !== undefined) {
            if (config.timeout < 1000) {
                result.warnings.push('Timeout less than 1 second may cause issues');
            }
            if (config.timeout > 300000) {
                result.warnings.push('Timeout greater than 5 minutes may be excessive');
            }
        }
        // Retries validation
        if (config.retries !== undefined && config.retries > 5) {
            result.warnings.push('More than 5 retries may slow down test execution');
        }
        // Performance validation
        if (config.performance) {
            const { maxConcurrency, requestsPerSecond } = config.performance;
            if (maxConcurrency && maxConcurrency > 50) {
                result.warnings.push('High concurrency may overwhelm target servers');
            }
            if (requestsPerSecond && requestsPerSecond > 1000) {
                result.warnings.push('High requests per second may overwhelm target servers');
            }
            if (maxConcurrency && requestsPerSecond) {
                const theoretical = maxConcurrency * requestsPerSecond;
                if (theoretical > 5000) {
                    result.warnings.push('Combined concurrency and RPS settings may be too aggressive');
                }
            }
        }
        // Security validation
        if (config.security) {
            if (config.security.allowUnsafeEval) {
                result.warnings.push('Unsafe eval is enabled - use with caution');
            }
            if (config.security.trustedDomains && config.security.trustedDomains.length === 0) {
                result.warnings.push('No trusted domains specified - all domains will be allowed');
            }
        }
        // Plugin validation
        if (config.plugins) {
            const { enabled, disabled } = config.plugins;
            if (enabled && disabled) {
                const overlap = enabled.filter(p => disabled.includes(p));
                if (overlap.length > 0) {
                    result.errors.push(`Plugins cannot be both enabled and disabled: ${overlap.join(', ')}`);
                }
            }
        }
        // Environment validation
        if (config.environments?.directory) {
            if (config.environments.directory.startsWith('/')) {
                result.warnings.push('Using absolute path for environments directory');
            }
        }
        // Output validation
        if (config.output?.directory) {
            if (config.output.directory.startsWith('/')) {
                result.warnings.push('Using absolute path for output directory');
            }
        }
        // Logging validation
        if (config.logging) {
            if (config.logging.colors === false && config.logging.format === 'simple') {
                result.warnings.push('Dev format without colors may be hard to read');
            }
        }
        result.valid = result.errors.length === 0;
        return result;
    }
    /**
     * Setup JSON schema for configuration
     */
    setupSchema() {
        this.schema = {
            type: 'object',
            properties: {
                version: {
                    type: 'string',
                    nullable: true
                },
                defaultEnvironment: {
                    type: 'string',
                    nullable: true
                },
                httpClient: {
                    type: 'string',
                    enum: ['got', 'axios', 'fetch'],
                    nullable: true
                },
                timeout: {
                    type: 'number',
                    minimum: 0,
                    maximum: 600000,
                    nullable: true
                },
                retries: {
                    type: 'number',
                    minimum: 0,
                    maximum: 20,
                    nullable: true
                },
                environments: {
                    type: 'object',
                    properties: {
                        directory: {
                            type: 'string',
                            nullable: true
                        },
                        default: {
                            type: 'string',
                            nullable: true
                        }
                    },
                    additionalProperties: false,
                    nullable: true
                },
                logging: {
                    type: 'object',
                    properties: {
                        level: {
                            type: 'string',
                            enum: ['debug', 'info', 'warn', 'error'],
                            nullable: true
                        },
                        colors: {
                            type: 'boolean',
                            nullable: true
                        },
                        format: {
                            type: 'string',
                            enum: ['simple', 'detailed', 'json'],
                            nullable: true
                        },
                        outputs: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            nullable: true
                        }
                    },
                    additionalProperties: false,
                    nullable: true
                },
                output: {
                    type: 'object',
                    properties: {
                        format: {
                            type: 'string',
                            enum: ['json', 'html', 'junit'],
                            nullable: true
                        },
                        directory: {
                            type: 'string',
                            nullable: true
                        },
                        filename: {
                            type: 'string',
                            nullable: true
                        }
                    },
                    additionalProperties: false,
                    nullable: true
                },
                plugins: {
                    type: 'object',
                    properties: {
                        directory: {
                            type: 'string',
                            nullable: true
                        },
                        enabled: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            nullable: true
                        },
                        disabled: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            nullable: true
                        }
                    },
                    additionalProperties: false,
                    nullable: true
                },
                globals: {
                    type: 'object',
                    additionalProperties: true,
                    nullable: true
                },
                performance: {
                    type: 'object',
                    properties: {
                        maxConcurrency: {
                            type: 'number',
                            minimum: 1,
                            maximum: 1000,
                            nullable: true
                        },
                        requestsPerSecond: {
                            type: 'number',
                            minimum: 0.1,
                            maximum: 10000,
                            nullable: true
                        },
                        enableMetrics: {
                            type: 'boolean',
                            nullable: true
                        }
                    },
                    additionalProperties: false,
                    nullable: true
                },
                security: {
                    type: 'object',
                    properties: {
                        encryptSecrets: {
                            type: 'boolean',
                            nullable: true
                        },
                        allowUnsafeEval: {
                            type: 'boolean',
                            nullable: true
                        },
                        trustedDomains: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            nullable: true
                        }
                    },
                    additionalProperties: false,
                    nullable: true
                }
            },
            additionalProperties: false
        };
    }
}
//# sourceMappingURL=config-validator.js.map