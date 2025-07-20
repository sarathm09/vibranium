/**
 * Configuration validation with schema checking
 */
import type { VibraniumConfig } from './config-manager';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class ConfigValidator {
    private ajv;
    private schema;
    constructor();
    /**
     * Validate configuration against schema
     */
    validate(config: VibraniumConfig): ValidationResult;
    /**
     * Validate configuration file structure
     */
    validateStructure(config: any): ValidationResult;
    /**
     * Validate environment-specific rules
     */
    private validateCustomRules;
    /**
     * Setup JSON schema for configuration
     */
    private setupSchema;
}
//# sourceMappingURL=config-validator.d.ts.map