/**
 * Authentication handlers for API requests
 */

import type { HttpRequest } from '@vibraniumjs/types';

export interface AuthConfig {
  type: 'basic' | 'bearer' | 'apikey' | 'oauth2' | 'custom';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  keyName?: string;
  location?: 'header' | 'query' | 'body';
  scheme?: string;
  config?: Record<string, any>;
}

export class AuthHandlers {
  private handlers: Map<string, (request: HttpRequest, config: AuthConfig) => void>;

  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  /**
   * Apply authentication to request
   */
  async applyAuth(request: HttpRequest, authConfig: AuthConfig): Promise<void> {
    const handler = this.handlers.get(authConfig.type);
    if (!handler) {
      throw new Error(`Unsupported authentication type: ${authConfig.type}`);
    }

    handler(request, authConfig);
  }

  /**
   * Register custom auth handler
   */
  registerHandler(type: string, handler: (request: HttpRequest, config: AuthConfig) => void): void {
    this.handlers.set(type, handler);
  }

  /**
   * Check if auth type is supported
   */
  supportsAuthType(type: string): boolean {
    return this.handlers.has(type);
  }

  /**
   * Get supported auth types
   */
  getSupportedTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Register default authentication handlers
   */
  private registerDefaultHandlers(): void {
    // Basic Authentication
    this.handlers.set('basic', (request, config) => {
      if (!config.username || !config.password) {
        throw new Error('Basic auth requires username and password');
      }
      
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      request.headers = request.headers || {};
      request.headers['Authorization'] = `Basic ${credentials}`;
    });

    // Bearer Token Authentication
    this.handlers.set('bearer', (request, config) => {
      if (!config.token) {
        throw new Error('Bearer auth requires token');
      }
      
      request.headers = request.headers || {};
      request.headers['Authorization'] = `Bearer ${config.token}`;
    });

    // API Key Authentication
    this.handlers.set('apikey', (request, config) => {
      if (!config.apiKey) {
        throw new Error('API key auth requires apiKey');
      }
      
      const keyName = config.keyName || 'X-API-Key';
      const location = config.location || 'header';
      
      switch (location) {
        case 'header':
          request.headers = request.headers || {};
          request.headers[keyName] = config.apiKey;
          break;
          
        case 'query':
          if (!request.searchParams) {
            request.searchParams = new URLSearchParams();
          }
          request.searchParams.set(keyName, config.apiKey);
          break;
          
        case 'body':
          if (typeof request.data === 'object' && request.data !== null) {
            request.data[keyName] = config.apiKey;
          } else {
            throw new Error('Cannot add API key to non-object body');
          }
          break;
          
        default:
          throw new Error(`Unsupported API key location: ${location}`);
      }
    });

    // OAuth2 Authentication
    this.handlers.set('oauth2', (request, config) => {
      if (!config.token) {
        throw new Error('OAuth2 requires access token');
      }
      
      request.headers = request.headers || {};
      request.headers['Authorization'] = `Bearer ${config.token}`;
    });

    // Custom Authentication
    this.handlers.set('custom', (request, config) => {
      if (!config.scheme || !config.token) {
        throw new Error('Custom auth requires scheme and token');
      }
      
      request.headers = request.headers || {};
      request.headers['Authorization'] = `${config.scheme} ${config.token}`;
      
      // Apply additional headers if specified
      if (config.config?.headers) {
        Object.assign(request.headers, config.config.headers);
      }
    });
  }

  /**
   * Validate auth configuration
   */
  validateAuthConfig(config: AuthConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.type) {
      errors.push('Auth type is required');
      return { valid: false, errors };
    }
    
    if (!this.supportsAuthType(config.type)) {
      errors.push(`Unsupported auth type: ${config.type}`);
      return { valid: false, errors };
    }
    
    // Type-specific validation
    switch (config.type) {
      case 'basic':
        if (!config.username) errors.push('Basic auth requires username');
        if (!config.password) errors.push('Basic auth requires password');
        break;
        
      case 'bearer':
      case 'oauth2':
        if (!config.token) errors.push(`${config.type} auth requires token`);
        break;
        
      case 'apikey':
        if (!config.apiKey) errors.push('API key auth requires apiKey');
        if (config.location && !['header', 'query', 'body'].includes(config.location)) {
          errors.push('API key location must be header, query, or body');
        }
        break;
        
      case 'custom':
        if (!config.scheme) errors.push('Custom auth requires scheme');
        if (!config.token) errors.push('Custom auth requires token');
        break;
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Create auth config from environment variables
   */
  createFromEnv(type: string, envPrefix = 'VIBRANIUM_AUTH'): AuthConfig | null {
    const getEnv = (key: string) => process.env[`${envPrefix}_${key}`];
    
    switch (type) {
      case 'basic':
        const username = getEnv('USERNAME');
        const password = getEnv('PASSWORD');
        if (username && password) {
          return { type: 'basic', username, password };
        }
        break;
        
      case 'bearer':
        const bearerToken = getEnv('TOKEN') || getEnv('BEARER_TOKEN');
        if (bearerToken) {
          return { type: 'bearer', token: bearerToken };
        }
        break;
        
      case 'apikey':
        const apiKey = getEnv('API_KEY');
        const keyName = getEnv('KEY_NAME');
        const location = getEnv('LOCATION') as 'header' | 'query' | 'body';
        if (apiKey) {
          return { type: 'apikey', apiKey, keyName, location };
        }
        break;
        
      case 'oauth2':
        const oauthToken = getEnv('OAUTH_TOKEN') || getEnv('ACCESS_TOKEN');
        if (oauthToken) {
          return { type: 'oauth2', token: oauthToken };
        }
        break;
        
      case 'custom':
        const scheme = getEnv('SCHEME');
        const customToken = getEnv('CUSTOM_TOKEN');
        if (scheme && customToken) {
          return { type: 'custom', scheme, token: customToken };
        }
        break;
    }
    
    return null;
  }

  /**
   * Sanitize auth config for logging (remove sensitive data)
   */
  sanitizeForLogging(config: AuthConfig): Partial<AuthConfig> {
    const sanitized: Partial<AuthConfig> = {
      type: config.type,
      location: config.location,
      scheme: config.scheme,
      keyName: config.keyName
    };
    
    // Mask sensitive values
    if (config.username) sanitized.username = '***';
    if (config.password) sanitized.password = '***';
    if (config.token) sanitized.token = config.token.slice(0, 8) + '***';
    if (config.apiKey) sanitized.apiKey = config.apiKey.slice(0, 8) + '***';
    
    return sanitized;
  }
}