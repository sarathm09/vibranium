/**
 * Variable resolution and interpolation for dot notation system
 */

import type { VariableMap, Environment } from '@vibraniumjs/types';

export interface ResolverContext {
  env?: VariableMap;
  global?: VariableMap;
  context?: VariableMap;
  request?: VariableMap;
  response?: VariableMap;
  api?: VariableMap;
  random?: VariableMap;
  [alias: string]: VariableMap | undefined;
}

export class VariableResolver {
  private context: ResolverContext = {};
  private randomGenerators: Map<string, Function> = new Map();

  constructor(initialContext: ResolverContext = {}) {
    this.context = { ...initialContext };
    this.setupRandomGenerators();
  }

  /**
   * Update the resolver context
   */
  updateContext(updates: Partial<ResolverContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Set environment variables
   */
  setEnvironment(environment: Environment): void {
    this.context.env = {
      ...environment.variables,
      ...environment.secrets
    };
  }

  /**
   * Set global variables
   */
  setGlobal(variables: VariableMap): void {
    this.context.global = variables;
  }

  /**
   * Set context variables (execution metadata)
   */
  setContext(variables: VariableMap): void {
    this.context.context = variables;
  }

  /**
   * Set request variables
   */
  setRequest(variables: VariableMap): void {
    this.context.request = variables;
  }

  /**
   * Set response variables
   */
  setResponse(variables: VariableMap): void {
    this.context.response = variables;
  }

  /**
   * Set API step variables
   */
  setApi(variables: VariableMap): void {
    this.context.api = variables;
  }

  /**
   * Set alias variables (from step dependencies)
   */
  setAlias(alias: string, variables: VariableMap): void {
    this.context[alias] = variables;
  }

  /**
   * Resolve a dot notation variable (e.g., $.env.API_URL)
   */
  resolve(variable: string): any {
    if (!variable.startsWith('$.')) {
      return variable;
    }

    const parts = variable.substring(2).split('.');
    const namespace = parts[0];
    const path = parts.slice(1);

    // Handle random namespace specially
    if (namespace === 'random') {
      return this.resolveRandomVariable(path);
    }

    // Get the namespace object
    const namespaceObj = this.context[namespace];
    if (!namespaceObj) {
      throw new Error(`Unknown variable namespace: ${namespace}`);
    }

    // Navigate the path
    return this.navigatePath(namespaceObj, path);
  }

  /**
   * Interpolate template string with variables
   */
  interpolate(template: string): string {
    if (typeof template !== 'string') {
      return template;
    }

    // Replace {{$.variable.path}} patterns
    return template.replace(/\{\{\s*(\$\.[^}]+)\s*\}\}/g, (match, variable) => {
      try {
        const value = this.resolve(variable.trim());
        return String(value);
      } catch (error) {
        throw new Error(`Failed to resolve variable ${variable} in template: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Interpolate all variables in an object recursively
   */
  interpolateObject<T>(obj: T): T {
    if (typeof obj === 'string') {
      return this.interpolate(obj) as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item)) as T;
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value);
      }
      return result;
    }

    return obj;
  }

  /**
   * Check if a string contains variables
   */
  hasVariables(str: string): boolean {
    return typeof str === 'string' && /\{\{\s*\$\.[^}]+\s*\}\}/.test(str);
  }

  /**
   * Extract all variables from a template string
   */
  extractVariables(template: string): string[] {
    if (typeof template !== 'string') {
      return [];
    }

    const matches = template.match(/\{\{\s*(\$\.[^}]+)\s*\}\}/g);
    if (!matches) {
      return [];
    }

    return matches.map(match => 
      match.replace(/\{\{\s*|\s*\}\}/g, '').trim()
    );
  }

  /**
   * Validate that all variables in a template can be resolved
   */
  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const variables = this.extractVariables(template);
    const errors: string[] = [];

    for (const variable of variables) {
      try {
        this.resolve(variable);
      } catch (error) {
        errors.push(`Variable ${variable}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get all available variables in current context
   */
  getAvailableVariables(): Record<string, string[]> {
    const available: Record<string, string[]> = {};

    for (const [namespace, obj] of Object.entries(this.context)) {
      if (obj && typeof obj === 'object') {
        available[namespace] = this.getObjectPaths(obj);
      }
    }

    // Add random generators
    available.random = Array.from(this.randomGenerators.keys());

    return available;
  }

  /**
   * Navigate object path (supports array indices and object properties)
   */
  private navigatePath(obj: any, path: string[]): any {
    let current = obj;

    for (const segment of path) {
      if (current === null || current === undefined) {
        throw new Error(`Cannot access property '${segment}' of ${current}`);
      }

      // Handle array index access
      if (Array.isArray(current) && /^\d+$/.test(segment)) {
        const index = parseInt(segment, 10);
        if (index >= current.length) {
          throw new Error(`Array index ${index} out of bounds (length: ${current.length})`);
        }
        current = current[index];
      }
      // Handle object property access
      else if (typeof current === 'object') {
        if (!(segment in current)) {
          throw new Error(`Property '${segment}' not found`);
        }
        current = current[segment];
      }
      else {
        throw new Error(`Cannot access property '${segment}' of ${typeof current}`);
      }
    }

    return current;
  }

  /**
   * Resolve random variable ($.random.function or $.random.category.function)
   */
  private resolveRandomVariable(path: string[]): any {
    const functionPath = path.join('.');
    const generator = this.randomGenerators.get(functionPath);
    
    if (generator) {
      return generator();
    }

    throw new Error(`Random generator not found: ${functionPath}`);
  }

  /**
   * Setup random data generators
   */
  private setupRandomGenerators(): void {
    // Basic generators
    this.randomGenerators.set('uuid', () => require('uuid').v4());
    this.randomGenerators.set('string', () => Math.random().toString(36).substring(2, 15));
    this.randomGenerators.set('number', () => Math.floor(Math.random() * 1000));
    this.randomGenerators.set('boolean', () => Math.random() >= 0.5);
    this.randomGenerators.set('email', () => `user${Math.floor(Math.random() * 10000)}@example.com`);
    this.randomGenerators.set('date', () => new Date().toISOString());

    // Lorem ipsum generators
    this.randomGenerators.set('lorem.word', () => 'lorem');
    this.randomGenerators.set('lorem.words', () => 'lorem ipsum dolor');
    this.randomGenerators.set('lorem.sentence', () => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
    this.randomGenerators.set('lorem.paragraph', () => 
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    );

    // Name generators (placeholders - will be enhanced with test-datasets)
    this.randomGenerators.set('names.marvel', () => 'Spider-Man');
    this.randomGenerators.set('names.harryPotter', () => 'Harry Potter');
    this.randomGenerators.set('names.starWars', () => 'Luke Skywalker');
    this.randomGenerators.set('names.first', () => 'John');
    this.randomGenerators.set('names.last', () => 'Doe');
    this.randomGenerators.set('names.full', () => 'John Doe');
  }

  /**
   * Get all possible paths in an object
   */
  private getObjectPaths(obj: any, prefix = ''): string[] {
    const paths: string[] = [];

    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        paths.push(currentPath);

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          paths.push(...this.getObjectPaths(value, currentPath));
        }
      }
    }

    return paths;
  }
}