/**
 * Validation operator types
 */

/**
 * Core validation operators as specified in the design
 */
export type ValidationOperator = 
  // Equality operators
  | 'equals'      // Strict equality (===)
  | 'notEquals'   // Strict inequality (!==)
  
  // String operators
  | 'contains'    // String/array contains
  | 'notContains' // String/array does not contain
  | 'startsWith'  // String starts with
  | 'endsWith'    // String ends with
  | 'regex'       // RegExp test
  | 'notRegex'    // RegExp negative test
  
  // Numeric operators
  | 'gt'          // Greater than
  | 'gte'         // Greater than or equal
  | 'lt'          // Less than
  | 'lte'         // Less than or equal
  
  // Collection operators
  | 'in'          // Value in array/set
  | 'notIn'       // Value not in array/set
  | 'length'      // Collection/string length equals
  | 'minLength'   // Minimum length
  | 'maxLength'   // Maximum length
  
  // Existence operators
  | 'exists'      // Value is not undefined/null
  | 'notExists'   // Value is undefined/null
  | 'empty'       // Value is empty ([], {}, "")
  | 'notEmpty'    // Value is not empty
  
  // Type operators
  | 'type'        // Type check (string, number, boolean, array, object)
  | 'instanceOf'  // Instance of class/constructor
  
  // Schema operators
  | 'schema'      // JSON Schema validation
  | 'jsonSchema'  // Explicit JSON Schema
  | 'xmlSchema'   // XML Schema (XSD) validation
  
  // Custom operators
  | 'custom'      // Custom validation function
  | 'javascript'  // JavaScript expression evaluation
  
  // Advanced operators
  | 'hasProperty' // Object has property
  | 'hasKey'      // Object has key (alias for hasProperty)
  | 'matches'     // Deep object matching
  | 'oneOf'       // Value matches one of multiple patterns
  | 'allOf'       // Value matches all patterns
  | 'anyOf'       // Value matches any pattern
  | 'not';        // Negation of another operator

/**
 * Operator metadata
 */
export interface OperatorMetadata {
  /** Operator name */
  name: ValidationOperator;
  
  /** Operator description */
  description: string;
  
  /** Supported data types */
  supportedTypes: DataType[];
  
  /** Examples */
  examples: OperatorExample[];
  
  /** Category */
  category: OperatorCategory;
  
  /** Aliases */
  aliases?: string[];
  
  /** Deprecated */
  deprecated?: boolean;
}

/**
 * Data types for operators
 */
export type DataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null'
  | 'undefined'
  | 'any';

/**
 * Operator example
 */
export interface OperatorExample {
  /** Example description */
  description: string;
  
  /** Example identifier */
  identifier: string;
  
  /** Example expected value */
  expected: any;
  
  /** Example actual value */
  actual: any;
  
  /** Expected result */
  result: boolean;
}

/**
 * Operator categories
 */
export type OperatorCategory = 
  | 'equality'
  | 'comparison'
  | 'string'
  | 'collection'
  | 'existence'
  | 'type'
  | 'schema'
  | 'advanced'
  | 'custom';

/**
 * Custom operator definition
 */
export interface CustomOperator {
  /** Operator name */
  name: string;
  
  /** Operator implementation */
  implementation: OperatorFunction;
  
  /** Operator metadata */
  metadata: Partial<OperatorMetadata>;
  
  /** Validation function for expected value */
  validateExpected?: (expected: any) => boolean;
}

/**
 * Operator function signature
 */
export type OperatorFunction = (actual: any, expected: any, context?: OperatorContext) => OperatorResult;

/**
 * Operator execution context
 */
export interface OperatorContext {
  /** Current identifier path */
  path: string;
  
  /** Full response data */
  response: any;
  
  /** Variable context */
  variables: Record<string, any>;
  
  /** Logger instance */
  logger?: Logger;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Operator execution result
 */
export interface OperatorResult {
  /** Validation passed */
  passed: boolean;
  
  /** Result message */
  message: string;
  
  /** Actual value */
  actual: any;
  
  /** Expected value */
  expected: any;
  
  /** Additional details */
  details?: Record<string, any>;
  
  /** Operator used */
  operator: ValidationOperator;
}

/**
 * Operator registry
 */
export interface OperatorRegistry {
  /** Register custom operator */
  register(operator: CustomOperator): void;
  
  /** Unregister operator */
  unregister(name: string): void;
  
  /** Get operator function */
  get(name: ValidationOperator): OperatorFunction | undefined;
  
  /** List all operators */
  list(): ValidationOperator[];
  
  /** Get operator metadata */
  getMetadata(name: ValidationOperator): OperatorMetadata | undefined;
  
  /** Check if operator exists */
  has(name: ValidationOperator): boolean;
}

/**
 * Compound operator for complex validations
 */
export interface CompoundOperator {
  /** Operator type */
  type: 'and' | 'or' | 'not' | 'xor';
  
  /** Sub-operators */
  operators: ValidationExpression[];
}

/**
 * Validation expression
 */
export interface ValidationExpression {
  /** Operator */
  operator: ValidationOperator;
  
  /** Expected value */
  expected: any;
  
  /** Nested expression (for compound operators) */
  expression?: CompoundOperator;
}

/**
 * Simple logger interface
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}