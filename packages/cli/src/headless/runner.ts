/**
 * Headless scenario execution
 */

import { resolve } from 'path';
import { ExecutionOrchestrator } from '@vibraniumjs/core';
import { EnvironmentManager, createLogger } from '@vibraniumjs/utils';
import { ScenarioResult, ExecutionContext, BatchResult } from '@vibraniumjs/types';
import { CliHelper } from '../utils/cli-utils';
import { ResolvedConfig } from '../utils/config-resolver';
import { ExitCodes } from '../utils/exit-codes';
import { ProgressReporter } from './progress-reporter';
import { ReportGenerator } from './report-generator';
import { BatchProcessor, BatchOptions } from './batch-processor';

const logger = createLogger('headless-runner');

export interface HeadlessRunOptions {
  environment?: string;
  reporter?: string;
  output?: string;
}

export class HeadlessRunner {
  private orchestrator: ExecutionOrchestrator;
  private envManager: EnvironmentManager;
  private progressReporter: ProgressReporter;
  private reportGenerator: ReportGenerator;

  constructor(
    private config: ResolvedConfig,
    private helper: CliHelper
  ) {
    this.orchestrator = new ExecutionOrchestrator();
    this.envManager = new EnvironmentManager();
    this.progressReporter = new ProgressReporter(helper);
    this.reportGenerator = new ReportGenerator(config, helper);
  }

  async runScenario(scenarioPath: string, environment?: string): Promise<ScenarioResult> {
    const startTime = Date.now();
    
    try {
      // Resolve scenario path
      const resolvedPath = resolve(this.config.workspaceRoot, scenarioPath);
      this.helper.logVerbose(`Loading scenario: ${resolvedPath}`);

      // Load environment
      const env = environment || this.config.defaultEnvironment || 'local';
      const envData = await this.envManager.loadEnvironment(env, this.config.environmentsDir);
      
      this.helper.log(`Running scenario: ${scenarioPath} (env: ${env})`);

      // Create execution context
      const context: ExecutionContext = {
        executionId: this.generateExecutionId(),
        startTime,
        environment: env,
        environmentData: envData,
        workspaceRoot: this.config.workspaceRoot,
        scenarioPath: resolvedPath
      };

      // Execute scenario
      this.progressReporter.start();
      const result = await this.orchestrator.executeScenario(resolvedPath, context);
      this.progressReporter.stop();

      // Report results
      await this.reportResults(result, { environment, reporter: 'console' });
      
      const duration = Date.now() - startTime;
      this.helper.log(`Execution completed in ${this.helper.formatDuration(duration)}`);
      
      if (result.success) {
        this.helper.logSuccess('Scenario passed');
      } else {
        this.helper.logError('Scenario failed');
        process.exit(ExitCodes.EXECUTION_FAILED);
      }
      
      return result;
    } catch (error) {
      this.progressReporter.stop();
      this.helper.logError(error instanceof Error ? error : new Error(String(error)));
      process.exit(ExitCodes.EXECUTION_FAILED);
    }
  }

  async runBatch(directory: string, options: BatchOptions = {}): Promise<BatchResult> {
    const batchProcessor = new BatchProcessor(this.config, this.helper);
    return batchProcessor.runBatch(directory, options);
  }

  private async reportResults(result: ScenarioResult, options: HeadlessRunOptions): Promise<void> {
    // Console output
    this.displayExecutionSummary(result);
    
    // Generate reports if requested
    if (options.reporter && options.reporter !== 'console') {
      const outputDir = options.output || this.config.outputDir;
      await this.reportGenerator.generate(result, options.reporter as any, outputDir);
    }
  }

  private displayExecutionSummary(result: ScenarioResult): void {
    this.helper.log('\\n' + '='.repeat(50));
    this.helper.log('EXECUTION SUMMARY');
    this.helper.log('='.repeat(50));
    
    this.helper.log(`Scenario: ${result.scenarioName}`);
    this.helper.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    this.helper.log(`Duration: ${this.helper.formatDuration(result.duration)}`);
    this.helper.log(`Steps: ${result.stepResults.length}`);
    
    const passed = result.stepResults.filter(s => s.success).length;
    const failed = result.stepResults.filter(s => !s.success).length;
    
    this.helper.log(`  Passed: ${passed}`);
    if (failed > 0) {
      this.helper.log(`  Failed: ${failed}`);
    }
    
    // Show failed steps
    const failedSteps = result.stepResults.filter(s => !s.success);
    if (failedSteps.length > 0) {
      this.helper.log('\\nFailed Steps:');
      failedSteps.forEach(step => {
        this.helper.logError(`  ${step.stepName}: ${step.error}`);
      });
    }
    
    this.helper.log('='.repeat(50));
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}