/**
 * Plugin lifecycle management and execution orchestration
 */

import type { VibraniumPlugin, Step, StepResult, ExecutionContext } from '@vibraniumjs/types';
import type { PluginContext } from '../base/plugin-context';

export interface LifecycleHooks {
  onInit?: () => Promise<void> | void;
  onDestroy?: () => Promise<void> | void;
  beforeStep?: (step: Step, context: ExecutionContext) => Promise<void> | void;
  afterStep?: (step: Step, result: StepResult, context: ExecutionContext) => Promise<void> | void;
}

export interface ExecutionMetrics {
  stepType: string;
  pluginName: string;
  executionTime: number;
  success: boolean;
  error?: Error;
  timestamp: Date;
}

export class LifecycleManager {
  private initialized = new Set<string>();
  private destroyed = new Set<string>();
  private executionQueue = new Map<string, Promise<any>>();
  private metrics: ExecutionMetrics[] = [];
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 10) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Initialize a plugin
   */
  async initializePlugin(plugin: VibraniumPlugin, context: PluginContext): Promise<void> {
    const pluginId = this.getPluginId(plugin);
    
    if (this.initialized.has(pluginId)) {
      return; // Already initialized
    }

    if (this.destroyed.has(pluginId)) {
      throw new Error(`Cannot initialize destroyed plugin: ${pluginId}`);
    }

    try {
      // Call plugin's onInit if available
      if (typeof (plugin as any).onInit === 'function') {
        await (plugin as any).onInit();
      }

      this.initialized.add(pluginId);
      console.log(`Plugin initialized: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      throw new Error(`Failed to initialize plugin ${pluginId}: ${error}`);
    }
  }

  /**
   * Destroy a plugin
   */
  async destroyPlugin(plugin: VibraniumPlugin, context: PluginContext): Promise<void> {
    const pluginId = this.getPluginId(plugin);
    
    if (this.destroyed.has(pluginId)) {
      return; // Already destroyed
    }

    try {
      // Wait for any pending executions to complete
      const pendingExecution = this.executionQueue.get(pluginId);
      if (pendingExecution) {
        await pendingExecution;
      }

      // Call plugin's onDestroy if available
      if (typeof (plugin as any).onDestroy === 'function') {
        await (plugin as any).onDestroy();
      }

      this.initialized.delete(pluginId);
      this.destroyed.add(pluginId);
      this.executionQueue.delete(pluginId);
      
      console.log(`Plugin destroyed: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      console.warn(`Error destroying plugin ${pluginId}:`, error);
    }
  }

  /**
   * Execute step with full lifecycle management
   */
  async executeStep(plugin: VibraniumPlugin, step: Step, context: ExecutionContext): Promise<StepResult> {
    const pluginId = this.getPluginId(plugin);
    
    if (!this.initialized.has(pluginId)) {
      throw new Error(`Plugin not initialized: ${pluginId}`);
    }

    if (this.destroyed.has(pluginId)) {
      throw new Error(`Plugin is destroyed: ${pluginId}`);
    }

    // Check concurrent execution limit
    if (this.executionQueue.size >= this.maxConcurrent) {
      await this.waitForAvailableSlot();
    }

    const startTime = Date.now();
    const executionPromise = this.doExecuteStep(plugin, step, context, startTime);
    
    // Track execution
    this.executionQueue.set(`${pluginId}-${Date.now()}`, executionPromise);
    
    try {
      const result = await executionPromise;
      return result;
    } finally {
      // Clean up execution tracking
      const keys = Array.from(this.executionQueue.keys());
      const key = keys.find(k => k.startsWith(pluginId));
      if (key) {
        this.executionQueue.delete(key);
      }
    }
  }

  /**
   * Internal step execution with lifecycle hooks
   */
  private async doExecuteStep(
    plugin: VibraniumPlugin,
    step: Step,
    context: ExecutionContext,
    startTime: number
  ): Promise<StepResult> {
    const pluginId = this.getPluginId(plugin);
    let result: StepResult;
    let error: Error | undefined;

    try {
      // Before step hook
      if (typeof plugin.beforeStep === 'function') {
        await plugin.beforeStep(step, context);
      }

      // Execute step
      result = await plugin.executeStep(step, context);
      
      // After step hook
      if (typeof plugin.afterStep === 'function') {
        await plugin.afterStep(step, result, context);
      }

    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      
      // Create error result
      result = {
        step,
        status: 'failed',
        startTime: new Date(startTime),
        endTime: new Date(),
        duration: Date.now() - startTime,
        error,
        data: null,
        logs: [`Plugin execution failed: ${error.message}`]
      };
    }

    // Record metrics
    this.recordMetrics(step.type, plugin.name, Date.now() - startTime, !error, error);

    return result;
  }

  /**
   * Wait for an available execution slot
   */
  private async waitForAvailableSlot(): Promise<void> {
    while (this.executionQueue.size >= this.maxConcurrent) {
      // Wait for any execution to complete
      const executions = Array.from(this.executionQueue.values());
      if (executions.length > 0) {
        await Promise.race(executions);
      } else {
        break;
      }
    }
  }

  /**
   * Get plugin identifier
   */
  private getPluginId(plugin: VibraniumPlugin): string {
    return `${plugin.name}-${plugin.version}`;
  }

  /**
   * Record execution metrics
   */
  private recordMetrics(
    stepType: string,
    pluginName: string,
    executionTime: number,
    success: boolean,
    error?: Error
  ): void {
    this.metrics.push({
      stepType,
      pluginName,
      executionTime,
      success,
      error,
      timestamp: new Date()
    });

    // Keep only recent metrics (last 1000 executions)
    if (this.metrics.length > 1000) {
      this.metrics.splice(0, this.metrics.length - 1000);
    }
  }

  /**
   * Get execution metrics
   */
  getMetrics(): ExecutionMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const failed = total - successful;
    
    const avgExecutionTime = total > 0 ?
      this.metrics.reduce((sum, m) => sum + m.executionTime, 0) / total :
      0;

    const stepTypeStats = this.metrics.reduce((acc, m) => {
      if (!acc[m.stepType]) {
        acc[m.stepType] = { count: 0, avgTime: 0, successRate: 0 };
      }
      acc[m.stepType].count++;
      return acc;
    }, {} as Record<string, { count: number; avgTime: number; successRate: number }>);

    // Calculate averages for each step type
    Object.keys(stepTypeStats).forEach(stepType => {
      const typeMetrics = this.metrics.filter(m => m.stepType === stepType);
      const typeSuccessful = typeMetrics.filter(m => m.success).length;
      
      stepTypeStats[stepType].avgTime = typeMetrics.reduce((sum, m) => sum + m.executionTime, 0) / typeMetrics.length;
      stepTypeStats[stepType].successRate = typeSuccessful / typeMetrics.length;
    });

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? successful / total : 0,
      avgExecutionTime,
      stepTypeStats,
      activeExecutions: this.executionQueue.size,
      initializedPlugins: this.initialized.size,
      destroyedPlugins: this.destroyed.size
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.length = 0;
  }

  /**
   * Check if plugin is initialized
   */
  isInitialized(plugin: VibraniumPlugin): boolean {
    return this.initialized.has(this.getPluginId(plugin));
  }

  /**
   * Check if plugin is destroyed
   */
  isDestroyed(plugin: VibraniumPlugin): boolean {
    return this.destroyed.has(this.getPluginId(plugin));
  }

  /**
   * Get active executions count
   */
  getActiveExecutionsCount(): number {
    return this.executionQueue.size;
  }

  /**
   * Shutdown lifecycle manager
   */
  async shutdown(): Promise<void> {
    // Wait for all pending executions
    const executions = Array.from(this.executionQueue.values());
    if (executions.length > 0) {
      await Promise.allSettled(executions);
    }

    this.executionQueue.clear();
    this.initialized.clear();
    this.destroyed.clear();
    this.metrics.length = 0;
  }
}
