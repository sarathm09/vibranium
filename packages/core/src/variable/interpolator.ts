/**
 * String interpolation engine for variable substitution in scenario files
 * Supports: {{$.env.API_URL}}/users, {{$.context.userId}}, etc.
 */

import { VariableResolver, ResolverContext } from './resolver';
import { logger } from '@vibraniumjs/utils';

export interface InterpolationOptions {
  strict?: boolean; // Fail on unresolvable variables
  preserveTypes?: boolean; // Keep non-string types when interpolating
  allowPartial?: boolean; // Allow partial interpolation
  defaultValue?: any; // Default for unresolvable variables
}

export interface InterpolationResult {
  value: any;
  interpolated: boolean;
  errors: string[];
  warnings: string[];
}

export class StringInterpolator {
  private resolver: VariableResolver;
  private variablePattern = /\{\{\s*([^}]+)\s*\}\}/g;

  constructor(resolver: VariableResolver) {
    this.resolver = resolver;
  }

  /**
   * Interpolate variables in a single value
   */
  interpolate(
    value: any,
    context: ResolverContext,
    options: InterpolationOptions = {}
  ): InterpolationResult {
    const {
      strict = false,
      preserveTypes = true,
      allowPartial = true,
      defaultValue = undefined
    } = options;

    try {
      logger.debug('Interpolating value', { type: typeof value });

      const result = this.interpolateValue(value, context, {
        strict,
        preserveTypes,
        allowPartial,
        defaultValue
      });

      return {
        value: result.value,
        interpolated: result.interpolated,
        errors: result.errors,
        warnings: result.warnings
      };
    } catch (error) {
      return {
        value,
        interpolated: false,
        errors: [`Interpolation failed: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Interpolate variables in an entire object tree
   */
  interpolateObject(
    obj: any,
    context: ResolverContext,
    options: InterpolationOptions = {}
  ): InterpolationResult {
    try {
      logger.debug('Interpolating object', { type: typeof obj });

      const result = this.interpolateValue(obj, context, options);
      
      return {
        value: result.value,
        interpolated: result.interpolated,
        errors: result.errors,
        warnings: result.warnings
      };
    } catch (error) {
      return {
        value: obj,
        interpolated: false,
        errors: [`Object interpolation failed: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Check if a value contains interpolation expressions
   */
  hasInterpolation(value: any): boolean {
    if (typeof value === 'string') {
      return this.variablePattern.test(value);
    }
    
    if (Array.isArray(value)) {
      return value.some(item => this.hasInterpolation(item));
    }
    
    if (value && typeof value === 'object') {
      return Object.values(value).some(val => this.hasInterpolation(val));
    }
    
    return false;
  }

  /**
   * Extract all variable references from a value
   */
  extractReferences(value: any): string[] {
    const references: string[] = [];
    this.collectReferences(value, references);
    return [...new Set(references)].sort();
  }

  /**
   * Validate that all references in a value can be resolved
   */
  validateReferences(
    value: any,
    context: ResolverContext
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const references = this.extractReferences(value);
    const errors: string[] = [];
    const warnings: string[] = [];
    
    references.forEach(ref => {
      try {
        this.resolver.resolve(ref, context);
      } catch (error) {
        errors.push(`Cannot resolve variable '${ref}': ${error.message}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Core interpolation logic for any value type
   */
  private interpolateValue(
    value: any,
    context: ResolverContext,
    options: InterpolationOptions
  ): { value: any; interpolated: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (typeof value === 'string') {
      const result = this.interpolateString(value, context, options);
      return {
        value: result.value,
        interpolated: result.interpolated,
        errors: result.errors,
        warnings: result.warnings
      };
    }
    
    if (Array.isArray(value)) {
      let arrayInterpolated = false;
      const interpolatedArray = value.map(item => {
        const result = this.interpolateValue(item, context, options);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
        if (result.interpolated) arrayInterpolated = true;
        return result.value;
      });
      
      return {
        value: interpolatedArray,
        interpolated: arrayInterpolated,
        errors,
        warnings
      };
    }
    
    if (value && typeof value === 'object') {
      let objectInterpolated = false;
      const interpolatedObject: any = {};
      
      Object.keys(value).forEach(key => {
        const result = this.interpolateValue(value[key], context, options);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
        if (result.interpolated) objectInterpolated = true;
        interpolatedObject[key] = result.value;
      });
      
      return {
        value: interpolatedObject,
        interpolated: objectInterpolated,
        errors,
        warnings
      };
    }
    
    // Primitive values (number, boolean, null, undefined)
    return {
      value,
      interpolated: false,
      errors,
      warnings
    };
  }

  /**
   * Interpolate variables in a string
   */
  private interpolateString(
    str: string,
    context: ResolverContext,
    options: InterpolationOptions
  ): { value: any; interpolated: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Reset regex state
    this.variablePattern.lastIndex = 0;
    
    const matches = [...str.matchAll(this.variablePattern)];
    
    if (matches.length === 0) {
      return {
        value: str,
        interpolated: false,
        errors,
        warnings
      };
    }
    
    // If the string is exactly one variable reference and preserveTypes is true,
    // return the resolved value directly (preserving its type)
    if (options.preserveTypes && matches.length === 1 && matches[0][0] === str.trim()) {
      const variableRef = matches[0][1].trim();
      try {
        const resolved = this.resolver.resolve(variableRef, context);
        return {
          value: resolved,
          interpolated: true,
          errors,
          warnings
        };
      } catch (error) {
        if (options.strict) {
          errors.push(`Failed to resolve variable '${variableRef}': ${error.message}`);
          return { value: str, interpolated: false, errors, warnings };
        } else {
          warnings.push(`Could not resolve variable '${variableRef}': ${error.message}`);
          return {
            value: options.defaultValue !== undefined ? options.defaultValue : str,
            interpolated: false,
            errors,
            warnings
          };
        }
      }
    }
    
    // Multiple variables or mixed content - perform string substitution
    let result = str;
    let interpolated = false;
    
    for (const match of matches) {
      const [fullMatch, variableRef] = match;
      const trimmedRef = variableRef.trim();
      
      try {
        const resolved = this.resolver.resolve(trimmedRef, context);
        const stringValue = this.valueToString(resolved);
        result = result.replace(fullMatch, stringValue);
        interpolated = true;
      } catch (error) {
        if (options.strict) {
          errors.push(`Failed to resolve variable '${trimmedRef}': ${error.message}`);
        } else if (options.allowPartial) {
          warnings.push(`Could not resolve variable '${trimmedRef}': ${error.message}`);
          // Leave the variable reference in place or use default
          if (options.defaultValue !== undefined) {
            const defaultStr = this.valueToString(options.defaultValue);
            result = result.replace(fullMatch, defaultStr);
            interpolated = true;
          }
        } else {
          warnings.push(`Could not resolve variable '${trimmedRef}': ${error.message}`);
        }
      }
    }
    
    return {
      value: result,
      interpolated,
      errors,
      warnings
    };
  }

  /**
   * Convert any value to string for interpolation
   */
  private valueToString(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    
    try {
      return JSON.stringify(value);
    } catch {
      return '[object Object]';
    }
  }

  /**
   * Recursively collect variable references from a value
   */
  private collectReferences(value: any, references: string[]): void {
    if (typeof value === 'string') {
      const matches = [...value.matchAll(this.variablePattern)];
      matches.forEach(match => {
        references.push(match[1].trim());
      });
    } else if (Array.isArray(value)) {
      value.forEach(item => this.collectReferences(item, references));
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(val => this.collectReferences(val, references));
    }
  }
}
