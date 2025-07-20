/**
 * @deprecated Use ./config exports instead
 * Global configuration management - Legacy compatibility
 */

import { ConfigManager as NewConfigManager } from './config/config-manager';
import type { VibraniumConfig as NewVibraniumConfig } from './config/config-manager';

export interface VibraniumConfig {
  defaultEnvironment?: string;
  httpClient?: 'got' | 'axios' | 'fetch';
  timeout?: number;
  retries?: number;
  colors?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  outputFormat?: 'json' | 'html' | 'junit';
  reportPath?: string;
  plugins?: string[];
}

export interface ConfigManager {
  load(): Promise<VibraniumConfig>;
  save(config: VibraniumConfig): Promise<void>;
  get<K extends keyof VibraniumConfig>(key: K): VibraniumConfig[K];
  set<K extends keyof VibraniumConfig>(key: K, value: VibraniumConfig[K]): void;
  reset(): Promise<void>;
}

/**
 * @deprecated Use ConfigManager from ./config instead
 */
export class GlobalConfigManager implements ConfigManager {
  private configManager: NewConfigManager;

  constructor() {
    this.configManager = new NewConfigManager();
  }

  async load(): Promise<VibraniumConfig> {
    const config = await this.configManager.load();
    
    // Map new config to legacy format
    return {
      defaultEnvironment: config.defaultEnvironment,
      httpClient: config.httpClient,
      timeout: config.timeout,
      retries: config.retries,
      colors: (config as any).logging?.colors,
      logLevel: (config as any).logging?.level,
      outputFormat: (config as any).output?.format as any,
      reportPath: (config as any).output?.directory,
      plugins: (config as any).plugins?.enabled
    };
  }

  async save(config: VibraniumConfig): Promise<void> {
    // Map legacy config to new format
    const newConfig: any = {
      defaultEnvironment: config.defaultEnvironment,
      httpClient: config.httpClient,
      timeout: config.timeout,
      retries: config.retries,
      logging: {
        colors: config.colors,
        level: config.logLevel
      },
      output: {
        format: config.outputFormat as any,
        directory: config.reportPath
      },
      plugins: config.plugins
    };

    (this.configManager as any).merge(newConfig);
    await this.configManager.save((this.configManager as any).getConfig());
  }

  get<K extends keyof VibraniumConfig>(key: K): VibraniumConfig[K] {
    const config = (this.configManager as any).getConfig();
    
    // Map new config structure to legacy key
    switch (key) {
      case 'colors':
        return config.logging?.colors as VibraniumConfig[K];
      case 'logLevel':
        return config.logging?.level as VibraniumConfig[K];
      case 'outputFormat':
        return config.output?.format as VibraniumConfig[K];
      case 'reportPath':
        return config.output?.directory as VibraniumConfig[K];
      case 'plugins':
        return config.plugins?.enabled as VibraniumConfig[K];
      default:
        return config[key as keyof NewVibraniumConfig] as VibraniumConfig[K];
    }
  }

  set<K extends keyof VibraniumConfig>(key: K, value: VibraniumConfig[K]): void {
    const updates: any = {};
    
    // Map legacy key to new config structure
    const currentConfig = (this.configManager as any).getConfig();
    switch (key) {
      case 'colors':
        updates.logging = { ...currentConfig.logging, colors: value as boolean };
        break;
      case 'logLevel':
        updates.logging = { ...currentConfig.logging, level: value as any };
        break;
      case 'outputFormat':
        updates.output = { ...currentConfig.output, format: value as any };
        break;
      case 'reportPath':
        updates.output = { ...currentConfig.output, directory: value as string };
        break;
      case 'plugins':
        updates.plugins = { ...currentConfig.plugins, enabled: value as string[] };
        break;
      default:
        (updates as any)[key] = value;
    }

    (this.configManager as any).merge(updates);
  }

  async reset(): Promise<void> {
    await (this.configManager as any).reset();
  }
}