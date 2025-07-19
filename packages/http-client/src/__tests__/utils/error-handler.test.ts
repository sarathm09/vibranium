/**
 * Tests for HTTP error handler utilities
 */

import { HttpErrorHandler } from '../../utils/error-handler';
import type { HttpRequest, HttpResponse } from '../../types';

describe('HttpErrorHandler', () => {
  const mockRequest: HttpRequest = {
    url: 'https://api.example.com/test',
    method: 'GET',
  };

  const mockResponse: HttpResponse = {
    status: 500,
    statusText: 'Internal Server Error',
    headers: {},
    data: { error: 'Server error' },
    request: mockRequest,
    duration: 100,
  };

  describe('createHttpError', () => {
    it('should create an HTTP error with all properties', () => {
      const error = HttpErrorHandler.createHttpError(
        'Test error',
        mockRequest,
        mockResponse,
        500,
        'Internal Server Error'
      );

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('HttpError');
      expect(error.isHttpError).toBe(true);
      expect(error.request).toBe(mockRequest);
      expect(error.response).toBe(mockResponse);
      expect(error.status).toBe(500);
      expect(error.statusText).toBe('Internal Server Error');
    });

    it('should create an HTTP error with minimal properties', () => {
      const error = HttpErrorHandler.createHttpError('Simple error');

      expect(error.message).toBe('Simple error');
      expect(error.name).toBe('HttpError');
      expect(error.isHttpError).toBe(true);
      expect(error.request).toBeUndefined();
      expect(error.response).toBeUndefined();
      expect(error.status).toBeUndefined();
      expect(error.statusText).toBeUndefined();
    });
  });

  describe('createTimeoutError', () => {
    it('should create a timeout error', () => {
      const error = HttpErrorHandler.createTimeoutError(mockRequest);

      expect(error.message).toBe(`Request timeout for ${mockRequest.method} ${mockRequest.url}`);
      expect(error.status).toBe(408);
      expect(error.statusText).toBe('Request Timeout');
      expect(error.request).toBe(mockRequest);
    });
  });

  describe('createNetworkError', () => {
    it('should create a network error', () => {
      const originalError = new Error('Connection failed');
      const error = HttpErrorHandler.createNetworkError(mockRequest, originalError);

      expect(error.message).toBe('Network error: Connection failed');
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Network Error');
      expect(error.request).toBe(mockRequest);
    });
  });

  describe('createConnectionError', () => {
    it('should create a connection error', () => {
      const error = HttpErrorHandler.createConnectionError(mockRequest);

      expect(error.message).toBe(`Connection failed for ${mockRequest.method} ${mockRequest.url}`);
      expect(error.status).toBe(0);
      expect(error.statusText).toBe('Connection Error');
      expect(error.request).toBe(mockRequest);
    });
  });

  describe('isHttpError', () => {
    it('should return true for HTTP errors', () => {
      const error = HttpErrorHandler.createHttpError('Test error');
      expect(HttpErrorHandler.isHttpError(error)).toBe(true);
    });

    it('should return false for regular errors', () => {
      const error = new Error('Regular error');
      expect(HttpErrorHandler.isHttpError(error)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(HttpErrorHandler.isHttpError(null)).toBe(false);
      expect(HttpErrorHandler.isHttpError(undefined)).toBe(false);
      expect(HttpErrorHandler.isHttpError({})).toBe(false);
      expect(HttpErrorHandler.isHttpError('string')).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable status codes', () => {
      const error = HttpErrorHandler.createHttpError('Server error', mockRequest, mockResponse, 500);
      expect(HttpErrorHandler.isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable status codes', () => {
      const error = HttpErrorHandler.createHttpError('Bad request', mockRequest, mockResponse, 400);
      expect(HttpErrorHandler.isRetryableError(error)).toBe(false);
    });

    it('should return true for network errors (no status)', () => {
      const error = HttpErrorHandler.createNetworkError(mockRequest, new Error('Network fail'));
      expect(HttpErrorHandler.isRetryableError(error)).toBe(true);
    });

    it('should respect custom retryOn codes', () => {
      const error = HttpErrorHandler.createHttpError('Not found', mockRequest, mockResponse, 404);
      expect(HttpErrorHandler.isRetryableError(error, [404, 500])).toBe(true);
      expect(HttpErrorHandler.isRetryableError(error, [500, 502])).toBe(false);
    });
  });

  describe('shouldRetry', () => {
    it('should return false when max retries exceeded', () => {
      const error = HttpErrorHandler.createHttpError('Server error', mockRequest, mockResponse, 500);
      expect(HttpErrorHandler.shouldRetry(error, 3, 3)).toBe(false);
    });

    it('should return true for retryable errors within limit', () => {
      const error = HttpErrorHandler.createHttpError('Server error', mockRequest, mockResponse, 500);
      expect(HttpErrorHandler.shouldRetry(error, 1, 3)).toBe(true);
    });

    it('should respect custom retry condition', () => {
      const error = HttpErrorHandler.createHttpError('Client error', mockRequest, mockResponse, 400);
      const retryCondition = (err: any) => err.status === 400;
      
      expect(HttpErrorHandler.shouldRetry(error, 1, 3, retryCondition)).toBe(true);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate linear delay', () => {
      expect(HttpErrorHandler.calculateRetryDelay(0, 1000, 'linear')).toBe(1000);
      expect(HttpErrorHandler.calculateRetryDelay(1, 1000, 'linear')).toBe(2000);
      expect(HttpErrorHandler.calculateRetryDelay(2, 1000, 'linear')).toBe(3000);
    });

    it('should calculate exponential delay', () => {
      expect(HttpErrorHandler.calculateRetryDelay(0, 1000, 'exponential')).toBe(1000);
      expect(HttpErrorHandler.calculateRetryDelay(1, 1000, 'exponential')).toBe(2000);
      expect(HttpErrorHandler.calculateRetryDelay(2, 1000, 'exponential')).toBe(4000);
      expect(HttpErrorHandler.calculateRetryDelay(3, 1000, 'exponential')).toBe(8000);
    });

    it('should default to linear when no backoff specified', () => {
      expect(HttpErrorHandler.calculateRetryDelay(1, 1000)).toBe(2000);
    });
  });
});