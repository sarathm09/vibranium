/**
 * Plugin interface types
 */

import type { Step, StepResult } from '../scenario/step';
import type { ExecutionContext } from '../execution/context';
import type { ValidationResult } from '../validation/result';

/**
 * Core plugin interface
 */
export interface VibraniumPlugin {
  /** Plugin metadata */
  metadata: PluginMetadata;
  
  /** Step types this plugin can handle */
  stepTypes: string[];
  
  /** Execute a step */
  executeStep(step: Step, context: ExecutionContext): Promise<StepResult>;
  
  /** Validate step configuration */
  validateStep?(step: Step): ValidationResult[];
  
  /** Plugin lifecycle hooks */
  lifecycle?: PluginLifecycle;
  
  /** Plugin configuration schema */
  configSchema?: object;
  
  /** Plugin capabilities */
  capabilities?: PluginCapabilities;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Plugin name */
  name: string;
  
  /** Plugin version */
  version: string;
  
  /** Plugin description */
  description: string;
  
  /** Plugin author */
  author?: string;
  
  /** Plugin homepage */
  homepage?: string;
  
  /** Plugin repository */
  repository?: string;
  
  /** Plugin license */
  license?: string;
  
  /** Plugin keywords */
  keywords?: string[];
  
  /** Minimum Vibranium version */
  vibraniumVersion?: string;
  
  /** Plugin dependencies */
  dependencies?: PluginDependency[];
  
  /** Plugin category */
  category?: PluginCategory;
}

/**
 * Plugin dependency
 */
export interface PluginDependency {
  /** Dependency name */
  name: string;
  
  /** Version requirement */
  version: string;
  
  /** Is optional */
  optional?: boolean;
}

/**
 * Plugin categories
 */
export type PluginCategory = 
  | 'http'        // HTTP/API testing
  | 'ui'          // UI testing
  | 'database'    // Database testing
  | 'file'        // File operations
  | 'validation'  // Custom validation
  | 'reporting'   // Custom reporting
  | 'integration' // Third-party integrations
  | 'utility'     // Utility functions
  | 'custom';     // Custom category

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
  /** Called when plugin is loaded */
  onLoad?(context: PluginContext): Promise<void>;
  
  /** Called when plugin is unloaded */
  onUnload?(context: PluginContext): Promise<void>;
  
  /** Called before scenario execution */
  beforeScenario?(scenario: any, context: ExecutionContext): Promise<void>;
  
  /** Called after scenario execution */
  afterScenario?(result: any, context: ExecutionContext): Promise<void>;
  
  /** Called before step execution */
  beforeStep?(step: Step, context: ExecutionContext): Promise<void>;
  
  /** Called after step execution */
  afterStep?(step: Step, result: StepResult, context: ExecutionContext): Promise<void>;
  
  /** Called on execution error */
  onError?(error: Error, context: ExecutionContext): Promise<void>;
}

/**
 * Plugin context
 */
export interface PluginContext {
  /** Plugin registry */
  registry: PluginRegistry;
  
  /** Plugin configuration */
  config: PluginConfig;
  
  /** Logger instance */
  logger: Logger;
  
  /** Event emitter */
  events: EventEmitter;
  
  /** File system utilities */
  fs: FileSystem;
  
  /** HTTP client */
  http: HttpClient;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  /** Plugin-specific configuration */
  [key: string]: any;
}

/**
 * Plugin capabilities
 */
export interface PluginCapabilities {
  /** Can handle async operations */
  async?: boolean;
  
  /** Can be used in parallel */
  parallel?: boolean;
  
  /** Supports caching */
  caching?: boolean;
  
  /** Supports retries */
  retries?: boolean;
  
  /** Supports validation */
  validation?: boolean;
  
  /** Supports custom operators */
  customOperators?: string[];
  
  /** Supported content types */
  contentTypes?: string[];
  
  /** Resource requirements */
  resources?: ResourceRequirements;
}

/**
 * Resource requirements
 */
export interface ResourceRequirements {
  /** Memory requirement (MB) */
  memory?: number;
  
  /** CPU requirement (%) */
  cpu?: number;
  
  /** Network requirement */
  network?: boolean;
  
  /** File system access */
  fileSystem?: boolean;
  
  /** External dependencies */
  external?: string[];
}

/**
 * Plugin factory interface
 */
export interface PluginFactory {
  /** Create plugin instance */
  create(config?: PluginConfig): VibraniumPlugin;
  
  /** Get plugin metadata */
  getMetadata(): PluginMetadata;
  
  /** Validate configuration */
  validateConfig(config: PluginConfig): ValidationResult[];
}

/**
 * Plugin loader interface
 */
export interface PluginLoader {
  /** Load plugin from file */
  loadFromFile(path: string): Promise<VibraniumPlugin>;
  
  /** Load plugin from package */
  loadFromPackage(name: string, version?: string): Promise<VibraniumPlugin>;
  
  /** Load plugin from URL */
  loadFromUrl(url: string): Promise<VibraniumPlugin>;
  
  /** Unload plugin */
  unload(plugin: VibraniumPlugin): Promise<void>;
  
  /** List available plugins */
  listAvailable(): Promise<PluginInfo[]>;
}

/**
 * Plugin information
 */
export interface PluginInfo {
  /** Plugin metadata */
  metadata: PluginMetadata;
  
  /** Plugin source */
  source: PluginSource;
  
  /** Is loaded */
  loaded: boolean;
  
  /** Load time */
  loadTime?: Date;
  
  /** Load duration (ms) */
  loadDuration?: number;
}

/**
 * Plugin source
 */
export interface PluginSource {
  /** Source type */
  type: 'file' | 'package' | 'url' | 'builtin';
  
  /** Source location */
  location: string;
  
  /** Source version */
  version?: string;
}

/**
 * Plugin registry interface
 */
export interface PluginRegistry {
  /** Register plugin */
  register(plugin: VibraniumPlugin): void;
  
  /** Unregister plugin */
  unregister(name: string): void;
  
  /** Get plugin by name */
  get(name: string): VibraniumPlugin | undefined;
  
  /** Get plugin for step type */
  getForStepType(stepType: string): VibraniumPlugin | undefined;
  
  /** List all plugins */
  list(): VibraniumPlugin[];
  
  /** Check if plugin exists */
  has(name: string): boolean;
  
  /** Check if step type is supported */
  isStepTypeSupported(stepType: string): boolean;
}

/**
 * Plugin event types
 */
export interface PluginEvents {
  'plugin:loaded': (plugin: VibraniumPlugin) => void;
  'plugin:unloaded': (plugin: VibraniumPlugin) => void;
  'plugin:error': (error: Error, plugin: VibraniumPlugin) => void;
  'step:before': (step: Step, plugin: VibraniumPlugin) => void;
  'step:after': (step: Step, result: StepResult, plugin: VibraniumPlugin) => void;
}

/**
 * Simple interfaces for dependencies
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface EventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

export interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
}

export interface HttpClient {
  request(config: any): Promise<any>;
  get(url: string, config?: any): Promise<any>;
  post(url: string, data?: any, config?: any): Promise<any>;
}