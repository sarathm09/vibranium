/**
 * HTTP configuration types
 */

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  retry?: RetryConfig;
  adapter?: string;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  proxy?: ProxyConfig;
}

export interface AuthConfig {
  type: 'basic' | 'bearer' | 'apikey' | 'oauth2';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  keyName?: string;
  location?: 'header' | 'query';
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffFactor?: number;
  maxDelay?: number;
  condition?: (error: any) => boolean;
}

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}