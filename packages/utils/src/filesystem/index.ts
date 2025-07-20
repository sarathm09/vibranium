/**
 * Filesystem utilities exports
 */

export * from './file-discovery';
export * from './config-loader';
export * from './path-utils';
export * from './file-watcher';

// Re-export the main implementations for backward compatibility
export { FileDiscovery as FileSystemHelper } from './file-discovery';
export { ConfigLoader } from './config-loader';
export { PathUtils } from './path-utils';
export { FileWatcher } from './file-watcher';

// Helper functions for direct usage
import { FileDiscovery, FileDiscoveryOptions } from './file-discovery';

export async function discoverScenarioFiles(
  directory: string,
  pattern?: string,
  options?: FileDiscoveryOptions
): Promise<string[]> {
  return FileDiscovery.discoverScenarios(directory, options);
}