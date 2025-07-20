/**
 * Plugin loader for dynamic discovery and loading
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { VibraniumPlugin } from '@vibraniumjs/types';

export interface PluginLoadOptions {
  recursive?: boolean;
  filePattern?: RegExp;
  validatePlugin?: boolean;
}

export class PluginLoader {
  private defaultOptions: PluginLoadOptions = {
    recursive: true,
    filePattern: /\.(js|mjs|ts)$/,
    validatePlugin: true
  };

  /**
   * Load plugins from a file path
   */
  async loadFromPath(pluginPath: string, options?: PluginLoadOptions): Promise<VibraniumPlugin[]> {
    const opts = { ...this.defaultOptions, ...options };
    const plugins: VibraniumPlugin[] = [];

    try {
      const stat = await fs.stat(pluginPath);
      
      if (stat.isFile()) {
        const plugin = await this.loadPluginFile(pluginPath);
        if (plugin) {
          plugins.push(plugin);
        }
      } else if (stat.isDirectory()) {
        const dirPlugins = await this.loadFromDirectory(pluginPath, opts);
        plugins.push(...dirPlugins);
      }
    } catch (error) {
      throw new Error(`Failed to load plugins from ${pluginPath}: ${error}`);
    }

    return plugins;
  }

  /**
   * Load plugins from directory
   */
  async loadFromDirectory(dirPath: string, options: PluginLoadOptions): Promise<VibraniumPlugin[]> {
    const plugins: VibraniumPlugin[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isFile() && options.filePattern?.test(entry.name)) {
          try {
            const plugin = await this.loadPluginFile(fullPath);
            if (plugin) {
              plugins.push(plugin);
            }
          } catch (error) {
            console.warn(`Failed to load plugin file ${fullPath}:`, error);
          }
        } else if (entry.isDirectory() && options.recursive) {
          try {
            const subPlugins = await this.loadFromDirectory(fullPath, options);
            plugins.push(...subPlugins);
          } catch (error) {
            console.warn(`Failed to load plugins from directory ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to read directory ${dirPath}: ${error}`);
    }

    return plugins;
  }

  /**
   * Load a single plugin file
   */
  async loadPluginFile(filePath: string): Promise<VibraniumPlugin | null> {
    try {
      // Dynamic import to support both CommonJS and ES modules
      const module = await import(filePath);
      
      // Try different export patterns
      let plugin: VibraniumPlugin | null = null;
      
      if (module.default && this.isValidPlugin(module.default)) {
        plugin = typeof module.default === 'function' ? new module.default() : module.default;
      } else if (this.isValidPlugin(module)) {
        plugin = typeof module === 'function' ? new module() : module;
      } else {
        // Look for named exports that might be plugins
        for (const [key, value] of Object.entries(module)) {
          if (this.isValidPlugin(value)) {
            plugin = typeof value === 'function' ? new (value as any)() : value as VibraniumPlugin;
            break;
          }
        }
      }
      
      if (!plugin) {
        console.warn(`No valid plugin found in ${filePath}`);
        return null;
      }

      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin from ${filePath}: ${error}`);
    }
  }

  /**
   * Auto-discover plugins in common locations
   */
  async discoverPlugins(): Promise<VibraniumPlugin[]> {
    const discoveryPaths = this.getDiscoveryPaths();
    const plugins: VibraniumPlugin[] = [];

    for (const discoveryPath of discoveryPaths) {
      try {
        await fs.access(discoveryPath);
        const pathPlugins = await this.loadFromPath(discoveryPath);
        plugins.push(...pathPlugins);
      } catch {
        // Path doesn't exist or not accessible, skip
      }
    }

    return plugins;
  }

  /**
   * Get standard plugin discovery paths
   */
  private getDiscoveryPaths(): string[] {
    const paths: string[] = [];
    
    // Current working directory plugins
    paths.push(path.join(process.cwd(), 'plugins'));
    paths.push(path.join(process.cwd(), 'vibranium-plugins'));
    
    // Node modules
    paths.push(path.join(process.cwd(), 'node_modules'));
    
    // Global npm modules (if accessible)
    if (process.env.NODE_PATH) {
      paths.push(...process.env.NODE_PATH.split(path.delimiter));
    }
    
    // User home directory
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (homeDir) {
      paths.push(path.join(homeDir, '.vibranium', 'plugins'));
    }
    
    return paths;
  }

  /**
   * Check if an object is a valid plugin
   */
  private isValidPlugin(obj: any): obj is VibraniumPlugin {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      typeof obj.version === 'string' &&
      Array.isArray(obj.supportedStepTypes) &&
      obj.supportedStepTypes.length > 0 &&
      typeof obj.executeStep === 'function'
    );
  }

  /**
   * Load plugins from npm package names
   */
  async loadFromPackageNames(packageNames: string[]): Promise<VibraniumPlugin[]> {
    const plugins: VibraniumPlugin[] = [];
    
    for (const packageName of packageNames) {
      try {
        const plugin = await this.loadFromPackage(packageName);
        if (plugin) {
          plugins.push(plugin);
        }
      } catch (error) {
        console.warn(`Failed to load plugin package ${packageName}:`, error);
      }
    }
    
    return plugins;
  }

  /**
   * Load plugin from npm package
   */
  private async loadFromPackage(packageName: string): Promise<VibraniumPlugin | null> {
    try {
      // Try to require the package
      const module = await import(packageName);
      
      if (this.isValidPlugin(module.default)) {
        return typeof module.default === 'function' ? new module.default() : module.default;
      }
      
      if (this.isValidPlugin(module)) {
        return typeof module === 'function' ? new module() : module;
      }
      
      console.warn(`Package ${packageName} does not export a valid plugin`);
      return null;
    } catch (error) {
      throw new Error(`Failed to load plugin package ${packageName}: ${error}`);
    }
  }

  /**
   * Validate loaded plugin
   */
  private validateLoadedPlugin(plugin: VibraniumPlugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }
    
    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a valid version');
    }
    
    if (!Array.isArray(plugin.supportedStepTypes) || plugin.supportedStepTypes.length === 0) {
      throw new Error('Plugin must support at least one step type');
    }
    
    if (typeof plugin.executeStep !== 'function') {
      throw new Error('Plugin must implement executeStep method');
    }
  }
}
