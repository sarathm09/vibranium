/**
 * Plugin registry for discovery, loading, and management
 */

import type { VibraniumPlugin, Step, ExecutionContext, StepResult } from '@vibraniumjs/types';
import { PluginLoader } from './plugin-loader';
import { CapabilityChecker } from './capability-checker';
import { LifecycleManager } from './lifecycle-manager';
import { PluginContext } from '../base/plugin-context';

export interface PluginRegistryConfig {
  autoDiscover?: boolean;
  pluginPaths?: string[];
  allowDuplicateStepTypes?: boolean;
  enableValidation?: boolean;
  maxConcurrentPlugins?: number;
}

export interface PluginRegistration {
  plugin: VibraniumPlugin;
  metadata: PluginMetadata;
  context: PluginContext;
  loaded: Date;
  active: boolean;
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  capabilities?: string[];
  configSchema?: any;
}

export class PluginRegistry {
  private plugins = new Map<string, PluginRegistration>();
  private stepTypeMap = new Map<string, string>();
  private loader: PluginLoader;
  private capabilityChecker: CapabilityChecker;
  private lifecycleManager: LifecycleManager;
  private config: PluginRegistryConfig;

  constructor(config: PluginRegistryConfig = {}) {
    this.config = {
      autoDiscover: true,
      allowDuplicateStepTypes: false,
      enableValidation: true,
      maxConcurrentPlugins: 10,
      ...config
    };

    this.loader = new PluginLoader();
    this.capabilityChecker = new CapabilityChecker();
    this.lifecycleManager = new LifecycleManager(this.config.maxConcurrentPlugins || 10);
  }

  /**
   * Register a plugin instance
   */
  async register(plugin: VibraniumPlugin, metadata?: Partial<PluginMetadata>): Promise<void> {
    const pluginMetadata = this.createPluginMetadata(plugin, metadata);
    
    // Validate plugin
    if (this.config.enableValidation) {
      await this.validatePlugin(plugin, pluginMetadata);
    }

    // Check for step type conflicts
    this.checkStepTypeConflicts(plugin, pluginMetadata.id);

    // Create plugin context
    const context = new PluginContext(pluginMetadata, this.config);

    // Initialize plugin
    await this.lifecycleManager.initializePlugin(plugin, context);

    // Register plugin
    const registration: PluginRegistration = {
      plugin,
      metadata: pluginMetadata,
      context,
      loaded: new Date(),
      active: true
    };

    this.plugins.set(pluginMetadata.id, registration);

    // Map step types
    plugin.supportedStepTypes.forEach(stepType => {
      this.stepTypeMap.set(stepType, pluginMetadata.id);
    });

    console.log(`Plugin registered: ${pluginMetadata.name} v${pluginMetadata.version}`);
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Destroy plugin
    await this.lifecycleManager.destroyPlugin(registration.plugin, registration.context);

    // Remove step type mappings
    registration.plugin.supportedStepTypes.forEach(stepType => {
      this.stepTypeMap.delete(stepType);
    });

    // Remove from registry
    this.plugins.delete(pluginId);

    console.log(`Plugin unregistered: ${registration.metadata.name}`);
  }

  /**
   * Get plugin for step type
   */
  getPlugin(stepType: string): VibraniumPlugin | undefined {
    const pluginId = this.stepTypeMap.get(stepType);
    if (!pluginId) {
      return undefined;
    }

    const registration = this.plugins.get(pluginId);
    return registration?.active ? registration.plugin : undefined;
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): VibraniumPlugin[] {
    return Array.from(this.plugins.values())
      .filter(reg => reg.active)
      .map(reg => reg.plugin);
  }

  /**
   * Check if step type is supported
   */
  isStepTypeSupported(stepType: string): boolean {
    const pluginId = this.stepTypeMap.get(stepType);
    if (!pluginId) {
      return false;
    }

    const registration = this.plugins.get(pluginId);
    return registration?.active ?? false;
  }

  /**
   * Execute step using appropriate plugin
   */
  async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    const plugin = this.getPlugin(step.type);
    if (!plugin) {
      throw new Error(`No plugin found for step type: ${step.type}`);
    }

    // Execute with lifecycle management
    return this.lifecycleManager.executeStep(plugin, step, context);
  }

  /**
   * Load plugins from specified paths
   */
  async loadPlugins(paths: string[] = []): Promise<void> {
    const pluginPaths = [...(this.config.pluginPaths || []), ...paths];
    
    for (const path of pluginPaths) {
      try {
        const plugins = await this.loader.loadFromPath(path);
        for (const plugin of plugins) {
          await this.register(plugin);
        }
      } catch (error) {
        console.warn(`Failed to load plugins from ${path}:`, error);
      }
    }
  }

  /**
   * Auto-discover and load plugins
   */
  async autoDiscover(): Promise<void> {
    if (!this.config.autoDiscover) {
      return;
    }

    try {
      const discoveredPlugins = await this.loader.discoverPlugins();
      for (const plugin of discoveredPlugins) {
        await this.register(plugin);
      }
    } catch (error) {
      console.warn('Plugin auto-discovery failed:', error);
    }
  }

  /**
   * Get plugin registration info
   */
  getPluginInfo(pluginId: string): PluginRegistration | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const activePlugins = Array.from(this.plugins.values()).filter(reg => reg.active);
    const stepTypes = Array.from(this.stepTypeMap.keys());
    
    return {
      totalPlugins: this.plugins.size,
      activePlugins: activePlugins.length,
      supportedStepTypes: stepTypes.length,
      stepTypes,
      plugins: activePlugins.map(reg => ({
        id: reg.metadata.id,
        name: reg.metadata.name,
        version: reg.metadata.version,
        stepTypes: reg.plugin.supportedStepTypes,
        loaded: reg.loaded
      }))
    };
  }

  /**
   * Shutdown registry and all plugins
   */
  async shutdown(): Promise<void> {
    const pluginIds = Array.from(this.plugins.keys());
    
    await Promise.allSettled(
      pluginIds.map(id => this.unregister(id))
    );

    this.plugins.clear();
    this.stepTypeMap.clear();
  }

  /**
   * Create plugin metadata
   */
  private createPluginMetadata(plugin: VibraniumPlugin, metadata?: Partial<PluginMetadata>): PluginMetadata {
    return {
      id: metadata?.id || `${plugin.name}-${plugin.version}`,
      name: plugin.name,
      version: plugin.version,
      description: metadata?.description,
      author: metadata?.author,
      dependencies: metadata?.dependencies || [],
      capabilities: plugin.supportedStepTypes,
      configSchema: metadata?.configSchema
    };
  }

  /**
   * Validate plugin before registration
   */
  private async validatePlugin(plugin: VibraniumPlugin, metadata: PluginMetadata): Promise<void> {
    // Basic validation
    if (!plugin.name || !plugin.version || !plugin.supportedStepTypes?.length) {
      throw new Error('Plugin missing required properties: name, version, supportedStepTypes');
    }

    if (typeof plugin.executeStep !== 'function') {
      throw new Error('Plugin must implement executeStep method');
    }

    // Check capabilities
    await this.capabilityChecker.validateCapabilities(plugin, metadata);

    // Check dependencies
    if (metadata.dependencies?.length) {
      this.validateDependencies(metadata.dependencies);
    }
  }

  /**
   * Check for step type conflicts
   */
  private checkStepTypeConflicts(plugin: VibraniumPlugin, pluginId: string): void {
    if (this.config.allowDuplicateStepTypes) {
      return;
    }

    for (const stepType of plugin.supportedStepTypes) {
      const existingPluginId = this.stepTypeMap.get(stepType);
      if (existingPluginId && existingPluginId !== pluginId) {
        const existingPlugin = this.plugins.get(existingPluginId);
        throw new Error(
          `Step type '${stepType}' already handled by plugin: ${existingPlugin?.metadata.name}`
        );
      }
    }
  }

  /**
   * Validate plugin dependencies
   */
  private validateDependencies(dependencies: string[]): void {
    for (const dependency of dependencies) {
      if (!this.plugins.has(dependency)) {
        throw new Error(`Missing plugin dependency: ${dependency}`);
      }
    }
  }
}
