/**
 * Main validation engine - simplified implementation
 */

import type { ExpectBlock, ValidationResult } from '../types';
import { logger } from '@vibraniumjs/utils';
import { JsonContentParser } from '../content/json-parser';
import { XmlContentParser } from '../content/xml-parser';
import { TextContentParser } from '../content/text-parser';

export interface ValidationContext {
  response?: any;
  stepName: string;
  data: any;
}

export class ValidationEngine {
  private jsonParser = new JsonContentParser();
  private xmlParser = new XmlContentParser();
  private textParser = new TextContentParser();

  /**
   * Validate response against expectations
   */
  async validate(
    expectations: ExpectBlock,
    context: ValidationContext
  ): Promise<ValidationResult[]> {
    logger.debug('Running validations', {
      step: context.stepName,
      expectations: Object.keys(expectations)
    });

    const results: ValidationResult[] = [];

    // Validate each expectation
    for (const [operator, expected] of Object.entries(expectations)) {
      try {
        const result = await this.validateOperator(
          operator,
          expected,
          context
        );
        results.push(result);
      } catch (error) {
        results.push({
          operator,
          expected,
          actual: undefined,
          passed: false,
          message: `Validation error: ${error.message}`,
          path: context.stepName
        });
      }
    }

    logger.debug('Validation completed', {
      step: context.stepName,
      total: results.length,
      passed: results.filter(r => r.passed).length
    });

    return results;
  }

  /**
   * Validate a single operator
   */
  private async validateOperator(
    operator: string,
    expected: any,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const { data } = context;

    switch (operator) {
      case 'status':
        return this.validateStatus(expected, data.status || data.statusCode);

      case 'body':
        return this.validateBody(expected, data.body || data.data);

      case 'headers':
        return this.validateHeaders(expected, data.headers);

      case 'jsonpath':
        return this.validateJsonPath(expected, data.body || data.data);

      case 'xpath':
        return this.validateXPath(expected, data.body || data.data);

      default:
        return {
          operator,
          expected,
          actual: undefined,
          passed: false,
          message: `Unknown validation operator: ${operator}`,
          path: context.stepName
        };
    }
  }

  /**
   * Validate HTTP status code
   */
  private validateStatus(expected: number, actual: number): ValidationResult {
    const passed = actual === expected;
    
    return {
      operator: 'status',
      expected,
      actual,
      passed,
      message: passed 
        ? `Status code ${actual} matches expected ${expected}`
        : `Expected status ${expected} but got ${actual}`,
      path: 'response.status'
    };
  }

  /**
   * Validate response body
   */
  private validateBody(expected: any, actual: any): ValidationResult {
    let passed = false;
    let message = '';

    if (typeof expected === 'object' && expected !== null) {
      // Deep object comparison
      passed = this.deepEqual(expected, actual);
      message = passed 
        ? 'Response body matches expected object'
        : 'Response body does not match expected object';
    } else {
      // Simple equality
      passed = expected === actual;
      message = passed
        ? `Response body matches expected value`
        : `Expected "${expected}" but got "${actual}"`;
    }

    return {
      operator: 'body',
      expected,
      actual,
      passed,
      message,
      path: 'response.body'
    };
  }

  /**
   * Validate response headers
   */
  private validateHeaders(expected: Record<string, any>, actual: Record<string, any>): ValidationResult {
    const results: string[] = [];
    let allPassed = true;

    for (const [headerName, expectedValue] of Object.entries(expected)) {
      const actualValue = actual?.[headerName] || actual?.[headerName.toLowerCase()];
      
      if (actualValue !== expectedValue) {
        allPassed = false;
        results.push(`Header "${headerName}": expected "${expectedValue}" but got "${actualValue}"`);
      }
    }

    return {
      operator: 'headers',
      expected,
      actual,
      passed: allPassed,
      message: allPassed 
        ? 'All headers match expected values'
        : results.join('; '),
      path: 'response.headers'
    };
  }

  /**
   * Validate using JSONPath
   */
  private validateJsonPath(expected: Record<string, any>, data: any): ValidationResult {
    try {
      const results: string[] = [];
      let allPassed = true;

      for (const [path, expectedValue] of Object.entries(expected)) {
        const queryResults = this.jsonParser.query(data, path);
        
        if (queryResults.length === 0) {
          allPassed = false;
          results.push(`JSONPath "${path}" returned no results`);
        } else {
          const actualValue = queryResults[0].value;
          
          if (actualValue !== expectedValue) {
            allPassed = false;
            results.push(`JSONPath "${path}": expected "${expectedValue}" but got "${actualValue}"`);
          }
        }
      }

      return {
        operator: 'jsonpath',
        expected,
        actual: data,
        passed: allPassed,
        message: allPassed
          ? 'All JSONPath assertions passed'
          : results.join('; '),
        path: 'response.body'
      };
    } catch (error) {
      return {
        operator: 'jsonpath',
        expected,
        actual: data,
        passed: false,
        message: `JSONPath validation failed: ${error.message}`,
        path: 'response.body'
      };
    }
  }

  /**
   * Validate using XPath
   */
  private validateXPath(expected: Record<string, any>, data: any): ValidationResult {
    try {
      // Parse XML data if it's a string
      let document: Document;
      if (typeof data === 'string') {
        const parseResult = this.xmlParser.parse(data);
        document = parseResult.document;
      } else if (data && data.documentElement) {
        document = data;
      } else {
        throw new Error('Data is not valid XML');
      }

      const results: string[] = [];
      let allPassed = true;

      for (const [path, expectedValue] of Object.entries(expected)) {
        const actualValue = this.xmlParser.queryValue(document, path);
        
        if (actualValue !== expectedValue) {
          allPassed = false;
          results.push(`XPath "${path}": expected "${expectedValue}" but got "${actualValue}"`);
        }
      }

      return {
        operator: 'xpath',
        expected,
        actual: data,
        passed: allPassed,
        message: allPassed
          ? 'All XPath assertions passed'
          : results.join('; '),
        path: 'response.body'
      };
    } catch (error) {
      return {
        operator: 'xpath',
        expected,
        actual: data,
        passed: false,
        message: `XPath validation failed: ${error.message}`,
        path: 'response.body'
      };
    }
  }

  /**
   * Deep equality check for objects
   */
  private deepEqual(expected: any, actual: any): boolean {
    if (expected === actual) {
      return true;
    }

    if (expected == null || actual == null) {
      return false;
    }

    if (typeof expected !== typeof actual) {
      return false;
    }

    if (Array.isArray(expected)) {
      if (!Array.isArray(actual) || expected.length !== actual.length) {
        return false;
      }
      
      return expected.every((item, index) => this.deepEqual(item, actual[index]));
    }

    if (typeof expected === 'object') {
      const expectedKeys = Object.keys(expected);
      const actualKeys = Object.keys(actual);
      
      if (expectedKeys.length !== actualKeys.length) {
        return false;
      }
      
      return expectedKeys.every(key => 
        actualKeys.includes(key) && this.deepEqual(expected[key], actual[key])
      );
    }

    return false;
  }
}
