/**
 * Tests for scenario parser functionality
 */

import { ScenarioParser } from '../parser/scenario-parser';
import { YamlParser } from '../parser/yaml-parser';
import { JsonParser } from '../parser/json-parser';
import { SchemaValidator } from '../parser/schema-validator';
import type { Scenario, ParsedScenario } from '../types';

describe('ScenarioParser', () => {
  let parser: ScenarioParser;
  let yamlParser: YamlParser;
  let jsonParser: JsonParser;
  let validator: SchemaValidator;

  beforeEach(() => {
    yamlParser = new YamlParser();
    jsonParser = new JsonParser();
    validator = new SchemaValidator();
    parser = new ScenarioParser({
      yamlParser,
      jsonParser,
      validator
    });
  });

  describe('YAML Scenario Parsing', () => {
    it('should parse valid YAML scenario', async () => {
      const yamlContent = `
name: User API Tests
description: Test user management API
version: 1.0.0
environment: test
variables:
  baseUrl: https://api.example.com
  userId: 123
steps:
  - name: Get User
    type: api
    url: $.variables.baseUrl/users/$.variables.userId
    method: GET
    headers:
      Authorization: Bearer $.env.token
    validate:
      - field: $.response.status
        operator: equals
        expected: 200
      - field: $.response.body.id
        operator: equals
        expected: $.variables.userId
`;

      const result = await parser.parseYaml(yamlContent);

      expect(result.success).toBe(true);
      expect(result.scenario?.name).toBe('User API Tests');
      expect(result.scenario?.steps).toHaveLength(1);
      expect(result.scenario?.steps[0].name).toBe('Get User');
      expect(result.scenario?.steps[0].type).toBe('api');
    });

    it('should handle YAML parsing errors', async () => {
      const invalidYaml = `
name: Test
steps:
  - name: Step 1
    invalid_yaml: [
`;

      const result = await parser.parseYaml(invalidYaml);

      expect(result.success).toBe(false);
      expect(result.error).toContain('YAML parsing error');
    });

    it('should validate YAML scenario structure', async () => {
      const invalidScenario = `
name: Test
# Missing steps array
variables:
  test: value
`;

      const result = await parser.parseYaml(invalidScenario);

      expect(result.success).toBe(false);
      expect(result.error).toContain('steps');
    });
  });

  describe('JSON Scenario Parsing', () => {
    it('should parse valid JSON scenario', async () => {
      const jsonContent = JSON.stringify({
        name: 'API Integration Tests',
        description: 'Complete API integration test suite',
        version: '2.0.0',
        environment: 'staging',
        variables: {
          apiUrl: 'https://staging.api.com',
          timeout: 5000
        },
        steps: [
          {
            name: 'Health Check',
            type: 'api',
            url: '$.variables.apiUrl/health',
            method: 'GET',
            timeout: '$.variables.timeout',
            validate: [
              {
                field: '$.response.status',
                operator: 'equals',
                expected: 200
              },
              {
                field: '$.response.body.status',
                operator: 'equals',
                expected: 'healthy'
              }
            ]
          },
          {
            name: 'Create User',
            type: 'post',
            url: '$.variables.apiUrl/users',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              name: '$.random.name',
              email: '$.random.email',
              age: 25
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
      });

      const result = await parser.parseJson(jsonContent);

      expect(result.success).toBe(true);
      expect(result.scenario?.name).toBe('API Integration Tests');
      expect(result.scenario?.steps).toHaveLength(2);
      expect(result.scenario?.steps[0].name).toBe('Health Check');
      expect(result.scenario?.steps[1].name).toBe('Create User');
    });

    it('should handle JSON parsing errors', async () => {
      const invalidJson = `{
  "name": "Test",
  "steps": [
    {
      "name": "Step 1"
      // Missing comma
      "type": "api"
    }
  ]
}`;

      const result = await parser.parseJson(invalidJson);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON parsing error');
    });
  });

  describe('File-based Parsing', () => {
    it('should detect file type by extension', async () => {
      const yamlFile = '/path/to/scenario.yaml';
      const jsonFile = '/path/to/scenario.json';
      const ymlFile = '/path/to/scenario.yml';

      expect(parser.detectFileType(yamlFile)).toBe('yaml');
      expect(parser.detectFileType(jsonFile)).toBe('json');
      expect(parser.detectFileType(ymlFile)).toBe('yaml');
    });

    it('should throw error for unsupported file types', () => {
      expect(() => {
        parser.detectFileType('/path/to/scenario.txt');
      }).toThrow('Unsupported file type');
    });
  });

  describe('Schema Validation', () => {
    it('should validate scenario against schema', async () => {
      const validScenario: Scenario = {
        name: 'Valid Scenario',
        description: 'A valid test scenario',
        version: '1.0.0',
        environment: 'test',
        variables: {
          baseUrl: 'https://api.test.com',
          timeout: 5000
        },
        steps: [
          {
            name: 'Test Step',
            type: 'api',
            url: '$.variables.baseUrl/test',
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

      const result = await parser.validate(validScenario);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const invalidScenario = {
        // Missing 'name' field
        steps: [
          {
            name: 'Test Step',
            type: 'api',
            url: 'https://api.test.com/test',
            method: 'GET'
          }
        ]
      } as Scenario;

      const result = await parser.validate(invalidScenario);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('name')
      );
    });

    it('should validate step structure', async () => {
      const scenarioWithInvalidStep: Scenario = {
        name: 'Test Scenario',
        steps: [
          {
            name: 'Invalid Step',
            type: 'api',
            // Missing required 'url' field for API step
            method: 'GET'
          } as any
        ]
      };

      const result = await parser.validate(scenarioWithInvalidStep);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('url')
      );
    });

    it('should validate validation rules', async () => {
      const scenarioWithInvalidValidation: Scenario = {
        name: 'Test Scenario',
        steps: [
          {
            name: 'Test Step',
            type: 'api',
            url: 'https://api.test.com/test',
            method: 'GET',
            validate: [
              {
                field: '$.response.status',
                operator: 'invalid_operator' as any,
                expected: 200
              }
            ]
          }
        ]
      };

      const result = await parser.validate(scenarioWithInvalidValidation);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('operator')
      );
    });
  });

  describe('Variable Resolution', () => {
    it('should identify variables in scenario', async () => {
      const scenario: Scenario = {
        name: 'Variable Test',
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
            headers: {
              'Authorization': 'Bearer $.env.token',
              'X-Request-ID': '$.random.uuid'
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

      const variables = parser.extractVariables(scenario);

      expect(variables).toContain('$.variables.baseUrl');
      expect(variables).toContain('$.variables.userId');
      expect(variables).toContain('$.env.token');
      expect(variables).toContain('$.random.uuid');
    });

    it('should identify circular variable dependencies', async () => {
      const scenarioWithCircularDeps: Scenario = {
        name: 'Circular Dependencies',
        variables: {
          var1: '$.variables.var2',
          var2: '$.variables.var1' // Circular dependency
        },
        steps: []
      };

      const result = await parser.validate(scenarioWithCircularDeps);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('circular dependency')
      );
    });
  });

  describe('Step Dependencies', () => {
    it('should analyze step dependencies', async () => {
      const scenario: Scenario = {
        name: 'Dependency Test',
        steps: [
          {
            name: 'Create User',
            type: 'post',
            url: 'https://api.test.com/users',
            method: 'POST',
            body: { name: 'John' }
          },
          {
            name: 'Get Created User',
            type: 'get',
            url: 'https://api.test.com/users/$.response.body.id', // Depends on previous step
            method: 'GET'
          },
          {
            name: 'Update User',
            type: 'put',
            url: 'https://api.test.com/users/$.response.body.id',
            method: 'PUT',
            body: { name: 'John Updated' }
          }
        ]
      };

      const dependencies = parser.analyzeDependencies(scenario);

      expect(dependencies).toHaveProperty('Get Created User');
      expect(dependencies['Get Created User']).toContain('Create User');
      expect(dependencies).toHaveProperty('Update User');
      expect(dependencies['Update User']).toContain('Get Created User');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large scenarios efficiently', async () => {
      const largeScenario: Scenario = {
        name: 'Large Scenario',
        steps: Array.from({ length: 1000 }, (_, i) => ({
          name: `Step ${i + 1}`,
          type: 'api',
          url: `https://api.test.com/endpoint-${i}`,
          method: 'GET'
        }))
      };

      const startTime = Date.now();
      const result = await parser.validate(largeScenario);
      const duration = Date.now() - startTime;

      expect(result.valid).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle deeply nested variable references', async () => {
      const nestedScenario: Scenario = {
        name: 'Nested Variables',
        variables: {
          level1: {
            level2: {
              level3: {
                value: 'deep-value'
              }
            }
          }
        },
        steps: [
          {
            name: 'Deep Variable Test',
            type: 'api',
            url: 'https://api.test.com/test',
            method: 'GET',
            headers: {
              'X-Deep-Value': '$.variables.level1.level2.level3.value'
            }
          }
        ]
      };

      const result = await parser.validate(nestedScenario);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty scenarios gracefully', async () => {
      const emptyScenario: Scenario = {
        name: 'Empty Scenario',
        steps: []
      };

      const result = await parser.validate(emptyScenario);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
