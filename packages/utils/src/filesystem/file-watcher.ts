/**
 * File watching utilities for development and hot reloading
 */

import chokidar, { FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';

export interface WatchEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  stats?: object;
}

export interface FileWatcherOptions {
  ignoreInitial?: boolean;
  ignored?: string | string[] | RegExp;
  persistent?: boolean;
  followSymlinks?: boolean;
  depth?: number;
  awaitWriteFinish?: boolean | {
    stabilityThreshold?: number;
    pollInterval?: number;
  };
}

export class FileWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private watching: string[] = [];

  constructor(private options: FileWatcherOptions = {}) {
    super();
    this.setupDefaultOptions();
  }

  /**
   * Start watching files or directories
   */
  watch(paths: string | string[]): this {
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    
    if (this.watcher) {
      this.watcher.add(pathsArray);
    } else {
      this.watcher = chokidar.watch(pathsArray, this.options);
      this.setupEventListeners();
    }
    
    this.watching.push(...pathsArray);
    return this;
  }

  /**
   * Stop watching files or directories
   */
  unwatch(paths?: string | string[]): this {
    if (!this.watcher) return this;

    if (paths) {
      const pathsArray = Array.isArray(paths) ? paths : [paths];
      this.watcher.unwatch(pathsArray);
      this.watching = this.watching.filter(p => !pathsArray.includes(p));
    } else {
      this.watcher.close();
      this.watcher = null;
      this.watching = [];
    }

    return this;
  }

  /**
   * Close the watcher and clean up resources
   */
  async close(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.watching = [];
    }
    this.removeAllListeners();
  }

  /**
   * Get list of currently watched paths
   */
  getWatched(): string[] {
    return [...this.watching];
  }

  /**
   * Check if a path is being watched
   */
  isWatching(path: string): boolean {
    return this.watching.includes(path);
  }

  /**
   * Setup default options
   */
  private setupDefaultOptions(): void {
    this.options = {
      ignoreInitial: true,
      persistent: true,
      followSymlinks: false,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.DS_Store',
        '**/Thumbs.db'
      ],
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 10
      },
      ...this.options
    };
  }

  /**
   * Setup event listeners for the watcher
   */
  private setupEventListeners(): void {
    if (!this.watcher) return;

    this.watcher
      .on('add', (path, stats) => {
        this.emit('file', { type: 'add', path, stats });
        this.emit('change', { type: 'add', path, stats });
      })
      .on('change', (path, stats) => {
        this.emit('file', { type: 'change', path, stats });
        this.emit('change', { type: 'change', path, stats });
      })
      .on('unlink', (path) => {
        this.emit('file', { type: 'unlink', path });
        this.emit('change', { type: 'unlink', path });
      })
      .on('addDir', (path, stats) => {
        this.emit('directory', { type: 'addDir', path, stats });
        this.emit('change', { type: 'addDir', path, stats });
      })
      .on('unlinkDir', (path) => {
        this.emit('directory', { type: 'unlinkDir', path });
        this.emit('change', { type: 'unlinkDir', path });
      })
      .on('error', (error) => {
        this.emit('error', error);
      })
      .on('ready', () => {
        this.emit('ready');
      });
  }

  /**
   * Create a debounced watcher that batches events
   */
  static createDebouncedWatcher(
    paths: string | string[],
    callback: (events: WatchEvent[]) => void,
    debounceMs = 300,
    options: FileWatcherOptions = {}
  ): FileWatcher {
    const watcher = new FileWatcher(options);
    const events: WatchEvent[] = [];
    let timeout: NodeJS.Timeout | null = null;

    const flushEvents = () => {
      if (events.length > 0) {
        callback([...events]);
        events.length = 0;
      }
      timeout = null;
    };

    watcher.on('change', (event: WatchEvent) => {
      events.push(event);
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(flushEvents, debounceMs);
    });

    watcher.watch(paths);
    return watcher;
  }

  /**
   * Create a filtered watcher that only watches specific file types
   */
  static createFilteredWatcher(
    paths: string | string[],
    extensions: string[],
    callback: (event: WatchEvent) => void,
    options: FileWatcherOptions = {}
  ): FileWatcher {
    const watcher = new FileWatcher(options);
    
    watcher.on('change', (event: WatchEvent) => {
      const extension = event.path.split('.').pop()?.toLowerCase();
      if (extension && extensions.includes(extension)) {
        callback(event);
      }
    });

    watcher.watch(paths);
    return watcher;
  }
}