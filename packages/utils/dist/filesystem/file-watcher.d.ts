/**
 * File watching utilities for development and hot reloading
 */
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
export declare class FileWatcher extends EventEmitter {
    private options;
    private watcher;
    private watching;
    constructor(options?: FileWatcherOptions);
    /**
     * Start watching files or directories
     */
    watch(paths: string | string[]): this;
    /**
     * Stop watching files or directories
     */
    unwatch(paths?: string | string[]): this;
    /**
     * Close the watcher and clean up resources
     */
    close(): Promise<void>;
    /**
     * Get list of currently watched paths
     */
    getWatched(): string[];
    /**
     * Check if a path is being watched
     */
    isWatching(path: string): boolean;
    /**
     * Setup default options
     */
    private setupDefaultOptions;
    /**
     * Setup event listeners for the watcher
     */
    private setupEventListeners;
    /**
     * Create a debounced watcher that batches events
     */
    static createDebouncedWatcher(paths: string | string[], callback: (events: WatchEvent[]) => void, debounceMs?: number, options?: FileWatcherOptions): FileWatcher;
    /**
     * Create a filtered watcher that only watches specific file types
     */
    static createFilteredWatcher(paths: string | string[], extensions: string[], callback: (event: WatchEvent) => void, options?: FileWatcherOptions): FileWatcher;
}
//# sourceMappingURL=file-watcher.d.ts.map