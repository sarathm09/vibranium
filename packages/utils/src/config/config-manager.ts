/**
 * Configuration management with validation and discovery
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { LogLevel } from '../logging/logger';
import { ConfigLoader } from '../filesystem/config-loader';
import { PathUtils } from '../filesystem/path-utils';
import { FileDiscovery } from '../filesystem/file-discovery';

export interface VibraniumConfig {
  // Core settings
  version?: string;
  defaultEnvironment?: string;
  httpClient?: 'got' | 'axios' | 'fetch';
  timeout?: number;
  retries?: number;
  
  // Environment settings
  environments?: {
    directory?: string;
    default?: string;
  };
  
  // Logging settings
  logging?: {
    level?: LogLevel;
    colors?: boolean;
    format?: 'simple' | 'detailed' | 'json';
    outputs?: string[];
  };
  
  // Output settings
  output?: {
    format?: 'json' | 'html' | 'junit';
    directory?: string;
    filename?: string;
  };
  
  // Plugin settings
  plugins?: {
    directory?: string;
    enabled?: string[];
    disabled?: string[];
  };
  
  // Global variables
  globals?: Record<string, any>;
  
  // Performance settings
  performance?: {
    maxConcurrency?: number;
    requestsPerSecond?: number;
    enableMetrics?: boolean;
  };
  
  // Security settings
  security?: {
    encryptSecrets?: boolean;
    allowUnsafeEval?: boolean;
    trustedDomains?: string[];
  };
}

export interface ConfigManagerOptions {
  configFile?: string;
  searchPaths?: string[];
  defaults?: Partial<VibraniumConfig>;
  validate?: boolean;
}

export class ConfigManager {
  private config: VibraniumConfig = {};
  private configFile: string | null = null;
  private options: Required<ConfigManagerOptions>;
  private defaults!: VibraniumConfig;

  constructor(options: ConfigManagerOptions = {}) {
    this.options = {
      configFile: options.configFile || '',
      searchPaths: options.searchPaths || [
        process.cwd(),
        path.join(process.cwd(), '.vibranium'),
        PathUtils.getHomeDirectory(),
        path.join(PathUtils.getHomeDirectory(), '.vibranium')
      ],
      defaults: options.defaults || {},
      validate: options.validate ?? true
    };

    this.setupDefaults();
  }

  /**
   * Initialize configuration manager
   */
  async initialize(): Promise<void> {
    await this.discoverConfig();
    await this.loadConfig();
  }

  /**
   * Load configuration from file or defaults
   */
  async load(): Promise<VibraniumConfig> {
    if (this.configFile) {
      try {
        const loadedConfig = await ConfigLoader.loadConfig<VibraniumConfig>(this.configFile);
        this.config = this.mergeConfigs(this.defaults, loadedConfig);
        
        if (this.options.validate) {
          this.validateConfig(this.config);
        }
      } catch (error) {
        throw new Error(`Failed to load config from ${this.configFile}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      this.config = { ...this.defaults };
    }

    return this.config;
  }

  /**
   * Save configuration to file
   */
  async save(config: VibraniumConfig = this.config): Promise<void> {
    if (!this.configFile) {
      // Create default config file in current directory
      this.configFile = path.join(process.cwd(), 'vibranium.config.json');
    }

    if (this.options.validate) {
      this.validateConfig(config);
    }

    try {
      await ConfigLoader.saveConfig(this.configFile, config, { format: 'json', indent: 2 });
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to save config to ${this.configFile}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get configuration value by key
   */
  get<K extends keyof VibraniumConfig>(key: K): VibraniumConfig[K] {
    return this.config[key];
  }

  /**
   * Set configuration value by key
   */
  set<K extends keyof VibraniumConfig>(key: K, value: VibraniumConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * Get nested configuration value
   */
  getNested(path: string): any {
    const keys = path.split('.');
    let current: any = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Set nested configuration value
   */
  setNested(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) {
      throw new Error('Invalid path');
    }
    
    let current: any = this.config;
    
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<void> {
    this.config = { ...this.defaults };
    
    if (this.configFile) {
      await this.save();
    }
  }

  /**
   * Merge configurations with the current one
   */
  merge(updates: Partial<VibraniumConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
  }

  /**
   * Get current configuration
   */
  getConfig(): VibraniumConfig {
    return { ...this.config };
  }

  /**
   * Get configuration file path
   */
  getConfigFile(): string | null {
    return this.configFile;
  }

  /**
   * Check if configuration file exists
   */
  hasConfigFile(): boolean {
    return this.configFile !== null;
  }

  /**
   * Create default configuration file
   */
  async createDefaultConfig(filePath?: string): Promise<string> {
    const configPath = filePath || path.join(process.cwd(), 'vibranium.config.json');
    
    await ConfigLoader.saveConfig(configPath, this.defaults, { 
      format: 'json', 
      indent: 2 
    });
    
    this.configFile = configPath;
    return configPath;
  }

  /**
   * Validate configuration
   */
  validateConfig(config: VibraniumConfig): void {
    // Basic validation
    if (config.timeout && (config.timeout < 0 || config.timeout > 300000)) {
      throw new Error('Timeout must be between 0 and 300000ms');
    }

    if (config.retries && (config.retries < 0 || config.retries > 10)) {
      throw new Error('Retries must be between 0 and 10');
    }

    if (config.httpClient && !['got', 'axios', 'fetch'].includes(config.httpClient)) {
      throw new Error('HTTP client must be one of: got, axios, fetch');
    }

    if (config.logging?.level && !['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
      throw new Error('Log level must be one of: debug, info, warn, error');
    }

    if (config.output?.format && !['json', 'html', 'junit'].includes(config.output.format)) {
      throw new Error('Output format must be one of: json, html, junit');
    }

    if (config.performance?.maxConcurrency && config.performance.maxConcurrency < 1) {
      throw new Error('Max concurrency must be at least 1');
    }

    if (config.performance?.requestsPerSecond && config.performance.requestsPerSecond < 0.1) {
      throw new Error('Requests per second must be at least 0.1');
    }
  }

  /**
   * Discover configuration file
   */
  private async discoverConfig(): Promise<void> {
    if (this.options.configFile) {
      if (await PathUtils.exists(this.options.configFile)) {
        this.configFile = this.options.configFile;
        return;
      } else {
        throw new Error(`Specified config file not found: ${this.options.configFile}`);
      }
    }

    const configNames = [
      'vibranium.config.json',
      'vibranium.config.js',
      'scenariorest.config.json',
      '.vibraniumrc',
      '.vibraniumrc.json',
      '.vibraniumrc.js'
    ];

    for (const searchPath of this.options.searchPaths) {
      for (const configName of configNames) {
        const configPath = path.join(searchPath, configName);
        if (await PathUtils.exists(configPath)) {
          this.configFile = configPath;
          return;
        }
      }
    }

    // No config file found, will use defaults
  }

  /**
   * Load configuration
   */
  private async loadConfig(): Promise<void> {
    await this.load();
  }

  /**
   * Setup default configuration
   */
  private setupDefaults(): void {
    this.defaults = {
      version: '1.0.0',
      defaultEnvironment: 'local',
      httpClient: 'got',
      timeout: 30000,
      retries: 3,
      
      environments: {
        directory: './environments',
        default: 'local'
      },
      
      logging: {
        level: 'info',
        colors: true,
        format: 'simple',
        outputs: ['console']
      },
      
      output: {
        format: 'json',
        directory: './reports',
        filename: 'test-results'
      },
      
      plugins: {
        directory: './plugins',
        enabled: [],
        disabled: []
      },
      
      globals: {},
      
      performance: {
        maxConcurrency: 10,
        requestsPerSecond: 100,
        enableMetrics: true
      },
      
      security: {
        encryptSecrets: false,
        allowUnsafeEval: false,
        trustedDomains: []
      },
      
      ...this.options.defaults
    };
  }

  /**
   * Deep merge two configuration objects
   */
  private mergeConfigs(base: any, override: any): any {
    const result = { ...base };
    
    for (const key in override) {
      if (override[key] !== undefined) {
        if (
          typeof override[key] === 'object' && 
          override[key] !== null && 
          !Array.isArray(override[key]) &&
          typeof base[key] === 'object' && 
          base[key] !== null && 
          !Array.isArray(base[key])
        ) {
          result[key] = this.mergeConfigs(base[key], override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }
    
    return result;
  }
}