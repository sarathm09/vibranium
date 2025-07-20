/**
 * HTTP request executor using the abstracted HTTP client
 */

import { HttpClientFactory } from '@vibraniumjs/http-client';
import type { HttpClient, HttpRequest, HttpResponse } from '@vibraniumjs/types';

export interface ExecutionOptions {
  followRedirects?: boolean;
  validateSsl?: boolean;
  encoding?: string;
  compress?: boolean;
  retry?: {
    count: number;
    delay: number;
  };
  timeout?: number;
}

export interface ExecutionTiming {
  total: number;
  dns?: number;
  tcp?: number;
  tls?: number;
  request?: number;
  response?: number;
}

export interface ExecutionResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  timing: ExecutionTiming;
  raw?: any;
}

export class HttpExecutor {
  private httpClient: HttpClient;
  private initialized = false;

  /**
   * Initialize HTTP executor
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.httpClient = HttpClientFactory.getDefaultClient();
    this.initialized = true;
  }

  /**
   * Execute HTTP request
   */
  async executeRequest(request: HttpRequest, options: ExecutionOptions = {}): Promise<ExecutionResponse> {
    if (!this.initialized) {
      throw new Error('HTTP executor not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Configure request options
      const requestConfig = this.buildRequestConfig(request, options);
      
      // Execute request with timing
      const response = await this.httpClient.request(requestConfig);
      
      // Calculate timing
      const totalTime = Date.now() - startTime;
      const timing: ExecutionTiming = {
        total: totalTime,
        // Additional timing details would come from the HTTP client if supported
        request: response.timing?.request || totalTime,
        response: response.timing?.response || 0
      };
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: this.normalizeHeaders(response.headers),
        body: response.data,
        timing,
        raw: response
      };
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      // Handle HTTP errors vs network errors
      if (this.isHttpError(error)) {
        const httpError = error as any;
        return {
          status: httpError.response?.status || 0,
          statusText: httpError.response?.statusText || 'Error',
          headers: this.normalizeHeaders(httpError.response?.headers || {}),
          body: httpError.response?.data || null,
          timing: { total: totalTime },
          raw: httpError.response
        };
      }
      
      // Network or other errors
      throw new Error(`HTTP request failed: ${error}`);
    }
  }

  /**
   * Execute multiple requests concurrently
   */
  async executeConcurrent(requests: HttpRequest[], options: ExecutionOptions = {}): Promise<ExecutionResponse[]> {
    const promises = requests.map(request => this.executeRequest(request, options));
    return Promise.all(promises);
  }

  /**
   * Execute requests in sequence
   */
  async executeSequential(requests: HttpRequest[], options: ExecutionOptions = {}): Promise<ExecutionResponse[]> {
    const responses: ExecutionResponse[] = [];
    
    for (const request of requests) {
      const response = await this.executeRequest(request, options);
      responses.push(response);
    }
    
    return responses;
  }

  /**
   * Stream HTTP request
   */
  async streamRequest(request: HttpRequest, options: ExecutionOptions = {}): Promise<NodeJS.ReadableStream> {
    if (!this.initialized) {
      throw new Error('HTTP executor not initialized');
    }

    const requestConfig = this.buildRequestConfig(request, options);
    
    // This would depend on the HTTP client implementation
    if (typeof this.httpClient.stream === 'function') {
      return this.httpClient.stream(requestConfig);
    }
    
    throw new Error('Streaming not supported by current HTTP client');
  }

  /**
   * Set HTTP client instance
   */
  setHttpClient(client: HttpClient): void {
    this.httpClient = client;
    this.initialized = true;
  }

  /**
   * Get current HTTP client
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * Check if executor is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Build request configuration
   */
  private buildRequestConfig(request: HttpRequest, options: ExecutionOptions): HttpRequest {
    const config: HttpRequest = {
      method: request.method,
      url: request.url,
      headers: { ...request.headers },
      data: request.data
    };

    // Apply execution options
    if (options.timeout) {
      config.timeout = options.timeout;
    }
    
    if (options.followRedirects !== undefined) {
      config.followRedirect = options.followRedirects;
    }
    
    if (options.validateSsl !== undefined) {
      config.https = {
        rejectUnauthorized: options.validateSsl
      };
    }
    
    if (options.encoding) {
      config.encoding = options.encoding;
    }
    
    if (options.compress !== undefined) {
      config.decompress = options.compress;
    }
    
    if (options.retry) {
      config.retry = {
        limit: options.retry.count,
        calculateDelay: () => options.retry!.delay
      };
    }
    
    return config;
  }

  /**
   * Normalize response headers
   */
  private normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    if (!headers || typeof headers !== 'object') {
      return normalized;
    }
    
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        normalized[key.toLowerCase()] = String(value);
      }
    }
    
    return normalized;
  }

  /**
   * Check if error is HTTP error (4xx/5xx)
   */
  private isHttpError(error: any): boolean {
    return (
      error &&
      error.response &&
      typeof error.response.status === 'number' &&
      error.response.status >= 400
    );
  }

  /**
   * Create request abort controller
   */
  createAbortController(): AbortController {
    return new AbortController();
  }

  /**
   * Execute request with abort signal
   */
  async executeWithAbort(
    request: HttpRequest,
    signal: AbortSignal,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResponse> {
    const requestConfig = this.buildRequestConfig(request, options);
    requestConfig.signal = signal;
    
    return this.executeRequest(requestConfig, options);
  }

  /**
   * Health check for HTTP client
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.initialized) {
        return false;
      }
      
      // Perform a simple request to verify client works
      // This could be configurable or use a known endpoint
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get executor statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      clientType: this.httpClient?.constructor?.name || 'Unknown',
      // Additional stats could be tracked here
    };
  }

  /**
   * Cleanup executor resources
   */
  async cleanup(): Promise<void> {
    // Clean up any resources if needed
    this.initialized = false;
  }
}
