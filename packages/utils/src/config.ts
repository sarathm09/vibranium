/**
 * Global configuration management
 */

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

// Placeholder implementation
export class GlobalConfigManager implements ConfigManager {
  private config: VibraniumConfig = {};

  async load(): Promise<VibraniumConfig> {
    // TODO: Implement config loading from file system
    return this.config;
  }

  async save(config: VibraniumConfig): Promise<void> {
    // TODO: Implement config saving to file system
    this.config = { ...this.config, ...config };
  }

  get<K extends keyof VibraniumConfig>(key: K): VibraniumConfig[K] {
    return this.config[key];
  }

  set<K extends keyof VibraniumConfig>(key: K, value: VibraniumConfig[K]): void {
    this.config[key] = value;
  }

  async reset(): Promise<void> {
    // TODO: Implement config reset to defaults
    this.config = {};
  }
}