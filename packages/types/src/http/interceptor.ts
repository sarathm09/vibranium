/**
 * HTTP interceptor types
 */

import type { HttpRequestConfig } from './request';
import type { HttpResponse } from './response';

export interface HttpInterceptor {
  request?: RequestInterceptor;
  response?: ResponseInterceptor;
}

export type RequestInterceptor = (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;

export type ResponseInterceptor = (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;

export interface InterceptorManager {
  use(onFulfilled?: RequestInterceptor | ResponseInterceptor, onRejected?: (error: any) => any): number;
  eject(id: number): void;
}