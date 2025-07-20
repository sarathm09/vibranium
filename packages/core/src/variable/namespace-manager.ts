/**
 * Namespace manager for variable resolution system
 * Manages built-in namespaces (env, global, context, response, api, random) and custom aliases
 */

import { logger } from '@vibraniumjs/utils';

export interface NamespaceConfig {
  name: string;
  description?: string;
  readonly?: boolean;
  builtin?: boolean;
  validator?: (data: any) => boolean;
  transformer?: (data: any) => any;
}

export class NamespaceManager {
  private namespaces = new Map<string, NamespaceConfig>();
  private aliases = new Map<string, string>();

  constructor() {
    this.initializeBuiltinNamespaces();
  }

  /**
   * Register a new namespace or alias
   */
  register(config: NamespaceConfig): void {
    if (this.namespaces.has(config.name)) {
      const existing = this.namespaces.get(config.name)!;
      if (existing.builtin && !config.builtin) {
        throw new Error(`Cannot override builtin namespace '${config.name}'`);
      }
    }

    logger.debug('Registering namespace', { name: config.name, builtin: config.builtin });
    this.namespaces.set(config.name, config);
  }

  /**
   * Create an alias for an existing namespace
   */
  createAlias(alias: string, target: string): void {
    if (!this.namespaces.has(target)) {
      throw new Error(`Target namespace '${target}' does not exist`);
    }

    if (this.namespaces.has(alias)) {
      throw new Error(`Namespace '${alias}' already exists`);
    }

    logger.debug('Creating namespace alias', { alias, target });
    this.aliases.set(alias, target);
  }

  /**
   * Resolve namespace name (handle aliases)
   */
  resolveNamespace(name: string): string {
    return this.aliases.get(name) || name;
  }

  /**
   * Check if a namespace exists
   */
  hasNamespace(name: string): boolean {
    const resolved = this.resolveNamespace(name);
    return this.namespaces.has(resolved);
  }

  /**
   * Get namespace configuration
   */
  getNamespace(name: string): NamespaceConfig | undefined {
    const resolved = this.resolveNamespace(name);
    return this.namespaces.get(resolved);
  }

  /**
   * Get all registered namespaces
   */
  getAllNamespaces(): NamespaceConfig[] {
    return Array.from(this.namespaces.values());
  }

  /**
   * Get all aliases
   */
  getAllAliases(): Array<{ alias: string; target: string }> {
    return Array.from(this.aliases.entries()).map(([alias, target]) => ({ alias, target }));
  }

  /**
   * Validate data for a namespace
   */
  validateNamespaceData(name: string, data: any): boolean {
    const namespace = this.getNamespace(name);
    if (!namespace) {
      return false;
    }

    if (namespace.validator) {
      try {
        return namespace.validator(data);
      } catch (error) {
        logger.warn('Namespace validation failed', { name, error: error.message });
        return false;
      }
    }

    return true;
  }

  /**
   * Transform data for a namespace
   */
  transformNamespaceData(name: string, data: any): any {
    const namespace = this.getNamespace(name);
    if (!namespace) {
      return data;
    }

    if (namespace.transformer) {
      try {
        return namespace.transformer(data);
      } catch (error) {
        logger.warn('Namespace transformation failed', { name, error: error.message });
        return data;
      }
    }

    return data;
  }

  /**
   * Remove a namespace (only non-builtin ones)
   */
  remove(name: string): boolean {
    const namespace = this.getNamespace(name);
    if (!namespace) {
      return false;
    }

    if (namespace.builtin) {
      throw new Error(`Cannot remove builtin namespace '${name}'`);
    }

    logger.debug('Removing namespace', { name });
    
    // Remove aliases pointing to this namespace
    for (const [alias, target] of this.aliases.entries()) {
      if (target === name) {
        this.aliases.delete(alias);
      }
    }

    return this.namespaces.delete(name);
  }

  /**
   * Remove an alias
   */
  removeAlias(alias: string): boolean {
    return this.aliases.delete(alias);
  }

  /**
   * Initialize built-in namespaces
   */
  private initializeBuiltinNamespaces(): void {
    // Environment variables
    this.register({
      name: 'env',
      description: 'Environment variables from process.env and configuration',
      readonly: true,
      builtin: true,
      validator: (data: any) => typeof data === 'object' && data !== null
    });

    // Global variables (shared across all scenarios)
    this.register({
      name: 'global',
      description: 'Global variables shared across all scenarios',
      readonly: false,
      builtin: true,
      validator: (data: any) => typeof data === 'object' && data !== null
    });

    // Context variables (scenario-specific)
    this.register({
      name: 'context',
      description: 'Context variables specific to current scenario execution',
      readonly: false,
      builtin: true,
      validator: (data: any) => typeof data === 'object' && data !== null
    });

    // Response data from previous API calls
    this.register({
      name: 'response',
      description: 'Response data from the most recent API call',
      readonly: true,
      builtin: true,
      validator: (data: any) => data === null || typeof data === 'object'
    });

    // API call responses by step name
    this.register({
      name: 'api',
      description: 'API call responses indexed by step name',
      readonly: true,
      builtin: true,
      validator: (data: any) => typeof data === 'object' && data !== null
    });

    // Random data generators
    this.register({
      name: 'random',
      description: 'Random data generators for testing',
      readonly: true,
      builtin: true,
      validator: (data: any) => typeof data === 'object' && data !== null,
      transformer: (data: any) => {
        // Ensure random data is always fresh
        if (typeof data === 'object' && data !== null) {
          const transformed: any = {};
          Object.keys(data).forEach(key => {
            const value = data[key];
            if (typeof value === 'function') {
              transformed[key] = value();
            } else {
              transformed[key] = value;
            }
          });
          return transformed;
        }
        return data;
      }
    });

    logger.debug('Built-in namespaces initialized');
  }
}
