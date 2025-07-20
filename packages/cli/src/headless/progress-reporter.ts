/**
 * Progress reporting for headless execution
 */

import ora, { Ora } from 'ora';
import { CliHelper } from '../utils/cli-utils';

export class ProgressReporter {
  private spinner?: Ora;
  private startTime: number = 0;
  private stepCount: number = 0;
  private totalSteps: number = 0;

  constructor(private helper: CliHelper) {}

  start(message = 'Executing scenario...', totalSteps = 0): void {
    this.startTime = Date.now();
    this.stepCount = 0;
    this.totalSteps = totalSteps;
    
    if (this.helper['options']?.verbose || this.helper['options']?.debug) {
      // Don't use spinner in verbose mode
      this.helper.log(message);
      return;
    }

    this.spinner = ora({
      text: this.formatMessage(message),
      color: 'blue',
      spinner: 'dots'
    }).start();
  }

  update(message: string): void {
    if (this.spinner) {
      this.spinner.text = this.formatMessage(message);
    } else {
      this.helper.logVerbose(message);
    }
  }
  
  stepCompleted(stepName: string): void {
    this.stepCount++;
    const message = `Step ${this.stepCount}${this.totalSteps > 0 ? `/${this.totalSteps}` : ''}: ${stepName}`;
    this.update(message);
  }
  
  batchProgress(completed: number, total: number, currentScenario?: string): void {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const message = `Progress: ${completed}/${total} (${percentage}%)${currentScenario ? ` - ${currentScenario}` : ''}`;
    this.update(message);
  }

  succeed(message?: string): void {
    if (this.spinner) {
      const duration = this.helper.formatDuration(Date.now() - this.startTime);
      this.spinner.succeed(message || `Completed in ${duration}`);
      this.spinner = undefined;
    } else if (message) {
      this.helper.logSuccess(message);
    }
  }

  fail(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message || 'Execution failed');
      this.spinner = undefined;
    } else if (message) {
      this.helper.logError(message);
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = undefined;
    }
  }

  warn(message: string): void {
    if (this.spinner) {
      this.spinner.warn(message);
      this.spinner = undefined;
    } else {
      this.helper.logWarning(message);
    }
  }
  
  private formatMessage(message: string): string {
    const elapsed = Date.now() - this.startTime;
    const duration = this.helper.formatDuration(elapsed);
    return `${message} (${duration})`;
  }
}