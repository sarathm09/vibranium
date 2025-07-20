/**
 * Tests for type definitions compilation and basic structure
 */

import type { Scenario } from '../scenario/scenario';
import type { Step, ApiStep, StepResult } from '../scenario/step';
import type { Environment } from '../environment/environment';
import type { VariableNamespace } from '../variable/namespace';
import type { HttpRequest, HttpResponse } from '../http/request';
import type { ValidationOperator, ValidationResult } from '../validation';

describe('Type Definitions Compilation', () => {
  describe('Scenario Types', () => {
    it('should compile scenario interface', () => {
      const scenario: Scenario = {
        name: 'Test Scenario',
        steps: []
      };

      expect(scenario.name).toBe('Test Scenario');
      expect(scenario.steps).toEqual([]);
    });

    it('should support complete scenario structure', () => {
      const scenario: Scenario = {
        name: 'Complete Scenario',
        description: 'A complete test scenario',
        version: '1.0.0',
        steps: [
          {
            name: 'Test Step',
            type: 'api',
            method: 'GET',
            url: 'https://api.example.com/test'
          } as ApiStep
        ],
        config: {
          timeout: 5000,
          retries: 3,
          variables: {
            baseUrl: 'https://api.example.com'
          }
        }
      };

      expect(scenario).toBeDefined();
      expect(scenario.config?.timeout).toBe(5000);
      expect(scenario.steps).toHaveLength(1);
    });
  });

  describe('Step Types', () => {
    it('should compile step interfaces', () => {
      const baseStep: Step = {
        name: 'Base Step',
        type: 'custom',
        timeout: 5000
      };

      const apiStep: ApiStep = {
        name: 'API Step',
        type: 'api',
        method: 'POST',
        url: 'https://api.example.com/data',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          data: 'test'
        }
      };

      expect(baseStep.name).toBe('Base Step');
      expect(baseStep.type).toBe('custom');
      expect(apiStep.method).toBe('POST');
      expect(apiStep.url).toBe('https://api.example.com/data');
    });

    it('should compile step result interface', () => {
      const stepResult: StepResult = {
        step: {
          name: 'Test Step',
          type: 'api',
          method: 'GET',
          url: 'https://api.example.com/test'
        } as ApiStep,
        status: 'passed',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:00:01Z'),
        duration: 1000,
        data: { success: true }
      };

      expect(stepResult.status).toBe('passed');
      expect(stepResult.duration).toBe(1000);
      expect(stepResult.step.name).toBe('Test Step');
    });
  });

  describe('HTTP Types', () => {
    it('should compile HTTP request interface', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        body: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        timeout: 5000
      };

      expect(request.url).toBe('https://api.example.com/users');
      expect(request.method).toBe('POST');
      expect(request.timeout).toBe(5000);
    });

    it('should compile HTTP response interface', () => {
      const response: HttpResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json'
        },
        body: {
          id: 123,
          name: 'John Doe'
        },
        duration: 850,
        size: 256
      };

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(123);
      expect(response.duration).toBe(850);
    });
  });

  describe('Environment Types', () => {
    it('should compile environment interface', () => {
      const environment: Environment = {
        name: 'test',
        variables: {
          baseUrl: 'https://api.test.com',
          timeout: 5000
        },
        secrets: {
          apiKey: 'secret-key'
        }
      };

      expect(environment.name).toBe('test');
      expect(environment.variables?.baseUrl).toBe('https://api.test.com');
      expect(environment.secrets?.apiKey).toBe('secret-key');
    });
  });

  describe('Variable Types', () => {
    it('should compile variable namespace interface', () => {
      const namespace: VariableNamespace = {
        env: {
          NODE_ENV: 'test',
          API_URL: 'https://api.example.com'
        },
        global: {
          timeout: 5000,
          retries: 3
        },
        context: {
          scenarioName: 'Test Scenario',
          stepName: 'Current Step'
        },
        variables: {
          userId: 123,
          userName: 'testuser'
        }
      };

      expect(namespace.env?.NODE_ENV).toBe('test');
      expect(namespace.global?.timeout).toBe(5000);
      expect(namespace.variables?.userId).toBe(123);
    });
  });

  describe('Validation Types', () => {
    it('should compile validation operator types', () => {
      const operators: ValidationOperator[] = [
        'equals',
        'contains',
        'greaterThan',
        'lessThan',
        'matches',
        'hasProperty',
        'isEmpty',
        'isDefined'
      ];

      expect(operators).toHaveLength(8);
      expect(operators.includes('equals')).toBe(true);
      expect(operators.includes('matches')).toBe(true);
    });

    it('should compile validation result interface', () => {
      const result: ValidationResult = {
        passed: true,
        message: 'Validation passed',
        operator: 'equals',
        expected: 200,
        actual: 200,
        path: '$.response.status'
      };

      expect(result.passed).toBe(true);
      expect(result.operator).toBe('equals');
      expect(result.expected).toBe(200);
    });
  });

  describe('Type Unions and Complex Types', () => {
    it('should handle union types correctly', () => {
      // Test that step can be any of the step types
      const steps: Step[] = [
        {
          name: 'API Step',
          type: 'api',
          method: 'GET',
          url: 'https://api.example.com'
        } as ApiStep,
        {
          name: 'Custom Step',
          type: 'custom',
          customProperty: 'value'
        } as Step & { customProperty: string }
      ];

      expect(steps).toHaveLength(2);
      expect(steps[0].type).toBe('api');
      expect(steps[1].type).toBe('custom');
    });

    it('should handle optional properties', () => {
      const minimalScenario: Scenario = {
        name: 'Minimal',
        steps: []
      };

      const fullScenario: Scenario = {
        name: 'Full Scenario',
        description: 'Complete scenario',
        version: '1.0.0',
        steps: [],
        config: {
          timeout: 10000,
          retries: 5,
          failFast: true
        },
        metadata: {
          author: 'Test Author',
          tags: ['api', 'regression']
        }
      };

      expect(minimalScenario.description).toBeUndefined();
      expect(fullScenario.description).toBe('Complete scenario');
      expect(fullScenario.config?.failFast).toBe(true);
    });
  });
});