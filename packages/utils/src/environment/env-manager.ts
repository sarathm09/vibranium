/**
 * Environment management with loading, switching, and validation
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Environment, VariableMap } from '@vibraniumjs/types';
import { ConfigLoader } from '../filesystem/config-loader';
import { PathUtils } from '../filesystem/path-utils';
import { FileDiscovery } from '../filesystem/file-discovery';

export interface EnvironmentManagerOptions {
  environmentsDirectory?: string;
  defaultEnvironment?: string;
  secretsFile?: string;
  cacheEnvironments?: boolean;
}

export class EnvironmentManager {
  private environments: Map<string, Environment> = new Map();
  private currentEnvironment: string | null = null;
  private secrets: VariableMap = {};
  private options: Required<EnvironmentManagerOptions>;

  constructor(options: EnvironmentManagerOptions = {}) {
    this.options = {
      environmentsDirectory: options.environmentsDirectory || './environments',
      defaultEnvironment: options.defaultEnvironment || 'local',
      secretsFile: options.secretsFile || '.env',
      cacheEnvironments: options.cacheEnvironments ?? true
    };
  }

  /**
   * Initialize the environment manager
   */
  async initialize(): Promise<void> {
    await this.loadSecrets();
    await this.discoverEnvironments();
    
    // Set default environment if available
    if (this.environments.has(this.options.defaultEnvironment)) {
      await this.setCurrentEnvironment(this.options.defaultEnvironment);
    } else if (this.environments.size > 0) {
      const firstEnv = Array.from(this.environments.keys())[0];
      await this.setCurrentEnvironment(firstEnv);
    }
  }

  /**
   * Load a specific environment
   */
  async loadEnvironment(name: string): Promise<Environment> {
    // Check cache first
    if (this.options.cacheEnvironments && this.environments.has(name)) {
      return this.environments.get(name)!;
    }

    const envFile = await this.findEnvironmentFile(name);
    if (!envFile) {
      throw new Error(`Environment '${name}' not found`);
    }

    try {
      const envData = await ConfigLoader.loadConfig<Environment>(envFile);
      
      // Validate environment structure
      this.validateEnvironment(envData, name);
      
      // Process secrets
      const processedEnv = await this.processEnvironmentSecrets(envData);
      
      if (this.options.cacheEnvironments) {
        this.environments.set(name, processedEnv);
      }
      
      return processedEnv;
    } catch (error) {
      throw new Error(`Failed to load environment '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all available environments
   */
  async getAllEnvironments(): Promise<Record<string, Environment>> {
    const result: Record<string, Environment> = {};
    
    for (const [name] of this.environments) {
      result[name] = await this.loadEnvironment(name);
    }
    
    return result;
  }

  /**
   * Get list of available environment names
   */
  getEnvironmentNames(): string[] {
    return Array.from(this.environments.keys()).sort();
  }

  /**
   * Set the current active environment
   */
  async setCurrentEnvironment(name: string): Promise<void> {
    const environment = await this.loadEnvironment(name);
    this.currentEnvironment = name;
    
    // Optionally set process.env variables
    if (environment.variables) {
      for (const [key, value] of Object.entries(environment.variables)) {
        if (typeof value === 'string') {
          process.env[key] = value;
        }
      }
    }
  }

  /**
   * Get the current active environment
   */
  getCurrentEnvironment(): string | null {
    return this.currentEnvironment;
  }

  /**
   * Get the current environment data
   */
  async getCurrentEnvironmentData(): Promise<Environment | null> {
    if (!this.currentEnvironment) {
      return null;
    }
    
    return this.loadEnvironment(this.currentEnvironment);
  }

  /**
   * Reload all environments (clear cache)
   */
  async reload(): Promise<void> {
    this.environments.clear();
    await this.initialize();
  }

  /**
   * Create a new environment
   */
  async createEnvironment(name: string, environment: Environment): Promise<void> {
    this.validateEnvironment(environment, name);
    
    const envFile = path.join(this.options.environmentsDirectory, `${name}.json`);
    await PathUtils.ensureDirectory(this.options.environmentsDirectory);
    await ConfigLoader.saveConfig(envFile, environment);
    
    if (this.options.cacheEnvironments) {
      this.environments.set(name, environment);
    }
  }

  /**
   * Update an existing environment
   */
  async updateEnvironment(name: string, updates: Partial<Environment>): Promise<void> {
    const existing = await this.loadEnvironment(name);
    const updated = { ...existing, ...updates };
    
    this.validateEnvironment(updated, name);
    
    const envFile = await this.findEnvironmentFile(name);
    if (!envFile) {
      throw new Error(`Environment '${name}' not found`);
    }
    
    await ConfigLoader.saveConfig(envFile, updated);
    
    if (this.options.cacheEnvironments) {
      this.environments.set(name, updated);
    }
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(name: string): Promise<void> {
    const envFile = await this.findEnvironmentFile(name);
    if (!envFile) {
      throw new Error(`Environment '${name}' not found`);
    }
    
    await PathUtils.delete(envFile);
    this.environments.delete(name);
    
    if (this.currentEnvironment === name) {
      this.currentEnvironment = null;
    }
  }

  /**
   * Discover available environments
   */
  private async discoverEnvironments(): Promise<void> {
    if (!await PathUtils.exists(this.options.environmentsDirectory)) {
      return;
    }

    const envFiles = await FileDiscovery.findEnvironmentFiles(
      path.dirname(this.options.environmentsDirectory)
    );

    for (const envFile of envFiles) {
      const envName = PathUtils.getBasename(envFile, false);
      if (!this.environments.has(envName)) {
        this.environments.set(envName, {} as Environment); // Placeholder, will be loaded on demand
      }
    }
  }

  /**
   * Find environment file by name
   */
  private async findEnvironmentFile(name: string): Promise<string | null> {
    const extensions = ['json', 'yaml', 'yml'];
    
    for (const ext of extensions) {
      const envFile = path.join(this.options.environmentsDirectory, `${name}.${ext}`);
      if (await PathUtils.exists(envFile)) {
        return envFile;
      }
    }
    
    return null;
  }

  /**
   * Load secrets from file
   */
  private async loadSecrets(): Promise<void> {
    try {
      const secretsPath = PathUtils.resolve(process.cwd(), this.options.secretsFile);
      if (await PathUtils.exists(secretsPath)) {
        this.secrets = await ConfigLoader.loadEnvironmentFile(secretsPath);
      }
    } catch (error) {
      // Secrets file is optional, don't fail if it's not found
    }
  }

  /**
   * Process environment secrets (replace $.env.* references)
   */
  private async processEnvironmentSecrets(environment: Environment): Promise<Environment> {
    const processed = { ...environment };
    
    if (environment.secrets) {
      const processedSecrets: VariableMap = {};
      
      for (const [key, value] of Object.entries(environment.secrets)) {
        if (typeof value === 'string' && (value as string).startsWith('$.env.')) {
          const secretKey = (value as string).substring(6); // Remove '$.env.'
          processedSecrets[key] = this.secrets[secretKey] || process.env[secretKey] || '';
        } else {
          processedSecrets[key] = value;
        }
      }
      
      processed.secrets = processedSecrets;
    }
    
    return processed;
  }

  /**
   * Validate environment structure
   */
  private validateEnvironment(environment: any, name: string): void {
    if (!environment || typeof environment !== 'object') {
      throw new Error(`Invalid environment '${name}': must be an object`);
    }

    if (environment.environment && typeof environment.environment !== 'string') {
      throw new Error(`Invalid environment '${name}': 'environment' field must be a string`);
    }

    if (environment.variables && typeof environment.variables !== 'object') {
      throw new Error(`Invalid environment '${name}': 'variables' field must be an object`);
    }

    if (environment.secrets && typeof environment.secrets !== 'object') {
      throw new Error(`Invalid environment '${name}': 'secrets' field must be an object`);
    }
  }
}