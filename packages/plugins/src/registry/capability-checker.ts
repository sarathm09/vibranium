/**
 * Plugin capability validation and checking
 */

import type { VibraniumPlugin } from '@vibraniumjs/types';
import type { PluginMetadata } from './plugin-registry';

export interface PluginCapability {
  name: string;
  version?: string;
  required?: boolean;
  description?: string;
  validator?: (plugin: VibraniumPlugin) => boolean | Promise<boolean>;
}

export interface CapabilityValidationResult {
  capability: string;
  supported: boolean;
  reason?: string;
}

export class CapabilityChecker {
  private knownCapabilities = new Map<string, PluginCapability>();

  constructor() {
    this.registerStandardCapabilities();
  }

  /**
   * Register a capability for validation
   */
  registerCapability(capability: PluginCapability): void {
    this.knownCapabilities.set(capability.name, capability);
  }

  /**
   * Validate plugin capabilities
   */
  async validateCapabilities(plugin: VibraniumPlugin, metadata: PluginMetadata): Promise<CapabilityValidationResult[]> {
    const results: CapabilityValidationResult[] = [];
    const capabilities = metadata.capabilities || plugin.supportedStepTypes;

    for (const capabilityName of capabilities) {
      const result = await this.validateCapability(plugin, capabilityName);
      results.push(result);
    }

    // Check for required capabilities that are missing
    for (const [name, capability] of this.knownCapabilities) {
      if (capability.required && !capabilities.includes(name)) {
        results.push({
          capability: name,
          supported: false,
          reason: 'Required capability not declared'
        });
      }
    }

    return results;
  }

  /**
   * Validate a specific capability
   */
  async validateCapability(plugin: VibraniumPlugin, capabilityName: string): Promise<CapabilityValidationResult> {
    const capability = this.knownCapabilities.get(capabilityName);
    
    if (!capability) {
      // Unknown capability - assume supported if declared
      return {
        capability: capabilityName,
        supported: true,
        reason: 'Unknown capability, assuming supported'
      };
    }

    try {
      if (capability.validator) {
        const isSupported = await capability.validator(plugin);
        return {
          capability: capabilityName,
          supported: isSupported,
          reason: isSupported ? undefined : 'Failed capability validation'
        };
      }

      // Default validation based on step types
      const isSupported = plugin.supportedStepTypes.includes(capabilityName);
      return {
        capability: capabilityName,
        supported: isSupported,
        reason: isSupported ? undefined : 'Step type not in supportedStepTypes'
      };
    } catch (error) {
      return {
        capability: capabilityName,
        supported: false,
        reason: `Validation error: ${error}`
      };
    }
  }

  /**
   * Check if plugin supports specific capability
   */
  async supportsCapability(plugin: VibraniumPlugin, capabilityName: string): Promise<boolean> {
    const result = await this.validateCapability(plugin, capabilityName);
    return result.supported;
  }

  /**
   * Get all registered capabilities
   */
  getRegisteredCapabilities(): PluginCapability[] {
    return Array.from(this.knownCapabilities.values());
  }

  /**
   * Check if capability is registered
   */
  isCapabilityRegistered(capabilityName: string): boolean {
    return this.knownCapabilities.has(capabilityName);
  }

  /**
   * Register standard capabilities
   */
  private registerStandardCapabilities(): void {
    // HTTP/API capabilities
    this.registerCapability({
      name: 'api',
      description: 'Basic API/HTTP request capability',
      validator: (plugin) => {
        return plugin.supportedStepTypes.includes('api') ||
               plugin.supportedStepTypes.some(type => ['http', 'get', 'post', 'put', 'patch', 'delete'].includes(type));
      }
    });

    // HTTP method capabilities
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    httpMethods.forEach(method => {
      this.registerCapability({
        name: method,
        description: `HTTP ${method.toUpperCase()} method support`,
        validator: (plugin) => {
          return plugin.supportedStepTypes.includes(method) ||
                 plugin.supportedStepTypes.includes('api') ||
                 plugin.supportedStepTypes.includes('http');
        }
      });
    });

    // Authentication capabilities
    this.registerCapability({
      name: 'auth-bearer',
      description: 'Bearer token authentication',
      validator: async (plugin) => {
        // Check if plugin has auth capabilities
        return typeof (plugin as any).supportsAuth === 'function' ?
          await (plugin as any).supportsAuth('bearer') :
          plugin.supportedStepTypes.includes('api');
      }
    });

    this.registerCapability({
      name: 'auth-basic',
      description: 'Basic authentication (username/password)',
      validator: async (plugin) => {
        return typeof (plugin as any).supportsAuth === 'function' ?
          await (plugin as any).supportsAuth('basic') :
          plugin.supportedStepTypes.includes('api');
      }
    });

    this.registerCapability({
      name: 'auth-apikey',
      description: 'API key authentication',
      validator: async (plugin) => {
        return typeof (plugin as any).supportsAuth === 'function' ?
          await (plugin as any).supportsAuth('apikey') :
          plugin.supportedStepTypes.includes('api');
      }
    });

    // Content type capabilities
    const contentTypes = ['json', 'xml', 'text', 'form', 'multipart', 'binary'];
    contentTypes.forEach(contentType => {
      this.registerCapability({
        name: `content-${contentType}`,
        description: `${contentType.toUpperCase()} content type support`,
        validator: async (plugin) => {
          return typeof (plugin as any).supportsContentType === 'function' ?
            await (plugin as any).supportsContentType(contentType) :
            plugin.supportedStepTypes.includes('api');
        }
      });
    });

    // Validation capabilities
    this.registerCapability({
      name: 'validation',
      description: 'Response validation support',
      validator: (plugin) => {
        return typeof plugin.validateStep === 'function';
      }
    });

    // Lifecycle hook capabilities
    const lifecycleHooks = ['beforeStep', 'afterStep', 'onInit', 'onDestroy'];
    lifecycleHooks.forEach(hook => {
      this.registerCapability({
        name: `lifecycle-${hook}`,
        description: `${hook} lifecycle hook support`,
        validator: (plugin) => {
          return typeof (plugin as any)[hook] === 'function';
        }
      });
    });

    // UI testing capabilities (for future plugins)
    this.registerCapability({
      name: 'ui',
      description: 'UI testing capability',
      validator: (plugin) => {
        return plugin.supportedStepTypes.includes('ui');
      }
    });

    // Performance testing capabilities
    this.registerCapability({
      name: 'performance',
      description: 'Performance testing capability',
      validator: (plugin) => {
        return plugin.supportedStepTypes.includes('performance') ||
               plugin.supportedStepTypes.includes('load-test');
      }
    });

    // Custom operator capabilities
    this.registerCapability({
      name: 'custom-operators',
      description: 'Custom validation operators',
      validator: async (plugin) => {
        return typeof (plugin as any).getCustomOperators === 'function';
      }
    });
  }
}
