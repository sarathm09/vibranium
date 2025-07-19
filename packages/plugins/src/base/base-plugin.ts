/**
 * Base plugin implementation with common functionality
 */

import type { VibraniumPlugin, Step, StepResult, ExecutionContext, ValidationResult } from '@vibraniumjs/types';
import type { PluginContext } from './plugin-context';

export interface BasePluginConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableMetrics?: boolean;
  enableLogging?: boolean;
}

export interface PluginMetrics {
  executionCount: number;
  successCount: number;
  failureCount: number;
  avgExecutionTime: number;
  lastExecuted?: Date;
  lastError?: Error;
}

export abstract class BasePlugin implements VibraniumPlugin {
  abstract readonly metadata: import('@vibraniumjs/types').PluginMetadata;
  abstract readonly stepTypes: string[];
  abstract readonly capabilities?: import('@vibraniumjs/types').PluginCapabilities;
  abstract readonly configSchema?: object;
  abstract readonly lifecycle?: import('@vibraniumjs/types').PluginLifecycle;

  protected context?: PluginContext;
  protected config: BasePluginConfig;
  protected metrics: PluginMetrics;
  protected isInitialized = false;
  protected isDestroyed = false;

  constructor(config: BasePluginConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 0,
      retryDelay: 1000,
      enableMetrics: true,
      enableLogging: true,
      ...config
    };

    this.metrics = {
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      avgExecutionTime: 0
    };
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.doInit();
    this.isInitialized = true;
    this.log('info', 'Plugin initialized');
  }

  /**
   * Destroy plugin
   */
  async onDestroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    await this.doDestroy();
    this.isDestroyed = true;
    this.isInitialized = false;
    this.log('info', 'Plugin destroyed');
  }

  /**
   * Execute step with error handling and retries
   */
  async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    this.ensureInitialized();
    
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempt = 0;
    const maxAttempts = (this.config.retries || 0) + 1;

    while (attempt < maxAttempts) {
      try {
        const result = await this.executeWithTimeout(step, context, this.config.timeout!);
        
        // Update metrics on success
        this.updateMetrics(startTime, true);
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;
        
        if (attempt < maxAttempts) {
          this.log('warn', `Step execution failed (attempt ${attempt}/${maxAttempts}), retrying...`, lastError);
          await this.delay(this.config.retryDelay!);
        }
      }
    }

    // Update metrics on failure
    this.updateMetrics(startTime, false, lastError);
    
    // Return error result
    return this.createErrorResult(step, lastError!, startTime);
  }

  /**
   * Validate step (optional)
   */
  validateStep?(step: Step): ValidationResult[] {
    const result = this.doValidateStep(step);
    return [result];
  }

  /**
   * Internal validation method
   */
  protected doValidateStep(step: Step): ValidationResult {
    // Default validation - can be overridden
    if (!step.type) {
      return {
        passed: false,
        message: 'Step type is required',
        operator: 'custom',
        path: 'type'
      };
    }

    if (!this.stepTypes.includes(step.type)) {
      return {
        passed: false,
        message: `Unsupported step type: ${step.type}`,
        operator: 'custom',
        expected: this.stepTypes,
        actual: step.type,
        path: 'type'
      };
    }

    return {
      passed: true,
      message: 'Step validation passed',
      operator: 'custom'
    };
  }

  /**
   * Before step hook (optional)
   */
  async beforeStep?(step: Step, context: ExecutionContext): Promise<void> {
    this.log('debug', `Executing step: ${step.name || step.type}`);
  }

  /**
   * After step hook (optional)
   */
  async afterStep?(step: Step, result: StepResult, context: ExecutionContext): Promise<void> {
    const status = result.status;
    const duration = result.duration || 0;
    this.log('debug', `Step completed: ${step.name || step.type} [${status}] (${duration}ms)`);
  }

  /**
   * Get plugin metrics
   */
  getMetrics(): PluginMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      avgExecutionTime: 0
    };
  }

  /**
   * Set plugin context
   */
  setContext(context: PluginContext): void {
    this.context = context;
  }

  /**
   * Get plugin context
   */
  getContext(): PluginContext | undefined {
    return this.context;
  }

  /**
   * Check if plugin is initialized
   */
  isPluginInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if plugin is destroyed
   */
  isPluginDestroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Abstract method for actual step execution
   */
  protected abstract doExecuteStep(step: Step, context: ExecutionContext): Promise<StepResult>;

  /**
   * Override for custom initialization
   */
  protected async doInit(): Promise<void> {
    // Default implementation - can be overridden
  }

  /**
   * Override for custom destruction
   */
  protected async doDestroy(): Promise<void> {
    // Default implementation - can be overridden
    if (this.context) {
      await this.context.cleanup();
    }
  }

  /**
   * Execute step with timeout
   */
  private async executeWithTimeout(step: Step, context: ExecutionContext, timeout: number): Promise<StepResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Step execution timed out after ${timeout}ms`));
      }, timeout);

      this.doExecuteStep(step, context)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Update execution metrics
   */
  private updateMetrics(startTime: number, success: boolean, error?: Error): void {
    if (!this.config.enableMetrics) {
      return;
    }

    const executionTime = Date.now() - startTime;
    
    this.metrics.executionCount++;
    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.failureCount++;
      this.metrics.lastError = error;
    }
    
    // Update average execution time
    const totalTime = this.metrics.avgExecutionTime * (this.metrics.executionCount - 1) + executionTime;
    this.metrics.avgExecutionTime = totalTime / this.metrics.executionCount;
    
    this.metrics.lastExecuted = new Date();
  }

  /**
   * Create error result
   */
  private createErrorResult(step: Step, error: Error, startTime: number): StepResult {
    return {
      step,
      status: 'failed',
      startTime: new Date(startTime),
      endTime: new Date(),
      duration: Date.now() - startTime,
      error,
      data: null,
      logs: [error.message]
    };
  }

  /**
   * Ensure plugin is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(`Plugin ${this.metadata.name} is not initialized`);
    }
    
    if (this.isDestroyed) {
      throw new Error(`Plugin ${this.metadata.name} is destroyed`);
    }
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log message with plugin context
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    if (!this.config.enableLogging) {
      return;
    }

    const logger = this.context?.getLogger();
    if (logger) {
      logger[level](message, ...args);
    } else {
      console[level](`[${this.metadata.name}] ${message}`, ...args);
    }
  }

  /**
   * Create successful result
   */
  protected createSuccessResult(step: Step, data: any, startTime: number, logs: string[] = []): StepResult {
    return {
      step,
      status: 'passed',
      startTime: new Date(startTime),
      endTime: new Date(),
      duration: Date.now() - startTime,
      data,
      logs
    };
  }

  /**
   * Validate step configuration against schema
   */
  protected validateStepConfig(step: Step, schema: any): ValidationResult {
    // This would use a schema validator like AJV
    // For now, return basic validation
    return {
      passed: true,
      message: 'Step configuration valid',
      operator: 'schema'
    };
  }
}
