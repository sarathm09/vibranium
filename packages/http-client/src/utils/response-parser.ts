/**
 * HTTP response parsing utilities
 */

import type { HttpResponse } from '../types';

export class ResponseParser {
  static normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};

    if (!headers) {
      return normalized;
    }

    // Handle different header formats from different adapters
    if (typeof headers === 'object') {
      for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
          // Convert arrays to comma-separated strings (some adapters return arrays)
          normalized[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
        }
      }
    }

    return normalized;
  }

  static parseResponseData<T = any>(data: any, contentType?: string, responseType?: string): T {
    if (data === null || data === undefined) {
      return data as T;
    }

    // If response type is specified and not 'json', return as-is
    if (responseType && responseType !== 'json') {
      return data as T;
    }

    // If content type indicates JSON, try to parse
    if (contentType && contentType.includes('application/json')) {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data) as T;
        } catch {
          // If parsing fails, return as string
          return data as T;
        }
      }
    }

    // If data is already an object, return as-is
    if (typeof data === 'object') {
      return data as T;
    }

    // For text responses, return as string
    if (typeof data === 'string') {
      return data as T;
    }

    return data as T;
  }

  static getContentType(headers: Record<string, string>): string | undefined {
    return headers['content-type'] || headers['Content-Type'];
  }

  static getContentLength(headers: Record<string, string>): number | undefined {
    const length = headers['content-length'] || headers['Content-Length'];
    return length ? parseInt(length, 10) : undefined;
  }

  static isJsonResponse(headers: Record<string, string>): boolean {
    const contentType = this.getContentType(headers);
    return contentType ? contentType.includes('application/json') : false;
  }

  static isTextResponse(headers: Record<string, string>): boolean {
    const contentType = this.getContentType(headers);
    if (!contentType) return false;
    
    return contentType.includes('text/') || 
           contentType.includes('application/xml') ||
           contentType.includes('application/html');
  }

  static isBinaryResponse(headers: Record<string, string>): boolean {
    const contentType = this.getContentType(headers);
    if (!contentType) return false;

    const binaryTypes = [
      'application/octet-stream',
      'application/pdf',
      'image/',
      'video/',
      'audio/',
      'application/zip',
      'application/gzip'
    ];

    return binaryTypes.some(type => contentType.includes(type));
  }

  static validateResponse<T>(response: HttpResponse<T>): void {
    if (!response) {
      throw new Error('Response is null or undefined');
    }

    if (typeof response.status !== 'number') {
      throw new Error('Response status must be a number');
    }

    if (response.status < 100 || response.status > 599) {
      throw new Error(`Invalid response status: ${response.status}`);
    }

    if (!response.headers || typeof response.headers !== 'object') {
      throw new Error('Response headers must be an object');
    }
  }

  static isSuccessStatus(status: number, validateStatus?: (status: number) => boolean): boolean {
    if (validateStatus) {
      return validateStatus(status);
    }

    // Default success range
    return status >= 200 && status < 300;
  }

  static createResponseFromError(error: any, request: any, startTime: number): Partial<HttpResponse> {
    const duration = Date.now() - startTime;
    
    return {
      status: error.status || error.response?.status || 0,
      statusText: error.statusText || error.response?.statusText || 'Unknown Error',
      headers: error.response?.headers ? this.normalizeHeaders(error.response.headers) : {},
      data: error.response?.data || error.message,
      request,
      duration
    };
  }

  static extractResponseMetadata(response: HttpResponse): {
    contentType?: string;
    contentLength?: number;
    isJson: boolean;
    isText: boolean;
    isBinary: boolean;
  } {
    const headers = response.headers;
    const contentType = this.getContentType(headers);
    
    return {
      contentType,
      contentLength: this.getContentLength(headers),
      isJson: this.isJsonResponse(headers),
      isText: this.isTextResponse(headers),
      isBinary: this.isBinaryResponse(headers)
    };
  }
}