/**
 * Validation operators - placeholder for future implementation
 */

// This module will contain specific validation operators
// For now, basic validation is handled in the main validator
export const VALIDATION_OPERATORS = [
  'equals',
  'contains',
  'regex',
  'type',
  'exists',
  'in',
  'gt',
  'lt',
  'gte',
  'lte',
  'length',
  'schema'
] as const;

export type ValidationOperator = typeof VALIDATION_OPERATORS[number];