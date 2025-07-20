/**
 * Batch scenario processing
 */

import { resolve } from 'path';
import { ScenarioResult, BatchResult } from '@vibraniumjs/types';
import { CliHelper } from '../utils/cli-utils';
import { ResolvedConfig, ConfigResolver } from '../utils/config-resolver';
import { ExitCodes } from '../utils/exit-codes';
import { HeadlessRunner } from './runner';
import { ReportGenerator } from './report-generator';

export interface BatchOptions {
  environment?: string;
  parallel?: boolean;
  maxConcurrency?: number;
  continueOnFailure?: boolean;
  reporter?: string;
  output?: string;
  scenarioOverride?: string[]; // Specific scenarios to run instead of discovery
}

export class BatchProcessor {
  private configResolver: ConfigResolver;
  private reportGenerator: ReportGenerator;

  constructor(
    private config: ResolvedConfig,
    private helper: CliHelper
  ) {
    this.configResolver = new ConfigResolver();
    this.reportGenerator = new ReportGenerator(config, helper);
  }

  async runBatch(directory: string, options: BatchOptions = {}): Promise<BatchResult> {
    const startTime = Date.now();
    
    try {
      // Use provided scenarios or discover them
      const scenarios = options.scenarioOverride || await this.discoverScenarios(directory);
      
      if (scenarios.length === 0) {
        const location = options.scenarioOverride ? 'provided list' : directory;
        this.helper.logWarning(`No scenarios found in: ${location}`);
        return this.createEmptyBatchResult();
      }

      this.helper.log(`Found ${scenarios.length} scenarios to execute`);
      this.helper.logVerbose(`Scenarios: ${scenarios.join(', ')}`);

      // Execute scenarios
      const results = options.parallel 
        ? await this.executeParallel(scenarios, options)
        : await this.executeSequential(scenarios, options);

      // Generate batch result
      const batchResult: BatchResult = {
        success: results.every(r => r.success),
        scenarios: results,
        summary: this.generateSummary(results),
        duration: Date.now() - startTime,
        environment: options.environment || this.config.defaultEnvironment || 'local'
      };

      // Report results
      await this.reportBatchResults(batchResult, options);

      return batchResult;
    } catch (error) {
      this.helper.logError(error instanceof Error ? error : new Error(String(error)));
      process.exit(ExitCodes.EXECUTION_FAILED);
    }
  }

  private async discoverScenarios(directory: string): Promise<string[]> {
    const targetDir = resolve(this.config.workspaceRoot, directory);
    return this.configResolver.findScenarios({ ...this.config, scenariosDir: targetDir });
  }

  private async executeSequential(scenarios: string[], options: BatchOptions): Promise<ScenarioResult[]> {
    const results: ScenarioResult[] = [];
    const runner = new HeadlessRunner(this.config, this.helper);

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      this.helper.log(`\n${this.helper.createProgressMessage(i + 1, scenarios.length, scenario)}`);
      
      try {
        const result = await runner.runScenario(scenario, options.environment);
        results.push(result);
        
        if (!result.success && !options.continueOnFailure) {
          this.helper.logError(`Batch execution stopped due to failure in: ${scenario}`);
          break;
        }
      } catch (error) {
        const failedResult: ScenarioResult = {
          scenarioName: scenario,
          success: false,
          stepResults: [],
          duration: 0,
          error: error instanceof Error ? error.message : String(error)
        };
        results.push(failedResult);
        
        if (!options.continueOnFailure) {
          this.helper.logError(`Batch execution stopped due to error in: ${scenario}`);
          break;
        }
      }
    }

    return results;
  }

  private async executeParallel(scenarios: string[], options: BatchOptions): Promise<ScenarioResult[]> {
    const concurrency = Math.min(
      options.maxConcurrency || this.config.maxConcurrency || 4,
      scenarios.length
    );
    
    this.helper.log(`Executing ${scenarios.length} scenarios with concurrency: ${concurrency}`);

    const results: ScenarioResult[] = [];
    const chunks = this.chunkArray(scenarios, concurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (scenario, index) => {
        const runner = new HeadlessRunner(this.config, this.helper);
        
        try {
          this.helper.logVerbose(`Starting: ${scenario}`);
          const result = await runner.runScenario(scenario, options.environment);
          this.helper.logVerbose(`Completed: ${scenario} (${result.success ? 'PASSED' : 'FAILED'})`);
          return result;
        } catch (error) {
          this.helper.logVerbose(`Error in: ${scenario}`);
          return {
            scenarioName: scenario,
            success: false,
            stepResults: [],
            duration: 0,
            error: error instanceof Error ? error.message : String(error)
          } as ScenarioResult;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private generateSummary(results: ScenarioResult[]): any {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      totalDuration,
      averageDuration: total > 0 ? totalDuration / total : 0
    };
  }

  private async reportBatchResults(result: BatchResult, options: BatchOptions): Promise<void> {
    // Console summary
    this.displayBatchSummary(result);
    
    // Generate reports if requested
    if (options.reporter && options.reporter !== 'console') {
      const outputDir = options.output || this.config.outputDir;
      await this.reportGenerator.generateBatch(result, options.reporter as any, outputDir);
    }
  }

  private displayBatchSummary(result: BatchResult): void {
    this.helper.log('\n' + '='.repeat(60));
    this.helper.log('BATCH EXECUTION SUMMARY');
    this.helper.log('='.repeat(60));
    
    const { summary } = result;
    
    this.helper.log(`Total Scenarios: ${summary.total}`);
    this.helper.log(`Passed: ${summary.passed} (${summary.passRate.toFixed(1)}%)`);
    if (summary.failed > 0) {
      this.helper.log(`Failed: ${summary.failed}`);
    }
    this.helper.log(`Total Duration: ${this.helper.formatDuration(summary.totalDuration)}`);
    this.helper.log(`Average Duration: ${this.helper.formatDuration(summary.averageDuration)}`);
    
    // Show failed scenarios
    const failedScenarios = result.scenarios.filter(s => !s.success);
    if (failedScenarios.length > 0) {
      this.helper.log('\nFailed Scenarios:');
      failedScenarios.forEach(scenario => {
        this.helper.logError(`  ${scenario.scenarioName}: ${scenario.error || 'Unknown error'}`);
      });
    }
    
    this.helper.log('='.repeat(60));
    
    if (result.success) {
      this.helper.logSuccess('All scenarios passed!');
    } else {
      this.helper.logError('Some scenarios failed');
    }
  }

  private createEmptyBatchResult(): BatchResult {
    return {
      success: true,
      scenarios: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        totalDuration: 0,
        averageDuration: 0
      },
      duration: 0,
      environment: this.config.defaultEnvironment || 'local'
    };
  }
}