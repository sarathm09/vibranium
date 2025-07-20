/**
 * Test utilities and helpers
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';
import type { RestRequest, ResponseResolver, RestContext, MockedRequest } from 'msw';
import type { Scenario, StepResult, ScenarioResult } from '../../types';
import type { HttpResponse } from '@vibraniumjs/types';

/**
 * Mock API server for testing
 */
export function createMockServer() {
  return setupServer(
    // User endpoints
    rest.get('https://api.example.com/users/:id', (req: RestRequest, res: any, ctx: RestContext) => {
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

    rest.post('https://api.example.com/users', (req: RestRequest, res: any, ctx: RestContext) => {
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

    rest.put('https://api.example.com/users/:id', (req: RestRequest, res: any, ctx: RestContext) => {
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

    rest.delete('https://api.example.com/users/:id', (req: RestRequest, res: any, ctx: RestContext) => {
      return res(ctx.status(204));
    }),

    // Authentication endpoints
    rest.post('https://api.example.com/auth/login', (req: RestRequest, res: any, ctx: RestContext) => {
      return res(
        ctx.status(200),
        ctx.json({
          token: 'jwt-token-12345',
          expires: '2024-12-31T23:59:59Z'
        })
      );
    }),

    rest.get('https://api.example.com/auth/profile', (req: RestRequest, res: any, ctx: RestContext) => {
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
    }),

    // Health check
    rest.get('https://api.example.com/health', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          status: 'healthy',
          timestamp: new Date().toISOString()
        })
      );
    }),

    // Error endpoints
    rest.get('https://api.example.com/error', (req, res, ctx) => {
      return res(
        ctx.status(500),
        ctx.json({
          error: 'Internal Server Error',
          message: 'Something went wrong'
        })
      );
    }),

    rest.get('https://api.example.com/nonexistent', (req, res, ctx) => {
      return res(
        ctx.status(404),
        ctx.json({
          error: 'Not Found',
          message: 'Resource not found'
        })
      );
    }),

    // Test validation endpoint
    rest.get('https://api.example.com/test', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          message: 'success message',
          count: 42,
          items: [1, 2, 3, 4, 5],
          email: 'test@example.com',
          id: 'test-id-123'
        })
      );
    })
  );
}

/**
 * Create mock HTTP response
 */
export function createMockResponse(data: Partial<HttpResponse>): HttpResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json'
    },
    body: {},
    ...data
  };
}

/**
 * Create mock step result
 */
export function createMockStepResult(data: Partial<StepResult>): StepResult {
  return {
    stepName: 'Test Step',
    success: true,
    duration: 1000,
    timestamp: new Date(),
    ...data
  };
}

/**
 * Create mock scenario result
 */
export function createMockScenarioResult(data: Partial<ScenarioResult>): ScenarioResult {
  return {
    scenarioName: 'Test Scenario',
    success: true,
    duration: 5000,
    timestamp: new Date(),
    steps: [],
    summary: {
      totalSteps: 0,
      passedSteps: 0,
      failedSteps: 0,
      skippedSteps: 0
    },
    ...data
  };
}

/**
 * Wait for specified duration
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test data
 */
export const testData = {
  users: [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 28,
      active: true
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      age: 34,
      active: false
    },
    {
      id: 3,
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      age: 22,
      active: true
    }
  ],
  
  posts: [
    {
      id: 1,
      title: 'First Post',
      content: 'This is the first post content.',
      userId: 1,
      published: true
    },
    {
      id: 2,
      title: 'Second Post',
      content: 'This is the second post content.',
      userId: 2,
      published: false
    }
  ],
  
  comments: [
    {
      id: 1,
      postId: 1,
      userId: 2,
      content: 'Great post!',
      created: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      postId: 1,
      userId: 3,
      content: 'Thanks for sharing!',
      created: '2024-01-01T11:00:00Z'
    }
  ]
};

/**
 * Assertion helpers
 */
export const assertions = {
  /**
   * Assert that a value is defined
   */
  isDefined<T>(value: T | undefined | null): asserts value is T {
    expect(value).toBeDefined();
    expect(value).not.toBeNull();
  },

  /**
   * Assert that a step result is successful
   */
  isSuccessfulStep(stepResult: StepResult): void {
    expect(stepResult.success).toBe(true);
    expect(stepResult.error).toBeUndefined();
    expect(stepResult.duration).toBeGreaterThan(0);
    expect(stepResult.timestamp).toBeInstanceOf(Date);
  },

  /**
   * Assert that a step result is failed
   */
  isFailedStep(stepResult: StepResult): void {
    expect(stepResult.success).toBe(false);
    expect(stepResult.error).toBeDefined();
  },

  /**
   * Assert that a scenario result is successful
   */
  isSuccessfulScenario(scenarioResult: ScenarioResult): void {
    expect(scenarioResult.success).toBe(true);
    expect(scenarioResult.steps.length).toBeGreaterThan(0);
    expect(scenarioResult.summary.totalSteps).toBe(scenarioResult.steps.length);
    expect(scenarioResult.summary.failedSteps).toBe(0);
  },

  /**
   * Assert that an HTTP response has expected structure
   */
  isValidHttpResponse(response: HttpResponse): void {
    expect(response.status).toBeGreaterThanOrEqual(100);
    expect(response.status).toBeLessThan(600);
    expect(response.headers).toBeDefined();
    expect(typeof response.headers).toBe('object');
  },

  /**
   * Assert that a validation result is successful
   */
  isSuccessfulValidation(validation: any): void {
    expect(validation.success).toBe(true);
    expect(validation.field).toBeDefined();
    expect(validation.operator).toBeDefined();
    expect(validation.expected).toBeDefined();
    expect(validation.actual).toBeDefined();
  }
};

/**
 * Performance measurement helpers
 */
export const performance = {
  /**
   * Measure execution time of a function
   */
  async measure<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  },

  /**
   * Assert that operation completes within time limit
   */
  async withinTimeLimit<T>(fn: () => Promise<T>, timeLimit: number): Promise<T> {
    const { result, duration } = await this.measure(fn);
    expect(duration).toBeLessThan(timeLimit);
    return result;
  }
};

/**
 * Environment setup helpers
 */
export const environment = {
  /**
   * Set test environment variables
   */
  setTestEnvVars(): void {
    process.env.TEST_API_URL = 'https://api.example.com';
    process.env.TEST_TOKEN = 'test-token-123';
    process.env.TEST_TIMEOUT = '5000';
    process.env.NODE_ENV = 'test';
  },

  /**
   * Clean test environment variables
   */
  cleanTestEnvVars(): void {
    delete process.env.TEST_API_URL;
    delete process.env.TEST_TOKEN;
    delete process.env.TEST_TIMEOUT;
  },

  /**
   * Create test namespace
   */
  createTestNamespace() {
    return {
      env: {
        API_URL: 'https://api.example.com',
        TOKEN: 'test-token-123',
        TIMEOUT: '5000',
        NODE_ENV: 'test'
      },
      global: {
        timeout: 5000,
        retries: 3,
        userAgent: 'Vibranium-Test-Client'
      },
      context: {
        scenarioName: 'Test Scenario',
        stepName: 'Test Step',
        stepIndex: 0,
        totalSteps: 1,
        runId: 'test-run-123'
      },
      variables: {
        baseUrl: 'https://api.example.com',
        userId: 123,
        userName: 'testuser'
      },
      random: {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: 1640995200000,
        string: 'randomString123'
      }
    };
  }
};

/**
 * Scenario validation helpers
 */
export const scenarioHelpers = {
  /**
   * Validate scenario structure
   */
  isValidScenario(scenario: Scenario): void {
    expect(scenario.name).toBeDefined();
    expect(typeof scenario.name).toBe('string');
    expect(scenario.steps).toBeDefined();
    expect(Array.isArray(scenario.steps)).toBe(true);
    
    scenario.steps.forEach((step, index) => {
      expect(step.name).toBeDefined();
      expect(step.type).toBeDefined();
      expect(typeof step.name).toBe('string');
      expect(typeof step.type).toBe('string');
    });
  },

  /**
   * Create minimal valid scenario
   */
  createMinimalScenario(name: string = 'Test Scenario'): Scenario {
    return {
      name,
      steps: [
        {
          name: 'Test Step',
          type: 'api',
          url: 'https://api.example.com/test',
          method: 'GET'
        }
      ]
    };
  }
};

/**
 * Mock factory for creating test doubles
 */
export const mockFactory = {
  /**
   * Create mock variable resolver
   */
  createMockVariableResolver() {
    return {
      resolve: jest.fn().mockImplementation((path: string) => {
        if (path === '$.variables.baseUrl') return 'https://api.example.com';
        if (path === '$.variables.userId') return 123;
        if (path === '$.env.token') return 'test-token';
        if (path === '$.random.uuid') return '550e8400-e29b-41d4-a716-446655440000';
        return path;
      }),
      setNamespace: jest.fn(),
      updateContext: jest.fn()
    };
  },

  /**
   * Create mock validation engine
   */
  createMockValidationEngine() {
    return {
      validate: jest.fn().mockResolvedValue({
        success: true,
        results: []
      }),
      validateStep: jest.fn().mockResolvedValue({
        success: true,
        validations: []
      })
    };
  },

  /**
   * Create mock plugin registry
   */
  createMockPluginRegistry() {
    return {
      getForStepType: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue({
          success: true,
          response: createMockResponse({})
        })
      }),
      isStepTypeSupported: jest.fn().mockReturnValue(true)
    };
  }
};
