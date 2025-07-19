/**
 * HTTP adapter types
 */

import type { HttpRequestConfig } from './request';
import type { HttpResponse } from './response';

export interface HttpAdapter {
  name: string;
  execute<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
  isAvailable(): boolean;
}

export interface AdapterFactory {
  create(name: string, config?: any): HttpAdapter;
  register(name: string, adapter: HttpAdapter): void;
  list(): string[];
}