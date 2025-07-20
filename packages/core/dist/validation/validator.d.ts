/**
 * Main validation engine - simplified implementation
 */
import type { ExpectBlock, ValidationResult } from '../types';
export interface ValidationContext {
    response?: any;
    stepName: string;
    data: any;
}
export declare class ValidationEngine {
    private jsonParser;
    private xmlParser;
    private textParser;
    /**
     * Validate response against expectations
     */
    validate(expectations: ExpectBlock, context: ValidationContext): Promise<ValidationResult[]>;
    /**
     * Validate a single operator
     */
    private validateOperator;
    /**
     * Validate HTTP status code
     */
    private validateStatus;
    /**
     * Validate response body
     */
    private validateBody;
    /**
     * Validate response headers
     */
    private validateHeaders;
    /**
     * Validate using JSONPath
     */
    private validateJsonPath;
    /**
     * Validate using XPath
     */
    private validateXPath;
    /**
     * Deep equality check for objects
     */
    private deepEqual;
}
//# sourceMappingURL=validator.d.ts.map