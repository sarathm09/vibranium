/**
 * Local types for HTTP client package
 * This is a standalone version to avoid dependency issues
 */

// Authentication types
export interface HttpAuth {
  type: 'bearer' | 'basic' | 'custom';
  token?: string;
  username?: string;
  password?: string;
  headers?: Record<string, string>;
}

// Retry configuration
export interface RetryConfig {
  count: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retryCondition?: (error: any) => boolean;
  retryOn?: number[];
}

// Timeout configuration
export interface TimeoutConfig {
  request?: number;
  connect?: number;
  response?: number;
}

// Interceptor types
export interface RequestInterceptor {
  (config: HttpRequest): HttpRequest | Promise<HttpRequest>;
}

export interface ResponseInterceptor {
  (response: HttpResponse): HttpResponse | Promise<HttpResponse>;
}

export interface ErrorInterceptor {
  (error: HttpError): HttpError | Promise<HttpError>;
}

// Client configuration
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number | TimeoutConfig;
  headers?: Record<string, string>;
  auth?: HttpAuth;
  retry?: RetryConfig;
  followRedirects?: boolean;
  maxRedirects?: number;
  validateStatus?: (status: number) => boolean;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
  errorInterceptors?: ErrorInterceptor[];
  proxy?: string;
  rejectUnauthorized?: boolean;
}

export interface HttpRequest {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number | TimeoutConfig;
  retries?: RetryConfig;
  auth?: HttpAuth;
  followRedirects?: boolean;
  maxRedirects?: number;
  validateStatus?: (status: number) => boolean;
  proxy?: string;
  responseType?: 'json' | 'text' | 'blob' | 'stream' | 'buffer';
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  request: HttpRequest;
  duration: number;
}

export interface HttpClient {
  // Core request method
  request<T = any>(config: HttpRequest): Promise<HttpResponse<T>>;
  
  // Convenience methods
  get<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  post<T = any>(url: string, data?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  put<T = any>(url: string, data?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  head<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  options<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  
  // Configuration and interceptors
  setConfig?(config: Partial<HttpClientConfig>): void;
  addRequestInterceptor?(interceptor: RequestInterceptor): void;
  addResponseInterceptor?(interceptor: ResponseInterceptor): void;
  addErrorInterceptor?(interceptor: ErrorInterceptor): void;
}

export type HttpMethod = 
  | 'GET' 
  | 'POST' 
  | 'PUT' 
  | 'PATCH' 
  | 'DELETE' 
  | 'HEAD' 
  | 'OPTIONS';

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: HttpResponse;
  request?: HttpRequest;
  isHttpError: true;
}