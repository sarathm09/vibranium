/**
 * Secure secrets handling with encryption and environment variable management
 */
import type { VariableMap } from '@vibraniumjs/types';
export interface SecretConfig {
    encrypted?: boolean;
    algorithm?: string;
    keyFile?: string;
    envPrefix?: string;
}
export interface SecretEntry {
    key: string;
    value: string;
    encrypted: boolean;
    source: 'file' | 'env' | 'vault';
    lastUpdated?: Date;
}
export declare class SecretsHandler {
    private secrets;
    private encryptionKey;
    private config;
    constructor(config?: SecretConfig);
    /**
     * Initialize the secrets handler
     */
    initialize(): Promise<void>;
    /**
     * Add a secret
     */
    addSecret(key: string, value: string, encrypt?: boolean): Promise<void>;
    /**
     * Get a secret value
     */
    getSecret(key: string): string | undefined;
    /**
     * Check if a secret exists
     */
    hasSecret(key: string): boolean;
    /**
     * Remove a secret
     */
    removeSecret(key: string): boolean;
    /**
     * Get all secret keys (not values)
     */
    getSecretKeys(): string[];
    /**
     * Get secret metadata
     */
    getSecretMetadata(key: string): Omit<SecretEntry, 'value'> | undefined;
    /**
     * Load secrets from a file
     */
    loadSecretsFromFile(filePath: string, format?: 'json' | 'env'): Promise<void>;
    /**
     * Save secrets to a file
     */
    saveSecretsToFile(filePath: string, format?: 'json' | 'env'): Promise<void>;
    /**
     * Load secrets from environment variables
     */
    loadSecretsFromEnvironment(): Promise<void>;
    /**
     * Export secrets for use in templates
     */
    exportSecrets(): VariableMap;
    /**
     * Generate a new encryption key
     */
    generateEncryptionKey(): Promise<string>;
    /**
     * Encrypt a value
     */
    private encrypt;
    /**
     * Decrypt a value
     */
    private decrypt;
    /**
     * Check if a value is encrypted
     */
    private isEncryptedValue;
    /**
     * Load encryption key from file
     */
    private loadEncryptionKey;
    /**
     * Save encryption key to file
     */
    private saveEncryptionKey;
    /**
     * Parse .env file format
     */
    private parseEnvFile;
    /**
     * Convert object to .env file format
     */
    private stringifyEnvFile;
}
//# sourceMappingURL=secrets-handler.d.ts.map