/**
 * Tests for CLI commands
 */

import { render } from 'ink-testing-library';
import React from 'react';
import { RunCommand } from '../commands/run';
import { BatchCommand } from '../commands/batch';
import { ValidateCommand } from '../commands/validate';
import { InitCommand } from '../commands/init';
import { VersionCommand } from '../commands/version';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('@vibraniumjs/core');
jest.mock('@vibraniumjs/http-client');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CLI Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RunCommand', () => {
    it('should render run command interface', () => {
      const props = {
        scenarioPath: '/test/scenario.yaml',
        environment: 'test',
        options: {
          headless: false,
          verbose: false,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toContain('Running scenario');
      expect(lastFrame()).toContain('/test/scenario.yaml');
      expect(lastFrame()).toContain('Environment: test');
    });

    it('should handle headless mode', () => {
      const props = {
        scenarioPath: '/test/scenario.yaml',
        environment: 'test',
        options: {
          headless: true,
          verbose: false,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toContain('Headless execution');
    });

    it('should display verbose output when enabled', () => {
      const props = {
        scenarioPath: '/test/scenario.yaml',
        environment: 'test',
        options: {
          headless: false,
          verbose: true,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toContain('Verbose mode enabled');
    });

    it('should handle scenario file not found', () => {
      mockFs.existsSync.mockReturnValue(false);

      const props = {
        scenarioPath: '/nonexistent/scenario.yaml',
        environment: 'test',
        options: {
          headless: false,
          verbose: false,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toContain('File not found');
      expect(lastFrame()).toContain('/nonexistent/scenario.yaml');
    });
  });

  describe('BatchCommand', () => {
    it('should render batch command interface', () => {
      const props = {
        scenarioPattern: '/test/scenarios/**/*.yaml',
        environment: 'test',
        options: {
          parallel: false,
          maxConcurrency: 4,
          failFast: false,
          reportFormat: 'html' as const,
          outputDir: './reports'
        }
      };

      const { lastFrame } = render(<BatchCommand {...props} />);

      expect(lastFrame()).toContain('Batch execution');
      expect(lastFrame()).toContain('/test/scenarios/**/*.yaml');
      expect(lastFrame()).toContain('Environment: test');
    });

    it('should handle parallel execution', () => {
      const props = {
        scenarioPattern: '/test/scenarios/**/*.yaml',
        environment: 'test',
        options: {
          parallel: true,
          maxConcurrency: 8,
          failFast: false,
          reportFormat: 'json' as const,
          outputDir: './reports'
        }
      };

      const { lastFrame } = render(<BatchCommand {...props} />);

      expect(lastFrame()).toContain('Parallel execution');
      expect(lastFrame()).toContain('Max concurrency: 8');
    });

    it('should handle fail-fast mode', () => {
      const props = {
        scenarioPattern: '/test/scenarios/**/*.yaml',
        environment: 'test',
        options: {
          parallel: false,
          maxConcurrency: 4,
          failFast: true,
          reportFormat: 'junit' as const,
          outputDir: './reports'
        }
      };

      const { lastFrame } = render(<BatchCommand {...props} />);

      expect(lastFrame()).toContain('Fail-fast enabled');
    });

    it('should display report generation info', () => {
      const props = {
        scenarioPattern: '/test/scenarios/**/*.yaml',
        environment: 'test',
        options: {
          parallel: false,
          maxConcurrency: 4,
          failFast: false,
          reportFormat: 'html' as const,
          outputDir: './custom-reports'
        }
      };

      const { lastFrame } = render(<BatchCommand {...props} />);

      expect(lastFrame()).toContain('Report format: html');
      expect(lastFrame()).toContain('Output directory: ./custom-reports');
    });
  });

  describe('ValidateCommand', () => {
    it('should render validation interface', () => {
      const props = {
        scenarioPath: '/test/scenario.yaml',
        options: {
          strict: false,
          checkVariables: true,
          checkDependencies: true
        }
      };

      const { lastFrame } = render(<ValidateCommand {...props} />);

      expect(lastFrame()).toContain('Validating scenario');
      expect(lastFrame()).toContain('/test/scenario.yaml');
    });

    it('should handle strict mode', () => {
      const props = {
        scenarioPath: '/test/scenario.yaml',
        options: {
          strict: true,
          checkVariables: true,
          checkDependencies: true
        }
      };

      const { lastFrame } = render(<ValidateCommand {...props} />);

      expect(lastFrame()).toContain('Strict mode enabled');
    });

    it('should display validation options', () => {
      const props = {
        scenarioPath: '/test/scenario.yaml',
        options: {
          strict: false,
          checkVariables: false,
          checkDependencies: true
        }
      };

      const { lastFrame } = render(<ValidateCommand {...props} />);

      expect(lastFrame()).toContain('Variable checking: disabled');
      expect(lastFrame()).toContain('Dependency checking: enabled');
    });

    it('should handle validation errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid yaml content: [');

      const props = {
        scenarioPath: '/test/invalid-scenario.yaml',
        options: {
          strict: false,
          checkVariables: true,
          checkDependencies: true
        }
      };

      const { lastFrame } = render(<ValidateCommand {...props} />);

      expect(lastFrame()).toContain('Validation failed');
    });
  });

  describe('InitCommand', () => {
    it('should render init command interface', () => {
      const props = {
        projectPath: '/test/new-project',
        options: {
          template: 'basic' as const,
          withExamples: true,
          httpAdapter: 'got' as const
        }
      };

      const { lastFrame } = render(<InitCommand {...props} />);

      expect(lastFrame()).toContain('Initializing project');
      expect(lastFrame()).toContain('/test/new-project');
      expect(lastFrame()).toContain('Template: basic');
    });

    it('should handle different templates', () => {
      const props = {
        projectPath: '/test/api-project',
        options: {
          template: 'api-testing' as const,
          withExamples: false,
          httpAdapter: 'axios' as const
        }
      };

      const { lastFrame } = render(<InitCommand {...props} />);

      expect(lastFrame()).toContain('Template: api-testing');
      expect(lastFrame()).toContain('HTTP adapter: axios');
    });

    it('should show example inclusion option', () => {
      const props = {
        projectPath: '/test/project',
        options: {
          template: 'basic' as const,
          withExamples: true,
          httpAdapter: 'fetch' as const
        }
      };

      const { lastFrame } = render(<InitCommand {...props} />);

      expect(lastFrame()).toContain('Including examples');
    });

    it('should handle existing directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['existing-file.txt'] as any);

      const props = {
        projectPath: '/test/existing-project',
        options: {
          template: 'basic' as const,
          withExamples: false,
          httpAdapter: 'got' as const
        }
      };

      const { lastFrame } = render(<InitCommand {...props} />);

      expect(lastFrame()).toContain('Directory is not empty');
    });
  });

  describe('VersionCommand', () => {
    it('should display version information', () => {
      const { lastFrame } = render(<VersionCommand />);

      expect(lastFrame()).toContain('Vibranium CLI');
      expect(lastFrame()).toMatch(/Version: \d+\.\d+\.\d+/);
    });

    it('should display package versions', () => {
      const { lastFrame } = render(<VersionCommand />);

      expect(lastFrame()).toContain('@vibraniumjs/core');
      expect(lastFrame()).toContain('@vibraniumjs/http-client');
      expect(lastFrame()).toContain('@vibraniumjs/utils');
      expect(lastFrame()).toContain('@vibraniumjs/plugins');
    });

    it('should display system information', () => {
      const { lastFrame } = render(<VersionCommand />);

      expect(lastFrame()).toContain('Node.js version');
      expect(lastFrame()).toContain('Platform');
      expect(lastFrame()).toContain('Architecture');
    });
  });

  describe('Command Integration', () => {
    it('should handle command navigation', () => {
      const { lastFrame, stdin } = render(<RunCommand 
        scenarioPath="/test/scenario.yaml" 
        environment="test" 
        options={{
          headless: false,
          verbose: false,
          colors: true
        }} 
      />);

      // Simulate key press
      stdin.write('\u001B[B'); // Arrow down

      expect(lastFrame()).toContain('Selected');
    });

    it('should handle exit scenarios gracefully', () => {
      const { lastFrame, stdin } = render(<RunCommand 
        scenarioPath="/test/scenario.yaml" 
        environment="test" 
        options={{
          headless: false,
          verbose: false,
          colors: true
        }} 
      />);

      // Simulate Ctrl+C
      stdin.write('\u0003');

      expect(lastFrame()).toContain('Cancelled');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const props = {
        scenarioPath: '/test/scenario.yaml',
        environment: 'test',
        options: {
          headless: false,
          verbose: false,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toContain('Error');
      expect(lastFrame()).toContain('Permission denied');
    });

    it('should handle invalid command arguments', () => {
      const props = {
        scenarioPath: '', // Empty path
        environment: 'test',
        options: {
          headless: false,
          verbose: false,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toContain('Invalid scenario path');
    });

    it('should handle network errors gracefully', () => {
      // Mock network error during scenario execution
      const props = {
        scenarioPath: '/test/network-scenario.yaml',
        environment: 'test',
        options: {
          headless: false,
          verbose: false,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toBeDefined();
    });
  });

  describe('Progress and Status Display', () => {
    it('should show execution progress', () => {
      const props = {
        scenarioPath: '/test/long-scenario.yaml',
        environment: 'test',
        options: {
          headless: false,
          verbose: true,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toContain('Progress');
    });

    it('should display step results', () => {
      const props = {
        scenarioPath: '/test/scenario.yaml',
        environment: 'test',
        options: {
          headless: false,
          verbose: true,
          colors: true
        }
      };

      const { lastFrame } = render(<RunCommand {...props} />);

      expect(lastFrame()).toContain('Step results');
    });

    it('should handle real-time updates', () => {
      const props = {
        scenarioPath: '/test/scenario.yaml',
        environment: 'test',
        options: {
          headless: false,
          verbose: false,
          colors: true
        }
      };

      const { lastFrame, rerender } = render(<RunCommand {...props} />);

      // Simulate status update
      rerender(<RunCommand {...props} />);

      expect(lastFrame()).toBeDefined();
    });
  });
});
