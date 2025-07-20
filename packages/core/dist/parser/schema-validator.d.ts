/**
 * Schema validation using AJV for scenario files
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    data?: any;
}
export declare class SchemaValidator {
    private ajv;
    private scenarioValidator?;
    private stepValidator?;
    private environmentValidator?;
    constructor();
    /**
     * Validate a complete scenario
     */
    validate(scenario: any): Promise<ValidationResult>;
    /**
     * Validate a single step
     */
    validateStep(step: any): Promise<ValidationResult>;
    /**
     * Validate environment configuration
     */
    validateEnvironment(environment: any): Promise<ValidationResult>;
    /**
     * Add custom AJV keywords for Vibranium-specific validation
     */
    private addCustomKeywords;
    /**
     * Compile all schema validators
     */
    private compileValidators;
    /**
     * Perform semantic validation beyond schema
     */
    private validateSemantics;
    /**
     * Format AJV validation error for user-friendly display
     */
    private formatValidationError;
}
//# sourceMappingURL=schema-validator.d.ts.map