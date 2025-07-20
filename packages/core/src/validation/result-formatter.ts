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

export class ValidationResultFormatter {
  /**
   * Format validation results for display
   */
  format(results: ValidationResult[]): FormattedValidationResult {
    const total = results.length;
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = total - passedCount;
    const passed = failedCount === 0;

    const summary = passed 
      ? `All ${total} validations passed`
      : `${failedCount} of ${total} validations failed`;

    const details = results.map(result => 
      `${result.passed ? '✓' : '✗'} ${result.operator}: ${result.message}`
    );

    return {
      summary,
      details,
      passed,
      total,
      passedCount,
      failedCount
    };
  }

  /**
   * Format as simple text output
   */
  formatAsText(results: ValidationResult[]): string {
    const formatted = this.format(results);
    return [
      formatted.summary,
      ...formatted.details.map(detail => `  ${detail}`)
    ].join('\n');
  }
}