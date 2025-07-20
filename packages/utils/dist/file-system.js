/**
 * @deprecated Use ./filesystem exports instead
 * File system utilities for Vibranium CLI - Legacy compatibility
 */
import { ConfigLoader, FileDiscovery, PathUtils } from './filesystem';
/**
 * @deprecated Use FileDiscovery, ConfigLoader, and PathUtils from ./filesystem instead
 */
export class FileSystemHelper {
    async loadScenario(filePath) {
        return ConfigLoader.loadScenario(filePath);
    }
    async discoverScenarios(directory) {
        return FileDiscovery.discoverScenarios(directory);
    }
    async readConfigFile(filePath) {
        return ConfigLoader.loadConfig(filePath);
    }
    async writeConfigFile(filePath, data) {
        await ConfigLoader.saveConfig(filePath, data);
    }
    async ensureDirectory(dirPath) {
        await PathUtils.ensureDirectory(dirPath);
    }
    async pathExists(path) {
        return PathUtils.exists(path);
    }
}
//# sourceMappingURL=file-system.js.map