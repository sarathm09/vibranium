/**
 * Console reporter with colored status indicators
 */

import chalk from 'chalk';
import { ScenarioResult, BatchResult } from '@vibraniumjs/types';
import { CliHelper } from '../../utils/cli-utils';
import { ReportData, ConsoleOutputLevel } from '../report-generator';

// Type aliases for compatibility
type ExecutionStatus = 'passed' | 'failed' | 'error' | 'cancelled' | 'timeout' | 'skipped';
type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'blocked';

export class ConsoleReporter {
  constructor(private helper: CliHelper) {}

  generateScenarioReport(data: ReportData): string {
    const result = data.result as ScenarioResult;
    const level = data.options.consoleLevel || 'normal';
    const useColor = data.options.colorOutput !== false;

    let output = '';

    // Header
    output += this.formatHeader('Scenario Report', useColor);
    output += this.formatScenarioSummary(result, useColor);

    if (level !== 'minimal') {
      output += this.formatStepResults(result, level, useColor);
    }

    if (level === 'verbose') {
      output += this.formatMetadata(result, useColor);
      output += this.formatArtifacts(result, useColor);
    }

    return output;
  }

  generateBatchReport(data: ReportData): string {
    const result = data.result as BatchResult;
    const level = data.options.consoleLevel || 'normal';
    const useColor = data.options.colorOutput !== false;

    let output = '';

    // Header
    output += this.formatHeader('Batch Report', useColor);
    output += this.formatBatchSummary(result, useColor);

    if (level !== 'minimal') {
      output += this.formatScenarioResults(result, level, useColor);
    }

    if (level === 'verbose') {
      output += this.formatBatchMetadata(result, useColor);
    }

    return output;
  }

  private formatHeader(title: string, useColor: boolean): string {
    const separator = '='.repeat(60);
    const formattedTitle = useColor ? chalk.bold.cyan(title) : title;
    return `\n${separator}\n${formattedTitle}\n${separator}\n\n`;
  }

  private formatScenarioSummary(result: ScenarioResult, useColor: boolean): string {
    const status = this.formatStatus(result.status, useColor);
    const duration = this.helper.formatDuration(result.summary.duration);
    
    let output = `Scenario: ${useColor ? chalk.bold(result.scenario.name) : result.scenario.name}\n`;
    output += `Status: ${status}\n`;
    output += `Duration: ${duration}\n`;
    output += `Steps: ${result.summary.totalSteps} total, `;
    output += `${this.formatCount(result.summary.passedSteps, 'passed', useColor)} passed, `;
    output += `${this.formatCount(result.summary.failedSteps, 'failed', useColor)} failed, `;
    output += `${this.formatCount(result.summary.skippedSteps, 'skipped', useColor)} skipped\n`;
    output += `Success Rate: ${result.summary.successRate.toFixed(1)}%\n\n`;

    return output;
  }

  private formatBatchSummary(result: BatchResult, useColor: boolean): string {
    const status = this.formatStatus(result.status, useColor);
    const duration = this.helper.formatDuration(result.summary.duration);
    
    let output = `Batch Execution\n`;
    output += `Status: ${status}\n`;
    output += `Duration: ${duration}\n`;
    output += `Scenarios: ${result.summary.totalScenarios} total, `;
    output += `${this.formatCount(result.summary.passedScenarios, 'passed', useColor)} passed, `;
    output += `${this.formatCount(result.summary.failedScenarios, 'failed', useColor)} failed, `;
    output += `${this.formatCount(result.summary.skippedScenarios, 'skipped', useColor)} skipped\n`;
    output += `Success Rate: ${result.summary.successRate.toFixed(1)}%\n\n`;

    return output;
  }

  private formatStepResults(result: ScenarioResult, level: ConsoleOutputLevel, useColor: boolean): string {
    let output = useColor ? chalk.bold('Step Results:\n') : 'Step Results:\n';
    
    for (const stepResult of result.stepResults) {
      const status = this.formatStatus(stepResult.status, useColor);
      const duration = stepResult.metadata?.duration ? 
        this.helper.formatDuration(stepResult.metadata.duration) : 'N/A';
      
      output += `  ${stepResult.step.name}: ${status}`;
      if (level === 'verbose') {
        output += ` (${duration})`;
      }
      output += '\n';

      if (stepResult.error && level === 'verbose') {
        const errorMsg = useColor ? 
          chalk.red(`    Error: ${stepResult.error.message}`) :
          `    Error: ${stepResult.error.message}`;
        output += `${errorMsg}\n`;
      }

      if (stepResult.validationResults && stepResult.validationResults.length > 0 && level === 'verbose') {
        for (const validation of stepResult.validationResults) {
          const validationStatus = validation.passed ? 
            (useColor ? chalk.green('✓') : '✓') : 
            (useColor ? chalk.red('✗') : '✗');
          output += `    ${validationStatus} ${validation.operator}: ${validation.message}\n`;
        }
      }
    }

    return output + '\n';
  }

  private formatScenarioResults(result: BatchResult, level: ConsoleOutputLevel, useColor: boolean): string {
    let output = useColor ? chalk.bold('Scenario Results:\n') : 'Scenario Results:\n';
    
    for (const scenarioResult of result.scenarioResults) {
      const status = this.formatStatus(scenarioResult.status, useColor);
      const duration = this.helper.formatDuration(scenarioResult.summary.duration);
      
      output += `  ${scenarioResult.scenario.name}: ${status}`;
      if (level === 'verbose') {
        output += ` (${duration}, ${scenarioResult.summary.totalSteps} steps)`;
      }
      output += '\n';

      if (scenarioResult.error && level === 'verbose') {
        const errorMsg = useColor ? 
          chalk.red(`    Error: ${scenarioResult.error.message}`) :
          `    Error: ${scenarioResult.error.message}`;
        output += `${errorMsg}\n`;
      }
    }

    return output + '\n';
  }

  private formatMetadata(result: ScenarioResult, useColor: boolean): string {
    let output = useColor ? chalk.bold('Metadata:\n') : 'Metadata:\n';
    output += `  Environment: ${result.environment.name}\n`;
    output += `  Started: ${result.metadata.startedAt.toISOString()}\n`;
    output += `  Ended: ${result.metadata.endedAt?.toISOString() || 'N/A'}\n`;
    output += `  Average Step Duration: ${this.helper.formatDuration(result.summary.averageStepDuration || 0)}\n`;
    
    // Configuration details would be shown here if available
    // Note: metadata.config structure depends on implementation

    return output + '\n';
  }

  private formatArtifacts(result: ScenarioResult, useColor: boolean): string {
    if (result.artifacts.length === 0) {
      return '';
    }

    let output = useColor ? chalk.bold('Artifacts:\n') : 'Artifacts:\n';
    for (const artifact of result.artifacts) {
      output += `  ${artifact.type}: ${artifact.path} (${this.formatFileSize(artifact.size)})\n`;
    }

    return output + '\n';
  }

  private formatBatchMetadata(result: BatchResult, useColor: boolean): string {
    let output = useColor ? chalk.bold('Batch Metadata:\n') : 'Batch Metadata:\n';
    output += `  Mode: ${result.metadata.mode}\n`;
    output += `  Environment: ${result.metadata.environment}\n`;
    output += `  Started: ${result.metadata.startedAt.toISOString()}\n`;
    output += `  Ended: ${result.metadata.endedAt?.toISOString() || 'N/A'}\n`;
    
    // Max concurrency details would be shown here if available

    return output + '\n';
  }

  private formatStatus(status: ExecutionStatus | StepStatus, useColor: boolean): string {
    if (!useColor) {
      return status.toUpperCase();
    }

    switch (status) {
      case 'passed':
        return chalk.green('PASSED');
      case 'failed':
        return chalk.red('FAILED');
      case 'error':
        return chalk.red('ERROR');
      case 'cancelled':
        return chalk.yellow('CANCELLED');
      case 'timeout':
        return chalk.yellow('TIMEOUT');
      case 'skipped':
        return chalk.cyan('SKIPPED');
      case 'pending':
        return chalk.yellow('PENDING');
      case 'running':
        return chalk.blue('RUNNING');
      case 'blocked':
        return chalk.magenta('BLOCKED');
      default:
        return chalk.gray(String(status).toUpperCase());
    }
  }

  private formatCount(count: number, type: string, useColor: boolean): string {
    if (!useColor) {
      return `${count} ${type}`;
    }

    const color = type === 'passed' ? chalk.green : 
                  type === 'failed' ? chalk.red : 
                  type === 'skipped' ? chalk.cyan : chalk.gray;
    
    return color(`${count} ${type}`);
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}