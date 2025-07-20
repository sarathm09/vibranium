/**
 * Tests for validation engine
 */

import { ValidationEngine } from '../../validation/validator';
import { AssertionEngine } from '../../validation/assertion-engine';
import { ResultFormatter } from '../../validation/result-formatter';
import type { ValidationRule, ValidationResult } from '@vibraniumjs/types';
import type { HttpResponse } from '@vibraniumjs/types';

describe('ValidationEngine', () => {
  let validationEngine: ValidationEngine;
  let assertionEngine: AssertionEngine;
  let resultFormatter: ResultFormatter;

  beforeEach(() => {
    assertionEngine = new AssertionEngine();
    resultFormatter = new ResultFormatter();
    validationEngine = new ValidationEngine({
      assertionEngine,
      resultFormatter
    });
  });

  describe('Basic Validation Operations', () => {
    it('should validate equals operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: { id: 123, name: 'Test User' }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 200
        },
        {
          field: '$.response.body.id',
          operator: 'equals',
          expected: 123
        },
        {
          field: '$.response.body.name',
          operator: 'equals',
          expected: 'Test User'
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      result.results.forEach(validation => {
        expect(validation.success).toBe(true);
      });
    });

    it('should validate contains operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: {
          message: 'Operation completed successfully',
          description: 'The user has been created'
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.message',
          operator: 'contains',
          expected: 'successfully'
        },
        {
          field: '$.response.body.description',
          operator: 'contains',
          expected: 'user'
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    it('should validate greater_than operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          count: 42,
          score: 95.5,
          items: [1, 2, 3, 4, 5]
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.count',
          operator: 'greater_than',
          expected: 40
        },
        {
          field: '$.response.body.score',
          operator: 'greater_than',
          expected: 90
        },
        {
          field: '$.response.body.items.length',
          operator: 'greater_than',
          expected: 3
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should validate less_than operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          age: 25,
          timeout: 4500,
          errorCount: 2
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.age',
          operator: 'less_than',
          expected: 30
        },
        {
          field: '$.response.body.timeout',
          operator: 'less_than',
          expected: 5000
        },
        {
          field: '$.response.body.errorCount',
          operator: 'less_than',
          expected: 5
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should validate length operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          users: [1, 2, 3, 4, 5],
          name: 'John',
          description: 'A test description',
          tags: ['api', 'test']
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.users',
          operator: 'length',
          expected: 5
        },
        {
          field: '$.response.body.name',
          operator: 'length',
          expected: 4
        },
        {
          field: '$.response.body.tags',
          operator: 'length',
          expected: 2
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should validate matches (regex) operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          email: 'test@example.com',
          phone: '+1-555-123-4567',
          uuid: '550e8400-e29b-41d4-a716-446655440000',
          url: 'https://api.example.com/users/123'
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.email',
          operator: 'matches',
          expected: '^[^@]+@[^@]+\\.[^@]+$'
        },
        {
          field: '$.response.body.phone',
          operator: 'matches',
          expected: '^\\+\\d{1}-\\d{3}-\\d{3}-\\d{4}$'
        },
        {
          field: '$.response.body.uuid',
          operator: 'matches',
          expected: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        },
        {
          field: '$.response.body.url',
          operator: 'matches',
          expected: '^https?://'
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4);
    });

    it('should validate exists operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: { 'x-request-id': 'req-123' },
        body: {
          id: 123,
          name: 'Test User',
          profile: {
            avatar: 'avatar.jpg'
          }
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.id',
          operator: 'exists'
        },
        {
          field: '$.response.body.name',
          operator: 'exists'
        },
        {
          field: '$.response.body.profile.avatar',
          operator: 'exists'
        },
        {
          field: '$.response.headers.x-request-id',
          operator: 'exists'
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4);
    });

    it('should validate not_exists operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          id: 123,
          name: 'Test User'
          // deprecated field should not exist
          // sensitive field should not exist
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.deprecated',
          operator: 'not_exists'
        },
        {
          field: '$.response.body.password',
          operator: 'not_exists'
        },
        {
          field: '$.response.body.sensitive',
          operator: 'not_exists'
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle mixed validation results', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          id: 123,
          name: 'Test User',
          age: 25,
          wrongField: 'unexpected-value'
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 200 // Should pass
        },
        {
          field: '$.response.body.id',
          operator: 'equals',
          expected: 456 // Should fail
        },
        {
          field: '$.response.body.name',
          operator: 'contains',
          expected: 'Test' // Should pass
        },
        {
          field: '$.response.body.wrongField',
          operator: 'equals',
          expected: 'expected-value' // Should fail
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(4);
      expect(result.results[0].success).toBe(true);  // status check
      expect(result.results[1].success).toBe(false); // id check
      expect(result.results[2].success).toBe(true);  // name check
      expect(result.results[3].success).toBe(false); // wrongField check
    });

    it('should validate array contents', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          users: [
            { id: 1, name: 'Alice', active: true },
            { id: 2, name: 'Bob', active: false },
            { id: 3, name: 'Charlie', active: true }
          ],
          tags: ['api', 'test', 'integration'],
          scores: [95, 87, 92, 88, 91]
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.users',
          operator: 'length',
          expected: 3
        },
        {
          field: '$.response.body.users[0].id',
          operator: 'equals',
          expected: 1
        },
        {
          field: '$.response.body.users[1].name',
          operator: 'equals',
          expected: 'Bob'
        },
        {
          field: '$.response.body.tags[0]',
          operator: 'equals',
          expected: 'api'
        },
        {
          field: '$.response.body.scores[0]',
          operator: 'greater_than',
          expected: 90
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(5);
    });

    it('should validate nested object structures', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          user: {
            id: 123,
            profile: {
              personal: {
                name: 'John Doe',
                email: 'john@example.com'
              },
              settings: {
                theme: 'dark',
                notifications: {
                  email: true,
                  push: false
                }
              }
            }
          }
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.user.id',
          operator: 'equals',
          expected: 123
        },
        {
          field: '$.response.body.user.profile.personal.name',
          operator: 'equals',
          expected: 'John Doe'
        },
        {
          field: '$.response.body.user.profile.personal.email',
          operator: 'matches',
          expected: '^[^@]+@[^@]+\\.[^@]+$'
        },
        {
          field: '$.response.body.user.profile.settings.theme',
          operator: 'equals',
          expected: 'dark'
        },
        {
          field: '$.response.body.user.profile.settings.notifications.email',
          operator: 'equals',
          expected: true
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid field paths', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: { id: 123 }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.nonexistent.field',
          operator: 'equals',
          expected: 'value'
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('Field not found');
    });

    it('should handle malformed regex patterns', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: { text: 'test string' }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.text',
          operator: 'matches',
          expected: '[invalid regex pattern' // Malformed regex
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('Invalid regex');
    });

    it('should handle type mismatches gracefully', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          stringValue: 'test',
          numberValue: 42,
          booleanValue: true
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.stringValue',
          operator: 'greater_than',
          expected: 10 // Trying to compare string with number
        },
        {
          field: '$.response.body.numberValue',
          operator: 'contains',
          expected: '4' // Trying to check contains on number
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      result.results.forEach(validation => {
        expect(validation.success).toBe(false);
        expect(validation.error).toContain('Type mismatch');
      });
    });
  });

  describe('Performance', () => {
    it('should handle large validation sets efficiently', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            value: i * 2
          }))
        }
      };

      const rules: ValidationRule[] = Array.from({ length: 100 }, (_, i) => ({
        field: `$.response.body.items[${i}].id`,
        operator: 'equals',
        expected: i
      }));

      const startTime = Date.now();
      const result = await validationEngine.validate(response, rules);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Custom Validation Messages', () => {
    it('should provide detailed validation results', async () => {
      const response: HttpResponse = {
        status: 404,
        headers: {},
        body: { error: 'Not Found' }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 200,
          message: 'API should return success status'
        },
        {
          field: '$.response.body.data',
          operator: 'exists',
          message: 'Response should contain data field'
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].message).toBe('API should return success status');
      expect(result.results[1].message).toBe('Response should contain data field');
    });
  });

  describe('Special Operators', () => {
    it('should validate in operator (value in array)', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          status: 'active',
          role: 'admin',
          priority: 'high'
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.status',
          operator: 'in',
          expected: ['active', 'inactive', 'pending']
        },
        {
          field: '$.response.body.role',
          operator: 'in',
          expected: ['admin', 'user', 'guest']
        },
        {
          field: '$.response.body.priority',
          operator: 'in',
          expected: ['low', 'medium', 'high']
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should validate range operator', async () => {
      const response: HttpResponse = {
        status: 200,
        headers: {},
        body: {
          age: 25,
          score: 85.5,
          count: 10
        }
      };

      const rules: ValidationRule[] = [
        {
          field: '$.response.body.age',
          operator: 'range',
          expected: { min: 18, max: 65 }
        },
        {
          field: '$.response.body.score',
          operator: 'range',
          expected: { min: 0, max: 100 }
        },
        {
          field: '$.response.body.count',
          operator: 'range',
          expected: { min: 1, max: 50 }
        }
      ];

      const result = await validationEngine.validate(response, rules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });
  });
});
