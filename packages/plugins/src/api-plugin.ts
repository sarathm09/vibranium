/**
 * Core API plugin for HTTP step implementation
 */

import type { VibraniumPlugin, Step, StepResult, ExecutionContext } from '@vibraniumjs/types';

// Placeholder implementation
export class CoreApiPlugin implements VibraniumPlugin {
  name = 'core-api';
  version = '0.1.0';
  supportedStepTypes = ['api', 'http', 'get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

  async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    // TODO: Implement HTTP step execution
    // - Request building with headers/auth/multipart
    // - Response parsing delegation
    // - Lifecycle hooks (beforeApi, afterApi)
    throw new Error('Not implemented');
  }

  validateStep(step: Step) {
    // TODO: Implement step validation
    return {
      isValid: true,
      errors: []
    };
  }

  async beforeStep(step: Step, context: ExecutionContext): Promise<void> {
    // TODO: Implement beforeApi lifecycle hook
  }

  async afterStep(step: Step, result: StepResult, context: ExecutionContext): Promise<void> {
    // TODO: Implement afterApi lifecycle hook
  }
}