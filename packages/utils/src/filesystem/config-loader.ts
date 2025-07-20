/**
 * Configuration file loading and parsing utilities
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import type { Scenario } from '@vibraniumjs/types';

export interface LoadOptions {
  encoding?: BufferEncoding;
  validate?: boolean;
  schema?: object;
}

export class ConfigLoader {
  /**
   * Load and parse a scenario file (YAML or JSON)
   */
  static async loadScenario(filePath: string, options: LoadOptions = {}): Promise<Scenario> {
    const { encoding = 'utf8', validate = true } = options;

    try {
      const content = await fs.readFile(filePath, encoding);
      const extension = path.extname(filePath).toLowerCase();
      
      let scenario: Scenario;
      
      switch (extension) {
        case '.yaml':
        case '.yml':
          scenario = parseYaml(content) as Scenario;
          break;
        case '.json':
          scenario = JSON.parse(content) as Scenario;
          break;
        default:
          throw new Error(`Unsupported file extension: ${extension}`);
      }

      if (validate) {
        this.validateScenario(scenario, filePath);
      }

      return scenario;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load scenario from ${filePath}: ${error.message}`);
      }
      throw new Error(`Failed to load scenario from ${filePath}: ${String(error)}`);
    }
  }

  /**
   * Load a configuration file (JSON or YAML)
   */
  static async loadConfig<T = Record<string, any>>(
    filePath: string, 
    options: LoadOptions = {}
  ): Promise<T> {
    const { encoding = 'utf8' } = options;

    try {
      const content = await fs.readFile(filePath, encoding);
      const extension = path.extname(filePath).toLowerCase();
      
      switch (extension) {
        case '.yaml':
        case '.yml':
          return parseYaml(content) as T;
        case '.json':
          return JSON.parse(content) as T;
        case '': // Handle .vibraniumrc without extension
          try {
            return JSON.parse(content) as T;
          } catch {
            return parseYaml(content) as T;
          }
        default:
          throw new Error(`Unsupported configuration file extension: ${extension}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load config from ${filePath}: ${error.message}`);
      }
      throw new Error(`Failed to load config from ${filePath}: ${String(error)}`);
    }
  }

  /**
   * Save configuration to file
   */
  static async saveConfig<T>(
    filePath: string,
    config: T,
    options: { format?: 'json' | 'yaml'; indent?: number } = {}
  ): Promise<void> {
    const { format = 'json', indent = 2 } = options;

    try {
      let content: string;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(config, null, indent);
          break;
        case 'yaml':
          const { stringify } = await import('yaml');
          content = stringify(config, { indent });
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save config to ${filePath}: ${error.message}`);
      }
      throw new Error(`Failed to save config to ${filePath}: ${String(error)}`);
    }
  }

  /**
   * Load environment file (.env, JSON, or YAML)
   */
  static async loadEnvironmentFile(filePath: string): Promise<Record<string, any>> {
    const extension = path.extname(filePath).toLowerCase();
    
    if (extension === '.env') {
      return this.loadEnvFile(filePath);
    }
    
    return this.loadConfig(filePath);
  }

  /**
   * Load .env file
   */
  private static async loadEnvFile(filePath: string): Promise<Record<string, string>> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const env: Record<string, string> = {};
      
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            env[key.trim()] = value;
          }
        }
      }
      
      return env;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load .env file from ${filePath}: ${error.message}`);
      }
      throw new Error(`Failed to load .env file from ${filePath}: ${String(error)}`);
    }
  }

  /**
   * Basic scenario validation
   */
  private static validateScenario(scenario: any, filePath: string): void {
    if (!scenario || typeof scenario !== 'object') {
      throw new Error(`Invalid scenario format in ${filePath}: must be an object`);
    }

    if (!scenario.name || typeof scenario.name !== 'string') {
      throw new Error(`Invalid scenario in ${filePath}: 'name' field is required and must be a string`);
    }

    if (!scenario.steps || !Array.isArray(scenario.steps)) {
      throw new Error(`Invalid scenario in ${filePath}: 'steps' field is required and must be an array`);
    }

    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      if (!step.name || typeof step.name !== 'string') {
        throw new Error(`Invalid step ${i} in ${filePath}: 'name' field is required and must be a string`);
      }
      if (!step.type || typeof step.type !== 'string') {
        throw new Error(`Invalid step ${i} in ${filePath}: 'type' field is required and must be a string`);
      }
    }
  }
}