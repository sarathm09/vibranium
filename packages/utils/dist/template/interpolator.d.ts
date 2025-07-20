/**
 * Template interpolation with variable substitution
 */
export interface InterpolatorOptions {
    openDelimiter?: string;
    closeDelimiter?: string;
    escapeHtml?: boolean;
    allowUndefined?: boolean;
    throwOnMissing?: boolean;
}
export declare class TemplateInterpolator {
    private options;
    constructor(options?: InterpolatorOptions);
    /**
     * Interpolate template with variables
     */
    interpolate(template: string, variables: Record<string, any>): string;
    /**
     * Interpolate object recursively
     */
    interpolateObject<T>(obj: T, variables: Record<string, any>): T;
    /**
     * Check if template contains variables
     */
    hasVariables(template: string): boolean;
    /**
     * Extract variable names from template
     */
    extractVariables(template: string): string[];
    /**
     * Create regex pattern for matching variables
     */
    private createPattern;
    /**
     * Escape regex special characters
     */
    private escapeRegex;
    /**
     * Evaluate expression safely
     */
    private evaluateExpression;
    /**
     * Evaluate dot notation expressions
     */
    private evaluateDotNotation;
    /**
     * Extract the root variable name from an expression
     */
    private extractVariableName;
    /**
     * Format value for output
     */
    private formatValue;
    /**
     * Escape HTML characters
     */
    private escapeHtml;
}
//# sourceMappingURL=interpolator.d.ts.map