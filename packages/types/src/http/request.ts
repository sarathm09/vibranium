/**
 * HTTP request types
 */

export interface HttpRequest {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
}

export interface HttpRequestConfig extends HttpRequest {
  baseURL?: string;
  auth?: any;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  responseType?: 'json' | 'text' | 'stream' | 'arraybuffer';
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';