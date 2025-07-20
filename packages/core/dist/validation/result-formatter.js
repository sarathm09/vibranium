/**
 * Validation result formatter
 */
export class ValidationResultFormatter {
    /**
     * Format validation results for display
     */
    format(results) {
        const total = results.length;
        const passedCount = results.filter(r => r.passed).length;
        const failedCount = total - passedCount;
        const passed = failedCount === 0;
        const summary = passed
            ? `All ${total} validations passed`
            : `${failedCount} of ${total} validations failed`;
        const details = results.map(result => `${result.passed ? '✓' : '✗'} ${result.operator}: ${result.message}`);
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
    formatAsText(results) {
        const formatted = this.format(results);
        return [
            formatted.summary,
            ...formatted.details.map(detail => `  ${detail}`)
        ].join('\n');
    }
}
//# sourceMappingURL=result-formatter.js.map