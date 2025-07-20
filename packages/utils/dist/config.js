/**
 * @deprecated Use ./config exports instead
 * Global configuration management - Legacy compatibility
 */
import { ConfigManager as NewConfigManager } from './config/config-manager';
/**
 * @deprecated Use ConfigManager from ./config instead
 */
export class GlobalConfigManager {
    configManager;
    constructor() {
        this.configManager = new NewConfigManager();
    }
    async load() {
        const config = await this.configManager.load();
        // Map new config to legacy format
        return {
            defaultEnvironment: config.defaultEnvironment,
            httpClient: config.httpClient,
            timeout: config.timeout,
            retries: config.retries,
            colors: config.logging?.colors,
            logLevel: config.logging?.level,
            outputFormat: config.output?.format,
            reportPath: config.output?.directory,
            plugins: config.plugins?.enabled
        };
    }
    async save(config) {
        // Map legacy config to new format
        const newConfig = {
            defaultEnvironment: config.defaultEnvironment,
            httpClient: config.httpClient,
            timeout: config.timeout,
            retries: config.retries,
            logging: {
                colors: config.colors,
                level: config.logLevel
            },
            output: {
                format: config.outputFormat,
                directory: config.reportPath
            },
            plugins: config.plugins
        };
        this.configManager.merge(newConfig);
        await this.configManager.save(this.configManager.getConfig());
    }
    get(key) {
        const config = this.configManager.getConfig();
        // Map new config structure to legacy key
        switch (key) {
            case 'colors':
                return config.logging?.colors;
            case 'logLevel':
                return config.logging?.level;
            case 'outputFormat':
                return config.output?.format;
            case 'reportPath':
                return config.output?.directory;
            case 'plugins':
                return config.plugins?.enabled;
            default:
                return config[key];
        }
    }
    set(key, value) {
        const updates = {};
        // Map legacy key to new config structure
        const currentConfig = this.configManager.getConfig();
        switch (key) {
            case 'colors':
                updates.logging = { ...currentConfig.logging, colors: value };
                break;
            case 'logLevel':
                updates.logging = { ...currentConfig.logging, level: value };
                break;
            case 'outputFormat':
                updates.output = { ...currentConfig.output, format: value };
                break;
            case 'reportPath':
                updates.output = { ...currentConfig.output, directory: value };
                break;
            case 'plugins':
                updates.plugins = { ...currentConfig.plugins, enabled: value };
                break;
            default:
                updates[key] = value;
        }
        this.configManager.merge(updates);
    }
    async reset() {
        await this.configManager.reset();
    }
}
//# sourceMappingURL=config.js.map