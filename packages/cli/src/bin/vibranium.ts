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

// Run command - supports single files, patterns, and all scenarios
program
  .command('run [pattern]')
  .description('Run scenario(s) - file path, glob pattern, or all scenarios in current directory')
  .option('-e, --env <environment>', 'Environment to use')
  .option('-f, --format <format>', 'Output format (console, json, junit, html)', 'console')
  .option('-o, --output <path>', 'Output file path (for non-console formats)')
  .option('--output-dir <path>', 'Output directory for reports (default: ./reports)')
  .option('--include-artifacts', 'Include artifacts (screenshots, logs) in reports')
  .option('--include-metadata', 'Include detailed metadata in reports')
  .option('--console-level <level>', 'Console output level (minimal, normal, verbose)', 'normal')
  .option('--no-color', 'Disable colored output in console reports')
  .option('-p, --parallel', 'Run scenarios in parallel')
  .option('--max-concurrency <number>', 'Maximum parallel executions', '4')
  .option('--continue-on-failure', 'Continue execution even if scenarios fail')
  .option('--headless', 'Force headless mode (auto-detected if no TTY)')
  .option('--watch', 'Watch for file changes and re-run')
  .option('--reporter <format>', 'Alias for --format (deprecated)', 'console')
  .action(async (pattern: string | undefined, options: any, command: Command) => {
    try {
      const globalOptions = command.parent?.opts() || {};
      const cliOptions = parseCommonOptions({ ...globalOptions, ...options });
      const helper = new CliHelper(cliOptions);
      
      // Resolve configuration using user's actual working directory
      const userWorkingDir = process.cwd();
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
      
      // Import and execute run command
      const { RunCommand } = await import('../commands/run');
      const runCommand = new RunCommand(config, cliOptions);
      
      // Use format option over deprecated reporter
      const format = options.format || options.reporter;
      
      await runCommand.execute(pattern, {
        ...cliOptions,
        environment: options.env,
        format,
        output: options.output,
        outputDir: options.outputDir,
        includeArtifacts: options.includeArtifacts,
        includeMetadata: options.includeMetadata,
        consoleLevel: options.consoleLevel,
        color: !options.noColor,
        parallel: options.parallel,
        maxConcurrency: parseInt(options.maxConcurrency, 10),
        continueOnFailure: options.continueOnFailure,
        headless: options.headless,
        watch: options.watch
      });
      
    } catch (error) {
      const helper = new CliHelper(parseCommonOptions(command.parent?.opts() || {}));
      handleCliError(error instanceof Error ? error : new Error(String(error)), helper);
    }
  });

// Batch command (legacy - use 'run' command instead)
program
  .command('batch <directory>')
  .description('Run multiple scenarios in a directory (legacy - use "run" command instead)')
  .option('-e, --env <environment>', 'Environment to use')
  .option('-f, --format <format>', 'Output format (console, json, junit, html)', 'console')
  .option('-o, --output <path>', 'Output file path (for non-console formats)')
  .option('--output-dir <path>', 'Output directory for reports (default: ./reports)')
  .option('--include-artifacts', 'Include artifacts (screenshots, logs) in reports')
  .option('--include-metadata', 'Include detailed metadata in reports')
  .option('--console-level <level>', 'Console output level (minimal, normal, verbose)', 'normal')
  .option('--no-color', 'Disable colored output in console reports')
  .option('-p, --parallel', 'Run scenarios in parallel')
  .option('--max-concurrency <number>', 'Maximum parallel executions', '4')
  .option('--continue-on-failure', 'Continue execution even if scenarios fail')
  .option('--reporter <format>', 'Alias for --format (deprecated)', 'console')
  .action(async (directory: string, options: any, command: Command) => {
    try {
      const globalOptions = command.parent?.opts() || {};
      const cliOptions = parseCommonOptions({ ...globalOptions, ...options });
      const helper = new CliHelper(cliOptions);
      
      // Resolve configuration using user's actual working directory
      const userWorkingDir = process.cwd();
      const configResolver = new ConfigResolver();
      const config = await configResolver.resolveConfig({
        configPath: cliOptions.config,
        workingDir: userWorkingDir,
        environment: options.env
      });
      
      // Resolve directory path relative to user's working directory
      const { resolve } = await import('path');
      const resolvedDirectory = resolve(userWorkingDir, directory);
      
      // Import and execute batch command
      const { BatchCommand } = await import('../commands/batch');
      const batchCommand = new BatchCommand(config, cliOptions);
      
      // Use format option over deprecated reporter
      const format = options.format || options.reporter;
      
      await batchCommand.execute(resolvedDirectory, {
        ...cliOptions,
        environment: options.env,
        format,
        output: options.output,
        outputDir: options.outputDir,
        includeArtifacts: options.includeArtifacts,
        includeMetadata: options.includeMetadata,
        consoleLevel: options.consoleLevel,
        color: !options.noColor,
        parallel: options.parallel,
        maxConcurrency: parseInt(options.maxConcurrency, 10),
        continueOnFailure: options.continueOnFailure
      });
      
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
      const userWorkingDir = process.cwd();
      const configResolver = new ConfigResolver();
      const config = await configResolver.resolveConfig({
        configPath: cliOptions.config,
        workingDir: userWorkingDir
      });
      
      // Resolve path relative to user's working directory
      const { resolve } = await import('path');
      const resolvedPath = resolve(userWorkingDir, path);
      
      // Validate command (temporarily simplified)
      helper.log(`Would validate: ${resolvedPath}`);
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
      
      // Get the actual user's current working directory where command was run
      const userCurrentDir = process.cwd();
      console.log('User current directory:', userCurrentDir);
      
      const workingDir = directory ? resolve(userCurrentDir, directory) : userCurrentDir;
      console.log('Working directory for interactive mode:', workingDir);
      
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
      
      // Get the actual user's current working directory where command was run
      const userCurrentDir = process.cwd();
      console.log('User current directory for default action:', userCurrentDir);
      
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