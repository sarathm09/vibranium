/**
 * Test fixtures for scenarios
 */

import type { Scenario } from '../../types';

export const simpleGetScenario: Scenario = {
  name: 'Simple GET Test',
  description: 'Basic GET request test',
  version: '1.0.0',
  environment: 'test',
  variables: {
    baseUrl: 'https://api.example.com',
    userId: 123
  },
  steps: [
    {
      name: 'Get User',
      type: 'api',
      url: '$.variables.baseUrl/users/$.variables.userId',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer $.env.token'
      },
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 200
        },
        {
          field: '$.response.body.id',
          operator: 'equals',
          expected: '$.variables.userId'
        }
      ]
    }
  ]
};

export const crudWorkflowScenario: Scenario = {
  name: 'User CRUD Workflow',
  description: 'Complete CRUD operations for user management',
  version: '2.0.0',
  environment: 'test',
  variables: {
    baseUrl: 'https://api.example.com',
    userName: 'Test User',
    userEmail: 'test@example.com'
  },
  steps: [
    {
      name: 'Create User',
      type: 'post',
      url: '$.variables.baseUrl/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $.env.token'
      },
      body: {
        name: '$.variables.userName',
        email: '$.variables.userEmail',
        created: '$.random.timestamp'
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
        },
        {
          field: '$.response.body.name',
          operator: 'equals',
          expected: '$.variables.userName'
        }
      ]
    },
    {
      name: 'Get Created User',
      type: 'get',
      url: '$.variables.baseUrl/users/$.response.body.id',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer $.env.token'
      },
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
        },
        {
          field: '$.response.body.email',
          operator: 'equals',
          expected: '$.variables.userEmail'
        }
      ]
    },
    {
      name: 'Update User',
      type: 'put',
      url: '$.variables.baseUrl/users/$.steps["Create User"].response.body.id',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $.env.token'
      },
      body: {
        name: 'Updated User Name',
        email: 'updated@example.com',
        updated: '$.random.timestamp'
      },
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 200
        },
        {
          field: '$.response.body.name',
          operator: 'equals',
          expected: 'Updated User Name'
        }
      ]
    },
    {
      name: 'Delete User',
      type: 'delete',
      url: '$.variables.baseUrl/users/$.steps["Create User"].response.body.id',
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer $.env.token'
      },
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

export const validationTestScenario: Scenario = {
  name: 'Validation Operators Test',
  description: 'Test all validation operators',
  steps: [
    {
      name: 'Test All Validations',
      type: 'api',
      url: 'https://api.example.com/test',
      method: 'GET',
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 200
        },
        {
          field: '$.response.body.message',
          operator: 'contains',
          expected: 'success'
        },
        {
          field: '$.response.body.count',
          operator: 'greater_than',
          expected: 0
        },
        {
          field: '$.response.body.count',
          operator: 'less_than',
          expected: 1000
        },
        {
          field: '$.response.body.items',
          operator: 'length',
          expected: 5
        },
        {
          field: '$.response.body.email',
          operator: 'matches',
          expected: '^[^@]+@[^@]+\\.[^@]+$'
        },
        {
          field: '$.response.body.id',
          operator: 'exists'
        },
        {
          field: '$.response.body.deprecated',
          operator: 'not_exists'
        }
      ]
    }
  ]
};

export const errorHandlingScenario: Scenario = {
  name: 'Error Handling Test',
  description: 'Test error conditions and recovery',
  steps: [
    {
      name: 'Trigger 404 Error',
      type: 'get',
      url: 'https://api.example.com/nonexistent',
      method: 'GET',
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 404
        },
        {
          field: '$.response.body.error',
          operator: 'exists'
        }
      ]
    },
    {
      name: 'Trigger 500 Error',
      type: 'get',
      url: 'https://api.example.com/error',
      method: 'GET',
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 500
        }
      ]
    },
    {
      name: 'Recovery Request',
      type: 'get',
      url: 'https://api.example.com/health',
      method: 'GET',
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

export const authenticationScenario: Scenario = {
  name: 'Authentication Flow',
  description: 'Test login and authenticated requests',
  variables: {
    username: 'testuser',
    password: 'password123'
  },
  steps: [
    {
      name: 'Login',
      type: 'post',
      url: 'https://api.example.com/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        username: '$.variables.username',
        password: '$.variables.password'
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
        },
        {
          field: '$.response.body.expires',
          operator: 'exists'
        }
      ]
    },
    {
      name: 'Get Profile',
      type: 'get',
      url: 'https://api.example.com/auth/profile',
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
          expected: '$.variables.username'
        }
      ]
    },
    {
      name: 'Access Protected Resource',
      type: 'get',
      url: 'https://api.example.com/protected/data',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer $.steps["Login"].response.body.token'
      },
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

export const randomDataScenario: Scenario = {
  name: 'Random Data Generation Test',
  description: 'Test random data generation capabilities',
  steps: [
    {
      name: 'Create User with Random Data',
      type: 'post',
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': '$.random.uuid',
        'X-Timestamp': '$.random.timestamp'
      },
      body: {
        id: '$.random.uuid',
        name: '$.random.name',
        email: '$.random.email',
        phone: '$.random.phone',
        age: '$.random.number(18,65)',
        isActive: '$.random.boolean',
        bio: '$.random.string(100)',
        tags: [
          '$.random.string(10)',
          '$.random.string(10)',
          '$.random.string(10)'
        ],
        metadata: {
          created: '$.random.timestamp',
          source: 'api-test',
          version: '$.random.number(1,10)'
        }
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

export const complexWorkflowScenario: Scenario = {
  name: 'Complex Multi-Step Workflow',
  description: 'Complex workflow with dependencies and conditions',
  environment: 'test',
  variables: {
    apiUrl: 'https://api.example.com',
    batchSize: 5
  },
  steps: [
    {
      name: 'Initialize Session',
      type: 'post',
      url: '$.variables.apiUrl/sessions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        clientId: '$.random.uuid',
        timestamp: '$.random.timestamp'
      },
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 201
        },
        {
          field: '$.response.body.sessionId',
          operator: 'exists'
        }
      ]
    },
    {
      name: 'Upload Data Batch',
      type: 'post',
      url: '$.variables.apiUrl/data/batch',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': '$.steps["Initialize Session"].response.body.sessionId'
      },
      body: {
        batchId: '$.random.uuid',
        size: '$.variables.batchSize',
        data: [
          { id: 1, value: '$.random.string(20)' },
          { id: 2, value: '$.random.string(20)' },
          { id: 3, value: '$.random.string(20)' },
          { id: 4, value: '$.random.string(20)' },
          { id: 5, value: '$.random.string(20)' }
        ]
      },
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 202
        },
        {
          field: '$.response.body.jobId',
          operator: 'exists'
        }
      ]
    },
    {
      name: 'Check Processing Status',
      type: 'get',
      url: '$.variables.apiUrl/jobs/$.steps["Upload Data Batch"].response.body.jobId/status',
      method: 'GET',
      headers: {
        'X-Session-ID': '$.steps["Initialize Session"].response.body.sessionId'
      },
      retries: 3,
      retryDelay: 1000,
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 200
        },
        {
          field: '$.response.body.status',
          operator: 'in',
          expected: ['processing', 'completed', 'failed']
        }
      ]
    },
    {
      name: 'Get Results',
      type: 'get',
      url: '$.variables.apiUrl/jobs/$.steps["Upload Data Batch"].response.body.jobId/results',
      method: 'GET',
      headers: {
        'X-Session-ID': '$.steps["Initialize Session"].response.body.sessionId'
      },
      condition: '$.steps["Check Processing Status"].response.body.status === "completed"',
      validate: [
        {
          field: '$.response.status',
          operator: 'equals',
          expected: 200
        },
        {
          field: '$.response.body.results',
          operator: 'length',
          expected: '$.variables.batchSize'
        }
      ]
    },
    {
      name: 'Clean Up Session',
      type: 'delete',
      url: '$.variables.apiUrl/sessions/$.steps["Initialize Session"].response.body.sessionId',
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

export const allScenarios = {
  simpleGetScenario,
  crudWorkflowScenario,
  validationTestScenario,
  errorHandlingScenario,
  authenticationScenario,
  randomDataScenario,
  complexWorkflowScenario
};
