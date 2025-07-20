/**
 * Plugin registry and loading system
 */

import type { VibraniumPlugin, PluginRegistry } from '@vibraniumjs/types';

// Placeholder implementation
export class DefaultPluginRegistry implements PluginRegistry {
  private plugins = new Map<string, VibraniumPlugin>();

  register(plugin: VibraniumPlugin): void {
    // TODO: Implement plugin registration with validation
    plugin.supportedStepTypes.forEach(stepType => {
      this.plugins.set(stepType, plugin);
    });
  }

  unregister(pluginName: string): void {
    // TODO: Implement plugin unregistration
    throw new Error('Not implemented');
  }

  getPlugin(stepType: string): VibraniumPlugin | undefined {
    return this.plugins.get(stepType);
  }

  getAllPlugins(): VibraniumPlugin[] {
    return Array.from(new Set(this.plugins.values()));
  }

  isStepTypeSupported(stepType: string): boolean {
    return this.plugins.has(stepType);
  }
}