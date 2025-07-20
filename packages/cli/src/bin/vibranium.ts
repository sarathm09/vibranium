#!/usr/bin/env node
/**
 * Vibranium CLI entry point
 */

import { Command, Option } from 'commander';
import chalk from 'chalk';
import { ConfigResolver } from '../utils/config-resolver';
import { CliHelper, parseCommonOptions, handleCliError } from '../utils/cli-utils';

const program = new Command();

program
  .name('vibranium')
  .description('Modern scenario-driven API testing with interactive CLI')
  .version('0.1.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('--debug', 'Enable debug mode')
  .option('--no-colors', 'Disable colors in output')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output <path>', 'Output directory');

// Run command
program
  .command('run')
  .description('Run a scenario')
  .argument('<scenario>', 'Scenario file path')
  .option('-e, --env <environment>', 'Environment to use')
  .option('--headless', 'Run in headless mode')
  .option('--reporter <format>', 'Report format (html, json, junit)', 'console')
  .option('--watch', 'Watch for file changes')
  .action(async (scenario: string, options: any, command: Command) => {
    try {
      const globalOptions = command.parent?.opts() || {};
      const cliOptions = parseCommonOptions({ ...globalOptions, ...options });
      const helper = new CliHelper(cliOptions);
      
      // Resolve configuration using user's actual working directory
      const userWorkingDir = process.env.PWD || process.cwd();
      const configResolver = new ConfigResolver();
      const config = await configResolver.resolveConfig({
        configPath: cliOptions.config,
        workingDir: userWorkingDir,
        environment: options.env
      });
      
      // Validate workspace
      const validation = await configResolver.validateWorkspace(config);
      if (!validation.valid) {
        validation.errors.forEach(error => helper.logError(error));
        process.exit(1);
      }
      
      // Execute run command (temporarily simplified)
      helper.log(`Would run scenario: ${scenario}`);
      helper.log(`Environment: ${options.env || 'default'}`);
      helper.log('Run command is not fully implemented yet.');
      
    } catch (error) {
      const helper = new CliHelper(parseCommonOptions(command.parent?.opts() || {}));
      handleCliError(error instanceof Error ? error : new Error(String(error)), helper);
    }
  });

// Batch command
program
  .command('batch')
  .description('Run multiple scenarios')
  .argument('<directory>', 'Directory containing scenarios')
  .option('-e, --env <environment>', 'Environment to use')
  .option('--parallel', 'Run scenarios in parallel')
  .option('--max-concurrency <number>', 'Maximum parallel executions', '4')
  .option('--continue-on-failure', 'Continue execution even if scenarios fail')
  .option('--reporter <format>', 'Report format (html, json, junit)', 'console')
  .action(async (directory: string, options: any, command: Command) => {
    try {
      const globalOptions = command.parent?.opts() || {};
      const cliOptions = parseCommonOptions({ ...globalOptions, ...options });
      const helper = new CliHelper(cliOptions);
      
      // Resolve configuration using user's actual working directory
      const userWorkingDir = process.env.PWD || process.cwd();
      const configResolver = new ConfigResolver();
      const config = await configResolver.resolveConfig({
        configPath: cliOptions.config,
        workingDir: userWorkingDir,
        environment: options.env
      });
      
      // Execute batch command (temporarily simplified)
      helper.log(`Would run batch in directory: ${directory}`);
      helper.log(`Max concurrency: ${options.maxConcurrency}`);
      helper.log('Batch command is not fully implemented yet.');
      
    } catch (error) {
      const helper = new CliHelper(parseCommonOptions(command.parent?.opts() || {}));
      handleCliError(error instanceof Error ? error : new Error(String(error)), helper);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize a new Vibranium project')
  .argument('[project-name]', 'Project directory name')
  .option('--template <name>', 'Project template to use')
  .option('--force', 'Overwrite existing files')
  .action(async (projectName: string | undefined, options: any, command: Command) => {
    try {
      const globalOptions = command.parent?.opts() || {};
      const cliOptions = parseCommonOptions({ ...globalOptions, ...options });
      const helper = new CliHelper(cliOptions);
      
      // Initialize command (temporarily simplified)
      helper.log(`Would initialize project: ${projectName || 'vibranium-project'}`);
      helper.log('Init command is not fully implemented yet.');
      
    } catch (error) {
      const helper = new CliHelper(parseCommonOptions(command.parent?.opts() || {}));
      handleCliError(error instanceof Error ? error : new Error(String(error)), helper);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate scenario files')
  .argument('<path>', 'Scenario file or directory')
  .option('--strict', 'Enable strict validation mode')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(async (path: string, options: any, command: Command) => {
    try {
      const globalOptions = command.parent?.opts() || {};
      const cliOptions = parseCommonOptions({ ...globalOptions, ...options });
      const helper = new CliHelper(cliOptions);
      
      // Resolve configuration using user's actual working directory
      const userWorkingDir = process.env.PWD || process.cwd();
      const configResolver = new ConfigResolver();
      const config = await configResolver.resolveConfig({
        configPath: cliOptions.config,
        workingDir: userWorkingDir
      });
      
      // Validate command (temporarily simplified)
      helper.log(`Would validate: ${path}`);
      helper.log('Validate command is not fully implemented yet.');
      
    } catch (error) {
      const helper = new CliHelper(parseCommonOptions(command.parent?.opts() || {}));
      handleCliError(error instanceof Error ? error : new Error(String(error)), helper);
    }
  });

// Version command
program
  .command('version')
  .description('Show version information')
  .option('--json', 'Output as JSON')
  .action(async (options, command) => {
    try {
      const globalOptions = command.parent?.opts() || {};
      const cliOptions = parseCommonOptions({ ...globalOptions, ...options });
      const helper = new CliHelper(cliOptions);
      
      // Version command (temporarily simplified)
      helper.log('Vibranium CLI v0.1.0');
      helper.log('Modern scenario-driven API testing with interactive CLI');
      
    } catch (error) {
      const helper = new CliHelper(parseCommonOptions(command.parent?.opts() || {}));
      handleCliError(error instanceof Error ? error : new Error(String(error)), helper);
    }
  });

// Interactive command
program
  .command('interactive [directory]')
  .description('Start interactive mode')
  .option('-e, --env <environment>', 'Environment to use', 'local')
  .action(async (directory: string | undefined, options: any, command: Command) => {
    try {
      const globalOptions = command.parent?.opts() || {};
      const cliOptions = parseCommonOptions({ ...globalOptions, ...options });
      const helper = new CliHelper(cliOptions);
      
      // Use specified directory or current working directory
      const { resolve } = await import('path');
      
      // Use PWD environment variable if available (more reliable for user's actual directory)
      const userCurrentDir = process.env.PWD || process.cwd();
      console.log('Using directory:', directory ? resolve(userCurrentDir, directory) : userCurrentDir);
      
      const workingDir = directory ? resolve(userCurrentDir, directory) : userCurrentDir;
      
      // Resolve configuration for interactive mode
      const configResolver = new ConfigResolver();
      const config = await configResolver.resolveConfig({
        configPath: cliOptions.config,
        workingDir: workingDir
      });
      
      // Start interactive mode with dynamic import
      helper.log(`Starting Vibranium interactive mode in: ${workingDir}`);
      
      try {
        const { startInteractiveMode } = await import('../interactive');
        const { unmount } = startInteractiveMode({
          config,
          environment: options.env
        });
        
        // Handle clean exit
        process.on('SIGINT', () => {
          unmount();
          process.exit(0);
        });
      } catch (inkError) {
        helper.logError('Failed to start interactive mode:');
        helper.logError(inkError instanceof Error ? inkError.message : String(inkError));
        helper.log('');
        helper.log('This is likely due to ESM/CJS compatibility issues with the Ink framework.');
        helper.log('Please use the specific commands instead:');
        helper.log('  vibranium run <scenario>     Run a single scenario file');
        helper.log('  vibranium batch <directory>  Run multiple scenarios');
        helper.log('  vibranium validate <path>    Validate scenario files');
        process.exit(1);
      }
      
    } catch (error) {
      const helper = new CliHelper(parseCommonOptions(command.parent?.opts() || {}));
      handleCliError(error instanceof Error ? error : new Error(String(error)), helper);
    }
  });

// Default action - start interactive mode in current directory
program
  .action(async (options: any) => {
    try {
      const cliOptions = parseCommonOptions(options);
      const helper = new CliHelper(cliOptions);
      
      // Use PWD environment variable if available (more reliable for user's actual directory)
      const userCurrentDir = process.env.PWD || process.cwd();
      console.log('Using directory:', userCurrentDir);
      
      // Resolve configuration for interactive mode
      const configResolver = new ConfigResolver();
      const config = await configResolver.resolveConfig({
        configPath: cliOptions.config,
        workingDir: userCurrentDir
      });
      
      // Start interactive mode with dynamic import
      helper.log('Starting Vibranium interactive mode...');
      
      try {
        const { startInteractiveMode } = await import('../interactive');
        const { unmount } = startInteractiveMode({
          config,
          environment: 'local' // Default environment for interactive mode
        });
        
        // Handle clean exit
        process.on('SIGINT', () => {
          unmount();
          process.exit(0);
        });
      } catch (inkError) {
        helper.logError('Failed to start interactive mode:');
        helper.logError(inkError instanceof Error ? inkError.message : String(inkError));
        helper.log('');
        helper.log('This is likely due to ESM/CJS compatibility issues with the Ink framework.');
        helper.log('Please use the specific commands instead:');
        helper.log('  vibranium run <scenario>     Run a single scenario file');
        helper.log('  vibranium batch <directory>  Run multiple scenarios');
        helper.log('  vibranium validate <path>    Validate scenario files');
        process.exit(1);
      }
      
    } catch (error) {
      const helper = new CliHelper(parseCommonOptions(options));
      handleCliError(error instanceof Error ? error : new Error(String(error)), helper);
    }
  });

// Check if this is the main module (ESM compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse(process.argv);
}

export default program;