/**
 * Fetch HTTP client adapter (modern web standard implementation)
 */

import type { HttpRequest, HttpResponse, HttpClientConfig } from '../types';
import { BaseHttpAdapter } from './base-adapter';
import { HttpErrorHandler, RequestBuilder, ResponseParser } from '../utils';

export class FetchAdapter extends BaseHttpAdapter {
  private agent?: any;
  private httpsAgent?: any;

  constructor(config: HttpClientConfig = {}) {
    super(config);
    this.setupAgents(config);
  }

  private setupAgents(config: HttpClientConfig): void {
    // Set up proxy agents if needed
    if (config.proxy) {
      try {
        const HttpProxyAgent = require('http-proxy-agent');
        const HttpsProxyAgent = require('https-proxy-agent');
        this.agent = new HttpProxyAgent(config.proxy);
        this.httpsAgent = new HttpsProxyAgent(config.proxy);
      } catch {
        // Proxy agents not available, continue without them
      }
    }

    // Set up HTTPS agent for SSL options
    if (config.rejectUnauthorized !== undefined) {
      try {
        const https = require('https');
        this.httpsAgent = new https.Agent({
          rejectUnauthorized: config.rejectUnauthorized,
        });
      } catch {
        // HTTPS agent not available
      }
    }
  }

  setConfig(config: Partial<HttpClientConfig>): void {
    super.setConfig(config);
    this.setupAgents(this.config);
  }

  async request<T = any>(config: HttpRequest): Promise<HttpResponse<T>> {
    const processedRequest = await this.applyRequestInterceptors(this.prepareRequest(config));
    
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      
      try {
        const fetchOptions = this.buildFetchOptions(processedRequest);
        const controller = new AbortController();
        
        // Set up timeout
        let timeoutId: NodeJS.Timeout | undefined;
        if (processedRequest.timeout) {
          const timeout = RequestBuilder.normalizeTimeout(processedRequest.timeout);
          const timeoutMs = timeout?.request || timeout?.connect || timeout?.response;
          if (timeoutMs) {
            timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          }
        }
        
        fetchOptions.signal = controller.signal;
        
        const fetchResponse = await fetch(processedRequest.url, fetchOptions);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        const response = await this.transformFetchResponse<T>(fetchResponse, processedRequest, startTime);
        
        // Check if response status indicates an error
        if (!ResponseParser.isSuccessStatus(response.status, processedRequest.validateStatus)) {
          throw HttpErrorHandler.createHttpError(
            `Request failed with status ${response.status}`,
            processedRequest,
            response,
            response.status,
            response.statusText
          );
        }
        
        return this.applyResponseInterceptors(response);
      } catch (error) {
        if (HttpErrorHandler.isHttpError(error)) {
          throw error;
        }
        
        // Handle Fetch-specific errors
        if ((error as any).name === 'AbortError') {
          throw HttpErrorHandler.createTimeoutError(processedRequest);
        }
        
        if ((error as any).name === 'TypeError' && (error as any).message?.includes('fetch')) {
          throw HttpErrorHandler.createConnectionError(processedRequest);
        }
        
        // Generic network error
        throw HttpErrorHandler.createNetworkError(processedRequest, error as Error);
      }
    }, processedRequest);
  }

  private buildFetchOptions(request: HttpRequest): RequestInit {
    const options: RequestInit = {
      method: request.method,
      headers: request.headers || {},
    };

    // Handle body
    if (request.body !== undefined) {
      if (request.body instanceof FormData || 
          request.body instanceof URLSearchParams ||
          typeof request.body === 'string' ||
          Buffer.isBuffer(request.body) ||
          request.body instanceof ArrayBuffer ||
          request.body instanceof Uint8Array) {
        options.body = request.body;
      } else if (typeof request.body === 'object') {
        options.body = JSON.stringify(request.body);
      } else {
        options.body = String(request.body);
      }
    }

    // Handle redirects
    if (request.followRedirects === false) {
      options.redirect = 'manual';
    } else {
      options.redirect = 'follow';
    }

    // Handle agent for proxy and SSL
    if (this.agent || this.httpsAgent) {
      (options as any).agent = (parsedURL: any) => {
        if (parsedURL.protocol === 'http:') {
          return this.agent;
        } else {
          return this.httpsAgent || this.agent;
        }
      };
    }

    return options;
  }

  private async transformFetchResponse<T>(
    fetchResponse: Response,
    request: HttpRequest,
    startTime: number
  ): Promise<HttpResponse<T>> {
    const duration = Date.now() - startTime;
    
    // Convert Headers to plain object
    const headers: Record<string, string> = {};
    fetchResponse.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    const normalizedHeaders = ResponseParser.normalizeHeaders(headers);
    const contentType = ResponseParser.getContentType(normalizedHeaders);
    
    let data: T;
    
    if (request.responseType === 'stream') {
      data = fetchResponse.body as any; // Return the readable stream
    } else {
      // Parse response based on requested type
      switch (request.responseType) {
        case 'json':
          try {
            data = await fetchResponse.json();
          } catch {
            data = await fetchResponse.text() as any;
          }
          break;
        case 'text':
          data = await fetchResponse.text() as any;
          break;
        case 'buffer':
          const arrayBuffer = await fetchResponse.arrayBuffer();
          data = Buffer.from(arrayBuffer) as any;
          break;
        case 'blob':
          data = await fetchResponse.blob() as any;
          break;
        default:
          // Auto-detect based on content type
          if (ResponseParser.isJsonResponse(normalizedHeaders)) {
            try {
              data = await fetchResponse.json();
            } catch {
              data = await fetchResponse.text() as any;
            }
          } else if (ResponseParser.isBinaryResponse(normalizedHeaders)) {
            const arrayBuffer = await fetchResponse.arrayBuffer();
            data = Buffer.from(arrayBuffer) as any;
          } else {
            data = await fetchResponse.text() as any;
          }
      }
      
      // Apply additional parsing if needed
      data = ResponseParser.parseResponseData<T>(data, contentType, request.responseType);
    }

    return {
      status: fetchResponse.status,
      statusText: fetchResponse.statusText || '',
      headers: normalizedHeaders,
      data,
      request,
      duration,
    };
  }
}