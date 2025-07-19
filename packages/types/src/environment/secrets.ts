/**
 * Secrets management types
 */

import type { SecretConfig, SecretProvider } from './variable';

/**
 * Secrets vault configuration
 */
export interface SecretsVault {
  /** Vault provider */
  provider: 'vault' | 'aws' | 'azure' | 'gcp' | 'file' | 'env' | 'custom';
  
  /** Vault configuration */
  config: VaultConfig;
  
  /** Default secret prefix */
  prefix?: string;
  
  /** Encryption configuration */
  encryption?: EncryptionConfig;
}

/**
 * Vault configuration (provider-specific)
 */
export interface VaultConfig {
  /** HashiCorp Vault */
  vault?: {
    url: string;
    token?: string;
    roleId?: string;
    secretId?: string;
    namespace?: string;
    mount?: string;
  };
  
  /** AWS Secrets Manager */
  aws?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    role?: string;
  };
  
  /** Azure Key Vault */
  azure?: {
    vaultUrl: string;
    clientId?: string;
    clientSecret?: string;
    tenantId?: string;
  };
  
  /** Google Secret Manager */
  gcp?: {
    projectId: string;
    keyFilename?: string;
    credentials?: object;
  };
  
  /** File-based secrets */
  file?: {
    path: string;
    format: 'json' | 'yaml' | 'env';
    encoding?: string;
  };
  
  /** Custom provider config */
  custom?: Record<string, any>;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /** Encryption algorithm */
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  
  /** Encryption key source */
  keySource: 'env' | 'file' | 'kms' | 'vault';
  
  /** Key configuration */
  keyConfig?: {
    env?: string;
    file?: string;
    kms?: {
      provider: 'aws' | 'azure' | 'gcp';
      keyId: string;
      region?: string;
    };
    vault?: {
      path: string;
      key: string;
    };
  };
}

/**
 * Secret metadata
 */
export interface SecretMetadata {
  /** Secret name */
  name: string;
  
  /** Secret description */
  description?: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  modifiedAt: Date;
  
  /** Last accessed timestamp */
  lastAccessed?: Date;
  
  /** Secret version */
  version?: string;
  
  /** Secret tags */
  tags?: Record<string, string>;
  
  /** Expiration date */
  expiresAt?: Date;
  
  /** Rotation configuration */
  rotation?: RotationConfig;
}

/**
 * Secret rotation configuration
 */
export interface RotationConfig {
  /** Enable automatic rotation */
  enabled: boolean;
  
  /** Rotation interval (days) */
  intervalDays: number;
  
  /** Rotation function */
  rotationFunction?: string;
  
  /** Notification configuration */
  notifications?: {
    beforeDays: number;
    channels: string[];
  };
}

/**
 * Secret access audit
 */
export interface SecretAudit {
  /** Access timestamp */
  timestamp: Date;
  
  /** User/service that accessed the secret */
  accessor: string;
  
  /** Access method */
  method: 'get' | 'set' | 'delete' | 'list';
  
  /** Secret name */
  secretName: string;
  
  /** Success status */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Secrets manager with advanced features
 */
export interface AdvancedSecretsManager {
  /** Initialize secrets manager */
  initialize(vault: SecretsVault): Promise<void>;
  
  /** Get secret with metadata */
  getWithMetadata(name: string): Promise<{ value: string; metadata: SecretMetadata } | null>;
  
  /** Set secret with metadata */
  setWithMetadata(name: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
  
  /** List secrets with filtering */
  list(filter?: SecretFilter): Promise<SecretMetadata[]>;
  
  /** Delete secret */
  delete(name: string): Promise<void>;
  
  /** Rotate secret */
  rotate(name: string): Promise<void>;
  
  /** Get secret versions */
  getVersions(name: string): Promise<string[]>;
  
  /** Get specific version */
  getVersion(name: string, version: string): Promise<string | null>;
  
  /** Audit secret access */
  audit(filter?: AuditFilter): Promise<SecretAudit[]>;
  
  /** Validate secret access */
  validateAccess(name: string, accessor: string): Promise<boolean>;
}

/**
 * Secret filter for listing
 */
export interface SecretFilter {
  /** Filter by tags */
  tags?: Record<string, string>;
  
  /** Filter by creation date range */
  createdAfter?: Date;
  createdBefore?: Date;
  
  /** Filter by expiration */
  expiringBefore?: Date;
  
  /** Filter by name pattern */
  namePattern?: string;
}

/**
 * Audit filter
 */
export interface AuditFilter {
  /** Filter by accessor */
  accessor?: string;
  
  /** Filter by secret name */
  secretName?: string;
  
  /** Filter by method */
  method?: 'get' | 'set' | 'delete' | 'list';
  
  /** Filter by date range */
  after?: Date;
  before?: Date;
  
  /** Filter by success status */
  success?: boolean;
}