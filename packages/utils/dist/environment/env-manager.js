/**
 * Environment management with loading, switching, and validation
 */
import path from 'path';
import { ConfigLoader } from '../filesystem/config-loader';
import { PathUtils } from '../filesystem/path-utils';
import { FileDiscovery } from '../filesystem/file-discovery';
export class EnvironmentManager {
    environments = new Map();
    currentEnvironment = null;
    secrets = {};
    options;
    constructor(options = {}) {
        this.options = {
            environmentsDirectory: options.environmentsDirectory || './environments',
            defaultEnvironment: options.defaultEnvironment || 'local',
            secretsFile: options.secretsFile || '.env',
            cacheEnvironments: options.cacheEnvironments ?? true
        };
    }
    /**
     * Initialize the environment manager
     */
    async initialize() {
        await this.loadSecrets();
        await this.discoverEnvironments();
        // Set default environment if available
        if (this.environments.has(this.options.defaultEnvironment)) {
            await this.setCurrentEnvironment(this.options.defaultEnvironment);
        }
        else if (this.environments.size > 0) {
            const firstEnv = Array.from(this.environments.keys())[0];
            await this.setCurrentEnvironment(firstEnv);
        }
    }
    /**
     * Load a specific environment
     */
    async loadEnvironment(name) {
        // Check cache first
        if (this.options.cacheEnvironments && this.environments.has(name)) {
            return this.environments.get(name);
        }
        const envFile = await this.findEnvironmentFile(name);
        if (!envFile) {
            throw new Error(`Environment '${name}' not found`);
        }
        try {
            const envData = await ConfigLoader.loadConfig(envFile);
            // Validate environment structure
            this.validateEnvironment(envData, name);
            // Process secrets
            const processedEnv = await this.processEnvironmentSecrets(envData);
            if (this.options.cacheEnvironments) {
                this.environments.set(name, processedEnv);
            }
            return processedEnv;
        }
        catch (error) {
            throw new Error(`Failed to load environment '${name}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get all available environments
     */
    async getAllEnvironments() {
        const result = {};
        for (const [name] of this.environments) {
            result[name] = await this.loadEnvironment(name);
        }
        return result;
    }
    /**
     * Get list of available environment names
     */
    getEnvironmentNames() {
        return Array.from(this.environments.keys()).sort();
    }
    /**
     * Set the current active environment
     */
    async setCurrentEnvironment(name) {
        const environment = await this.loadEnvironment(name);
        this.currentEnvironment = name;
        // Optionally set process.env variables
        if (environment.variables) {
            for (const [key, value] of Object.entries(environment.variables)) {
                if (typeof value === 'string') {
                    process.env[key] = value;
                }
            }
        }
    }
    /**
     * Get the current active environment
     */
    getCurrentEnvironment() {
        return this.currentEnvironment;
    }
    /**
     * Get the current environment data
     */
    async getCurrentEnvironmentData() {
        if (!this.currentEnvironment) {
            return null;
        }
        return this.loadEnvironment(this.currentEnvironment);
    }
    /**
     * Reload all environments (clear cache)
     */
    async reload() {
        this.environments.clear();
        await this.initialize();
    }
    /**
     * Create a new environment
     */
    async createEnvironment(name, environment) {
        this.validateEnvironment(environment, name);
        const envFile = path.join(this.options.environmentsDirectory, `${name}.json`);
        await PathUtils.ensureDirectory(this.options.environmentsDirectory);
        await ConfigLoader.saveConfig(envFile, environment);
        if (this.options.cacheEnvironments) {
            this.environments.set(name, environment);
        }
    }
    /**
     * Update an existing environment
     */
    async updateEnvironment(name, updates) {
        const existing = await this.loadEnvironment(name);
        const updated = { ...existing, ...updates };
        this.validateEnvironment(updated, name);
        const envFile = await this.findEnvironmentFile(name);
        if (!envFile) {
            throw new Error(`Environment '${name}' not found`);
        }
        await ConfigLoader.saveConfig(envFile, updated);
        if (this.options.cacheEnvironments) {
            this.environments.set(name, updated);
        }
    }
    /**
     * Delete an environment
     */
    async deleteEnvironment(name) {
        const envFile = await this.findEnvironmentFile(name);
        if (!envFile) {
            throw new Error(`Environment '${name}' not found`);
        }
        await PathUtils.delete(envFile);
        this.environments.delete(name);
        if (this.currentEnvironment === name) {
            this.currentEnvironment = null;
        }
    }
    /**
     * Discover available environments
     */
    async discoverEnvironments() {
        if (!await PathUtils.exists(this.options.environmentsDirectory)) {
            return;
        }
        const envFiles = await FileDiscovery.findEnvironmentFiles(path.dirname(this.options.environmentsDirectory));
        for (const envFile of envFiles) {
            const envName = PathUtils.getBasename(envFile, false);
            if (!this.environments.has(envName)) {
                this.environments.set(envName, {}); // Placeholder, will be loaded on demand
            }
        }
    }
    /**
     * Find environment file by name
     */
    async findEnvironmentFile(name) {
        const extensions = ['json', 'yaml', 'yml'];
        for (const ext of extensions) {
            const envFile = path.join(this.options.environmentsDirectory, `${name}.${ext}`);
            if (await PathUtils.exists(envFile)) {
                return envFile;
            }
        }
        return null;
    }
    /**
     * Load secrets from file
     */
    async loadSecrets() {
        try {
            const secretsPath = PathUtils.resolve(process.cwd(), this.options.secretsFile);
            if (await PathUtils.exists(secretsPath)) {
                this.secrets = await ConfigLoader.loadEnvironmentFile(secretsPath);
            }
        }
        catch (error) {
            // Secrets file is optional, don't fail if it's not found
        }
    }
    /**
     * Process environment secrets (replace $.env.* references)
     */
    async processEnvironmentSecrets(environment) {
        const processed = { ...environment };
        if (environment.secrets) {
            const processedSecrets = {};
            for (const [key, value] of Object.entries(environment.secrets)) {
                if (typeof value === 'string' && value.startsWith('$.env.')) {
                    const secretKey = value.substring(6); // Remove '$.env.'
                    processedSecrets[key] = this.secrets[secretKey] || process.env[secretKey] || '';
                }
                else {
                    processedSecrets[key] = value;
                }
            }
            processed.secrets = processedSecrets;
        }
        return processed;
    }
    /**
     * Validate environment structure
     */
    validateEnvironment(environment, name) {
        if (!environment || typeof environment !== 'object') {
            throw new Error(`Invalid environment '${name}': must be an object`);
        }
        if (environment.environment && typeof environment.environment !== 'string') {
            throw new Error(`Invalid environment '${name}': 'environment' field must be a string`);
        }
        if (environment.variables && typeof environment.variables !== 'object') {
            throw new Error(`Invalid environment '${name}': 'variables' field must be an object`);
        }
        if (environment.secrets && typeof environment.secrets !== 'object') {
            throw new Error(`Invalid environment '${name}': 'secrets' field must be an object`);
        }
    }
}
//# sourceMappingURL=env-manager.js.map