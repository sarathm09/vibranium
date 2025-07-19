/**
 * Expectation block types
 */

import type { ValidationOperator } from './operator';
import type { ValidationResult } from './result';

/**
 * Main expectation block structure
 */
export interface ExpectBlock {
  /** Array of assertions to validate */
  assertions?: Assertion[];
  
  /** Single assertion (shorthand) */
  assertion?: Assertion;
  
  /** Legacy format support */
  [key: string]: any;
}

/**
 * Individual assertion definition
 */
export interface Assertion {
  /** JSONPath/XPath expression to identify the value */
  identifier: string;
  
  /** Validation operator */
  operator: ValidationOperator;
  
  /** Expected value */
  expected: any;
  
  /** Custom error message */
  message?: string;
  
  /** Continue on failure */
  continueOnFailure?: boolean;
  
  /** Assertion metadata */
  metadata?: AssertionMetadata;
}

/**
 * Assertion metadata
 */
export interface AssertionMetadata {
  /** Assertion name/description */
  name?: string;
  
  /** Assertion category */
  category?: AssertionCategory;
  
  /** Assertion tags */
  tags?: string[];
  
  /** Timeout for assertion (ms) */
  timeout?: number;
  
  /** Retry configuration */
  retry?: AssertionRetryConfig;
  
  /** Custom properties */
  [key: string]: any;
}

/**
 * Assertion categories
 */
export type AssertionCategory = 
  | 'response'     // Response validation
  | 'status'       // Status code validation
  | 'headers'      // Header validation
  | 'body'         // Body content validation
  | 'performance'  // Performance validation
  | 'security'     // Security validation
  | 'business'     // Business logic validation
  | 'custom';      // Custom validation

/**
 * Assertion retry configuration
 */
export interface AssertionRetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  
  /** Delay between retries (ms) */
  delay: number;
  
  /** Exponential backoff */
  backoff?: boolean;
  
  /** Retry condition */
  condition?: (result: ValidationResult) => boolean;
}

/**
 * Advanced expectation block with conditions
 */
export interface ConditionalExpectBlock extends ExpectBlock {
  /** Condition for executing expectations */
  condition?: ExpectCondition;
  
  /** Timeout for all assertions */
  timeout?: number;
  
  /** Mode for assertion execution */
  mode?: ExpectMode;
  
  /** Group related assertions */
  groups?: ExpectGroup[];
}

/**
 * Expectation condition
 */
export interface ExpectCondition {
  /** Condition expression */
  expression: string;
  
  /** Variables for condition evaluation */
  variables?: Record<string, any>;
  
  /** Condition timeout (ms) */
  timeout?: number;
}

/**
 * Expectation execution modes
 */
export type ExpectMode = 
  | 'all'       // All assertions must pass
  | 'any'       // At least one assertion must pass
  | 'first'     // Stop at first passing assertion
  | 'optional'; // Assertions are optional

/**
 * Grouped assertions
 */
export interface ExpectGroup {
  /** Group name */
  name: string;
  
  /** Group description */
  description?: string;
  
  /** Assertions in group */
  assertions: Assertion[];
  
  /** Group execution mode */
  mode?: ExpectMode;
  
  /** Group condition */
  condition?: ExpectCondition;
}

/**
 * Expectation template for reuse
 */
export interface ExpectTemplate {
  /** Template name */
  name: string;
  
  /** Template description */
  description?: string;
  
  /** Template version */
  version?: string;
  
  /** Template parameters */
  parameters?: TemplateParameter[];
  
  /** Template expectation block */
  expect: ExpectBlock;
  
  /** Template metadata */
  metadata?: Record<string, any>;
}

/**
 * Template parameter
 */
export interface TemplateParameter {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  
  /** Parameter description */
  description?: string;
  
  /** Is required */
  required?: boolean;
  
  /** Default value */
  default?: any;
  
  /** Validation pattern */
  pattern?: string;
}

/**
 * Expectation builder for fluent API
 */
export interface ExpectBuilder {
  /** Add assertion */
  assert(identifier: string, operator: ValidationOperator, expected: any): ExpectBuilder;
  
  /** Set timeout */
  timeout(ms: number): ExpectBuilder;
  
  /** Set execution mode */
  mode(mode: ExpectMode): ExpectBuilder;
  
  /** Add condition */
  when(condition: string): ExpectBuilder;
  
  /** Create group */
  group(name: string, builder: (group: ExpectGroupBuilder) => void): ExpectBuilder;
  
  /** Build expectation block */
  build(): ExpectBlock;
}

/**
 * Expectation group builder
 */
export interface ExpectGroupBuilder {
  /** Add assertion to group */
  assert(identifier: string, operator: ValidationOperator, expected: any): ExpectGroupBuilder;
  
  /** Set group mode */
  mode(mode: ExpectMode): ExpectGroupBuilder;
  
  /** Set group condition */
  when(condition: string): ExpectGroupBuilder;
}

/**
 * Expectation validator interface
 */
export interface ExpectValidator {
  /** Validate expectation block syntax */
  validate(expect: ExpectBlock): ValidationResult[];
  
  /** Validate assertion */
  validateAssertion(assertion: Assertion): ValidationResult[];
  
  /** Validate template */
  validateTemplate(template: ExpectTemplate): ValidationResult[];
}

/**
 * Schema validation for expectations
 */
export interface ExpectSchema {
  /** JSON Schema for ExpectBlock */
  expectBlock: object;
  
  /** JSON Schema for Assertion */
  assertion: object;
  
  /** JSON Schema for ExpectTemplate */
  template: object;
  
  /** Validate against schema */
  validate(data: any, schemaName: string): ValidationResult[];
}