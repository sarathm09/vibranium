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
    // Implement scenario file discovery with proper validation
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
          const potentialScenarios = files.filter(file => 
            this.isValidScenarioExtension(file)
          );
          const validScenarios = await this.validateScenarioFiles(
            potentialScenarios.map(file => join(config.workspaceRoot, file))
          );
          return validScenarios;
        }
      }
      
      // Read the scenarios directory
      const files = await fs.readdir(config.scenariosDir);
      console.log('Files found:', files.length, 'files');
      
      // Filter by extension first
      const potentialScenarios = files.filter(file => {
        const isValidExt = this.isValidScenarioExtension(file);
        if (isValidExt) {
          console.log('Found potential scenario file:', file);
        }
        return isValidExt;
      });
      console.log('Potential scenario files:', potentialScenarios.length);
      
      // Validate actual scenario content
      const fullPaths = potentialScenarios.map(file => join(config.scenariosDir, file));
      const validScenarios = await this.validateScenarioFiles(fullPaths);
      
      console.log('Valid scenario files found:', validScenarios.length);
      console.log('Valid scenario file names:', validScenarios.map(p => p.split('/').pop()).join(', '));
      
      // Apply pattern filter if provided
      const filteredFiles = pattern 
        ? validScenarios.filter(file => file.includes(pattern))
        : validScenarios;
      
      console.log('Returning scenario paths:', filteredFiles.length, 'paths');
      filteredFiles.forEach(path => console.log('  ->', path));
      return filteredFiles;
      
    } catch (error) {
      console.error('Error finding scenarios:', error);
      return [];
    }
  }

  /**
   * Check if file has a valid scenario extension
   */
  private isValidScenarioExtension(filename: string): boolean {
    const ext = filename.toLowerCase();
    return (ext.endsWith('.yaml') || ext.endsWith('.yml') || ext.endsWith('.json')) &&
           !this.isExcludedFile(filename);
  }

  /**
   * Check if file should be excluded from scenario detection
   */
  private isExcludedFile(filename: string): boolean {
    const lowerName = filename.toLowerCase();
    
    // Exclude common non-scenario files
    const excludePatterns = [
      '.md', '.txt', '.log', '.config.', 'package.json', 'package-lock.json',
      'tsconfig.json', '.env', '.gitignore', 'readme', 'changelog', 
      'license', '.rc', '.test.', '.spec.', 'node_modules'
    ];
    
    return excludePatterns.some(pattern => lowerName.includes(pattern));
  }

  /**
   * Validate that files actually contain scenario content
   */
  private async validateScenarioFiles(filePaths: string[]): Promise<string[]> {
    const validScenarios: string[] = [];
    
    for (const filePath of filePaths) {
      try {
        const fs = await import('fs/promises');
        const content = await fs.readFile(filePath, 'utf8');
        
        if (await this.isValidScenarioContent(content, filePath)) {
          validScenarios.push(filePath);
          console.log('✓ Valid scenario:', filePath.split('/').pop());
        } else {
          console.log('✗ Invalid scenario content:', filePath.split('/').pop());
        }
      } catch (error) {
        console.log('✗ Error reading file:', filePath.split('/').pop(), error.message);
      }
    }
    
    return validScenarios;
  }

  /**
   * Validate scenario content with basic parsing
   */
  private async isValidScenarioContent(content: string, filePath?: string): boolean {
    try {
      // Quick pre-validation: check for required scenario keywords
      const trimmedContent = content.trim();
      if (!trimmedContent || trimmedContent.length < 10) {
        return false;
      }
      
      // Check for scenario-specific keywords
      const scenarioKeywords = ['name', 'steps'];
      const hasRequiredKeywords = scenarioKeywords.every(keyword => {
        // Look for the keyword as a property key (JSON/YAML format)
        const keywordRegex = new RegExp(`["'\s]*${keyword}["'\s]*\s*[:=]`, 'i');
        return keywordRegex.test(content);
      });
      
      if (!hasRequiredKeywords) {
        return false;
      }
      
      // Try basic parsing to validate structure
      try {
        let parsed: any;
        const path = await import('path');
        const ext = filePath ? path.extname(filePath).toLowerCase() : '';
        
        if (ext === '.json') {
          parsed = JSON.parse(content);
        } else if (ext === '.yaml' || ext === '.yml') {
          // Basic YAML parsing with simple regex patterns
          parsed = this.parseBasicYaml(content);
        } else {
          // Try JSON first, then YAML
          try {
            parsed = JSON.parse(content);
          } catch {
            parsed = this.parseBasicYaml(content);
          }
        }
        
        // Validate the parsed structure
        return parsed && 
               typeof parsed === 'object' &&
               parsed.name && 
               parsed.steps && 
               Array.isArray(parsed.steps) &&
               parsed.steps.length > 0;
      } catch {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Basic YAML parsing for validation (simplified)
   */
  private parseBasicYaml(content: string): any {
    const lines = content.split('\n');
    const result: any = {};
    let currentKey = '';
    let isInSteps = false;
    const steps: any[] = [];
    let currentStep: any = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Simple key-value parsing
      const match = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        if (key === 'steps') {
          isInSteps = true;
          continue;
        }
        
        if (isInSteps && trimmed.startsWith('- ')) {
          // New step
          if (Object.keys(currentStep).length > 0) {
            steps.push(currentStep);
          }
          currentStep = {};
          const stepMatch = trimmed.match(/^-\s*(.+?):\s*(.*)$/);
          if (stepMatch) {
            currentStep[stepMatch[1].trim()] = stepMatch[2].trim();
          }
        } else if (isInSteps && trimmed.startsWith('  ') && !trimmed.startsWith('- ')) {
          // Step property
          currentStep[key] = value;
        } else if (!isInSteps) {
          // Top-level property
          result[key] = value;
        }
      }
    }
    
    // Add the last step
    if (Object.keys(currentStep).length > 0) {
      steps.push(currentStep);
    }
    
    if (steps.length > 0) {
      result.steps = steps;
    }
    
    return result;
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