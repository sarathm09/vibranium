import type { Step, StepResult } from '../scenario/step';
import type { ExecutionContext } from '../execution/context';

export interface StepExecutor {
  execute(step: Step, context: ExecutionContext): Promise<StepResult>;
  canExecute(step: Step): boolean;
  validate(step: Step): ValidationResult[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}