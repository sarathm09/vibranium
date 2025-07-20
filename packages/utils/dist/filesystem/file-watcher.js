/**
 * File watching utilities for development and hot reloading
 */
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
export class FileWatcher extends EventEmitter {
    options;
    watcher = null;
    watching = [];
    constructor(options = {}) {
        super();
        this.options = options;
        this.setupDefaultOptions();
    }
    /**
     * Start watching files or directories
     */
    watch(paths) {
        const pathsArray = Array.isArray(paths) ? paths : [paths];
        if (this.watcher) {
            this.watcher.add(pathsArray);
        }
        else {
            this.watcher = chokidar.watch(pathsArray, this.options);
            this.setupEventListeners();
        }
        this.watching.push(...pathsArray);
        return this;
    }
    /**
     * Stop watching files or directories
     */
    unwatch(paths) {
        if (!this.watcher)
            return this;
        if (paths) {
            const pathsArray = Array.isArray(paths) ? paths : [paths];
            this.watcher.unwatch(pathsArray);
            this.watching = this.watching.filter(p => !pathsArray.includes(p));
        }
        else {
            this.watcher.close();
            this.watcher = null;
            this.watching = [];
        }
        return this;
    }
    /**
     * Close the watcher and clean up resources
     */
    async close() {
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
    getWatched() {
        return [...this.watching];
    }
    /**
     * Check if a path is being watched
     */
    isWatching(path) {
        return this.watching.includes(path);
    }
    /**
     * Setup default options
     */
    setupDefaultOptions() {
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
    setupEventListeners() {
        if (!this.watcher)
            return;
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
    static createDebouncedWatcher(paths, callback, debounceMs = 300, options = {}) {
        const watcher = new FileWatcher(options);
        const events = [];
        let timeout = null;
        const flushEvents = () => {
            if (events.length > 0) {
                callback([...events]);
                events.length = 0;
            }
            timeout = null;
        };
        watcher.on('change', (event) => {
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
    static createFilteredWatcher(paths, extensions, callback, options = {}) {
        const watcher = new FileWatcher(options);
        watcher.on('change', (event) => {
            const extension = event.path.split('.').pop()?.toLowerCase();
            if (extension && extensions.includes(extension)) {
                callback(event);
            }
        });
        watcher.watch(paths);
        return watcher;
    }
}
//# sourceMappingURL=file-watcher.js.map