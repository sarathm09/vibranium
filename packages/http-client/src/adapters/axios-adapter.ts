/**
 * Axios HTTP client adapter (alternative implementation)
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { HttpRequest, HttpResponse, HttpClientConfig } from '../types';
import { BaseHttpAdapter } from './base-adapter';
import { HttpErrorHandler, RequestBuilder, ResponseParser } from '../utils';

export class AxiosAdapter extends BaseHttpAdapter {
  private axiosInstance: AxiosInstance;

  constructor(config: HttpClientConfig = {}) {
    super(config);
    this.axiosInstance = this.createAxiosInstance(config);
  }

  private createAxiosInstance(config: HttpClientConfig): AxiosInstance {
    const axiosConfig: AxiosRequestConfig = {
      timeout: typeof config.timeout === 'number' ? config.timeout : undefined,
      maxRedirects: config.maxRedirects || 5,
      validateStatus: () => true, // We handle status validation ourselves
      decompress: true,
    };

    // Set base URL
    if (config.baseURL) {
      axiosConfig.baseURL = config.baseURL;
    }

    // Set default headers
    if (config.headers) {
      axiosConfig.headers = RequestBuilder.normalizeHeaders(config.headers);
    }

    // Handle timeout config
    if (config.timeout && typeof config.timeout === 'object') {
      // Axios doesn't have separate connect/response timeouts, use the request timeout
      axiosConfig.timeout = config.timeout.request || config.timeout.connect || config.timeout.response;
    }

    // Handle proxy
    if (config.proxy) {
      const url = new URL(config.proxy);
      axiosConfig.proxy = {
        protocol: url.protocol.slice(0, -1), // Remove trailing colon
        host: url.hostname,
        port: parseInt(url.port, 10),
        auth: url.username && url.password ? {
          username: url.username,
          password: url.password
        } : undefined,
      };
    }

    // SSL/TLS options
    if (config.rejectUnauthorized !== undefined) {
      axiosConfig.httpsAgent = new (require('https').Agent)({
        rejectUnauthorized: config.rejectUnauthorized,
      });
    }

    return axios.create(axiosConfig);
  }

  setConfig(config: Partial<HttpClientConfig>): void {
    super.setConfig(config);
    this.axiosInstance = this.createAxiosInstance(this.config);
  }

  async request<T = any>(config: HttpRequest): Promise<HttpResponse<T>> {
    const processedRequest = await this.applyRequestInterceptors(this.prepareRequest(config));
    
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      
      try {
        const axiosConfig = this.buildAxiosConfig(processedRequest);
        const axiosResponse = await this.axiosInstance.request(axiosConfig);
        
        const response = this.transformAxiosResponse<T>(axiosResponse, processedRequest, startTime);
        
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
        
        // Handle Axios-specific errors
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            throw HttpErrorHandler.createTimeoutError(processedRequest);
          }
          
          if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ENETUNREACH') {
            throw HttpErrorHandler.createConnectionError(processedRequest);
          }
          
          if (error.response) {
            // Server responded with error status
            const response = this.transformAxiosResponse<T>(error.response, processedRequest, startTime);
            throw HttpErrorHandler.createHttpError(
              `Request failed with status ${error.response.status}`,
              processedRequest,
              response,
              error.response.status,
              error.response.statusText
            );
          }
        }
        
        // Generic network error
        throw HttpErrorHandler.createNetworkError(processedRequest, error as Error);
      }
    }, processedRequest);
  }

  private buildAxiosConfig(request: HttpRequest): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      url: request.url,
      method: request.method.toLowerCase() as any,
      headers: request.headers || {},
    };

    // Handle body/data
    if (request.body !== undefined) {
      if (request.body instanceof FormData || 
          Buffer.isBuffer(request.body) || 
          request.body instanceof URLSearchParams) {
        config.data = request.body;
      } else if (typeof request.body === 'object') {
        config.data = request.body; // Axios auto-stringifies objects to JSON
      } else {
        config.data = request.body;
      }
    }

    // Handle timeout
    if (request.timeout) {
      const timeout = RequestBuilder.normalizeTimeout(request.timeout);
      if (timeout) {
        config.timeout = timeout.request || timeout.connect || timeout.response;
      }
    }

    // Handle redirects
    if (request.followRedirects !== undefined) {
      config.maxRedirects = request.followRedirects ? (request.maxRedirects || 5) : 0;
    }

    // Handle proxy
    if (request.proxy) {
      const url = new URL(request.proxy);
      config.proxy = {
        protocol: url.protocol.slice(0, -1),
        host: url.hostname,
        port: parseInt(url.port, 10),
        auth: url.username && url.password ? {
          username: url.username,
          password: url.password
        } : undefined,
      };
    }

    // Handle response type
    if (request.responseType) {
      switch (request.responseType) {
        case 'json':
          config.responseType = 'json';
          break;
        case 'text':
          config.responseType = 'text';
          break;
        case 'buffer':
          config.responseType = 'arraybuffer';
          break;
        case 'stream':
          config.responseType = 'stream';
          break;
        case 'blob':
          config.responseType = 'blob';
          break;
        default:
          config.responseType = 'text';
      }
    }

    return config;
  }

  private transformAxiosResponse<T>(
    axiosResponse: AxiosResponse,
    request: HttpRequest,
    startTime: number
  ): HttpResponse<T> {
    const duration = Date.now() - startTime;
    const headers = ResponseParser.normalizeHeaders(axiosResponse.headers);
    const contentType = ResponseParser.getContentType(headers);
    
    let data: T;
    if (request.responseType === 'stream') {
      data = axiosResponse.data; // Return the stream as-is
    } else if (request.responseType === 'buffer') {
      // Convert ArrayBuffer to Buffer for consistency
      data = Buffer.from(axiosResponse.data) as any;
    } else {
      data = ResponseParser.parseResponseData<T>(
        axiosResponse.data,
        contentType,
        request.responseType
      );
    }

    return {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText || '',
      headers,
      data,
      request,
      duration,
    };
  }
}