/**
 * Main orchestrator for scenario execution
 */
import { logger } from '@vibraniumjs/utils';
import { ExecutionContext } from './execution-context';
import { DependencyManager } from './dependency-manager';
import { StepExecutor } from './step-executor';
export class ScenarioOrchestrator {
    stepExecutor = new StepExecutor();
    dependencyManager = new DependencyManager();
    /**
     * Register a plugin executor
     */
    registerPlugin(stepType, executor) {
        this.stepExecutor.registerPlugin(stepType, executor);
    }
    /**
     * Execute a complete scenario
     */
    async executeScenario(scenario, initialVariables = {}, options = {}) {
        const { maxConcurrency = 5, timeout, failFast = false, skipOnError = false, retries = 0 } = options;
        logger.info('Starting scenario execution', {
            scenario: scenario.name,
            stepCount: scenario.steps.length,
            maxConcurrency
        });
        const context = new ExecutionContext(scenario, initialVariables);
        context.setStatus('running');
        try {
            // Execute scenario hooks - onStart
            await context.executeHook('onStart', { scenario });
            // Validate dependencies
            const dependencyValidation = this.dependencyManager.validateDependencies(scenario.steps);
            if (!dependencyValidation.valid) {
                throw new Error(`Dependency validation failed: ${dependencyValidation.errors.join(', ')}`);
            }
            // Create execution plan
            const executionPlan = this.dependencyManager.createExecutionPlan(scenario.steps);
            logger.debug('Execution plan created', {
                scenario: scenario.name,
                batchCount: executionPlan.batches.length,
                maxParallelism: executionPlan.maxParallelism
            });
            // Execute batches
            const progress = {
                totalSteps: executionPlan.totalSteps,
                completedSteps: 0,
                passedSteps: 0,
                failedSteps: 0,
                skippedSteps: 0,
                currentBatch: 0,
                totalBatches: executionPlan.batches.length
            };
            for (let batchIndex = 0; batchIndex < executionPlan.batches.length; batchIndex++) {
                const batch = executionPlan.batches[batchIndex];
                progress.currentBatch = batchIndex + 1;
                logger.debug('Executing batch', {
                    scenario: scenario.name,
                    batch: batchIndex + 1,
                    stepCount: batch.length
                });
                const batchResults = await this.executeBatch(batch, context, Math.min(maxConcurrency, batch.length), { timeout, retries });
                // Update progress
                batchResults.forEach(result => {
                    progress.completedSteps++;
                    switch (result.status) {
                        case 'passed':
                            progress.passedSteps++;
                            break;
                        case 'failed':
                            progress.failedSteps++;
                            break;
                        case 'skipped':
                            progress.skippedSteps++;
                            break;
                    }
                });
                // Check for failures
                const batchFailed = batchResults.some(result => result.status === 'failed');
                if (batchFailed) {
                    if (failFast) {
                        logger.warn('Failing fast due to step failure', {
                            scenario: scenario.name,
                            batch: batchIndex + 1
                        });
                        break;
                    }
                    else if (skipOnError) {
                        logger.warn('Skipping remaining batches due to error', {
                            scenario: scenario.name,
                            batch: batchIndex + 1
                        });
                        break;
                    }
                }
                // Emit progress event
                context.emit('progress', progress);
            }
            // Execute scenario hooks - onEnd
            await context.executeHook('onEnd', { scenario, context });
            // Determine final status
            const metrics = context.getMetrics();
            let finalStatus;
            if (metrics.failedSteps > 0) {
                finalStatus = 'failed';
            }
            else {
                finalStatus = 'completed';
            }
            context.setStatus(finalStatus);
            const result = {
                scenario,
                status: finalStatus,
                startTime: metrics.startTime,
                endTime: metrics.endTime,
                duration: metrics.duration,
                stepResults: context.getAllStepResults(),
                metrics: {
                    totalSteps: metrics.stepCount,
                    passedSteps: metrics.passedSteps,
                    failedSteps: metrics.failedSteps,
                    skippedSteps: metrics.skippedSteps
                },
                variables: context.getVariableContext(),
                error: context.getError()
            };
            logger.info('Scenario execution completed', {
                scenario: scenario.name,
                status: finalStatus,
                duration: metrics.duration,
                passed: metrics.passedSteps,
                failed: metrics.failedSteps,
                skipped: metrics.skippedSteps
            });
            return result;
        }
        catch (error) {
            context.setStatus('failed', error instanceof Error ? error : new Error(String(error)));
            const metrics = context.getMetrics();
            const result = {
                scenario,
                status: 'failed',
                startTime: metrics.startTime,
                endTime: new Date(),
                duration: Date.now() - metrics.startTime.getTime(),
                stepResults: context.getAllStepResults(),
                metrics: {
                    totalSteps: metrics.stepCount,
                    passedSteps: metrics.passedSteps,
                    failedSteps: metrics.failedSteps,
                    skippedSteps: metrics.skippedSteps
                },
                variables: context.getVariableContext(),
                error: error instanceof Error ? error : new Error(String(error))
            };
            logger.error('Scenario execution failed', {
                scenario: scenario.name,
                error: result.error?.message
            });
            return result;
        }
        finally {
            context.cleanup();
        }
    }
    /**
     * Execute a batch of steps in parallel
     */
    async executeBatch(steps, context, concurrency, options) {
        if (steps.length === 0) {
            return [];
        }
        // If concurrency is 1 or we have only one step, execute sequentially
        if (concurrency === 1 || steps.length === 1) {
            const results = [];
            for (const step of steps) {
                const result = await this.stepExecutor.executeStep(step, context, options);
                results.push(result);
            }
            return results;
        }
        // Execute steps in parallel with concurrency limit
        return this.executeConcurrently(steps, context, concurrency, options);
    }
    /**
     * Execute steps with concurrency control
     */
    async executeConcurrently(steps, context, concurrency, options) {
        const results = new Array(steps.length);
        const executing = [];
        let index = 0;
        const executeNext = async () => {
            const currentIndex = index++;
            if (currentIndex >= steps.length) {
                return;
            }
            const step = steps[currentIndex];
            try {
                results[currentIndex] = await this.stepExecutor.executeStep(step, context, options);
            }
            catch (error) {
                // Error handling is done in stepExecutor
                results[currentIndex] = {
                    step,
                    status: 'failed',
                    error: error instanceof Error ? error : new Error(String(error))
                };
            }
            // Continue with next step
            if (index < steps.length) {
                return executeNext();
            }
        };
        // Start initial batch of concurrent executions
        for (let i = 0; i < Math.min(concurrency, steps.length); i++) {
            executing.push(executeNext());
        }
        // Wait for all executions to complete
        await Promise.all(executing);
        return results;
    }
    /**
     * Get supported step types
     */
    getSupportedStepTypes() {
        return this.stepExecutor.getSupportedTypes();
    }
    /**
     * Validate scenario can be executed
     */
    validateScenario(scenario) {
        const errors = [];
        const warnings = [];
        // Validate dependencies
        const depValidation = this.dependencyManager.validateDependencies(scenario.steps);
        if (!depValidation.valid) {
            errors.push(...depValidation.errors);
        }
        // Check for unsupported step types
        const supportedTypes = this.getSupportedStepTypes();
        scenario.steps.forEach(step => {
            if (!supportedTypes.includes(step.type)) {
                errors.push(`Unsupported step type '${step.type}' in step '${step.name}'`);
            }
        });
        // Check for empty scenario
        if (scenario.steps.length === 0) {
            warnings.push('Scenario has no steps to execute');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
//# sourceMappingURL=orchestrator.js.map