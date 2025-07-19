/**
 * HTTP client interface types
 */

import type { HttpRequest, HttpRequestConfig } from './request';
import type { HttpResponse } from './response';
import type { HttpConfig } from './config';
import type { HttpInterceptor } from './interceptor';

/**
 * Core HTTP client interface
 */
export interface HttpClient {
  /** Make a generic HTTP request */
  request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
  
  /** GET request */
  get<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  
  /** POST request */
  post<T = any>(url: string, data?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  
  /** PUT request */
  put<T = any>(url: string, data?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  
  /** PATCH request */
  patch<T = any>(url: string, data?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  
  /** DELETE request */
  delete<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  
  /** HEAD request */
  head<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  
  /** OPTIONS request */
  options<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  
  /** Add request interceptor */
  addRequestInterceptor(interceptor: HttpInterceptor['request']): number;
  
  /** Add response interceptor */
  addResponseInterceptor(interceptor: HttpInterceptor['response']): number;
  
  /** Remove interceptor */
  removeInterceptor(id: number): void;
  
  /** Create a new instance with different config */
  create(config?: Partial<HttpConfig>): HttpClient;
  
  /** Get current configuration */
  getConfig(): HttpConfig;
  
  /** Update configuration */
  setConfig(config: Partial<HttpConfig>): void;
}

/**
 * HTTP client factory interface
 */
export interface HttpClientFactory {
  /** Create HTTP client instance */
  create(config?: HttpConfig): HttpClient;
  
  /** Get default configuration */
  getDefaultConfig(): HttpConfig;
  
  /** Set default configuration */
  setDefaultConfig(config: Partial<HttpConfig>): void;
  
  /** Register adapter */
  registerAdapter(name: string, adapter: HttpAdapter): void;
  
  /** Get available adapters */
  getAdapters(): string[];
}

/**
 * HTTP adapter interface
 */
export interface HttpAdapter {
  /** Adapter name */
  name: string;
  
  /** Execute HTTP request */
  execute<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
  
  /** Check if adapter is available */
  isAvailable(): boolean;
  
  /** Initialize adapter */
  initialize?(config: any): Promise<void>;
  
  /** Cleanup adapter */
  cleanup?(): Promise<void>;
}

/**
 * HTTP client builder for fluent API
 */
export interface HttpClientBuilder {
  /** Set base URL */
  baseURL(url: string): HttpClientBuilder;
  
  /** Set timeout */
  timeout(ms: number): HttpClientBuilder;
  
  /** Set default headers */
  headers(headers: Record<string, string>): HttpClientBuilder;
  
  /** Set authentication */
  auth(auth: AuthConfig): HttpClientBuilder;
  
  /** Set retry configuration */
  retry(config: RetryConfig): HttpClientBuilder;
  
  /** Add interceptor */
  interceptor(interceptor: HttpInterceptor): HttpClientBuilder;
  
  /** Set adapter */
  adapter(name: string): HttpClientBuilder;
  
  /** Build the client */
  build(): HttpClient;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type: 'basic' | 'bearer' | 'apikey' | 'oauth2' | 'custom';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  keyName?: string;
  location?: 'header' | 'query' | 'body';
  scheme?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  scopes?: string[];
  custom?: Record<string, any>;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  
  /** Initial delay (ms) */
  delay: number;
  
  /** Exponential backoff factor */
  backoffFactor?: number;
  
  /** Maximum delay (ms) */
  maxDelay?: number;
  
  /** Jitter for retry delays */
  jitter?: boolean;
  
  /** Retry condition */
  condition?: (error: any, attempt: number) => boolean;
  
  /** Retry on status codes */
  retryOnStatus?: number[];
  
  /** Don't retry on status codes */
  noRetryOnStatus?: number[];
}

/**
 * HTTP client metrics
 */
export interface HttpClientMetrics {
  /** Total requests made */
  totalRequests: number;
  
  /** Successful requests */
  successfulRequests: number;
  
  /** Failed requests */
  failedRequests: number;
  
  /** Average response time (ms) */
  averageResponseTime: number;
  
  /** Request rate (requests/second) */
  requestRate: number;
  
  /** Error rate (%) */
  errorRate: number;
  
  /** Retry count */
  retryCount: number;
  
  /** Cache hit rate (%) */
  cacheHitRate: number;
}

/**
 * HTTP client with metrics
 */
export interface HttpClientWithMetrics extends HttpClient {
  /** Get metrics */
  getMetrics(): HttpClientMetrics;
  
  /** Reset metrics */
  resetMetrics(): void;
  
  /** Enable/disable metrics collection */
  setMetricsEnabled(enabled: boolean): void;
}

/**
 * HTTP client pool for connection management
 */
export interface HttpClientPool {
  /** Get client from pool */
  getClient(key?: string): HttpClient;
  
  /** Return client to pool */
  returnClient(client: HttpClient, key?: string): void;
  
  /** Create new client */
  createClient(config?: HttpConfig): HttpClient;
  
  /** Destroy client */
  destroyClient(client: HttpClient): void;
  
  /** Get pool stats */
  getStats(): PoolStats;
  
  /** Clear pool */
  clear(): void;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  /** Active clients */
  active: number;
  
  /** Idle clients */
  idle: number;
  
  /** Total clients created */
  created: number;
  
  /** Total clients destroyed */
  destroyed: number;
  
  /** Pool utilization (%) */
  utilization: number;
}