/**
 * Validation result formatter
 */
import type { ValidationResult } from '@vibraniumjs/types';
export interface FormattedValidationResult {
    summary: string;
    details: string[];
    passed: boolean;
    total: number;
    passedCount: number;
    failedCount: number;
}
export declare class ValidationResultFormatter {
    /**
     * Format validation results for display
     */
    format(results: ValidationResult[]): FormattedValidationResult;
    /**
     * Format as simple text output
     */
    formatAsText(results: ValidationResult[]): string;
}
//# sourceMappingURL=result-formatter.d.ts.map