/**
 * Utility functions for plugin development
 */

import type { Step, StepResult, ExecutionContext } from '@vibraniumjs/types';

export interface StepValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  validator?: (value: any) => boolean;
  message?: string;
}

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: Error) => boolean;
}

export class PluginUtils {
  /**
   * Validate step configuration
   */
  static validateStep(step: Step, rules: StepValidationRule[]): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = step[rule.field];
      
      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(rule.message || `Field '${rule.field}' is required`);
        continue;
      }
      
      // Skip type checking for undefined optional fields
      if (value === undefined && !rule.required) {
        continue;
      }
      
      // Check type
      if (rule.type && !this.isOfType(value, rule.type)) {
        errors.push(rule.message || `Field '${rule.field}' must be of type ${rule.type}`);
        continue;
      }
      
      // Custom validation
      if (rule.validator && !rule.validator(value)) {
        errors.push(rule.message || `Field '${rule.field}' failed validation`);
      }
    }

    return errors;
  }

  /**
   * Execute function with retry logic
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        if (options.shouldRetry && !options.shouldRetry(lastError)) {
          throw lastError;
        }
        
        // Don't delay on last attempt
        if (attempt < options.maxAttempts) {
          const delay = this.calculateDelay(attempt, options.delay, options.backoff);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Safely access nested object properties
   */
  static getNestedValue(obj: any, path: string): any {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  /**
   * Set nested object property
   */
  static setNestedValue(obj: any, path: string, value: any): void {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Target must be an object');
    }
    
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }
    
    if (typeof obj === 'object') {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  }

  /**
   * Merge objects deeply
   */
  static deepMerge(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return this.deepMerge(target, ...sources);
  }

  /**
   * Sanitize step data for logging
   */
  static sanitizeForLogging(data: any, sensitiveFields: string[] = []): any {
    const defaultSensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'cookie', 'session', 'credential', 'private', 'confidential'
    ];
    
    const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
    
    return this.sanitizeObject(data, allSensitiveFields);
  }

  /**
   * Format duration in human readable format
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Generate unique identifier
   */
  static generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
  }

  /**
   * Create standardized error
   */
  static createError(message: string, code?: string, details?: any): Error {
    const error = new Error(message) as any;
    if (code) error.code = code;
    if (details) error.details = details;
    return error;
  }

  /**
   * Check if value is of specified type
   */
  private static isOfType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Calculate retry delay
   */
  private static calculateDelay(attempt: number, baseDelay: number, backoff?: string): number {
    switch (backoff) {
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      case 'linear':
      default:
        return baseDelay * attempt;
    }
  }

  /**
   * Create delay promise
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if value is object
   */
  private static isObject(obj: any): boolean {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
  }

  /**
   * Sanitize object recursively
   */
  private static sanitizeObject(obj: any, sensitiveFields: string[]): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, sensitiveFields));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      
      if (sensitiveFields.some(field => keyLower.includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value, sensitiveFields);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

/**
 * Decorator for automatic error handling
 */
export function handleErrors(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    try {
      return await method.apply(this, args);
    } catch (error) {
      const pluginError = PluginUtils.createError(
        `Error in ${target.constructor.name}.${propertyName}: ${error.message}`,
        'PLUGIN_EXECUTION_ERROR',
        { originalError: error, method: propertyName }
      );
      throw pluginError;
    }
  };
}

/**
 * Decorator for logging method execution
 */
export function logExecution(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const startTime = Date.now();
    const pluginName = this.name || target.constructor.name;
    
    console.debug(`[${pluginName}] Starting ${propertyName}`);
    
    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;
      console.debug(`[${pluginName}] Completed ${propertyName} in ${PluginUtils.formatDuration(duration)}`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${pluginName}] Failed ${propertyName} after ${PluginUtils.formatDuration(duration)}:`, error);
      throw error;
    }
  };
}
