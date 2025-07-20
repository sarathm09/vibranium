/**
 * Schema validation using AJV for scenario files
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { logger } from '@vibraniumjs/utils';
export class SchemaValidator {
    ajv;
    scenarioValidator;
    stepValidator;
    environmentValidator;
    constructor() {
        // Initialize AJV with strict mode and formats
        this.ajv = new Ajv({
            strict: true,
            allErrors: true,
            verbose: true,
            discriminator: true,
            removeAdditional: false,
            useDefaults: true,
            coerceTypes: false
        });
        // Add format validation - with fallback for compatibility issues
        try {
            addFormats(this.ajv);
        }
        catch (error) {
            logger.warn('Failed to add AJV formats, continuing without format validation', { error: error.message });
        }
        // Add custom keywords and formats
        this.addCustomKeywords();
        // Compile validators
        this.compileValidators();
    }
    /**
     * Validate a complete scenario
     */
    async validate(scenario) {
        try {
            logger.debug('Validating scenario', { name: scenario?.name });
            if (!this.scenarioValidator) {
                throw new Error('Scenario validator not initialized');
            }
            const valid = this.scenarioValidator(scenario);
            const errors = [];
            const warnings = [];
            if (!valid && this.scenarioValidator.errors) {
                this.scenarioValidator.errors.forEach(error => {
                    const errorMessage = this.formatValidationError(error);
                    errors.push(errorMessage);
                });
            }
            // Additional semantic validation
            if (valid) {
                const semanticResult = this.validateSemantics(scenario);
                warnings.push(...semanticResult.warnings);
                if (!semanticResult.valid) {
                    errors.push(...semanticResult.errors);
                }
            }
            const result = {
                valid: valid && errors.length === 0,
                errors,
                warnings,
                data: scenario
            };
            logger.debug('Scenario validation completed', {
                valid: result.valid,
                errors: result.errors.length,
                warnings: result.warnings.length
            });
            return result;
        }
        catch (error) {
            logger.error('Validation failed', { error: error.message });
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`],
                warnings: []
            };
        }
    }
    /**
     * Validate a single step
     */
    async validateStep(step) {
        if (!this.stepValidator) {
            throw new Error('Step validator not initialized');
        }
        const valid = this.stepValidator(step);
        const errors = [];
        if (!valid && this.stepValidator.errors) {
            this.stepValidator.errors.forEach(error => {
                errors.push(this.formatValidationError(error));
            });
        }
        return {
            valid,
            errors,
            warnings: [],
            data: step
        };
    }
    /**
     * Validate environment configuration
     */
    async validateEnvironment(environment) {
        if (!this.environmentValidator) {
            throw new Error('Environment validator not initialized');
        }
        const valid = this.environmentValidator(environment);
        const errors = [];
        if (!valid && this.environmentValidator.errors) {
            this.environmentValidator.errors.forEach(error => {
                errors.push(this.formatValidationError(error));
            });
        }
        return {
            valid,
            errors,
            warnings: [],
            data: environment
        };
    }
    /**
     * Add custom AJV keywords for Vibranium-specific validation
     */
    addCustomKeywords() {
        // Custom keyword for variable references
        this.ajv.addKeyword({
            keyword: 'variableReference',
            type: 'string',
            schemaType: 'boolean',
            compile: (schema) => {
                return (data) => {
                    if (!schema)
                        return true;
                    // Check if string contains variable references like {{$.env.VAR}}
                    const variableRegex = /\{\{\$\.[\w\.]+\}\}/;
                    return variableRegex.test(data) || !data.includes('{{');
                };
            },
            errors: false,
            metaSchema: {
                type: 'boolean'
            }
        });
        // Custom keyword for step dependency validation
        this.ajv.addKeyword({
            keyword: 'validStepReference',
            type: 'string',
            schemaType: 'object',
            compile: (schema) => {
                return (data) => {
                    // This would be validated later with actual step context
                    return typeof data === 'string' && data.length > 0;
                };
            },
            errors: false
        });
    }
    /**
     * Compile all schema validators
     */
    compileValidators() {
        try {
            // Scenario schema
            const scenarioSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string', nullable: true },
                    version: { type: 'string', default: '1.0' },
                    environment: { type: 'string', nullable: true },
                    variables: {
                        type: 'object',
                        additionalProperties: true,
                        nullable: true
                    },
                    steps: {
                        type: 'array',
                        items: { $ref: '#/$defs/step' },
                        minItems: 1
                    },
                    hooks: {
                        type: 'object',
                        properties: {
                            onStart: { type: 'array', items: { type: 'string' }, nullable: true },
                            onEnd: { type: 'array', items: { type: 'string' }, nullable: true },
                            beforeApi: { type: 'array', items: { type: 'string' }, nullable: true },
                            afterApi: { type: 'array', items: { type: 'string' }, nullable: true }
                        },
                        additionalProperties: false,
                        nullable: true
                    },
                    config: {
                        type: 'object',
                        additionalProperties: true,
                        nullable: true
                    },
                    metadata: {
                        type: 'object',
                        additionalProperties: true,
                        nullable: true
                    },
                    timeout: { type: 'number', minimum: 0, nullable: true }
                },
                required: ['name', 'steps'],
                additionalProperties: false,
                $defs: {
                    step: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', minLength: 1 },
                            type: { type: 'string', minLength: 1 },
                            description: { type: 'string', nullable: true },
                            dependsOn: {
                                type: 'array',
                                items: { type: 'string' },
                                nullable: true
                            },
                            skip: {
                                oneOf: [
                                    { type: 'boolean' },
                                    { type: 'string' }
                                ],
                                nullable: true
                            },
                            timeout: { type: 'number', minimum: 0, nullable: true },
                            retries: { type: 'number', minimum: 0, nullable: true },
                            expect: {
                                type: 'object',
                                additionalProperties: true,
                                nullable: true
                            },
                            config: {
                                type: 'object',
                                additionalProperties: true,
                                nullable: true
                            },
                            metadata: {
                                type: 'object',
                                additionalProperties: true,
                                nullable: true
                            }
                        },
                        required: ['name', 'type'],
                        additionalProperties: true // Allow step-specific properties
                    }
                }
            };
            this.scenarioValidator = this.ajv.compile(scenarioSchema);
            logger.debug('Schema validators compiled successfully');
        }
        catch (error) {
            logger.error('Failed to compile schema validators', { error: error.message });
            throw new Error(`Schema compilation failed: ${error.message}`);
        }
    }
    /**
     * Perform semantic validation beyond schema
     */
    validateSemantics(scenario) {
        const errors = [];
        const warnings = [];
        // Validate step dependencies
        const stepNames = new Set(scenario.steps.map(step => step.name));
        scenario.steps.forEach(step => {
            if (step.dependsOn) {
                step.dependsOn.forEach(dep => {
                    if (typeof dep === 'string' && !stepNames.has(dep)) {
                        errors.push(`Step '${step.name}' depends on non-existent step '${dep}'`);
                    }
                });
            }
            // Check for circular dependencies (basic check)
            if (step.dependsOn?.includes(step.name)) {
                errors.push(`Step '${step.name}' cannot depend on itself`);
            }
        });
        // Check for duplicate step names
        const duplicates = scenario.steps
            .map(step => step.name)
            .filter((name, index, arr) => arr.indexOf(name) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate step names found: ${duplicates.join(', ')}`);
        }
        // Validate variable references (basic check)
        const variableKeys = Object.keys(scenario.variables || {});
        scenario.steps.forEach(step => {
            const stepStr = JSON.stringify(step);
            const variableRefs = stepStr.match(/\{\{\$\.\w+\.([\w\.]+)\}\}/g);
            if (variableRefs) {
                variableRefs.forEach(ref => {
                    const varName = ref.match(/\{\{\$\.\w+\.([\w\.]+)\}\}/)?.[1];
                    if (varName && !variableKeys.includes(varName.split('.')[0])) {
                        warnings.push(`Variable reference '${varName}' in step '${step.name}' may not be defined`);
                    }
                });
            }
        });
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Format AJV validation error for user-friendly display
     */
    formatValidationError(error) {
        const path = error.instancePath || 'root';
        const value = error.data !== undefined ? JSON.stringify(error.data) : 'undefined';
        switch (error.keyword) {
            case 'required':
                return `Missing required property '${error.params.missingProperty}' at ${path}`;
            case 'type':
                return `Expected ${error.params.type} but got ${typeof error.data} at ${path}`;
            case 'minLength':
                return `String at ${path} must be at least ${error.params.limit} characters long`;
            case 'enum':
                return `Value at ${path} must be one of: ${error.params.allowedValues.join(', ')}`;
            case 'additionalProperties':
                return `Unexpected property '${error.params.additionalProperty}' at ${path}`;
            default:
                return `Validation error at ${path}: ${error.message} (value: ${value})`;
        }
    }
}
//# sourceMappingURL=schema-validator.js.map