/**
 * Environment management with loading, switching, and validation
 */
import type { Environment } from '@vibraniumjs/types';
export interface EnvironmentManagerOptions {
    environmentsDirectory?: string;
    defaultEnvironment?: string;
    secretsFile?: string;
    cacheEnvironments?: boolean;
}
export declare class EnvironmentManager {
    private environments;
    private currentEnvironment;
    private secrets;
    private options;
    constructor(options?: EnvironmentManagerOptions);
    /**
     * Initialize the environment manager
     */
    initialize(): Promise<void>;
    /**
     * Load a specific environment
     */
    loadEnvironment(name: string): Promise<Environment>;
    /**
     * Get all available environments
     */
    getAllEnvironments(): Promise<Record<string, Environment>>;
    /**
     * Get list of available environment names
     */
    getEnvironmentNames(): string[];
    /**
     * Set the current active environment
     */
    setCurrentEnvironment(name: string): Promise<void>;
    /**
     * Get the current active environment
     */
    getCurrentEnvironment(): string | null;
    /**
     * Get the current environment data
     */
    getCurrentEnvironmentData(): Promise<Environment | null>;
    /**
     * Reload all environments (clear cache)
     */
    reload(): Promise<void>;
    /**
     * Create a new environment
     */
    createEnvironment(name: string, environment: Environment): Promise<void>;
    /**
     * Update an existing environment
     */
    updateEnvironment(name: string, updates: Partial<Environment>): Promise<void>;
    /**
     * Delete an environment
     */
    deleteEnvironment(name: string): Promise<void>;
    /**
     * Discover available environments
     */
    private discoverEnvironments;
    /**
     * Find environment file by name
     */
    private findEnvironmentFile;
    /**
     * Load secrets from file
     */
    private loadSecrets;
    /**
     * Process environment secrets (replace $.env.* references)
     */
    private processEnvironmentSecrets;
    /**
     * Validate environment structure
     */
    private validateEnvironment;
}
//# sourceMappingURL=env-manager.d.ts.map