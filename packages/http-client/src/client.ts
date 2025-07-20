/**
 * HTTP client factory and configuration management
 */

import type { HttpClient, HttpClientConfig } from './types';

export type HttpAdapterType = 'got' | 'axios' | 'fetch';

export interface HttpClientFactoryOptions {
  adapter?: HttpAdapterType;
  config?: HttpClientConfig;
}

export class HttpClientFactory {
  private static defaultClient: HttpClient | null = null;
  private static defaultConfig: HttpClientConfig = {};

  /**
   * Set the default client instance
   */
  static setDefaultClient(client: HttpClient): void {
    this.defaultClient = client;
  }

  /**
   * Set default configuration for all new clients
   */
  static setDefaultConfig(config: HttpClientConfig): void {
    this.defaultConfig = { ...config };
  }

  /**
   * Get the default client (lazy-loaded Got adapter)
   */
  static getDefaultClient(): HttpClient {
    if (!this.defaultClient) {
      this.defaultClient = this.createGotClient(this.defaultConfig);
    }
    return this.defaultClient;
  }

  /**
   * Create a new HTTP client with specified options
   */
  static createClient(options: HttpClientFactoryOptions = {}): HttpClient {
    const config = { ...this.defaultConfig, ...options.config };
    const adapter = options.adapter || 'got';

    switch (adapter) {
      case 'got':
        return this.createGotClient(config);
      case 'axios':
        return this.createAxiosClient(config);
      case 'fetch':
        return this.createFetchClient(config);
      default:
        throw new Error(`Unknown HTTP adapter: ${adapter}`);
    }
  }

  /**
   * Create a Got-based HTTP client
   */
  static createGotClient(config: HttpClientConfig = {}): HttpClient {
    const { GotAdapter } = require('./adapters/got-adapter');
    return new GotAdapter({ ...this.defaultConfig, ...config });
  }

  /**
   * Create an Axios-based HTTP client
   */
  static createAxiosClient(config: HttpClientConfig = {}): HttpClient {
    const { AxiosAdapter } = require('./adapters/axios-adapter');
    return new AxiosAdapter({ ...this.defaultConfig, ...config });
  }

  /**
   * Create a Fetch-based HTTP client
   */
  static createFetchClient(config: HttpClientConfig = {}): HttpClient {
    const { FetchAdapter } = require('./adapters/fetch-adapter');
    return new FetchAdapter({ ...this.defaultConfig, ...config });
  }

  /**
   * Check if an adapter is available
   */
  static isAdapterAvailable(adapter: HttpAdapterType): boolean {
    try {
      switch (adapter) {
        case 'got':
          require('got');
          return true;
        case 'axios':
          require('axios');
          return true;
        case 'fetch':
          // Check if fetch is available (Node.js 18+ or with polyfill)
          return typeof fetch !== 'undefined';
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get list of available adapters
   */
  static getAvailableAdapters(): HttpAdapterType[] {
    const adapters: HttpAdapterType[] = [];
    
    if (this.isAdapterAvailable('got')) {
      adapters.push('got');
    }
    if (this.isAdapterAvailable('axios')) {
      adapters.push('axios');
    }
    if (this.isAdapterAvailable('fetch')) {
      adapters.push('fetch');
    }
    
    return adapters;
  }

  /**
   * Reset factory to default state
   */
  static reset(): void {
    this.defaultClient = null;
    this.defaultConfig = {};
  }
}