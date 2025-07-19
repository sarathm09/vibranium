/**
 * Validation result types
 */

import type { ValidationOperator } from './operator';

export interface ValidationResult {
  passed: boolean;
  message: string;
  operator: ValidationOperator;
  expected?: any;
  actual?: any;
  path?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ValidationSummary {
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  successRate: number;
  duration: number;
  results: ValidationResult[];
}