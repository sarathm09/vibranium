/**
 * Filesystem utilities exports
 */
export * from './file-discovery';
export * from './config-loader';
export * from './path-utils';
export * from './file-watcher';
export { FileDiscovery as FileSystemHelper } from './file-discovery';
export { ConfigLoader } from './config-loader';
export { PathUtils } from './path-utils';
export { FileWatcher } from './file-watcher';
import { FileDiscoveryOptions } from './file-discovery';
export declare function discoverScenarioFiles(directory: string, pattern?: string, options?: FileDiscoveryOptions): Promise<string[]>;
//# sourceMappingURL=index.d.ts.map