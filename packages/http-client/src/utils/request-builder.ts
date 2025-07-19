/**
 * HTTP request building utilities
 */

import type { HttpRequest, HttpAuth, TimeoutConfig } from '../types';

export class RequestBuilder {
  static applyAuth(headers: Record<string, string>, auth: HttpAuth): Record<string, string> {
    const newHeaders = { ...headers };

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          newHeaders['Authorization'] = `Bearer ${auth.token}`;
        }
        break;

      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          newHeaders['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'custom':
        if (auth.headers) {
          Object.assign(newHeaders, auth.headers);
        }
        break;
    }

    return newHeaders;
  }

  static buildUrl(baseUrl: string | undefined, url: string): string {
    if (!baseUrl) {
      return url;
    }

    // If url is already absolute, return it as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Remove trailing slash from baseUrl and leading slash from url
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanUrl = url.replace(/^\//, '');

    return `${cleanBaseUrl}/${cleanUrl}`;
  }

  static normalizeHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      // Normalize header names to lowercase for consistency
      normalized[key.toLowerCase()] = value;
    }

    return normalized;
  }

  static detectContentType(body: any): string | undefined {
    if (body === null || body === undefined) {
      return undefined;
    }

    if (typeof body === 'string') {
      // Try to detect if it's JSON
      try {
        JSON.parse(body);
        return 'application/json';
      } catch {
        return 'text/plain';
      }
    }

    if (body instanceof FormData) {
      // Let the adapter handle multipart/form-data boundary
      return undefined;
    }

    if (body instanceof URLSearchParams) {
      return 'application/x-www-form-urlencoded';
    }

    if (Buffer.isBuffer(body) || body instanceof ArrayBuffer || body instanceof Uint8Array) {
      return 'application/octet-stream';
    }

    if (typeof body === 'object') {
      return 'application/json';
    }

    return 'text/plain';
  }

  static serializeBody(body: any, contentType?: string): any {
    if (body === null || body === undefined) {
      return undefined;
    }

    // Don't serialize FormData, Buffers, or streams
    if (body instanceof FormData || Buffer.isBuffer(body) || 
        body instanceof ArrayBuffer || body instanceof Uint8Array ||
        (typeof body === 'object' && 'pipe' in body)) {
      return body;
    }

    if (typeof body === 'string') {
      return body;
    }

    if (body instanceof URLSearchParams) {
      return body.toString();
    }

    if (typeof body === 'object') {
      return JSON.stringify(body);
    }

    return String(body);
  }

  static normalizeTimeout(timeout: number | TimeoutConfig | undefined): TimeoutConfig | undefined {
    if (timeout === undefined) {
      return undefined;
    }

    if (typeof timeout === 'number') {
      return {
        request: timeout,
        connect: timeout,
        response: timeout
      };
    }

    return timeout;
  }

  static mergeConfig(base: Partial<HttpRequest>, override: Partial<HttpRequest>): HttpRequest {
    const merged = { ...base, ...override } as HttpRequest;

    // Merge headers
    if (base.headers || override.headers) {
      merged.headers = {
        ...this.normalizeHeaders(base.headers),
        ...this.normalizeHeaders(override.headers)
      };
    }

    return merged;
  }

  static validateRequest(request: HttpRequest): void {
    if (!request.url) {
      throw new Error('Request URL is required');
    }

    if (!request.method) {
      throw new Error('Request method is required');
    }

    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(request.method)) {
      throw new Error(`Invalid HTTP method: ${request.method}`);
    }

    // Validate URL format
    try {
      new URL(request.url);
    } catch {
      // If not a valid URL, check if it's a relative path
      if (!request.url.startsWith('/') && !request.url.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/)) {
        throw new Error(`Invalid URL format: ${request.url}`);
      }
    }
  }
}