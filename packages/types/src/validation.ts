/**
 * Validation types for Vibranium CLI
 */

export interface ExpectBlock {
  [key: string]: ExpectAssertion | ExpectAssertion[];
}

export interface ExpectAssertion {
  operator: ValidationOperator;
  value?: any;
  path?: string;
  message?: string;
  continueOnFailure?: boolean;
}

export type ValidationOperator = 
  | 'equals' 
  | 'notEquals'
  | 'contains' 
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'matches'
  | 'notMatches'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'hasProperty'
  | 'hasLength'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isNull'
  | 'isNotNull'
  | 'isDefined'
  | 'isUndefined'
  | 'isType'
  | 'schema'
  | 'custom';

export interface ValidationResult {
  passed: boolean;
  message: string;
  operator: ValidationOperator;
  expected?: any;
  actual?: any;
  path?: string;
}

export interface ValidationEngine {
  validate(data: any, expectBlock: ExpectBlock): ValidationResult[];
  validateAssertion(data: any, assertion: ExpectAssertion): ValidationResult;
  registerCustomOperator(name: string, validator: CustomValidator): void;
}

export interface CustomValidator {
  (actual: any, expected: any, path?: string): ValidationResult;
}