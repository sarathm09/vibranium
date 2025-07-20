/**
 * Tests for variable resolution system
 */

import { VariableResolver } from '../variable/resolver';
import { NamespaceManager } from '../variable/namespace-manager';
import { VariableCache } from '../variable/cache';
import { Interpolator } from '../variable/interpolator';
import type { VariableNamespace } from '@vibraniumjs/types';

describe('VariableResolver', () => {
  let resolver: VariableResolver;
  let namespaceManager: NamespaceManager;
  let cache: VariableCache;
  let interpolator: Interpolator;

  beforeEach(() => {
    namespaceManager = new NamespaceManager();
    cache = new VariableCache();
    interpolator = new Interpolator();
    resolver = new VariableResolver({
      namespaceManager,
      cache,
      interpolator
    });
  });

  describe('Basic Variable Resolution', () => {
    it('should resolve simple variable references', async () => {
      const namespace: VariableNamespace = {
        env: {
          API_URL: 'https://api.example.com',
          NODE_ENV: 'test'
        },
        global: {
          timeout: 5000,
          retries: 3
        },
        variables: {
          userId: 123,
          userName: 'testuser'
        }
      };

      resolver.setNamespace(namespace);

      expect(await resolver.resolve('$.env.API_URL')).toBe('https://api.example.com');
      expect(await resolver.resolve('$.global.timeout')).toBe(5000);
      expect(await resolver.resolve('$.variables.userId')).toBe(123);
      expect(await resolver.resolve('$.variables.userName')).toBe('testuser');
    });

    it('should resolve nested object properties', async () => {
      const namespace: VariableNamespace = {
        response: {
          body: {
            user: {
              id: 456,
              profile: {
                name: 'John Doe',
                email: 'john@example.com'
              }
            },
            metadata: {
              total: 1,
              page: 1
            }
          },
          headers: {
            'content-type': 'application/json',
            'x-rate-limit': '1000'
          }
        }
      };

      resolver.setNamespace(namespace);

      expect(await resolver.resolve('$.response.body.user.id')).toBe(456);
      expect(await resolver.resolve('$.response.body.user.profile.name')).toBe('John Doe');
      expect(await resolver.resolve('$.response.headers.content-type')).toBe('application/json');
      expect(await resolver.resolve('$.response.body.metadata.total')).toBe(1);
    });

    it('should resolve array elements', async () => {
      const namespace: VariableNamespace = {
        response: {
          body: {
            users: [
              { id: 1, name: 'Alice' },
              { id: 2, name: 'Bob' },
              { id: 3, name: 'Charlie' }
            ],
            tags: ['api', 'test', 'integration']
          }
        }
      };

      resolver.setNamespace(namespace);

      expect(await resolver.resolve('$.response.body.users[0].id')).toBe(1);
      expect(await resolver.resolve('$.response.body.users[1].name')).toBe('Bob');
      expect(await resolver.resolve('$.response.body.tags[0]')).toBe('api');
      expect(await resolver.resolve('$.response.body.tags[2]')).toBe('integration');
    });
  });

  describe('String Interpolation', () => {
    it('should interpolate variables in strings', async () => {
      const namespace: VariableNamespace = {
        env: {
          BASE_URL: 'https://api.example.com',
          API_VERSION: 'v1'
        },
        variables: {
          userId: 123,
          endpoint: 'users'
        }
      };

      resolver.setNamespace(namespace);

      const template = '$.env.BASE_URL/$.env.API_VERSION/$.variables.endpoint/$.variables.userId';
      const result = await resolver.resolve(template);

      expect(result).toBe('https://api.example.com/v1/users/123');
    });

    it('should handle multiple variables in single string', async () => {
      const namespace: VariableNamespace = {
        variables: {
          firstName: 'John',
          lastName: 'Doe',
          age: 30
        }
      };

      resolver.setNamespace(namespace);

      const template = 'Hello $.variables.firstName $.variables.lastName, you are $.variables.age years old';
      const result = await resolver.resolve(template);

      expect(result).toBe('Hello John Doe, you are 30 years old');
    });

    it('should handle escaped variable references', async () => {
      const namespace: VariableNamespace = {
        variables: {
          value: 'test'
        }
      };

      resolver.setNamespace(namespace);

      const template = 'This is a literal \$.variables.value and this is resolved $.variables.value';
      const result = await resolver.resolve(template);

      expect(result).toBe('This is a literal $.variables.value and this is resolved test');
    });
  });

  describe('Random Value Generation', () => {
    it('should generate random values', async () => {
      const uuid = await resolver.resolve('$.random.uuid');
      const email = await resolver.resolve('$.random.email');
      const name = await resolver.resolve('$.random.name');
      const phone = await resolver.resolve('$.random.phone');
      const timestamp = await resolver.resolve('$.random.timestamp');

      expect(typeof uuid).toBe('string');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      expect(typeof email).toBe('string');
      expect(email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
      
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
      
      expect(typeof phone).toBe('string');
      expect(phone).toMatch(/^[+]?[0-9\s\-\(\)]+$/);
      
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should generate random values with parameters', async () => {
      const randomString = await resolver.resolve('$.random.string(10)');
      const randomNumber = await resolver.resolve('$.random.number(1,100)');
      const randomBoolean = await resolver.resolve('$.random.boolean');

      expect(typeof randomString).toBe('string');
      expect(randomString).toHaveLength(10);
      
      expect(typeof randomNumber).toBe('number');
      expect(randomNumber).toBeGreaterThanOrEqual(1);
      expect(randomNumber).toBeLessThanOrEqual(100);
      
      expect(typeof randomBoolean).toBe('boolean');
    });
  });

  describe('Context Variables', () => {
    it('should resolve context variables', async () => {
      const namespace: VariableNamespace = {
        context: {
          scenarioName: 'User API Tests',
          stepName: 'Create User',
          stepIndex: 0,
          totalSteps: 5,
          runId: 'run-123',
          startTime: '2024-01-01T10:00:00Z'
        }
      };

      resolver.setNamespace(namespace);

      expect(await resolver.resolve('$.context.scenarioName')).toBe('User API Tests');
      expect(await resolver.resolve('$.context.stepName')).toBe('Create User');
      expect(await resolver.resolve('$.context.stepIndex')).toBe(0);
      expect(await resolver.resolve('$.context.totalSteps')).toBe(5);
      expect(await resolver.resolve('$.context.runId')).toBe('run-123');
    });

    it('should update context during execution', async () => {
      resolver.updateContext({
        stepName: 'Get User',
        stepIndex: 1
      });

      expect(await resolver.resolve('$.context.stepName')).toBe('Get User');
      expect(await resolver.resolve('$.context.stepIndex')).toBe(1);
    });
  });

  describe('API Response Variables', () => {
    it('should resolve API response variables', async () => {
      const namespace: VariableNamespace = {
        api: {
          lastResponseTime: 1250,
          statusCode: 200,
          contentType: 'application/json',
          responseSize: 256
        },
        response: {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'req-123'
          },
          body: {
            id: 789,
            name: 'Created User',
            email: 'user@example.com'
          }
        },
        request: {
          url: 'https://api.example.com/users',
          method: 'POST',
          headers: {
            'authorization': 'Bearer token123'
          }
        }
      };

      resolver.setNamespace(namespace);

      expect(await resolver.resolve('$.api.lastResponseTime')).toBe(1250);
      expect(await resolver.resolve('$.api.statusCode')).toBe(200);
      expect(await resolver.resolve('$.response.body.id')).toBe(789);
      expect(await resolver.resolve('$.request.method')).toBe('POST');
    });
  });

  describe('Variable Caching', () => {
    it('should cache resolved variables', async () => {
      const namespace: VariableNamespace = {
        variables: {
          expensiveComputation: 'computed-value'
        }
      };

      resolver.setNamespace(namespace);
      
      // First resolution
      const result1 = await resolver.resolve('$.variables.expensiveComputation');
      // Second resolution should use cache
      const result2 = await resolver.resolve('$.variables.expensiveComputation');

      expect(result1).toBe('computed-value');
      expect(result2).toBe('computed-value');
      expect(result1).toBe(result2);
    });

    it('should invalidate cache when namespace changes', async () => {
      resolver.setNamespace({
        variables: { value: 'first' }
      });

      const result1 = await resolver.resolve('$.variables.value');
      expect(result1).toBe('first');

      // Update namespace
      resolver.setNamespace({
        variables: { value: 'second' }
      });

      const result2 = await resolver.resolve('$.variables.value');
      expect(result2).toBe('second');
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined variable references', async () => {
      const namespace: VariableNamespace = {
        variables: {
          existingVar: 'value'
        }
      };

      resolver.setNamespace(namespace);

      await expect(resolver.resolve('$.variables.nonexistent'))
        .rejects.toThrow('Variable not found: $.variables.nonexistent');
    });

    it('should handle invalid variable paths', async () => {
      const namespace: VariableNamespace = {
        variables: {
          stringValue: 'test'
        }
      };

      resolver.setNamespace(namespace);

      await expect(resolver.resolve('$.variables.stringValue.nonexistent'))
        .rejects.toThrow('Invalid variable path');
    });

    it('should handle malformed variable syntax', async () => {
      await expect(resolver.resolve('$invalid.syntax'))
        .rejects.toThrow('Invalid variable syntax');
        
      await expect(resolver.resolve('$..'))
        .rejects.toThrow('Invalid variable syntax');
        
      await expect(resolver.resolve('$.'))
        .rejects.toThrow('Invalid variable syntax');
    });

    it('should handle circular references', async () => {
      const namespace: VariableNamespace = {
        variables: {
          var1: '$.variables.var2',
          var2: '$.variables.var1'
        }
      };

      resolver.setNamespace(namespace);

      await expect(resolver.resolve('$.variables.var1'))
        .rejects.toThrow('Circular reference detected');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed variable types in complex expressions', async () => {
      const namespace: VariableNamespace = {
        env: {
          BASE_URL: 'https://api.example.com'
        },
        variables: {
          version: 'v2',
          userId: 456
        },
        response: {
          body: {
            user: {
              permissions: ['read', 'write']
            }
          }
        }
      };

      resolver.setNamespace(namespace);

      const complexUrl = '$.env.BASE_URL/$.variables.version/users/$.variables.userId/permissions/$.response.body.user.permissions[0]';
      const result = await resolver.resolve(complexUrl);

      expect(result).toBe('https://api.example.com/v2/users/456/permissions/read');
    });

    it('should handle conditional variable resolution', async () => {
      const namespace: VariableNamespace = {
        env: {
          NODE_ENV: 'test'
        },
        variables: {
          apiUrl: {
            test: 'https://test.api.com',
            prod: 'https://api.com'
          }
        }
      };

      resolver.setNamespace(namespace);

      const conditionalUrl = await resolver.resolve('$.variables.apiUrl["$.env.NODE_ENV"]');
      expect(conditionalUrl).toBe('https://test.api.com');
    });

    it('should handle variable resolution in nested objects', async () => {
      const namespace: VariableNamespace = {
        variables: {
          userId: 123,
          action: 'update'
        }
      };

      resolver.setNamespace(namespace);

      const nestedObject = {
        url: '$.env.BASE_URL/users/$.variables.userId',
        method: 'PUT',
        body: {
          action: '$.variables.action',
          timestamp: '$.random.timestamp',
          metadata: {
            userId: '$.variables.userId',
            requestId: '$.random.uuid'
          }
        }
      };

      const resolved = await resolver.resolveObject(nestedObject);

      expect(resolved.body.action).toBe('update');
      expect(resolved.body.metadata.userId).toBe(123);
      expect(typeof resolved.body.timestamp).toBe('number');
      expect(typeof resolved.body.metadata.requestId).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should resolve variables efficiently for large datasets', async () => {
      const largeNamespace: VariableNamespace = {
        variables: Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`var${i}`, `value${i}`])
        )
      };

      resolver.setNamespace(largeNamespace);

      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, (_, i) => 
        resolver.resolve(`$.variables.var${i * 10}`)
      );
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(results[0]).toBe('value0');
      expect(results[9]).toBe('value90');
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
