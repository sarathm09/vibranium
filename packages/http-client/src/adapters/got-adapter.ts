/**
 * Got HTTP client adapter (default implementation)
 */

import got, { type Got, type Response as GotResponse, type Options as GotOptions } from 'got';
import type { HttpRequest, HttpResponse, HttpClientConfig, TimeoutConfig } from '../types';
import { BaseHttpAdapter } from './base-adapter';
import { HttpErrorHandler, RequestBuilder, ResponseParser } from '../utils';

export class GotAdapter extends BaseHttpAdapter {
  private gotInstance: Got;

  constructor(config: HttpClientConfig = {}) {
    super(config);
    this.gotInstance = this.createGotInstance(config);
  }

  private createGotInstance(config: HttpClientConfig): Got {
    const gotOptions: GotOptions = {
      followRedirect: config.followRedirects !== false,
      maxRedirects: config.maxRedirects || 10,
      throwHttpErrors: false, // We handle errors ourselves
      allowGetBody: false,
      decompress: true,
      dnsCache: true,
      http2: false, // Disable HTTP/2 for better compatibility
    };

    // Set up timeout
    if (config.timeout) {
      const timeout = RequestBuilder.normalizeTimeout(config.timeout);
      if (timeout) {
        gotOptions.timeout = {
          request: timeout.request,
          connect: timeout.connect,
          response: timeout.response,
        };
      }
    }

    // Set up proxy
    if (config.proxy) {
      gotOptions.agent = {
        http: require('http-proxy-agent')(config.proxy),
        https: require('https-proxy-agent')(config.proxy),
      };
    }

    // SSL/TLS options
    if (config.rejectUnauthorized !== undefined) {
      gotOptions.https = {
        rejectUnauthorized: config.rejectUnauthorized,
      };
    }

    return got.extend(gotOptions);
  }

  setConfig(config: Partial<HttpClientConfig>): void {
    super.setConfig(config);
    this.gotInstance = this.createGotInstance(this.config);
  }

  async request<T = any>(config: HttpRequest): Promise<HttpResponse<T>> {
    const processedRequest = await this.applyRequestInterceptors(this.prepareRequest(config));
    
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      
      try {
        const gotOptions = this.buildGotOptions(processedRequest);
        const gotResponse = await this.gotInstance(processedRequest.url, gotOptions);
        
        const response = this.transformGotResponse<T>(gotResponse, processedRequest, startTime);
        
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
        
        // Handle Got-specific errors
        if ((error as any).name === 'TimeoutError') {
          throw HttpErrorHandler.createTimeoutError(processedRequest);
        }
        
        if ((error as any).name === 'RequestError' || (error as any).code === 'ECONNREFUSED' || (error as any).code === 'ENOTFOUND') {
          throw HttpErrorHandler.createConnectionError(processedRequest);
        }
        
        // Generic network error
        throw HttpErrorHandler.createNetworkError(processedRequest, error as Error);
      }
    }, processedRequest);
  }

  private buildGotOptions(request: HttpRequest): GotOptions {
    const options: GotOptions = {
      method: request.method,
      headers: request.headers || {},
    };

    // Handle body
    if (request.body !== undefined) {
      if (request.body instanceof FormData || 
          Buffer.isBuffer(request.body) || 
          request.body instanceof URLSearchParams) {
        options.body = request.body;
      } else if (typeof request.body === 'object') {
        options.json = request.body;
      } else {
        options.body = String(request.body);
      }
    }

    // Handle timeout
    if (request.timeout) {
      const timeout = RequestBuilder.normalizeTimeout(request.timeout);
      if (timeout) {
        options.timeout = {
          request: timeout.request,
          connect: timeout.connect,
          response: timeout.response,
        };
      }
    }

    // Handle redirects
    if (request.followRedirects !== undefined) {
      options.followRedirect = request.followRedirects;
    }
    
    if (request.maxRedirects !== undefined) {
      options.maxRedirects = request.maxRedirects;
    }

    // Handle proxy
    if (request.proxy) {
      options.agent = {
        http: require('http-proxy-agent')(request.proxy),
        https: require('https-proxy-agent')(request.proxy),
      };
    }

    // Handle response type
    if (request.responseType) {
      switch (request.responseType) {
        case 'json':
          options.responseType = 'json';
          break;
        case 'text':
          options.responseType = 'text';
          break;
        case 'buffer':
          options.responseType = 'buffer';
          break;
        case 'stream':
          options.isStream = true;
          break;
        default:
          options.responseType = 'text';
      }
    }

    return options;
  }

  private transformGotResponse<T>(
    gotResponse: GotResponse,
    request: HttpRequest,
    startTime: number
  ): HttpResponse<T> {
    const duration = Date.now() - startTime;
    const headers = ResponseParser.normalizeHeaders(gotResponse.headers);
    const contentType = ResponseParser.getContentType(headers);
    
    let data: T;
    if (request.responseType === 'stream') {
      data = gotResponse as any; // Return the stream itself
    } else {
      data = ResponseParser.parseResponseData<T>(
        gotResponse.body,
        contentType,
        request.responseType
      );
    }

    return {
      status: gotResponse.statusCode,
      statusText: gotResponse.statusMessage || '',
      headers,
      data,
      request,
      duration,
    };
  }
}