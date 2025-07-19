/**
 * Tests for plugin registry functionality
 */

import { PluginRegistry } from '../registry/plugin-registry';
import { CoreApiPlugin } from '../core/api-plugin';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;
  let apiPlugin: CoreApiPlugin;

  beforeEach(() => {
    registry = new PluginRegistry();
    apiPlugin = new CoreApiPlugin();
  });

  afterEach(async () => {
    await registry.shutdown();
  });

  describe('Plugin Registration', () => {
    it('should register a plugin successfully', async () => {
      await registry.register(apiPlugin);
      
      expect(registry.has(apiPlugin.metadata.name)).toBe(true);
      expect(registry.list()).toHaveLength(1);
    });

    it('should prevent duplicate plugin registration', async () => {
      await registry.register(apiPlugin);
      
      await expect(registry.register(apiPlugin)).rejects.toThrow(
        `Plugin ${apiPlugin.metadata.name} is already registered`
      );
    });

    it('should map step types to plugins', async () => {
      await registry.register(apiPlugin);
      
      for (const stepType of apiPlugin.stepTypes) {
        expect(registry.isStepTypeSupported(stepType)).toBe(true);
        expect(registry.getForStepType(stepType)).toBe(apiPlugin);
      }
    });

    it('should unregister plugins', async () => {
      await registry.register(apiPlugin);
      registry.unregister(apiPlugin.metadata.name);
      
      expect(registry.has(apiPlugin.metadata.name)).toBe(false);
      expect(registry.list()).toHaveLength(0);
      
      for (const stepType of apiPlugin.stepTypes) {
        expect(registry.isStepTypeSupported(stepType)).toBe(false);
      }
    });
  });

  describe('Step Type Resolution', () => {
    beforeEach(async () => {
      await registry.register(apiPlugin);
    });

    it('should resolve plugins for supported step types', () => {
      expect(registry.getForStepType('api')).toBe(apiPlugin);
      expect(registry.getForStepType('get')).toBe(apiPlugin);
      expect(registry.getForStepType('post')).toBe(apiPlugin);
      expect(registry.getForStepType('http')).toBe(apiPlugin);
    });

    it('should return undefined for unsupported step types', () => {
      expect(registry.getForStepType('unsupported')).toBeUndefined();
      expect(registry.getForStepType('ui')).toBeUndefined();
    });

    it('should list all supported step types', () => {
      const supportedTypes = registry.getSupportedStepTypes();
      expect(supportedTypes).toEqual(expect.arrayContaining(apiPlugin.stepTypes));
    });
  });

  describe('Registry Statistics', () => {
    it('should provide accurate statistics', async () => {
      const initialStats = registry.getStats();
      expect(initialStats.pluginCount).toBe(0);
      expect(initialStats.stepTypeCount).toBe(0);

      await registry.register(apiPlugin);
      
      const stats = registry.getStats();
      expect(stats.pluginCount).toBe(1);
      expect(stats.stepTypeCount).toBe(apiPlugin.stepTypes.length);
      expect(stats.plugins).toHaveLength(1);
      expect(stats.plugins[0].name).toBe(apiPlugin.metadata.name);
    });
  });

  describe('Plugin Information', () => {
    beforeEach(async () => {
      await registry.register(apiPlugin);
    });

    it('should provide plugin information', () => {
      const pluginInfo = registry.getPluginInfo();
      expect(pluginInfo).toHaveLength(1);
      
      const info = pluginInfo[0];
      expect(info.metadata.name).toBe(apiPlugin.metadata.name);
      expect(info.metadata.version).toBe(apiPlugin.metadata.version);
      expect(info.loaded).toBe(true);
      expect(info.source.type).toBe('builtin');
    });
  });

  describe('Registry Cleanup', () => {
    it('should clear all plugins', async () => {
      await registry.register(apiPlugin);
      expect(registry.list()).toHaveLength(1);
      
      registry.clear();
      expect(registry.list()).toHaveLength(0);
      expect(registry.getSupportedStepTypes()).toHaveLength(0);
    });

    it('should shutdown gracefully', async () => {
      await registry.register(apiPlugin);
      await registry.shutdown();
      
      expect(registry.list()).toHaveLength(0);
    });
  });
});