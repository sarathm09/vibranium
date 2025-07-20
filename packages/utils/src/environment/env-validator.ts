/**
 * Environment validation and schema checking
 */

import Ajv from 'ajv';
import type { Environment, VariableMap } from '@vibraniumjs/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvironmentSchema {
  environment?: {
    required?: boolean;
    type?: 'string';
    enum?: string[];
  };
  variables?: {
    required?: boolean;
    type?: 'object';
    properties?: Record<string, any>;
  };
  secrets?: {
    required?: boolean;
    type?: 'object';
    properties?: Record<string, any>;
  };
}

export class EnvironmentValidator {
  private ajv: Ajv.Ajv;
  private defaultSchema: any;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.setupDefaultSchema();
  }

  /**
   * Validate an environment against schema
   */
  validate(environment: Environment, schema?: EnvironmentSchema): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Basic structure validation
    const structureResult = this.validateStructure(environment);
    result.errors.push(...structureResult.errors);
    result.warnings.push(...structureResult.warnings);

    // Schema validation if provided
    if (schema) {
      const schemaResult = this.validateAgainstSchema(environment, schema);
      result.errors.push(...schemaResult.errors);
      result.warnings.push(...schemaResult.warnings);
    }

    // Variable validation
    const variableResult = this.validateVariables(environment);
    result.errors.push(...variableResult.errors);
    result.warnings.push(...variableResult.warnings);

    // Security validation
    const securityResult = this.validateSecurity(environment);
    result.warnings.push(...securityResult.warnings);

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate environment structure
   */
  validateStructure(environment: any): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!environment || typeof environment !== 'object') {
      result.errors.push('Environment must be an object');
      return result;
    }

    // Validate environment name
    if (environment.environment !== undefined) {
      if (typeof environment.environment !== 'string') {
        result.errors.push('Environment name must be a string');
      } else if (!environment.environment.trim()) {
        result.errors.push('Environment name cannot be empty');
      }
    }

    // Validate variables
    if (environment.variables !== undefined) {
      if (typeof environment.variables !== 'object' || Array.isArray(environment.variables)) {
        result.errors.push('Variables must be an object');
      } else {
        for (const [key, value] of Object.entries(environment.variables)) {
          if (typeof key !== 'string' || !key.trim()) {
            result.errors.push(`Variable key must be a non-empty string: ${key}`);
          }
          if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
            result.warnings.push(`Variable '${key}' has non-primitive value, may cause issues`);
          }
        }
      }
    }

    // Validate secrets
    if (environment.secrets !== undefined) {
      if (typeof environment.secrets !== 'object' || Array.isArray(environment.secrets)) {
        result.errors.push('Secrets must be an object');
      } else {
        for (const [key, value] of Object.entries(environment.secrets)) {
          if (typeof key !== 'string' || !key.trim()) {
            result.errors.push(`Secret key must be a non-empty string: ${key}`);
          }
          if (typeof value !== 'string') {
            result.errors.push(`Secret '${key}' must be a string`);
          }
        }
      }
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate against custom schema
   */
  validateAgainstSchema(environment: Environment, schema: EnvironmentSchema): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Validate environment name
    if (schema.environment) {
      const envName = environment.name;
      
      if (schema.environment.required && !envName) {
        result.errors.push('Environment name is required');
      }
      
      if (envName && schema.environment.enum && !schema.environment.enum.includes(envName)) {
        result.errors.push(`Environment name '${envName}' is not in allowed values: ${schema.environment.enum.join(', ')}`);
      }
    }

    // Validate variables against schema
    if (schema.variables && environment.variables) {
      const varResult = this.validateVariablesAgainstSchema(environment.variables, schema.variables);
      result.errors.push(...varResult.errors);
      result.warnings.push(...varResult.warnings);
    }

    // Validate secrets against schema
    if (schema.secrets && environment.secrets) {
      const secretResult = this.validateVariablesAgainstSchema(environment.secrets, schema.secrets);
      result.errors.push(...secretResult.errors);
      result.warnings.push(...secretResult.warnings);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate variables
   */
  validateVariables(environment: Environment): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!environment.variables) {
      return result;
    }

    // Check for common variable naming issues
    for (const key of Object.keys(environment.variables)) {
      if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
        result.warnings.push(`Variable '${key}' doesn't follow conventional naming (A-Z, 0-9, _)`);
      }
      
      if (key.length > 50) {
        result.warnings.push(`Variable '${key}' has a very long name (${key.length} characters)`);
      }
    }

    // Check for circular references in variable interpolation
    const circularResult = this.checkCircularReferences(environment.variables);
    result.errors.push(...circularResult.errors);

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate security aspects
   */
  validateSecurity(environment: Environment): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check for potential secrets in variables (should be in secrets section)
    if (environment.variables) {
      for (const [key, value] of Object.entries(environment.variables)) {
        if (typeof value === 'string' && this.looksLikeSecret(key, value)) {
          result.warnings.push(`Variable '${key}' appears to contain sensitive data, consider moving to secrets`);
        }
      }
    }

    // Check for hardcoded credentials
    const allValues = [
      ...Object.values(environment.variables || {}),
      ...Object.values(environment.secrets || {})
    ];

    for (const value of allValues) {
      if (typeof value === 'string' && this.containsHardcodedCredentials(value)) {
        result.warnings.push('Hardcoded credentials detected, use environment variables instead');
      }
    }

    return result;
  }

  /**
   * Validate variables against schema properties
   */
  private validateVariablesAgainstSchema(variables: VariableMap, schema: any): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (schema.required) {
      const requiredVars = Array.isArray(schema.required) ? schema.required : [];
      for (const requiredVar of requiredVars) {
        if (!(requiredVar in variables)) {
          result.errors.push(`Required variable '${requiredVar}' is missing`);
        }
      }
    }

    if (schema.properties) {
      for (const [key, value] of Object.entries(variables)) {
        const propSchema = schema.properties[key];
        if (propSchema) {
          const validation = this.validateVariableValue(value, propSchema, key);
          result.errors.push(...validation.errors);
          result.warnings.push(...validation.warnings);
        }
      }
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate a single variable value against schema
   */
  private validateVariableValue(value: any, schema: any, varName: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (schema.type) {
      const actualType = typeof value;
      if (actualType !== schema.type) {
        result.errors.push(`Variable '${varName}' should be ${schema.type}, got ${actualType}`);
      }
    }

    if (schema.enum && !schema.enum.includes(value)) {
      result.errors.push(`Variable '${varName}' value '${value}' is not in allowed values: ${schema.enum.join(', ')}`);
    }

    if (schema.pattern && typeof value === 'string') {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        result.errors.push(`Variable '${varName}' doesn't match required pattern: ${schema.pattern}`);
      }
    }

    if (schema.minLength && typeof value === 'string' && value.length < schema.minLength) {
      result.errors.push(`Variable '${varName}' is too short (minimum ${schema.minLength} characters)`);
    }

    if (schema.maxLength && typeof value === 'string' && value.length > schema.maxLength) {
      result.errors.push(`Variable '${varName}' is too long (maximum ${schema.maxLength} characters)`);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Check for circular references in variable interpolation
   */
  private checkCircularReferences(variables: VariableMap): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    const visited = new Set<string>();
    const inProgress = new Set<string>();

    const checkVariable = (key: string): boolean => {
      if (inProgress.has(key)) {
        result.errors.push(`Circular reference detected in variable '${key}'`);
        return false;
      }

      if (visited.has(key)) {
        return true;
      }

      visited.add(key);
      inProgress.add(key);

      const value = variables[key];
      if (typeof value === 'string') {
        // Look for variable references in the value
        const references = this.extractVariableReferences(value);
        for (const ref of references) {
          if (ref in variables && !checkVariable(ref)) {
            return false;
          }
        }
      }

      inProgress.delete(key);
      return true;
    };

    for (const key of Object.keys(variables)) {
      if (!visited.has(key)) {
        checkVariable(key);
      }
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Extract variable references from a string
   */
  private extractVariableReferences(value: string): string[] {
    const matches = value.match(/\{\{\s*\$\.([^}]+)\s*\}\}/g);
    if (!matches) {
      return [];
    }

    return matches.map(match => {
      const variable = match.replace(/\{\{\s*\$\.|}\}/g, '').trim();
      return variable.split('.')[0]; // Get the top-level variable name
    });
  }

  /**
   * Check if a variable looks like it contains secret data
   */
  private looksLikeSecret(key: string, value: string): boolean {
    const secretKeywords = ['password', 'secret', 'key', 'token', 'auth', 'credential', 'private'];
    const keyLower = key.toLowerCase();
    
    return secretKeywords.some(keyword => keyLower.includes(keyword)) ||
           (typeof value === 'string' && value.length > 20 && !/\s/.test(value));
  }

  /**
   * Check if a value contains hardcoded credentials
   */
  private containsHardcodedCredentials(value: string): boolean {
    // Simple patterns for common credential formats
    const patterns = [
      /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 tokens
      /^[a-f0-9]{32,}$/i, // Hex keys
      /password.*[:=]\s*[^$]/i, // Hardcoded passwords
      /api_key.*[:=]\s*[^$]/i // Hardcoded API keys
    ];

    return patterns.some(pattern => pattern.test(value));
  }

  /**
   * Setup default JSON schema for environments
   */
  private setupDefaultSchema(): void {
    this.defaultSchema = {
      type: 'object',
      properties: {
        environment: {
          type: 'string',
          nullable: true
        },
        variables: {
          type: 'object',
          nullable: true,
          additionalProperties: true
        },
        secrets: {
          type: 'object',
          nullable: true,
          additionalProperties: true
        }
      },
      additionalProperties: false
    };
  }
}