/**
 * Generic step executor that delegates to appropriate plugins
 */
import { logger } from '@vibraniumjs/utils';
import { StringInterpolator } from '../variable/interpolator';
import { VariableResolver } from '../variable/resolver';
export class StepExecutor {
    plugins = new Map();
    resolver = new VariableResolver();
    interpolator = new StringInterpolator(this.resolver);
    /**
     * Register a plugin executor for a step type
     */
    registerPlugin(stepType, executor) {
        logger.debug('Registering step executor plugin', { stepType });
        this.plugins.set(stepType, executor);
    }
    /**
     * Execute a single step
     */
    async executeStep(step, context, options = {}) {
        const startTime = new Date();
        logger.debug('Executing step', { step: step.name, type: step.type });
        try {
            // Check skip condition
            if (this.shouldSkipStep(step, context, options)) {
                return this.createSkippedResult(step, startTime);
            }
            // Interpolate variables in step configuration
            const interpolatedStep = await this.interpolateStep(step, context);
            // Find appropriate plugin
            const plugin = this.findPlugin(interpolatedStep);
            if (!plugin) {
                throw new Error(`No plugin found for step type: ${interpolatedStep.type}`);
            }
            // Set current step in context
            context.setCurrentStep(interpolatedStep);
            // Execute with timeout and retries
            const result = await this.executeWithRetries(plugin, interpolatedStep, context, options);
            // Record result
            context.setStepResult(step.name, result);
            logger.debug('Step execution completed', {
                step: step.name,
                status: result.status,
                duration: result.duration
            });
            return result;
        }
        catch (error) {
            const failedResult = this.createFailedResult(step, startTime, error);
            context.setStepResult(step.name, failedResult);
            logger.error('Step execution failed', {
                step: step.name,
                error: error.message
            });
            return failedResult;
        }
    }
    /**
     * Get list of supported step types
     */
    getSupportedTypes() {
        return Array.from(this.plugins.keys());
    }
    /**
     * Check if a step type is supported
     */
    supportsStepType(stepType) {
        return this.plugins.has(stepType);
    }
    /**
     * Check if step should be skipped
     */
    shouldSkipStep(step, context, options) {
        // Check step's skip property
        if (step.skip === true) {
            return true;
        }
        // Check skip condition
        if (typeof step.skip === 'string') {
            try {
                // Evaluate skip condition as a variable reference or expression
                const resolved = this.resolver.resolve(step.skip, context.getVariableContext());
                return Boolean(resolved);
            }
            catch {
                // If evaluation fails, don't skip
                return false;
            }
        }
        // Check custom skip condition
        if (options.skipCondition) {
            return options.skipCondition(step, context);
        }
        return false;
    }
    /**
     * Interpolate variables in step configuration
     */
    async interpolateStep(step, context) {
        const variableContext = context.getVariableContext();
        const interpolationResult = this.interpolator.interpolateObject(step, variableContext, { strict: false, preserveTypes: true });
        if (interpolationResult.errors.length > 0) {
            logger.warn('Variable interpolation warnings in step', {
                step: step.name,
                errors: interpolationResult.errors
            });
        }
        return interpolationResult.value;
    }
    /**
     * Find plugin executor for step
     */
    findPlugin(step) {
        const plugin = this.plugins.get(step.type);
        if (plugin && plugin.canExecute(step)) {
            return plugin;
        }
        // Try to find a plugin that can handle this step
        for (const [, executor] of this.plugins) {
            if (executor.canExecute(step)) {
                return executor;
            }
        }
        return undefined;
    }
    /**
     * Execute step with retries and timeout
     */
    async executeWithRetries(plugin, step, context, options) {
        const maxRetries = step.retries ?? options.retries ?? 0;
        const timeout = step.timeout ?? options.timeout;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                logger.debug('Executing step attempt', {
                    step: step.name,
                    attempt: attempt + 1,
                    maxRetries: maxRetries + 1
                });
                const executePromise = plugin.execute(step, context);
                // Apply timeout if specified
                const result = timeout
                    ? await this.withTimeout(executePromise, timeout)
                    : await executePromise;
                // If we get here, execution succeeded
                if (attempt > 0) {
                    logger.info('Step succeeded after retry', {
                        step: step.name,
                        attempt: attempt + 1
                    });
                }
                return result;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < maxRetries) {
                    logger.warn('Step execution failed, retrying', {
                        step: step.name,
                        attempt: attempt + 1,
                        error: lastError.message
                    });
                    // Wait a bit before retry (simple exponential backoff)
                    await this.sleep(Math.min(1000 * Math.pow(2, attempt), 5000));
                }
            }
        }
        // All attempts failed
        throw lastError || new Error('Step execution failed after all retries');
    }
    /**
     * Add timeout to a promise
     */
    async withTimeout(promise, timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Step execution timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]);
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Create skipped step result
     */
    createSkippedResult(step, startTime) {
        const endTime = new Date();
        return {
            step,
            status: 'skipped',
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            logs: [`Step '${step.name}' was skipped`]
        };
    }
    /**
     * Create failed step result
     */
    createFailedResult(step, startTime, error) {
        const endTime = new Date();
        return {
            step,
            status: 'failed',
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            error: error instanceof Error ? error : new Error(String(error)),
            logs: [`Step '${step.name}' failed: ${error.message || error}`]
        };
    }
}
//# sourceMappingURL=step-executor.js.map