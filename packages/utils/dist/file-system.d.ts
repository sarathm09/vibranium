/**
 * @deprecated Use ./filesystem exports instead
 * File system utilities for Vibranium CLI - Legacy compatibility
 */
import type { Scenario } from '@vibraniumjs/types';
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
export declare class FileSystemHelper implements FileSystemUtils {
    loadScenario(filePath: string): Promise<Scenario>;
    discoverScenarios(directory: string): Promise<string[]>;
    readConfigFile(filePath: string): Promise<Record<string, any>>;
    writeConfigFile(filePath: string, data: Record<string, any>): Promise<void>;
    ensureDirectory(dirPath: string): Promise<void>;
    pathExists(path: string): Promise<boolean>;
}
//# sourceMappingURL=file-system.d.ts.map