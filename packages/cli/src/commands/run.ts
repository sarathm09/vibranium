/**
 * Enhanced Run command implementation
 * Supports single files, patterns, and batch execution
 */

import { resolve, join } from 'path';
import { glob } from 'glob';
import { existsSync, statSync } from 'fs';
import { CliHelper, CliOptions } from '../utils/cli-utils';
import { ResolvedConfig, ConfigResolver } from '../utils/config-resolver';
import { ExitCodes } from '../utils/exit-codes';
import { DefaultHeadlessRunner } from '../headless';
import { BatchProcessor } from '../headless/batch-processor';
import { startInteractiveMode } from '../interactive';
// import { WatchMode } from '../utils/watch-mode'; // TODO: Implement watch mode

export interface RunCommandOptions extends CliOptions {
  environment?: string;
  headless?: boolean;
  format?: string;
  output?: string;
  outputDir?: string;
  includeArtifacts?: boolean;
  includeMetadata?: boolean;
  consoleLevel?: string;
  color?: boolean;
  parallel?: boolean;
  maxConcurrency?: number;
  continueOnFailure?: boolean;
  watch?: boolean;
}

export class RunCommand {
  private helper: CliHelper;
  private configResolver: ConfigResolver;

  constructor(private config: ResolvedConfig, options: CliOptions) {
    this.helper = new CliHelper(options);
    this.configResolver = new ConfigResolver();
  }

  async execute(pattern: string | undefined, options: RunCommandOptions): Promise<void> {
    try {
      // Handle watch mode
      if (options.watch) {
        this.helper.logWarning('Watch mode is not yet implemented');
        process.exit(ExitCodes.EXECUTION_FAILED);
      }

      // Discover scenarios based on pattern
      const scenarios = await this.discoverScenarios(pattern);
      
      if (scenarios.length === 0) {
        this.helper.logWarning('No scenarios found to execute');
        if (pattern) {
          this.helper.log(`Pattern used: ${pattern}`);
        } else {
          this.helper.log('Searched in current directory for *.yaml, *.yml, *.json files');
        }
        process.exit(ExitCodes.SCENARIO_NOT_FOUND);
      }

      this.helper.logVerbose(`Found ${scenarios.length} scenario(s) to execute`);
      
      // Determine execution mode
      const isSingleScenario = scenarios.length === 1;
      const useHeadless = options.headless || !process.stdout.isTTY || scenarios.length > 1 || options.format !== 'console';
      
      if (useHeadless) {
        if (isSingleScenario) {
          await this.runSingleHeadless(scenarios[0], options);
        } else {
          await this.runBatchHeadless(scenarios, options);
        }
      } else {
        // Interactive mode only for single scenarios
        await this.runInteractive(scenarios[0], options);
      }
      
    } catch (error) {
      this.helper.logError(error instanceof Error ? error : new Error(String(error)));
      process.exit(ExitCodes.EXECUTION_FAILED);
    }
  }

  private async discoverScenarios(pattern: string | undefined): Promise<string[]> {
    const workingDir = this.config.workspaceRoot;
    
    if (!pattern) {
      // No pattern - find all scenarios in current directory
      const defaultPatterns = ['**/*.yaml', '**/*.yml', '**/*.json'];
      const allScenarios: string[] = [];
      
      for (const globPattern of defaultPatterns) {
        const matches = await glob(globPattern, {
          cwd: workingDir,
          ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
        });
        allScenarios.push(...matches);
      }
      
      return [...new Set(allScenarios)].sort();
    }
    
    // Check if pattern is a direct file path
    const absolutePath = resolve(workingDir, pattern);
    if (existsSync(absolutePath) && statSync(absolutePath).isFile()) {
      return [pattern];
    }
    
    // Check if pattern is a directory
    if (existsSync(absolutePath) && statSync(absolutePath).isDirectory()) {
      const dirPatterns = [
        join(pattern, '**/*.yaml'),
        join(pattern, '**/*.yml'),
        join(pattern, '**/*.json')
      ];
      
      const allScenarios: string[] = [];
      for (const globPattern of dirPatterns) {
        const matches = await glob(globPattern, {
          cwd: workingDir,
          ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
        });
        allScenarios.push(...matches);
      }
      
      return [...new Set(allScenarios)].sort();
    }
    
    // Treat as glob pattern
    const matches = await glob(pattern, {
      cwd: workingDir,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
    });
    
    return matches.sort();
  }

  private async runSingleHeadless(scenarioPath: string, options: RunCommandOptions): Promise<void> {
    const runner = new DefaultHeadlessRunner(this.config, this.helper);
    
    const result = await runner.runScenario(scenarioPath, options.environment);
    
    // Handle output formatting for single scenario
    if (options.format && options.format !== 'console') {
      const { ReportGenerator } = await import('../headless/report-generator');
      const reportGenerator = new ReportGenerator(this.config, this.helper);
      
      const reportOptions = {
        format: options.format as any,
        outputFile: options.output,
        outputDir: options.outputDir,
        includeArtifacts: options.includeArtifacts || false,
        includeMetadata: options.includeMetadata || false,
        consoleLevel: options.consoleLevel as any || 'normal',
        colorOutput: options.color !== false
      };
      
      const outputPath = await reportGenerator.generate(result, reportOptions);
      
      if (outputPath && !outputPath.includes('\n')) {
        this.helper.logSuccess(`Report generated: ${outputPath}`);
      }
    }
    
    // Exit with appropriate code
    process.exit(result.success ? ExitCodes.SUCCESS : ExitCodes.EXECUTION_FAILED);
  }

  private async runBatchHeadless(scenarios: string[], options: RunCommandOptions): Promise<void> {
    this.helper.log(`Executing ${scenarios.length} scenarios...`);
    
    const batchProcessor = new BatchProcessor(this.config, this.helper);
    
    // Create a temporary directory path for batch processing
    const tempDir = this.config.workspaceRoot;
    
    const result = await batchProcessor.runBatch(tempDir, {
      environment: options.environment,
      parallel: options.parallel,
      maxConcurrency: options.maxConcurrency,
      continueOnFailure: options.continueOnFailure,
      reporter: options.format,
      output: options.output,
      scenarioOverride: scenarios // Pass specific scenarios to run
    });
    
    // Handle output formatting for batch
    if (options.format && options.format !== 'console') {
      const { ReportGenerator } = await import('../headless/report-generator');
      const reportGenerator = new ReportGenerator(this.config, this.helper);
      
      const reportOptions = {
        format: options.format as any,
        outputFile: options.output,
        outputDir: options.outputDir,
        includeArtifacts: options.includeArtifacts || false,
        includeMetadata: options.includeMetadata || false,
        consoleLevel: options.consoleLevel as any || 'normal',
        colorOutput: options.color !== false
      };
      
      const outputPath = await reportGenerator.generateBatch(result, reportOptions);
      
      if (outputPath && !outputPath.includes('\n')) {
        this.helper.logSuccess(`Report generated: ${outputPath}`);
      }
    }
    
    // Exit with appropriate code
    process.exit(result.success ? ExitCodes.SUCCESS : ExitCodes.EXECUTION_FAILED);
  }

  private async runInteractive(scenarioPath: string, options: RunCommandOptions): Promise<void> {
    this.helper.log(`Starting interactive mode for: ${scenarioPath}`);
    
    const { unmount } = startInteractiveMode({
      scenarioPath,
      environment: options.environment,
      config: this.config
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      unmount();
      process.exit(ExitCodes.INTERRUPTED);
    });
  }
  
  private generateOutputFilename(format: string, scenarioPath: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const scenarioName = scenarioPath.replace(/[^a-zA-Z0-9]/g, '_');
    
    switch (format.toLowerCase()) {
      case 'junit':
        return `vibranium-${scenarioName}-${timestamp}.xml`;
      case 'json':
        return `vibranium-${scenarioName}-${timestamp}.json`;
      case 'html':
        return `vibranium-${scenarioName}-${timestamp}.html`;
      default:
        return `vibranium-${scenarioName}-${timestamp}.txt`;
    }
  }
  
  private generateBatchOutputFilename(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format.toLowerCase()) {
      case 'junit':
        return `vibranium-batch-${timestamp}.xml`;
      case 'json':
        return `vibranium-batch-${timestamp}.json`;
      case 'html':
        return `vibranium-batch-${timestamp}.html`;
      default:
        return `vibranium-batch-${timestamp}.txt`;
    }
  }
}