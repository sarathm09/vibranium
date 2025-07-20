/**
 * Configuration file loading and parsing utilities
 */
import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
export class ConfigLoader {
    /**
     * Load and parse a scenario file (YAML or JSON)
     */
    static async loadScenario(filePath, options = {}) {
        const { encoding = 'utf8', validate = true } = options;
        try {
            const content = await fs.readFile(filePath, encoding);
            const extension = path.extname(filePath).toLowerCase();
            let scenario;
            switch (extension) {
                case '.yaml':
                case '.yml':
                    scenario = parseYaml(content);
                    break;
                case '.json':
                    scenario = JSON.parse(content);
                    break;
                default:
                    throw new Error(`Unsupported file extension: ${extension}`);
            }
            if (validate) {
                this.validateScenario(scenario, filePath);
            }
            return scenario;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load scenario from ${filePath}: ${error.message}`);
            }
            throw new Error(`Failed to load scenario from ${filePath}: ${String(error)}`);
        }
    }
    /**
     * Load a configuration file (JSON or YAML)
     */
    static async loadConfig(filePath, options = {}) {
        const { encoding = 'utf8' } = options;
        try {
            const content = await fs.readFile(filePath, encoding);
            const extension = path.extname(filePath).toLowerCase();
            switch (extension) {
                case '.yaml':
                case '.yml':
                    return parseYaml(content);
                case '.json':
                    return JSON.parse(content);
                case '': // Handle .vibraniumrc without extension
                    try {
                        return JSON.parse(content);
                    }
                    catch {
                        return parseYaml(content);
                    }
                default:
                    throw new Error(`Unsupported configuration file extension: ${extension}`);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load config from ${filePath}: ${error.message}`);
            }
            throw new Error(`Failed to load config from ${filePath}: ${String(error)}`);
        }
    }
    /**
     * Save configuration to file
     */
    static async saveConfig(filePath, config, options = {}) {
        const { format = 'json', indent = 2 } = options;
        try {
            let content;
            switch (format) {
                case 'json':
                    content = JSON.stringify(config, null, indent);
                    break;
                case 'yaml':
                    const { stringify } = await import('yaml');
                    content = stringify(config, { indent });
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
            await fs.writeFile(filePath, content, 'utf8');
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save config to ${filePath}: ${error.message}`);
            }
            throw new Error(`Failed to save config to ${filePath}: ${String(error)}`);
        }
    }
    /**
     * Load environment file (.env, JSON, or YAML)
     */
    static async loadEnvironmentFile(filePath) {
        const extension = path.extname(filePath).toLowerCase();
        if (extension === '.env') {
            return this.loadEnvFile(filePath);
        }
        return this.loadConfig(filePath);
    }
    /**
     * Load .env file
     */
    static async loadEnvFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const env = {};
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                        env[key.trim()] = value;
                    }
                }
            }
            return env;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load .env file from ${filePath}: ${error.message}`);
            }
            throw new Error(`Failed to load .env file from ${filePath}: ${String(error)}`);
        }
    }
    /**
     * Basic scenario validation
     */
    static validateScenario(scenario, filePath) {
        if (!scenario || typeof scenario !== 'object') {
            throw new Error(`Invalid scenario format in ${filePath}: must be an object`);
        }
        if (!scenario.name || typeof scenario.name !== 'string') {
            throw new Error(`Invalid scenario in ${filePath}: 'name' field is required and must be a string`);
        }
        if (!scenario.steps || !Array.isArray(scenario.steps)) {
            throw new Error(`Invalid scenario in ${filePath}: 'steps' field is required and must be an array`);
        }
        for (let i = 0; i < scenario.steps.length; i++) {
            const step = scenario.steps[i];
            if (!step.name || typeof step.name !== 'string') {
                throw new Error(`Invalid step ${i} in ${filePath}: 'name' field is required and must be a string`);
            }
            if (!step.type || typeof step.type !== 'string') {
                throw new Error(`Invalid step ${i} in ${filePath}: 'type' field is required and must be a string`);
            }
        }
    }
}
//# sourceMappingURL=config-loader.js.map