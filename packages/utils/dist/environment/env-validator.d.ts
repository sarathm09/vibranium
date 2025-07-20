/**
 * Environment validation and schema checking
 */
import type { Environment } from '@vibraniumjs/types';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface EnvironmentSchema {
    environment?: {
        required?: boolean;
        type?: 'string';
        enum?: string[];
    };
    variables?: {
        required?: boolean;
        type?: 'object';
        properties?: Record<string, any>;
    };
    secrets?: {
        required?: boolean;
        type?: 'object';
        properties?: Record<string, any>;
    };
}
export declare class EnvironmentValidator {
    private ajv;
    private defaultSchema;
    constructor();
    /**
     * Validate an environment against schema
     */
    validate(environment: Environment, schema?: EnvironmentSchema): ValidationResult;
    /**
     * Validate environment structure
     */
    validateStructure(environment: any): ValidationResult;
    /**
     * Validate against custom schema
     */
    validateAgainstSchema(environment: Environment, schema: EnvironmentSchema): ValidationResult;
    /**
     * Validate variables
     */
    validateVariables(environment: Environment): ValidationResult;
    /**
     * Validate security aspects
     */
    validateSecurity(environment: Environment): ValidationResult;
    /**
     * Validate variables against schema properties
     */
    private validateVariablesAgainstSchema;
    /**
     * Validate a single variable value against schema
     */
    private validateVariableValue;
    /**
     * Check for circular references in variable interpolation
     */
    private checkCircularReferences;
    /**
     * Extract variable references from a string
     */
    private extractVariableReferences;
    /**
     * Check if a variable looks like it contains secret data
     */
    private looksLikeSecret;
    /**
     * Check if a value contains hardcoded credentials
     */
    private containsHardcodedCredentials;
    /**
     * Setup default JSON schema for environments
     */
    private setupDefaultSchema;
}
//# sourceMappingURL=env-validator.d.ts.map