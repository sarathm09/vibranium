/**
 * Validation engine types
 */

import type { ExpectBlock } from './expect';
import type { ValidationResult, ValidationSummary } from './result';
import type { OperatorRegistry } from './operator';

export interface ValidationEngine {
  validate(data: any, expect: ExpectBlock): Promise<ValidationSummary>;
  getOperatorRegistry(): OperatorRegistry;
  setConfig(config: ValidationConfig): void;
}

export interface ValidationConfig {
  strictMode?: boolean;
  continueOnFailure?: boolean;
  timeout?: number;
  parallel?: boolean;
  customOperators?: Record<string, any>;
}

export interface ValidationContext {
  data: any;
  variables: Record<string, any>;
  config: ValidationConfig;
  path: string;
}