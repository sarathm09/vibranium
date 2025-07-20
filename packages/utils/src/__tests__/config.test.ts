/**
 * Tests for configuration management
 */

import { ConfigManager } from '../config/config-manager';
import { ConfigValidator } from '../config/config-validator';
import type { VibraniumConfig } from '../config/index';
import * as path from 'path';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const testConfigPath = '/test/vibranium.config.json';

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigManager();
  });

  describe('Configuration Loading', () => {
    it('should load configuration from JSON file', async () => {
      const mockConfig: VibraniumConfig = {
        environments: {
          test: {
            name: 'test',
            variables: { baseUrl: 'https://test.api.com' }
          }
        },
        plugins: {
          enabled: ['core-api'],
          directories: ['./plugins']
        },
        http: {
          adapter: 'got',
          timeout: 5000,
          retries: 3
        },
        reporting: {
          formats: ['html', 'json'],
          outputDir: './reports'
        },
        cli: {
          colors: true,
          verbose: false
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const config = await configManager.load(testConfigPath);

      expect(config).toEqual(mockConfig);
      expect(mockFs.existsSync).toHaveBeenCalledWith(testConfigPath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(testConfigPath, 'utf8');
    });

    it('should load configuration from YAML file', async () => {
      const yamlContent = `
environments:
  test:
    name: test
    variables:
      baseUrl: https://test.api.com
http:
  adapter: got
  timeout: 5000
`;
      const yamlConfigPath = '/test/vibranium.config.yaml';

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);

      const config = await configManager.load(yamlConfigPath);

      expect(config.environments?.test?.variables?.baseUrl).toBe('https://test.api.com');
      expect(config.http?.adapter).toBe('got');
    });

    it('should return default config when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const config = await configManager.load(testConfigPath);

      expect(config).toEqual({
        environments: {},
        plugins: {
          enabled: ['core-api'],
          directories: ['./plugins']
        },
        http: {
          adapter: 'got',
          timeout: 30000,
          retries: 3
        },
        reporting: {
          formats: ['html'],
          outputDir: './reports'
        },
        cli: {
          colors: true,
          verbose: false
        }
      });
    });

    it('should throw error for invalid JSON', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json{');

      await expect(configManager.load(testConfigPath)).rejects.toThrow();
    });
  });

  describe('Configuration Saving', () => {
    it('should save configuration to JSON file', async () => {
      const config: VibraniumConfig = {
        environments: {
          prod: {
            name: 'production',
            variables: { baseUrl: 'https://api.prod.com' }
          }
        },
        http: {
          adapter: 'axios',
          timeout: 10000
        }
      };

      await configManager.save(testConfigPath, config);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testConfigPath,
        JSON.stringify(config, null, 2),
        'utf8'
      );
    });

    it('should create directory if it does not exist', async () => {
      const config: VibraniumConfig = { environments: {} };
      const configDir = path.dirname(testConfigPath);

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => undefined);

      await configManager.save(testConfigPath, config);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(configDir, { recursive: true });
    });
  });

  describe('Configuration Merging', () => {
    it('should merge configurations deeply', () => {
      const baseConfig: VibraniumConfig = {
        environments: {
          test: {
            name: 'test',
            variables: { baseUrl: 'https://test.com' }
          }
        },
        http: {
          adapter: 'got',
          timeout: 5000,
          retries: 3
        }
      };

      const overrideConfig: Partial<VibraniumConfig> = {
        environments: {
          test: {
            variables: { apiKey: 'test-key' }
          }
        },
        http: {
          timeout: 10000
        }
      };

      const merged = configManager.merge(baseConfig, overrideConfig);

      expect(merged.environments?.test?.variables).toEqual({
        baseUrl: 'https://test.com',
        apiKey: 'test-key'
      });
      expect(merged.http?.timeout).toBe(10000);
      expect(merged.http?.adapter).toBe('got');
      expect(merged.http?.retries).toBe(3);
    });

    it('should handle array merging for plugins', () => {
      const baseConfig: VibraniumConfig = {
        plugins: {
          enabled: ['core-api'],
          directories: ['./plugins']
        }
      };

      const overrideConfig: Partial<VibraniumConfig> = {
        plugins: {
          enabled: ['core-api', 'custom-plugin'],
          directories: ['./plugins', './custom-plugins']
        }
      };

      const merged = configManager.merge(baseConfig, overrideConfig);

      expect(merged.plugins?.enabled).toEqual(['core-api', 'custom-plugin']);
      expect(merged.plugins?.directories).toEqual(['./plugins', './custom-plugins']);
    });
  });

  describe('Environment Resolution', () => {
    it('should resolve environment-specific configuration', () => {
      const config: VibraniumConfig = {
        environments: {
          test: {
            name: 'test',
            variables: {
              baseUrl: 'https://test.api.com',
              timeout: 5000
            }
          },
          prod: {
            name: 'production',
            variables: {
              baseUrl: 'https://api.prod.com',
              timeout: 10000
            }
          }
        }
      };

      const testEnv = configManager.getEnvironment(config, 'test');
      const prodEnv = configManager.getEnvironment(config, 'prod');

      expect(testEnv?.name).toBe('test');
      expect(testEnv?.variables?.baseUrl).toBe('https://test.api.com');
      expect(prodEnv?.name).toBe('production');
      expect(prodEnv?.variables?.baseUrl).toBe('https://api.prod.com');
    });

    it('should return undefined for non-existent environment', () => {
      const config: VibraniumConfig = {
        environments: {
          test: { name: 'test' }
        }
      };

      const env = configManager.getEnvironment(config, 'nonexistent');
      expect(env).toBeUndefined();
    });
  });
});

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const validConfig: VibraniumConfig = {
        environments: {
          test: {
            name: 'test',
            variables: { baseUrl: 'https://test.api.com' }
          }
        },
        plugins: {
          enabled: ['core-api'],
          directories: ['./plugins']
        },
        http: {
          adapter: 'got',
          timeout: 5000,
          retries: 3
        },
        reporting: {
          formats: ['html', 'json'],
          outputDir: './reports'
        },
        cli: {
          colors: true,
          verbose: false
        }
      };

      const result = validator.validate(validConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid HTTP adapter', () => {
      const invalidConfig = {
        http: {
          adapter: 'invalid-adapter',
          timeout: 5000
        }
      } as VibraniumConfig;

      const result = validator.validate(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Invalid HTTP adapter')
      );
    });

    it('should detect invalid report formats', () => {
      const invalidConfig = {
        reporting: {
          formats: ['invalid-format'],
          outputDir: './reports'
        }
      } as VibraniumConfig;

      const result = validator.validate(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Invalid report format')
      );
    });

    it('should detect missing required environment properties', () => {
      const invalidConfig = {
        environments: {
          test: {
            // Missing 'name' property
            variables: { baseUrl: 'https://test.com' }
          }
        }
      } as VibraniumConfig;

      const result = validator.validate(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Environment must have a name')
      );
    });

    it('should validate timeout values', () => {
      const invalidConfig = {
        http: {
          adapter: 'got',
          timeout: -1000 // Invalid negative timeout
        }
      } as VibraniumConfig;

      const result = validator.validate(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Timeout must be a positive number')
      );
    });

    it('should validate retry count', () => {
      const invalidConfig = {
        http: {
          adapter: 'got',
          retries: -1 // Invalid negative retries
        }
      } as VibraniumConfig;

      const result = validator.validate(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Retries must be a non-negative number')
      );
    });
  });

  describe('Environment Validation', () => {
    it('should validate environment structure', () => {
      const validEnv = {
        name: 'test',
        description: 'Test environment',
        variables: {
          baseUrl: 'https://test.api.com',
          apiKey: 'test-key'
        },
        secrets: {
          dbPassword: 'secret-password'
        }
      };

      const result = validator.validateEnvironment(validEnv);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid variable names', () => {
      const invalidEnv = {
        name: 'test',
        variables: {
          'invalid-variable-name!': 'value' // Invalid characters
        }
      };

      const result = validator.validateEnvironment(invalidEnv);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Invalid variable name')
      );
    });
  });

  describe('Plugin Configuration Validation', () => {
    it('should validate plugin configuration', () => {
      const validPluginConfig = {
        enabled: ['core-api', 'custom-plugin'],
        directories: ['./plugins', './custom'],
        config: {
          'core-api': {
            timeout: 5000
          }
        }
      };

      const result = validator.validatePluginConfig(validPluginConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid plugin directories', () => {
      const invalidPluginConfig = {
        enabled: ['core-api'],
        directories: [''] // Empty directory path
      };

      const result = validator.validatePluginConfig(invalidPluginConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Plugin directory cannot be empty')
      );
    });
  });
});
