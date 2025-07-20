/**
 * End-to-end integration tests
 */

import { ScenarioParser } from '../../parser/scenario-parser';
import { StepExecutor } from '../../execution/step-executor';
import { VariableResolver } from '../../variable/resolver';
import { ValidationEngine } from '../../validation/validator';
import { HttpClientFactory } from '@vibraniumjs/http-client';
import { PluginRegistry } from '@vibraniumjs/plugins';
import { CoreApiPlugin } from '@vibraniumjs/plugins';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import type { Scenario } from '../../types';

// Mock API server for testing
const server = setupServer(
  rest.get('https://api.test.com/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id: parseInt(id as string),
        name: 'Test User',
        email: 'test@example.com',
        created: '2024-01-01T10:00:00Z'
      })
    );
  }),

  rest.post('https://api.test.com/users', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 123,
        name: 'Created User',
        email: 'created@example.com',
        created: new Date().toISOString()
      })
    );
  }),

  rest.put('https://api.test.com/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id: parseInt(id as string),
        name: 'Updated User',
        email: 'updated@example.com',
        updated: new Date().toISOString()
      })
    );
  }),

  rest.delete('https://api.test.com/users/:id', (req, res, ctx) => {
    return res(
      ctx.status(204)
    );
  }),

  rest.get('https://api.test.com/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      })
    );
  }),

  rest.get('https://api.test.com/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: 'Internal Server Error',
        message: 'Something went wrong'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('End-to-End Integration Tests', () => {
  let parser: ScenarioParser;
  let executor: StepExecutor;
  let resolver: VariableResolver;
  let validator: ValidationEngine;
  let pluginRegistry: PluginRegistry;
  let apiPlugin: CoreApiPlugin;

  beforeEach(async () => {
    // Initialize components
    parser = new ScenarioParser();
    resolver = new VariableResolver();
    validator = new ValidationEngine();
    pluginRegistry = new PluginRegistry();
    apiPlugin = new CoreApiPlugin();
    
    // Register core API plugin
    await pluginRegistry.register(apiPlugin);
    
    // Initialize step executor with plugin registry
    executor = new StepExecutor({
      pluginRegistry,
      variableResolver: resolver,
      validator
    });

    // Setup HTTP client
    HttpClientFactory.setDefaultConfig({
      timeout: 5000,
      validateStatus: (status) => status >= 200 && status < 600 // Accept all responses for testing
    });
  });

  afterEach(async () => {
    await pluginRegistry.shutdown();
  });

  describe('Single Step Execution', () => {
    it('should execute simple GET request', async () => {
      const scenario: Scenario = {
        name: 'Simple GET Test',
        environment: 'test',
        variables: {
          baseUrl: 'https://api.test.com',
          userId: 123
        },
        steps: [
          {
            name: 'Get User',
            type: 'api',
            url: '$.variables.baseUrl/users/$.variables.userId',
            method: 'GET',
            validate: [
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
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].success).toBe(true);
      expect(result.steps[0].response?.status).toBe(200);
      expect(result.steps[0].response?.body.id).toBe(123);
    });

    it('should execute POST request with body', async () => {
      const scenario: Scenario = {
        name: 'Create User Test',
        steps: [
          {
            name: 'Create User',
            type: 'post',
            url: 'https://api.test.com/users',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              name: 'New User',
              email: 'new@example.com'
            },
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 201
              },
              {
                field: '$.response.body.id',
                operator: 'exists'
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true);
      expect(result.steps[0].success).toBe(true);
      expect(result.steps[0].response?.status).toBe(201);
      expect(result.steps[0].response?.body.id).toBe(123);
    });
  });

  describe('Multi-Step Workflows', () => {
    it('should execute CRUD workflow with variable chaining', async () => {
      const scenario: Scenario = {
        name: 'User CRUD Workflow',
        environment: 'test',
        variables: {
          baseUrl: 'https://api.test.com'
        },
        steps: [
          {
            name: 'Create User',
            type: 'post',
            url: '$.variables.baseUrl/users',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              name: 'Test User',
              email: 'test@example.com'
            },
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 201
              }
            ]
          },
          {
            name: 'Get Created User',
            type: 'get',
            url: '$.variables.baseUrl/users/$.response.body.id',
            method: 'GET',
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 200
              },
              {
                field: '$.response.body.id',
                operator: 'equals',
                expected: '$.steps["Create User"].response.body.id'
              }
            ]
          },
          {
            name: 'Update User',
            type: 'put',
            url: '$.variables.baseUrl/users/$.steps["Create User"].response.body.id',
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              name: 'Updated User',
              email: 'updated@example.com'
            },
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 200
              }
            ]
          },
          {
            name: 'Delete User',
            type: 'delete',
            url: '$.variables.baseUrl/users/$.steps["Create User"].response.body.id',
            method: 'DELETE',
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 204
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(4);
      
      // Verify each step succeeded
      result.steps.forEach((step, index) => {
        expect(step.success).toBe(true);
        expect(step.stepName).toBe(scenario.steps[index].name);
      });

      // Verify step responses
      expect(result.steps[0].response?.status).toBe(201); // Create
      expect(result.steps[1].response?.status).toBe(200); // Get
      expect(result.steps[2].response?.status).toBe(200); // Update
      expect(result.steps[3].response?.status).toBe(204); // Delete
    });

    it('should handle conditional step execution', async () => {
      const scenario: Scenario = {
        name: 'Conditional Workflow',
        steps: [
          {
            name: 'Health Check',
            type: 'get',
            url: 'https://api.test.com/health',
            method: 'GET',
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 200
              }
            ]
          },
          {
            name: 'Create User If Healthy',
            type: 'post',
            url: 'https://api.test.com/users',
            method: 'POST',
            condition: '$.steps["Health Check"].success === true',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              name: 'Conditional User',
              email: 'conditional@example.com'
            },
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 201
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].success).toBe(true);
      expect(result.steps[1].success).toBe(true);
    });
  });

  describe('Variable Resolution in Real Scenarios', () => {
    it('should resolve random variables', async () => {
      const scenario: Scenario = {
        name: 'Random Variables Test',
        steps: [
          {
            name: 'Create Random User',
            type: 'post',
            url: 'https://api.test.com/users',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': '$.random.uuid'
            },
            body: {
              name: '$.random.name',
              email: '$.random.email',
              timestamp: '$.random.timestamp'
            },
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 201
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true);
      expect(result.steps[0].request?.headers?.['X-Request-ID']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should resolve environment variables', async () => {
      // Set environment variables
      process.env.TEST_API_URL = 'https://api.test.com';
      process.env.TEST_TIMEOUT = '10000';

      const scenario: Scenario = {
        name: 'Environment Variables Test',
        steps: [
          {
            name: 'Get with Env Vars',
            type: 'get',
            url: '$.env.TEST_API_URL/health',
            method: 'GET',
            timeout: '$.env.TEST_TIMEOUT',
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 200
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true);
      expect(result.steps[0].request?.url).toBe('https://api.test.com/health');

      // Clean up
      delete process.env.TEST_API_URL;
      delete process.env.TEST_TIMEOUT;
    });
  });

  describe('Validation Engine Integration', () => {
    it('should perform complex validations', async () => {
      const scenario: Scenario = {
        name: 'Complex Validation Test',
        steps: [
          {
            name: 'Get User',
            type: 'get',
            url: 'https://api.test.com/users/123',
            method: 'GET',
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 200
              },
              {
                field: '$.response.body.email',
                operator: 'matches',
                expected: '^[^@]+@[^@]+\\.[^@]+$'
              },
              {
                field: '$.response.body.created',
                operator: 'exists'
              },
              {
                field: '$.response.headers.content-type',
                operator: 'contains',
                expected: 'application/json'
              },
              {
                field: '$.response.body.name',
                operator: 'length',
                expected: { min: 1, max: 100 }
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true);
      expect(result.steps[0].validationResults).toHaveLength(5);
      result.steps[0].validationResults?.forEach(validation => {
        expect(validation.success).toBe(true);
      });
    });

    it('should handle validation failures', async () => {
      const scenario: Scenario = {
        name: 'Validation Failure Test',
        steps: [
          {
            name: 'Get User with Wrong Expectation',
            type: 'get',
            url: 'https://api.test.com/users/123',
            method: 'GET',
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 404 // Wrong expectation - should be 200
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(false);
      expect(result.steps[0].success).toBe(false);
      expect(result.steps[0].validationResults?.[0].success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', async () => {
      const scenario: Scenario = {
        name: 'Error Handling Test',
        steps: [
          {
            name: 'Trigger Server Error',
            type: 'get',
            url: 'https://api.test.com/error',
            method: 'GET',
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 500
              },
              {
                field: '$.response.body.error',
                operator: 'equals',
                expected: 'Internal Server Error'
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true); // Should succeed because we expect the 500 error
      expect(result.steps[0].response?.status).toBe(500);
    });

    it('should handle network timeout', async () => {
      // Mock a slow endpoint
      server.use(
        rest.get('https://api.test.com/slow', (req, res, ctx) => {
          return res(
            ctx.delay(6000), // 6 second delay
            ctx.status(200),
            ctx.json({ message: 'slow response' })
          );
        })
      );

      const scenario: Scenario = {
        name: 'Timeout Test',
        steps: [
          {
            name: 'Slow Request',
            type: 'get',
            url: 'https://api.test.com/slow',
            method: 'GET',
            timeout: 1000 // 1 second timeout
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(false);
      expect(result.steps[0].success).toBe(false);
      expect(result.steps[0].error).toContain('timeout');
    });
  });

  describe('Performance Testing', () => {
    it('should execute scenarios efficiently', async () => {
      const scenario: Scenario = {
        name: 'Performance Test',
        steps: Array.from({ length: 50 }, (_, i) => ({
          name: `Request ${i + 1}`,
          type: 'get',
          url: `https://api.test.com/users/${i + 1}`,
          method: 'GET',
          validate: [
            {
              field: '$.response.status',
              operator: 'equals',
              expected: 200
            }
          ]
        }))
      };

      const startTime = Date.now();
      const result = await executor.executeScenario(scenario);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(50);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle authentication workflow', async () => {
      // Mock authentication endpoints
      server.use(
        rest.post('https://api.test.com/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              token: 'jwt-token-12345',
              expires: '2024-12-31T23:59:59Z'
            })
          );
        }),

        rest.get('https://api.test.com/auth/profile', (req, res, ctx) => {
          const auth = req.headers.get('authorization');
          if (!auth || !auth.includes('jwt-token-12345')) {
            return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
          }
          return res(
            ctx.status(200),
            ctx.json({
              id: 1,
              username: 'testuser',
              role: 'admin'
            })
          );
        })
      );

      const scenario: Scenario = {
        name: 'Authentication Workflow',
        steps: [
          {
            name: 'Login',
            type: 'post',
            url: 'https://api.test.com/auth/login',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              username: 'testuser',
              password: 'password123'
            },
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 200
              },
              {
                field: '$.response.body.token',
                operator: 'exists'
              }
            ]
          },
          {
            name: 'Get Profile',
            type: 'get',
            url: 'https://api.test.com/auth/profile',
            method: 'GET',
            headers: {
              'Authorization': 'Bearer $.steps["Login"].response.body.token'
            },
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 200
              },
              {
                field: '$.response.body.username',
                operator: 'equals',
                expected: 'testuser'
              }
            ]
          }
        ]
      };

      const result = await executor.executeScenario(scenario);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].response?.body.token).toBe('jwt-token-12345');
      expect(result.steps[1].response?.body.username).toBe('testuser');
    });
  });
});
