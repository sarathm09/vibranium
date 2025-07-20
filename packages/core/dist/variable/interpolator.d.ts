/**
 * String interpolation engine for variable substitution in scenario files
 * Supports: {{$.env.API_URL}}/users, {{$.context.userId}}, etc.
 */
import { VariableResolver, ResolverContext } from './resolver';
export interface InterpolationOptions {
    strict?: boolean;
    preserveTypes?: boolean;
    allowPartial?: boolean;
    defaultValue?: any;
}
export interface InterpolationResult {
    value: any;
    interpolated: boolean;
    errors: string[];
    warnings: string[];
}
export declare class StringInterpolator {
    private resolver;
    private variablePattern;
    constructor(resolver: VariableResolver);
    /**
     * Interpolate variables in a single value
     */
    interpolate(value: any, context: ResolverContext, options?: InterpolationOptions): InterpolationResult;
    /**
     * Interpolate variables in an entire object tree
     */
    interpolateObject(obj: any, context: ResolverContext, options?: InterpolationOptions): InterpolationResult;
    /**
     * Check if a value contains interpolation expressions
     */
    hasInterpolation(value: any): boolean;
    /**
     * Extract all variable references from a value
     */
    extractReferences(value: any): string[];
    /**
     * Validate that all references in a value can be resolved
     */
    validateReferences(value: any, context: ResolverContext): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Core interpolation logic for any value type
     */
    private interpolateValue;
    /**
     * Interpolate variables in a string
     */
    private interpolateString;
    /**
     * Convert any value to string for interpolation
     */
    private valueToString;
    /**
     * Recursively collect variable references from a value
     */
    private collectReferences;
}
//# sourceMappingURL=interpolator.d.ts.map