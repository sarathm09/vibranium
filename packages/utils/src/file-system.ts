/**
 * @deprecated Use ./filesystem exports instead
 * File system utilities for Vibranium CLI - Legacy compatibility
 */

import type { Scenario } from '@vibraniumjs/types';
import { ConfigLoader, FileDiscovery, PathUtils } from './filesystem';

export interface FileSystemUtils {
  loadScenario(filePath: string): Promise<Scenario>;
  discoverScenarios(directory: string): Promise<string[]>;
  readConfigFile(filePath: string): Promise<Record<string, any>>;
  writeConfigFile(filePath: string, data: Record<string, any>): Promise<void>;
  ensureDirectory(dirPath: string): Promise<void>;
  pathExists(path: string): Promise<boolean>;
}

/**
 * @deprecated Use FileDiscovery, ConfigLoader, and PathUtils from ./filesystem instead
 */
export class FileSystemHelper implements FileSystemUtils {
  async loadScenario(filePath: string): Promise<Scenario> {
    return ConfigLoader.loadScenario(filePath);
  }

  async discoverScenarios(directory: string): Promise<string[]> {
    return FileDiscovery.discoverScenarios(directory);
  }

  async readConfigFile(filePath: string): Promise<Record<string, any>> {
    return ConfigLoader.loadConfig(filePath);
  }

  async writeConfigFile(filePath: string, data: Record<string, any>): Promise<void> {
    await ConfigLoader.saveConfig(filePath, data);
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    await PathUtils.ensureDirectory(dirPath);
  }

  async pathExists(path: string): Promise<boolean> {
    return PathUtils.exists(path);
  }
}