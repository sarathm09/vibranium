/**
 * Assertion types
 */

import type { ValidationOperator } from './operator';
import type { ValidationResult } from './result';

export interface Assertion {
  identifier: string;
  operator: ValidationOperator;
  expected: any;
  message?: string;
  continueOnFailure?: boolean;
}

export interface AssertionContext {
  data: any;
  variables: Record<string, any>;
  response?: any;
  request?: any;
}

export interface AssertionExecutor {
  execute(assertion: Assertion, context: AssertionContext): Promise<ValidationResult>;
  validate(assertion: Assertion): ValidationResult[];
}