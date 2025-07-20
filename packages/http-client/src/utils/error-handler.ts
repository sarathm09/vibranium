/**
 * HTTP error handling utilities
 */

import type { HttpError, HttpRequest, HttpResponse } from '../types';

export class HttpErrorHandler {
  static createHttpError(
    message: string,
    request?: HttpRequest,
    response?: HttpResponse,
    status?: number,
    statusText?: string
  ): HttpError {
    const error = new Error(message) as HttpError;
    error.name = 'HttpError';
    error.isHttpError = true;
    error.request = request;
    error.response = response;
    error.status = status;
    error.statusText = statusText;
    return error;
  }

  static createTimeoutError(request: HttpRequest): HttpError {
    return this.createHttpError(
      `Request timeout for ${request.method} ${request.url}`,
      request,
      undefined,
      408,
      'Request Timeout'
    );
  }

  static createNetworkError(request: HttpRequest, originalError: Error): HttpError {
    return this.createHttpError(
      `Network error: ${originalError.message}`,
      request,
      undefined,
      0,
      'Network Error'
    );
  }

  static createConnectionError(request: HttpRequest): HttpError {
    return this.createHttpError(
      `Connection failed for ${request.method} ${request.url}`,
      request,
      undefined,
      0,
      'Connection Error'
    );
  }

  static isHttpError(error: any): error is HttpError {
    return error && error.isHttpError === true;
  }

  static isRetryableError(error: HttpError, retryOn?: number[]): boolean {
    if (!error.status) {
      // Network errors are typically retryable
      return true;
    }

    if (retryOn) {
      return retryOn.includes(error.status);
    }

    // Default retryable status codes
    const defaultRetryableCodes = [408, 429, 500, 502, 503, 504];
    return defaultRetryableCodes.includes(error.status);
  }

  static shouldRetry(error: HttpError, attempt: number, maxRetries: number, retryCondition?: (error: any) => boolean): boolean {
    if (attempt >= maxRetries) {
      return false;
    }

    if (retryCondition) {
      return retryCondition(error);
    }

    return this.isRetryableError(error);
  }

  static calculateRetryDelay(attempt: number, baseDelay: number, backoff: 'linear' | 'exponential' = 'linear'): number {
    if (backoff === 'exponential') {
      return baseDelay * Math.pow(2, attempt);
    }
    return baseDelay * (attempt + 1);
  }
}