/**
 * Secure secrets handling with encryption and environment variable management
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { PathUtils } from '../filesystem/path-utils';
export class SecretsHandler {
    secrets = new Map();
    encryptionKey = null;
    config;
    constructor(config = {}) {
        this.config = {
            encrypted: config.encrypted ?? false,
            algorithm: config.algorithm ?? 'aes-256-gcm',
            keyFile: config.keyFile ?? '.vibranium.key',
            envPrefix: config.envPrefix ?? 'VIBRANIUM_'
        };
    }
    /**
     * Initialize the secrets handler
     */
    async initialize() {
        if (this.config.encrypted) {
            await this.loadEncryptionKey();
        }
        await this.loadSecretsFromEnvironment();
    }
    /**
     * Add a secret
     */
    async addSecret(key, value, encrypt = this.config.encrypted) {
        if (!key || typeof value !== 'string') {
            throw new Error('Invalid secret key or value');
        }
        const processedValue = encrypt ? this.encrypt(value) : value;
        this.secrets.set(key, {
            key,
            value: processedValue,
            encrypted: encrypt,
            source: 'vault',
            lastUpdated: new Date()
        });
    }
    /**
     * Get a secret value
     */
    getSecret(key) {
        const entry = this.secrets.get(key);
        if (!entry) {
            return undefined;
        }
        return entry.encrypted ? this.decrypt(entry.value) : entry.value;
    }
    /**
     * Check if a secret exists
     */
    hasSecret(key) {
        return this.secrets.has(key);
    }
    /**
     * Remove a secret
     */
    removeSecret(key) {
        return this.secrets.delete(key);
    }
    /**
     * Get all secret keys (not values)
     */
    getSecretKeys() {
        return Array.from(this.secrets.keys()).sort();
    }
    /**
     * Get secret metadata
     */
    getSecretMetadata(key) {
        const entry = this.secrets.get(key);
        if (!entry) {
            return undefined;
        }
        return {
            key: entry.key,
            encrypted: entry.encrypted,
            source: entry.source,
            lastUpdated: entry.lastUpdated
        };
    }
    /**
     * Load secrets from a file
     */
    async loadSecretsFromFile(filePath, format = 'json') {
        try {
            if (!await PathUtils.exists(filePath)) {
                return;
            }
            const content = await fs.readFile(filePath, 'utf8');
            let secrets;
            if (format === 'env') {
                secrets = this.parseEnvFile(content);
            }
            else {
                secrets = JSON.parse(content);
            }
            for (const [key, value] of Object.entries(secrets)) {
                if (typeof value === 'string') {
                    const isEncrypted = this.isEncryptedValue(value);
                    this.secrets.set(key, {
                        key,
                        value,
                        encrypted: isEncrypted,
                        source: 'file',
                        lastUpdated: new Date()
                    });
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to load secrets from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Save secrets to a file
     */
    async saveSecretsToFile(filePath, format = 'json') {
        try {
            await PathUtils.ensureDirectory(PathUtils.getDirname(filePath));
            const secretsObj = {};
            for (const [key, entry] of this.secrets) {
                secretsObj[key] = entry.value;
            }
            let content;
            if (format === 'env') {
                content = this.stringifyEnvFile(secretsObj);
            }
            else {
                content = JSON.stringify(secretsObj, null, 2);
            }
            await fs.writeFile(filePath, content, 'utf8');
        }
        catch (error) {
            throw new Error(`Failed to save secrets to ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Load secrets from environment variables
     */
    async loadSecretsFromEnvironment() {
        for (const [key, value] of Object.entries(process.env)) {
            if (key.startsWith(this.config.envPrefix) && value) {
                const secretKey = key.substring(this.config.envPrefix.length);
                this.secrets.set(secretKey, {
                    key: secretKey,
                    value,
                    encrypted: false,
                    source: 'env',
                    lastUpdated: new Date()
                });
            }
        }
    }
    /**
     * Export secrets for use in templates
     */
    exportSecrets() {
        const exported = {};
        for (const [key, entry] of this.secrets) {
            exported[key] = entry.encrypted ? this.decrypt(entry.value) : entry.value;
        }
        return exported;
    }
    /**
     * Generate a new encryption key
     */
    async generateEncryptionKey() {
        const key = crypto.randomBytes(32).toString('hex');
        await this.saveEncryptionKey(key);
        this.encryptionKey = key;
        return key;
    }
    /**
     * Encrypt a value
     */
    encrypt(value) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }
        const encrypted = CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
        return `encrypted:${encrypted}`;
    }
    /**
     * Decrypt a value
     */
    decrypt(encryptedValue) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }
        if (!encryptedValue.startsWith('encrypted:')) {
            return encryptedValue; // Not encrypted
        }
        const encrypted = encryptedValue.substring(10);
        const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
    /**
     * Check if a value is encrypted
     */
    isEncryptedValue(value) {
        return value.startsWith('encrypted:');
    }
    /**
     * Load encryption key from file
     */
    async loadEncryptionKey() {
        try {
            if (await PathUtils.exists(this.config.keyFile)) {
                this.encryptionKey = await fs.readFile(this.config.keyFile, 'utf8');
            }
            else {
                await this.generateEncryptionKey();
            }
        }
        catch (error) {
            throw new Error(`Failed to load encryption key: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Save encryption key to file
     */
    async saveEncryptionKey(key) {
        try {
            await fs.writeFile(this.config.keyFile, key, 'utf8');
            // Set restrictive permissions
            await fs.chmod(this.config.keyFile, 0o600);
        }
        catch (error) {
            throw new Error(`Failed to save encryption key: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Parse .env file format
     */
    parseEnvFile(content) {
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
    /**
     * Convert object to .env file format
     */
    stringifyEnvFile(obj) {
        const lines = [];
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Quote values that contain spaces or special characters
                const quotedValue = /[\s"'\\]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
                lines.push(`${key}=${quotedValue}`);
            }
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=secrets-handler.js.map