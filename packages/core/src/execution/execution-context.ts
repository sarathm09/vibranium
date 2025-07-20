/**
 * Execution context management for scenario runs
 */

import type { 
  Scenario, 
  Step, 
  StepResult, 
  ExecutionContext as IExecutionContext,
  VariableMap 
} from '../types';
import { logger } from '@vibraniumjs/utils';
import { EventEmitter } from 'events';
import { ResolverContext } from '../variable/resolver';

export interface ExecutionMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stepCount: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
}

export interface ExecutionState {
  scenario: Scenario;
  currentStep?: Step;
  stepResults: Map<string, StepResult>;
  variables: ResolverContext;
  metrics: ExecutionMetrics;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  error?: Error;
}

export class ExecutionContext extends EventEmitter implements IExecutionContext {
  private state: ExecutionState;
  private stepIndex = 0;
  private hooks = new Map<string, Function[]>();

  constructor(scenario: Scenario, initialVariables: Partial<ResolverContext> = {}) {
    super();
    
    this.state = {
      scenario,
      stepResults: new Map(),
      variables: {
        env: process.env,
        global: {},
        context: scenario.variables || {},
        response: null,
        api: {},
        random: {},
        ...initialVariables
      },
      metrics: {
        startTime: new Date(),
        stepCount: scenario.steps.length,
        passedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0
      },
      status: 'pending'
    };

    logger.debug('Execution context created', { 
      scenario: scenario.name,
      stepCount: scenario.steps.length 
    });
  }

  /**
   * Get current scenario
   */
  getScenario(): Scenario {
    return this.state.scenario;
  }

  /**
   * Get current execution status
   */
  getStatus(): ExecutionState['status'] {
    return this.state.status;
  }

  /**
   * Set execution status
   */
  setStatus(status: ExecutionState['status'], error?: Error): void {
    const previousStatus = this.state.status;
    this.state.status = status;
    
    if (error) {
      this.state.error = error;
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      this.state.metrics.endTime = new Date();
      this.state.metrics.duration = this.state.metrics.endTime.getTime() - this.state.metrics.startTime.getTime();
    }

    this.emit('statusChanged', { from: previousStatus, to: status, error });
    
    logger.debug('Execution status changed', { 
      scenario: this.state.scenario.name,
      from: previousStatus,
      to: status,
      error: error?.message
    });
  }

  /**
   * Get current step
   */
  getCurrentStep(): Step | undefined {
    return this.state.currentStep;
  }

  /**
   * Set current step
   */
  setCurrentStep(step: Step): void {
    this.state.currentStep = step;
    this.emit('stepStarted', step);
    
    logger.debug('Current step changed', { 
      scenario: this.state.scenario.name,
      step: step.name,
      type: step.type
    });
  }

  /**
   * Get step result
   */
  getStepResult(stepName: string): StepResult | undefined {
    return this.state.stepResults.get(stepName);
  }

  /**
   * Set step result
   */
  setStepResult(stepName: string, result: StepResult): void {
    this.state.stepResults.set(stepName, result);
    
    // Update metrics
    switch (result.status) {
      case 'passed':
        this.state.metrics.passedSteps++;
        break;
      case 'failed':
        this.state.metrics.failedSteps++;
        break;
      case 'skipped':
        this.state.metrics.skippedSteps++;
        break;
    }

    // Update API responses for variable resolution
    if (result.response && result.step.type === 'api') {
      this.state.variables.api[stepName] = result.response;
      
      // Update latest response for $.response namespace
      this.state.variables.response = result.response;
    }

    this.emit('stepCompleted', { step: result.step, result });
    
    logger.debug('Step result set', { 
      scenario: this.state.scenario.name,
      step: stepName,
      status: result.status,
      duration: result.duration
    });
  }

  /**
   * Get all step results
   */
  getAllStepResults(): StepResult[] {
    return Array.from(this.state.stepResults.values());
  }

  /**
   * Get variable context for resolution
   */
  getVariableContext(): ResolverContext {
    return { ...this.state.variables };
  }

  /**
   * Update variables in a namespace
   */
  updateVariables(namespace: string, variables: Record<string, any>): void {
    if (!this.state.variables[namespace]) {
      this.state.variables[namespace] = {};
    }
    
    Object.assign(this.state.variables[namespace], variables);
    
    this.emit('variablesUpdated', { namespace, variables });
    
    logger.debug('Variables updated', { 
      scenario: this.state.scenario.name,
      namespace,
      keys: Object.keys(variables)
    });
  }

  /**
   * Set variables for a namespace
   */
  setVariables(namespace: string, variables: Record<string, any>): void {
    this.state.variables[namespace] = variables;
    
    this.emit('variablesSet', { namespace, variables });
    
    logger.debug('Variables set', { 
      scenario: this.state.scenario.name,
      namespace,
      keys: Object.keys(variables)
    });
  }

  /**
   * Get execution metrics
   */
  getMetrics(): ExecutionMetrics {
    return { ...this.state.metrics };
  }

  /**
   * Get execution error if any
   */
  getError(): Error | undefined {
    return this.state.error;
  }

  /**
   * Register a lifecycle hook
   */
  registerHook(event: string, handler: Function): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    
    this.hooks.get(event)!.push(handler);
    
    logger.debug('Hook registered', { 
      scenario: this.state.scenario.name,
      event,
      hookCount: this.hooks.get(event)!.length
    });
  }

  /**
   * Execute lifecycle hooks
   */
  async executeHook(event: string, data: any = {}): Promise<void> {
    const handlers = this.hooks.get(event);
    if (!handlers || handlers.length === 0) {
      return;
    }

    logger.debug('Executing hooks', { 
      scenario: this.state.scenario.name,
      event,
      hookCount: handlers.length
    });

    for (const handler of handlers) {
      try {
        await handler(data, this);
      } catch (error) {
        logger.error('Hook execution failed', { 
          scenario: this.state.scenario.name,
          event,
          error: error.message
        });
        // Don't throw - hooks shouldn't break execution
      }
    }
  }

  /**
   * Create a snapshot of current execution state
   */
  createSnapshot(): ExecutionState {
    return {
      scenario: { ...this.state.scenario },
      currentStep: this.state.currentStep ? { ...this.state.currentStep } : undefined,
      stepResults: new Map(this.state.stepResults),
      variables: {
        env: { ...this.state.variables.env },
        global: { ...this.state.variables.global },
        context: { ...this.state.variables.context },
        response: this.state.variables.response,
        api: { ...this.state.variables.api },
        random: { ...this.state.variables.random }
      },
      metrics: { ...this.state.metrics },
      status: this.state.status,
      error: this.state.error
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.removeAllListeners();
    this.hooks.clear();
    
    logger.debug('Execution context cleaned up', { 
      scenario: this.state.scenario.name
    });
  }
}
