/**
 * Validate command implementation
 */

import { CliHelper, CliOptions } from '../utils/cli-utils';
import { ConfigResolver, ResolvedConfig } from '../utils/config-resolver';
import { ExitCodes } from '../utils/exit-codes';

export interface ValidateCommandOptions extends CliOptions {
  strict?: boolean;
  format?: 'table' | 'json';
}

export class ValidateCommand {
  private helper: CliHelper;
  private configResolver: ConfigResolver;

  constructor(private config: ResolvedConfig, options: CliOptions) {
    this.helper = new CliHelper(options);
    this.configResolver = new ConfigResolver();
  }

  async execute(path: string, options: ValidateCommandOptions): Promise<void> {
    try {
      this.helper.log(`Validating: ${path}`);
      
      const results = await this.validatePath(path, options);
      
      if (results.errors.length === 0) {
        this.helper.logSuccess(`Validation passed`);
        if (results.warnings.length > 0) {
          this.helper.logWarning(`${results.warnings.length} warnings found`);
          results.warnings.forEach(warning => this.helper.logWarning(`  ${warning}`));
        }
      } else {
        this.helper.logError(`Validation failed with ${results.errors.length} errors`);
        results.errors.forEach(error => this.helper.logError(`  ${error}`));
        process.exit(ExitCodes.VALIDATION_ERROR);
      }
      
    } catch (error) {
      this.helper.logError(error instanceof Error ? error : new Error(String(error)));
      process.exit(ExitCodes.VALIDATION_ERROR);
    }
  }

  private async validatePath(path: string, options: ValidateCommandOptions): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const fs = await import('fs/promises');
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const stat = await fs.stat(path);
      
      if (stat.isFile()) {
        // Validate single file
        const validation = await this.validateScenarioFile(path, options.strict);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      } else if (stat.isDirectory()) {
        // Validate directory
        const scenarios = await this.configResolver.findScenarios(this.config);
        
        for (const scenario of scenarios) {
          const validation = await this.validateScenarioFile(scenario, options.strict);
          errors.push(...validation.errors.map(e => `${scenario}: ${e}`));
          warnings.push(...validation.warnings.map(w => `${scenario}: ${w}`));
        }
      }
    } catch (error) {
      errors.push(`Cannot access path: ${path}`);
    }
    
    return { errors, warnings };
  }

  private async validateScenarioFile(filePath: string, strict = false): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    // Use core validation engine
    try {
      const { ScenarioParser } = await import('@vibraniumjs/core');
      const parser = new ScenarioParser();
      
      const result = await parser.parseFile(filePath);
      const validation = await parser.validate(result.scenario);
      
      return {
        errors: validation.errors || [],
        warnings: validation.warnings || []
      };
    } catch (error) {
      return {
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
    }
  }
}