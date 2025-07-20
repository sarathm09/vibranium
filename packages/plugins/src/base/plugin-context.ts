/**
 * Plugin execution context and utilities
 */

import type { PluginMetadata, PluginRegistryConfig } from '../registry/plugin-registry';

export interface PluginContextData {
  [key: string]: any;
}

export interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface PluginConfig {
  [key: string]: any;
}

export class PluginContext {
  private data: PluginContextData = {};
  private logger: PluginLogger;
  
  constructor(
    public readonly metadata: PluginMetadata,
    public readonly registryConfig: PluginRegistryConfig,
    public readonly config: PluginConfig = {}
  ) {
    this.logger = this.createLogger();
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): PluginMetadata {
    return { ...this.metadata };
  }

  /**
   * Get plugin configuration
   */
  getConfig(): PluginConfig {
    return { ...this.config };
  }

  /**
   * Get configuration value
   */
  getConfigValue<T = any>(key: string, defaultValue?: T): T {
    return this.config[key] ?? defaultValue;
  }

  /**
   * Set configuration value
   */
  setConfigValue(key: string, value: any): void {
    this.config[key] = value;
  }

  /**
   * Get context data
   */
  getData<T = any>(key: string): T | undefined {
    return this.data[key];
  }

  /**
   * Set context data
   */
  setData(key: string, value: any): void {
    this.data[key] = value;
  }

  /**
   * Check if data exists
   */
  hasData(key: string): boolean {
    return key in this.data;
  }

  /**
   * Remove data
   */
  removeData(key: string): void {
    delete this.data[key];
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.data = {};
  }

  /**
   * Get all data
   */
  getAllData(): PluginContextData {
    return { ...this.data };
  }

  /**
   * Get logger instance
   */
  getLogger(): PluginLogger {
    return this.logger;
  }

  /**
   * Create resource with cleanup tracking
   */
  createResource<T>(factory: () => T, cleanup?: (resource: T) => void): T {
    const resource = factory();
    
    if (cleanup) {
      const cleanupFunctions = this.getData<Array<() => void>>('__cleanup') || [];
      cleanupFunctions.push(() => cleanup(resource));
      this.setData('__cleanup', cleanupFunctions);
    }
    
    return resource;
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    const cleanupFunctions = this.getData<Array<() => void>>('__cleanup') || [];
    
    for (const cleanup of cleanupFunctions) {
      try {
        await cleanup();
      } catch (error) {
        this.logger.warn('Error during resource cleanup:', error);
      }
    }
    
    this.removeData('__cleanup');
  }

  /**
   * Get plugin identifier
   */
  getPluginId(): string {
    return this.metadata.id;
  }

  /**
   * Get plugin name
   */
  getPluginName(): string {
    return this.metadata.name;
  }

  /**
   * Get plugin version
   */
  getPluginVersion(): string {
    return this.metadata.version;
  }

  /**
   * Check if plugin supports capability
   */
  supportsCapability(capability: string): boolean {
    return this.metadata.capabilities?.includes(capability) ?? false;
  }

  /**
   * Get supported capabilities
   */
  getCapabilities(): string[] {
    return [...(this.metadata.capabilities || [])];
  }

  /**
   * Create scoped context for sub-operations
   */
  createScopedContext(scope: string): PluginContext {
    const scopedMetadata = {
      ...this.metadata,
      id: `${this.metadata.id}:${scope}`
    };
    
    const scopedContext = new PluginContext(scopedMetadata, this.registryConfig, this.config);
    
    // Share parent data
    scopedContext.data = { ...this.data };
    
    return scopedContext;
  }

  /**
   * Create plugin-specific logger
   */
  private createLogger(): PluginLogger {
    const prefix = `[${this.metadata.name}]`;
    
    return {
      debug: (message: string, ...args: any[]) => {
        console.debug(`${prefix} ${message}`, ...args);
      },
      info: (message: string, ...args: any[]) => {
        console.log(`${prefix} ${message}`, ...args);
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`${prefix} ${message}`, ...args);
      },
      error: (message: string, ...args: any[]) => {
        console.error(`${prefix} ${message}`, ...args);
      }
    };
  }

  /**
   * Validate configuration against schema
   */
  validateConfig(): boolean {
    if (!this.metadata.configSchema) {
      return true; // No schema to validate against
    }

    try {
      // This would be implemented with a schema validator like AJV
      // For now, return true
      return true;
    } catch (error) {
      this.logger.error('Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Convert to JSON for serialization
   */
  toJSON() {
    return {
      metadata: this.metadata,
      config: this.config,
      data: this.data
    };
  }

  /**
   * Clone context
   */
  clone(): PluginContext {
    const cloned = new PluginContext(
      { ...this.metadata },
      { ...this.registryConfig },
      { ...this.config }
    );
    
    cloned.data = { ...this.data };
    return cloned;
  }
}
