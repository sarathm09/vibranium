/**
 * Watch mode implementation for continuous testing
 */

import { watch, FSWatcher } from 'chokidar';
import { resolve, dirname } from 'path';
import { CliHelper } from './cli-utils';
import { ResolvedConfig } from './config-resolver';
import { ExitCodes } from './exit-codes';
import { RunCommandOptions } from '../commands/run';

export class WatchMode {
  private watcher: FSWatcher | null = null;
  private isRunning = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay = 500; // ms

  constructor(
    private config: ResolvedConfig,
    private helper: CliHelper
  ) {}

  async start(pattern: string | undefined, options: RunCommandOptions): Promise<void> {
    this.helper.log('Starting watch mode...');
    
    // Determine what files to watch
    const watchPatterns = this.getWatchPatterns(pattern);
    this.helper.logVerbose(`Watching patterns: ${watchPatterns.join(', ')}`);

    // Set up file watcher
    this.watcher = watch(watchPatterns, {
      ignored: [
        /node_modules/,
        /.git/,
        /dist/,
        /build/,
        /.DS_Store/,
        /Thumbs.db/
      ],
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      cwd: this.config.workspaceRoot
    });

    // Handle file changes
    this.watcher.on('change', (path) => {
      this.handleFileChange(path, pattern, options);
    });

    this.watcher.on('add', (path) => {
      this.handleFileChange(path, pattern, options);
    });

    this.watcher.on('unlink', (path) => {
      this.helper.logVerbose(`File removed: ${path}`);
    });

    this.watcher.on('error', (error) => {
      this.helper.logError(`Watch error: ${error.message}`);
    });

    this.watcher.on('ready', () => {
      this.helper.logSuccess('Watch mode ready. Watching for changes...');
      // Run initial execution
      this.executeWithDebounce(pattern, options);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.stop();
      process.exit(ExitCodes.INTERRUPTED);
    });

    process.on('SIGTERM', () => {
      this.stop();
      process.exit(ExitCodes.INTERRUPTED);
    });

    // Keep the process running
    return new Promise(() => {
      // This promise never resolves to keep watch mode running
    });
  }

  private getWatchPatterns(pattern: string | undefined): string[] {
    if (!pattern) {
      // Watch all scenario files and environment files
      return [
        '**/*.yaml',
        '**/*.yml', 
        '**/*.json',
        '**/environments/**/*',
        '**/env/**/*'
      ];
    }

    // If pattern is a specific file, watch that file and related files
    if (pattern.includes('.')) {
      const dir = dirname(pattern);
      return [
        pattern,
        `${dir}/**/*.yaml`,
        `${dir}/**/*.yml`,
        `${dir}/**/*.json`,
        '**/environments/**/*',
        '**/env/**/*'
      ];
    }

    // If pattern is a directory or glob, watch within that scope
    return [
      `${pattern}/**/*.yaml`,
      `${pattern}/**/*.yml`,
      `${pattern}/**/*.json`,
      '**/environments/**/*',
      '**/env/**/*'
    ];
  }

  private handleFileChange(path: string, pattern: string | undefined, options: RunCommandOptions): void {
    this.helper.log(`\nFile changed: ${path}`);
    this.executeWithDebounce(pattern, options);
  }

  private executeWithDebounce(pattern: string | undefined, options: RunCommandOptions): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      this.executeScenarios(pattern, options);
    }, this.debounceDelay);
  }

  private async executeScenarios(pattern: string | undefined, options: RunCommandOptions): Promise<void> {
    if (this.isRunning) {
      this.helper.logVerbose('Execution already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.helper.log('\\n' + '='.repeat(50));
      this.helper.log(`🔄 Re-running scenarios... (${new Date().toLocaleTimeString()})`);
      this.helper.log('='.repeat(50));

      // Import RunCommand dynamically to avoid circular dependencies
      const { RunCommand } = await import('../commands/run');
      const runCommand = new RunCommand(this.config, {
        verbose: options.verbose,
        debug: options.debug,
        colors: options.colors
      });

      // Create options without watch to avoid recursion
      const execOptions = { ...options };
      delete execOptions.watch;

      await runCommand.execute(pattern, execOptions);

      const duration = Date.now() - startTime;
      this.helper.log('\\n' + '='.repeat(50));
      this.helper.logSuccess(`✅ Execution completed in ${this.helper.formatDuration(duration)}`);
      this.helper.log('Waiting for file changes...');
      this.helper.log('='.repeat(50));

    } catch (error) {
      const duration = Date.now() - startTime;
      this.helper.log('\\n' + '='.repeat(50));
      this.helper.logError(`❌ Execution failed after ${this.helper.formatDuration(duration)}`);
      this.helper.logError(error instanceof Error ? error.message : String(error));
      this.helper.log('Waiting for file changes...');
      this.helper.log('='.repeat(50));
    } finally {
      this.isRunning = false;
    }
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.helper.log('\\nWatch mode stopped.');
  }
}