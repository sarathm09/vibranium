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

export class TemplateInterpolator {
  private options: Required<InterpolatorOptions>;

  constructor(options: InterpolatorOptions = {}) {
    this.options = {
      openDelimiter: options.openDelimiter || '{{',
      closeDelimiter: options.closeDelimiter || '}}',
      escapeHtml: options.escapeHtml ?? false,
      allowUndefined: options.allowUndefined ?? true,
      throwOnMissing: options.throwOnMissing ?? false
    };
  }

  /**
   * Interpolate template with variables
   */
  interpolate(template: string, variables: Record<string, any>): string {
    if (typeof template !== 'string') {
      return String(template);
    }

    const pattern = this.createPattern();
    
    return template.replace(pattern, (match, expression) => {
      try {
        const value = this.evaluateExpression(expression.trim(), variables);
        return this.formatValue(value);
      } catch (error) {
        if (this.options.throwOnMissing) {
          throw error;
        }
        return this.options.allowUndefined ? match : '';
      }
    });
  }

  /**
   * Interpolate object recursively
   */
  interpolateObject<T>(obj: T, variables: Record<string, any>): T {
    if (typeof obj === 'string') {
      return this.interpolate(obj, variables) as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, variables)) as T;
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, variables);
      }
      return result;
    }

    return obj;
  }

  /**
   * Check if template contains variables
   */
  hasVariables(template: string): boolean {
    const pattern = this.createPattern();
    return pattern.test(template);
  }

  /**
   * Extract variable names from template
   */
  extractVariables(template: string): string[] {
    const pattern = this.createPattern();
    const variables: string[] = [];
    let match;

    while ((match = pattern.exec(template)) !== null) {
      const expression = match[1].trim();
      const variableName = this.extractVariableName(expression);
      if (variableName && !variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }

  /**
   * Create regex pattern for matching variables
   */
  private createPattern(): RegExp {
    const open = this.escapeRegex(this.options.openDelimiter);
    const close = this.escapeRegex(this.options.closeDelimiter);
    return new RegExp(`${open}\\s*([^${close}]+)\\s*${close}`, 'g');
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Evaluate expression safely
   */
  private evaluateExpression(expression: string, variables: Record<string, any>): any {
    // Handle dot notation (e.g., user.name, response.data.id)
    if (expression.includes('.')) {
      return this.evaluateDotNotation(expression, variables);
    }

    // Simple variable lookup
    if (!(expression in variables)) {
      throw new Error(`Variable '${expression}' not found`);
    }

    return variables[expression];
  }

  /**
   * Evaluate dot notation expressions
   */
  private evaluateDotNotation(expression: string, variables: Record<string, any>): any {
    const parts = expression.split('.');
    let current = variables;

    for (const part of parts) {
      if (current === null || current === undefined) {
        throw new Error(`Cannot access property '${part}' of ${current}`);
      }

      if (typeof current !== 'object') {
        throw new Error(`Cannot access property '${part}' of ${typeof current}`);
      }

      // Handle array index access
      if (Array.isArray(current) && /^\d+$/.test(part)) {
        const index = parseInt(part, 10);
        if (index >= current.length) {
          throw new Error(`Array index ${index} out of bounds`);
        }
        current = current[index];
      }
      // Handle object property access
      else if (part in current) {
        current = (current as any)[part];
      } else {
        throw new Error(`Property '${part}' not found in ${expression}`);
      }
    }

    return current;
  }

  /**
   * Extract the root variable name from an expression
   */
  private extractVariableName(expression: string): string {
    return expression.split('.')[0];
  }

  /**
   * Format value for output
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    let result = String(value);

    if (this.options.escapeHtml) {
      result = this.escapeHtml(result);
    }

    return result;
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
  }
}