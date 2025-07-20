/**
 * HTTP response types
 */

import type { HttpRequest } from './request';

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  request: HttpRequest;
  duration: number;
  config: any;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: HttpResponse;
  request?: HttpRequest;
  config?: any;
  isHttpError: true;
}