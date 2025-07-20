/**
 * File discovery utilities for finding scenarios and configuration files
 */

import { promises as fs } from 'fs';
import path from 'path';
import * as glob from 'fast-glob';

export interface FileDiscoveryOptions {
  extensions?: string[];
  recursive?: boolean;
  maxDepth?: number;
  ignorePatterns?: string[];
}

export class FileDiscovery {
  private static readonly DEFAULT_SCENARIO_EXTENSIONS = ['yaml', 'yml', 'json'];
  private static readonly DEFAULT_IGNORE_PATTERNS = ['node_modules/**', '.git/**', 'dist/**', 'build/**'];

  /**
   * Discover scenario files in a directory
   */
  static async discoverScenarios(
    directory: string,
    options: FileDiscoveryOptions = {}
  ): Promise<string[]> {
    const {
      extensions = this.DEFAULT_SCENARIO_EXTENSIONS,
      recursive = true,
      maxDepth = 10,
      ignorePatterns = this.DEFAULT_IGNORE_PATTERNS
    } = options;

    const patterns = extensions.map(ext => 
      recursive ? `**/*.${ext}` : `*.${ext}`
    );

    try {
      const files = await glob.async(patterns, {
        cwd: directory,
        absolute: true,
        ignore: ignorePatterns,
        deep: maxDepth,
        onlyFiles: true
      }) as string[];

      // Filter to only include files that look like scenarios
      const scenarioFiles = await this.filterScenarioFiles(files);
      return scenarioFiles.sort();
    } catch (error) {
      throw new Error(`Failed to discover scenarios in ${directory}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find configuration files in a directory hierarchy
   */
  static async findConfigFiles(
    startDirectory: string,
    configNames: string[] = ['scenariorest.config.json', 'vibranium.config.json', '.vibraniumrc']
  ): Promise<string[]> {
    const found: string[] = [];
    let currentDir = path.resolve(startDirectory);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      for (const configName of configNames) {
        const configPath = path.join(currentDir, configName);
        try {
          await fs.access(configPath);
          found.push(configPath);
        } catch {
          // File doesn't exist, continue
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return found;
  }

  /**
   * Find environment files in a directory
   */
  static async findEnvironmentFiles(directory: string): Promise<string[]> {
    const patterns = ['environments/**/*.json', 'environments/**/*.yaml', 'environments/**/*.yml'];
    
    try {
      const files = await glob.async(patterns, {
        cwd: directory,
        absolute: true,
        onlyFiles: true
      }) as string[];

      return files.sort();
    } catch (error) {
      throw new Error(`Failed to find environment files in ${directory}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Filter files to only include those that appear to be scenario files
   */
  private static async filterScenarioFiles(files: string[]): Promise<string[]> {
    const scenarioFiles: string[] = [];

    for (const file of files) {
      try {
        // Skip files that are obviously not scenarios based on name
        if (this.isExcludedFile(file)) {
          continue;
        }

        // Quick content check to see if it looks like a scenario
        const content = await fs.readFile(file, 'utf8');
        if (await this.isValidScenarioContent(content, file)) {
          scenarioFiles.push(file);
        }
      } catch {
        // Skip files we can't read
      }
    }

    return scenarioFiles;
  }

  /**
   * Check if file should be excluded from scenario detection
   */
  private static isExcludedFile(filePath: string): boolean {
    const filename = path.basename(filePath).toLowerCase();
    
    // Exclude common non-scenario files
    const excludePatterns = [
      '.md', '.txt', '.log', '.config.', 'package.json', 'package-lock.json',
      'tsconfig.json', '.env', '.gitignore', 'readme', 'changelog', 
      'license', '.rc', '.test.', '.spec.', 'node_modules'
    ];
    
    return excludePatterns.some(pattern => filename.includes(pattern));
  }

  /**
   * Enhanced validation to determine if content is a valid scenario
   */
  private static async isValidScenarioContent(content: string, filePath?: string): Promise<boolean> {
    try {
      // Quick pre-validation: check for required scenario keywords
      const trimmedContent = content.trim();
      if (!trimmedContent || trimmedContent.length < 10) {
        return false;
      }
      
      // Check for scenario-specific structure
      const requiredKeywords = ['name', 'steps'];
      const hasRequiredKeywords = requiredKeywords.every(keyword => {
        // Look for the keyword as a property key (JSON/YAML format)
        const keywordRegex = new RegExp(`["'\s]*${keyword}["'\s]*\s*[:=]`, 'i');
        return keywordRegex.test(content);
      });
      
      if (!hasRequiredKeywords) {
        return false;
      }
      
      // Try basic parsing to validate structure (avoid circular dependency with core)
      try {
        let parsed: any;
        const ext = filePath ? path.extname(filePath).toLowerCase() : '';
        
        if (ext === '.json') {
          parsed = JSON.parse(content);
        } else {
          // For YAML or unknown, fall back to basic heuristic
          return this.looksLikeScenario(content);
        }
        
        // Validate the parsed structure for JSON
        return parsed && 
               typeof parsed === 'object' &&
               parsed.name && 
               parsed.steps && 
               Array.isArray(parsed.steps) &&
               parsed.steps.length > 0;
      } catch {
        // If parsing fails, fall back to basic heuristic
        return this.looksLikeScenario(content);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Basic heuristic to determine if a file looks like a scenario (fallback)
   */
  private static looksLikeScenario(content: string): boolean {
    // Look for common scenario keywords with better pattern matching
    const requiredKeywords = ['name', 'steps'];
    const optionalKeywords = ['description', 'expect', 'method', 'url', 'type'];
    
    let requiredCount = 0;
    let optionalCount = 0;
    
    // Check for required keywords as property keys
    for (const keyword of requiredKeywords) {
      const keywordRegex = new RegExp(`["'\s]*${keyword}["'\s]*\s*[:=]`, 'i');
      if (keywordRegex.test(content)) {
        requiredCount++;
      }
    }
    
    // Check for optional keywords
    for (const keyword of optionalKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        optionalCount++;
      }
    }

    // Must have all required keywords and at least one optional
    return requiredCount >= 2 && optionalCount >= 1;
  }

  /**
   * Watch directory for file changes
   */
  static async watchDirectory(
    directory: string,
    callback: (event: 'add' | 'change' | 'unlink', path: string) => void,
    options: { extensions?: string[] } = {}
  ): Promise<() => void> {
    const chokidar = await import('chokidar');
    const { extensions = this.DEFAULT_SCENARIO_EXTENSIONS } = options;
    
    const patterns = extensions.map(ext => `**/*.${ext}`);
    
    const watcher = chokidar.watch(patterns, {
      cwd: directory,
      ignored: this.DEFAULT_IGNORE_PATTERNS,
      persistent: true
    });

    watcher
      .on('add', (path) => callback('add', path))
      .on('change', (path) => callback('change', path))
      .on('unlink', (path) => callback('unlink', path));

    return () => watcher.close();
  }
}