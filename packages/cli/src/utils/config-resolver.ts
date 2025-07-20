/**
 * Configuration resolution utilities
 */

import { join, resolve } from 'path';
import { CliConfig } from '@vibraniumjs/types';

// Simplified configuration interface for now
interface VibraniumConfig {
  version?: string;
  defaultEnvironment?: string;
  httpClient?: 'got' | 'axios' | 'fetch';
  timeout?: number;
  retries?: number;
  environments?: {
    directory?: string;
    default?: string;
  };
  logging?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    colors?: boolean;
    format?: 'simple' | 'detailed' | 'json';
  };
  output?: {
    format?: 'json' | 'html' | 'junit';
    directory?: string;
    filename?: string;
  };
}

export interface ResolvedConfig extends CliConfig {
  workspaceRoot: string;
  scenariosDir: string;
  environmentsDir: string;
  outputDir: string;
}

export class ConfigResolver {
  constructor() {
    // Simplified implementation for now
  }

  async resolveConfig(options: {
    configPath?: string;
    workingDir?: string;
    environment?: string;
  }): Promise<ResolvedConfig> {
    const workingDir = options.workingDir || process.cwd();
    console.log('Config resolver workingDir:', workingDir);
    
    // For now, use default configuration
    const config: VibraniumConfig = {
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
        format: 'simple'
      },
      output: {
        format: 'json',
        directory: './reports',
        filename: 'test-results'
      }
    };

    // Convert VibraniumConfig to ResolvedConfig  
    const workspaceRoot = workingDir;
    
    // Smart scenarios directory detection
    let scenariosDir = resolve(workspaceRoot, 'scenarios');
    
    // Check if current directory contains scenario files directly
    try {
      const fs = await import('fs/promises');
      const currentDirFiles = await fs.readdir(workingDir);
      const hasScenarios = currentDirFiles.some(file => 
        file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
      );
      
      if (hasScenarios) {
        // Use current directory as scenarios directory
        scenariosDir = workingDir;
        console.log('Config resolver: Using current directory as scenarios dir:', scenariosDir);
      } else {
        console.log('Config resolver: Using scenarios subdirectory:', scenariosDir);
      }
    } catch (error) {
      console.log('Config resolver: Error checking current directory, using default:', error);
    }
    
    const environmentsDir = resolve(workspaceRoot, config.environments?.directory || 'environments');
    const outputDir = resolve(workspaceRoot, config.output?.directory || 'output');

    // Map VibraniumConfig to ResolvedConfig
    const resolvedConfig: ResolvedConfig = {
      workspaceRoot,
      scenariosDir,
      environmentsDir,
      outputDir,
      parallelExecution: true,
      maxConcurrency: config.performance?.maxConcurrency || 4,
      defaultEnvironment: config.defaultEnvironment || 'local',
      reporter: {
        formats: config.output?.format ? [config.output.format] : ['console'],
        outputDir: config.output?.directory || 'reports'
      },
      timeouts: {
        scenario: config.timeout || 300000,
        step: config.timeout || 60000
      }
    };

    return resolvedConfig;
  }

  async findScenarios(config: ResolvedConfig, pattern?: string): Promise<string[]> {
    // Implement scenario file discovery
    try {
      const fs = await import('fs/promises');
      const { join, extname } = await import('path');
      
      console.log('Looking for scenarios in:', config.scenariosDir);
      
      // Check if scenarios directory exists
      try {
        await fs.access(config.scenariosDir);
        console.log('Scenarios directory exists:', config.scenariosDir);
      } catch {
        // If config.scenariosDir doesn't exist, try workspaceRoot/scenarios directory
        const scenariosInWorkspaceRoot = join(config.workspaceRoot, 'scenarios');
        
        try {
          await fs.access(scenariosInWorkspaceRoot);
          config.scenariosDir = scenariosInWorkspaceRoot;
        } catch {
          // Try looking for scenario files directly in workspaceRoot directory
          const files = await fs.readdir(config.workspaceRoot);
          const scenarioFiles = files.filter(file => 
            file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
          );
          return scenarioFiles.map(file => join(config.workspaceRoot, file));
        }
      }
      
      // Read the scenarios directory
      const files = await fs.readdir(config.scenariosDir);
      console.log('Files found:', files.length, 'files');
      const scenarioFiles = files.filter(file => {
        const ext = extname(file).toLowerCase();
        const isScenario = ext === '.yaml' || ext === '.yml' || ext === '.json';
        if (isScenario) {
          console.log('Found scenario file:', file);
        }
        return isScenario;
      });
      console.log('Total scenario files found:', scenarioFiles.length);
      console.log('Scenario file names:', scenarioFiles.join(', '));
      
      // Apply pattern filter if provided
      const filteredFiles = pattern 
        ? scenarioFiles.filter(file => file.includes(pattern))
        : scenarioFiles;
      
      // Return full paths
      const fullPaths = filteredFiles.map(file => join(config.scenariosDir, file));
      console.log('Returning scenario paths:', fullPaths.length, 'paths');
      fullPaths.forEach(path => console.log('  ->', path));
      return fullPaths;
      
    } catch (error) {
      console.error('Error finding scenarios:', error);
      return [];
    }
  }

  async validateWorkspace(config: ResolvedConfig): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if directories exist
    const fs = await import('fs/promises');
    
    try {
      await fs.access(config.workspaceRoot);
    } catch {
      errors.push(`Workspace root not found: ${config.workspaceRoot}`);
    }

    try {
      await fs.access(config.scenariosDir);
    } catch {
      warnings.push(`Scenarios directory not found: ${config.scenariosDir}`);
    }

    try {
      await fs.access(config.environmentsDir);
    } catch {
      warnings.push(`Environments directory not found: ${config.environmentsDir}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  getDefaultConfig(): Partial<CliConfig> {
    return {
      scenariosDir: 'scenarios',
      environmentsDir: 'environments',
      outputDir: 'output',
      parallelExecution: true,
      maxConcurrency: 4,
      defaultEnvironment: 'local',
      reporter: {
        formats: ['console'],
        outputDir: 'reports'
      },
      timeouts: {
        scenario: 300000, // 5 minutes
        step: 60000 // 1 minute
      }
    };
  }
}