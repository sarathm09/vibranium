/**
 * String interpolation types
 */

import type { VariableContext } from './context';

export interface StringInterpolator {
  interpolate(template: string, context: VariableContext): Promise<string>;
  extractVariables(template: string): string[];
  validateTemplate(template: string): ValidationResult;
}

export interface InterpolationConfig {
  startDelimiter: string;
  endDelimiter: string;
  escapeCharacter?: string;
  allowFunctions?: boolean;
  strictMode?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  variables: string[];
}

export interface InterpolationContext {
  template: string;
  variables: VariableContext;
  config: InterpolationConfig;
  depth: number;
}