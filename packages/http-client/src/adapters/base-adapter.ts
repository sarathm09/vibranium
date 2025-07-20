/**
 * Base HTTP adapter with common functionality
 */

import type { 
  HttpClient, 
  HttpRequest, 
  HttpResponse, 
  HttpClientConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RetryConfig
} from '../types';
import { HttpErrorHandler, RequestBuilder, ResponseParser } from '../utils';

export abstract class BaseHttpAdapter implements HttpClient {
  protected config: HttpClientConfig = {};
  protected requestInterceptors: RequestInterceptor[] = [];
  protected responseInterceptors: ResponseInterceptor[] = [];
  protected errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: HttpClientConfig = {}) {
    this.config = { ...config };
    
    // Set default interceptors if provided in config
    if (config.requestInterceptors) {
      this.requestInterceptors = [...config.requestInterceptors];
    }
    if (config.responseInterceptors) {
      this.responseInterceptors = [...config.responseInterceptors];
    }
    if (config.errorInterceptors) {
      this.errorInterceptors = [...config.errorInterceptors];
    }
  }

  setConfig(config: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  protected async applyRequestInterceptors(request: HttpRequest): Promise<HttpRequest> {
    let processedRequest = request;
    
    for (const interceptor of this.requestInterceptors) {
      processedRequest = await interceptor(processedRequest);
    }
    
    return processedRequest;
  }

  protected async applyResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  protected async applyErrorInterceptors(error: any): Promise<any> {
    let processedError = HttpErrorHandler.isHttpError(error) ? error : 
      HttpErrorHandler.createNetworkError(error.request || {}, error);
    
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError);
    }
    
    return processedError;
  }

  protected prepareRequest(config: HttpRequest): HttpRequest {
    // Merge with base config
    const mergedConfig = RequestBuilder.mergeConfig(this.config, config);
    
    // Build full URL
    mergedConfig.url = RequestBuilder.buildUrl(this.config.baseURL, mergedConfig.url);
    
    // Apply authentication
    if (mergedConfig.auth || this.config.auth) {
      const auth = mergedConfig.auth || this.config.auth!;
      mergedConfig.headers = RequestBuilder.applyAuth(mergedConfig.headers || {}, auth);
    }
    
    // Merge headers with defaults
    mergedConfig.headers = {
      ...RequestBuilder.normalizeHeaders(this.config.headers),
      ...RequestBuilder.normalizeHeaders(mergedConfig.headers)
    };
    
    // Auto-detect content type if not set
    if (mergedConfig.body && !mergedConfig.headers['content-type']) {
      const contentType = RequestBuilder.detectContentType(mergedConfig.body);
      if (contentType) {
        mergedConfig.headers['content-type'] = contentType;
      }
    }
    
    // Serialize body
    mergedConfig.body = RequestBuilder.serializeBody(
      mergedConfig.body, 
      mergedConfig.headers['content-type']
    );
    
    // Apply default retry config
    if (!mergedConfig.retries && this.config.retry) {
      mergedConfig.retries = this.config.retry;
    }
    
    // Validate request
    RequestBuilder.validateRequest(mergedConfig);
    
    return mergedConfig;
  }

  protected async executeWithRetry<T>(
    requestFn: () => Promise<HttpResponse<T>>,
    request: HttpRequest
  ): Promise<HttpResponse<T>> {
    const retryConfig = request.retries || this.config.retry;
    
    if (!retryConfig) {
      return requestFn();
    }
    
    let attempt = 0;
    let lastError: any;
    
    while (attempt <= retryConfig.count) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        const httpError = HttpErrorHandler.isHttpError(error) ? error :
          HttpErrorHandler.createNetworkError(request, error as Error);
        
        if (!HttpErrorHandler.shouldRetry(
          httpError,
          attempt,
          retryConfig.count,
          retryConfig.retryCondition
        )) {
          throw await this.applyErrorInterceptors(httpError);
        }
        
        if (attempt < retryConfig.count) {
          const delay = HttpErrorHandler.calculateRetryDelay(
            attempt,
            retryConfig.delay,
            retryConfig.backoff
          );
          await this.sleep(delay);
        }
        
        attempt++;
      }
    }
    
    throw await this.applyErrorInterceptors(lastError);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Abstract method to be implemented by specific adapters
  abstract request<T = any>(config: HttpRequest): Promise<HttpResponse<T>>;

  // Convenience methods - all adapters get these for free
  async get<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', body: data });
  }

  async put<T = any>(url: string, data?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', body: data });
  }

  async patch<T = any>(url: string, data?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', body: data });
  }

  async delete<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  async head<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'HEAD' });
  }

  async options<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'OPTIONS' });
  }
}