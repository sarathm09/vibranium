/**
 * Execution context management for scenario runs
 */
import { logger } from '@vibraniumjs/utils';
import { EventEmitter } from 'events';
export class ExecutionContext extends EventEmitter {
    state;
    stepIndex = 0;
    hooks = new Map();
    constructor(scenario, initialVariables = {}) {
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
    getScenario() {
        return this.state.scenario;
    }
    /**
     * Get current execution status
     */
    getStatus() {
        return this.state.status;
    }
    /**
     * Set execution status
     */
    setStatus(status, error) {
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
    getCurrentStep() {
        return this.state.currentStep;
    }
    /**
     * Set current step
     */
    setCurrentStep(step) {
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
    getStepResult(stepName) {
        return this.state.stepResults.get(stepName);
    }
    /**
     * Set step result
     */
    setStepResult(stepName, result) {
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
    getAllStepResults() {
        return Array.from(this.state.stepResults.values());
    }
    /**
     * Get variable context for resolution
     */
    getVariableContext() {
        return { ...this.state.variables };
    }
    /**
     * Update variables in a namespace
     */
    updateVariables(namespace, variables) {
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
    setVariables(namespace, variables) {
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
    getMetrics() {
        return { ...this.state.metrics };
    }
    /**
     * Get execution error if any
     */
    getError() {
        return this.state.error;
    }
    /**
     * Register a lifecycle hook
     */
    registerHook(event, handler) {
        if (!this.hooks.has(event)) {
            this.hooks.set(event, []);
        }
        this.hooks.get(event).push(handler);
        logger.debug('Hook registered', {
            scenario: this.state.scenario.name,
            event,
            hookCount: this.hooks.get(event).length
        });
    }
    /**
     * Execute lifecycle hooks
     */
    async executeHook(event, data = {}) {
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
            }
            catch (error) {
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
    createSnapshot() {
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
    cleanup() {
        this.removeAllListeners();
        this.hooks.clear();
        logger.debug('Execution context cleaned up', {
            scenario: this.state.scenario.name
        });
    }
}
//# sourceMappingURL=execution-context.js.map