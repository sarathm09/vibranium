/**
 * Tests for HTTP response parser utilities
 */

import { ResponseParser } from '../../utils/response-parser';
import type { HttpResponse, HttpRequest } from '../../types';

describe('ResponseParser', () => {
  const mockRequest: HttpRequest = {
    url: 'https://api.example.com/test',
    method: 'GET',
  };

  describe('normalizeHeaders', () => {
    it('should normalize header keys to lowercase', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
        'X-CUSTOM-HEADER': 'value'
      };
      
      const result = ResponseParser.normalizeHeaders(headers);
      
      expect(result).toEqual({
        'content-type': 'application/json',
        'authorization': 'Bearer token',
        'x-custom-header': 'value'
      });
    });

    it('should handle array values', () => {
      const headers = {
        'Set-Cookie': ['cookie1=value1', 'cookie2=value2']
      };
      
      const result = ResponseParser.normalizeHeaders(headers);
      
      expect(result['set-cookie']).toBe('cookie1=value1, cookie2=value2');
    });

    it('should handle null/undefined headers', () => {
      expect(ResponseParser.normalizeHeaders(null)).toEqual({});
      expect(ResponseParser.normalizeHeaders(undefined)).toEqual({});
    });

    it('should filter out undefined values', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': undefined,
        'X-Custom': 'value'
      };
      
      const result = ResponseParser.normalizeHeaders(headers);
      
      expect(result).toEqual({
        'content-type': 'application/json',
        'x-custom': 'value'
      });
    });
  });

  describe('parseResponseData', () => {
    it('should parse JSON strings when content type is JSON', () => {
      const data = '{"message":"success","code":200}';
      const result = ResponseParser.parseResponseData(data, 'application/json');
      
      expect(result).toEqual({ message: 'success', code: 200 });
    });

    it('should return string if JSON parsing fails', () => {
      const data = 'invalid json {';
      const result = ResponseParser.parseResponseData(data, 'application/json');
      
      expect(result).toBe('invalid json {');
    });

    it('should return objects as-is', () => {
      const data = { message: 'success' };
      const result = ResponseParser.parseResponseData(data, 'application/json');
      
      expect(result).toBe(data);
    });

    it('should respect responseType parameter', () => {
      const data = '{"test":"value"}';
      const result = ResponseParser.parseResponseData(data, 'application/json', 'text');
      
      expect(result).toBe(data); // Should not parse as JSON
    });

    it('should handle null/undefined data', () => {
      expect(ResponseParser.parseResponseData(null)).toBeNull();
      expect(ResponseParser.parseResponseData(undefined)).toBeUndefined();
    });
  });

  describe('getContentType', () => {
    it('should extract content type from headers', () => {
      const headers = { 'content-type': 'application/json; charset=utf-8' };
      expect(ResponseParser.getContentType(headers)).toBe('application/json; charset=utf-8');
    });

    it('should handle case-insensitive headers', () => {
      const headers = { 'Content-Type': 'text/html' };
      expect(ResponseParser.getContentType(headers)).toBe('text/html');
    });

    it('should return undefined if content type not present', () => {
      expect(ResponseParser.getContentType({})).toBeUndefined();
    });
  });

  describe('getContentLength', () => {
    it('should extract and parse content length', () => {
      const headers = { 'content-length': '1024' };
      expect(ResponseParser.getContentLength(headers)).toBe(1024);
    });

    it('should handle case-insensitive headers', () => {
      const headers = { 'Content-Length': '2048' };
      expect(ResponseParser.getContentLength(headers)).toBe(2048);
    });

    it('should return undefined if content length not present', () => {
      expect(ResponseParser.getContentLength({})).toBeUndefined();
    });
  });

  describe('isJsonResponse', () => {
    it('should return true for JSON content types', () => {
      expect(ResponseParser.isJsonResponse({ 'content-type': 'application/json' })).toBe(true);
      expect(ResponseParser.isJsonResponse({ 'content-type': 'application/json; charset=utf-8' })).toBe(true);
    });

    it('should return false for non-JSON content types', () => {
      expect(ResponseParser.isJsonResponse({ 'content-type': 'text/html' })).toBe(false);
      expect(ResponseParser.isJsonResponse({ 'content-type': 'image/png' })).toBe(false);
    });

    it('should return false when content type is missing', () => {
      expect(ResponseParser.isJsonResponse({})).toBe(false);
    });
  });

  describe('isTextResponse', () => {
    it('should return true for text content types', () => {
      expect(ResponseParser.isTextResponse({ 'content-type': 'text/plain' })).toBe(true);
      expect(ResponseParser.isTextResponse({ 'content-type': 'text/html' })).toBe(true);
      expect(ResponseParser.isTextResponse({ 'content-type': 'application/xml' })).toBe(true);
    });

    it('should return false for non-text content types', () => {
      expect(ResponseParser.isTextResponse({ 'content-type': 'image/png' })).toBe(false);
      expect(ResponseParser.isTextResponse({ 'content-type': 'application/json' })).toBe(false);
    });
  });

  describe('isBinaryResponse', () => {
    it('should return true for binary content types', () => {
      expect(ResponseParser.isBinaryResponse({ 'content-type': 'application/octet-stream' })).toBe(true);
      expect(ResponseParser.isBinaryResponse({ 'content-type': 'image/png' })).toBe(true);
      expect(ResponseParser.isBinaryResponse({ 'content-type': 'application/pdf' })).toBe(true);
    });

    it('should return false for non-binary content types', () => {
      expect(ResponseParser.isBinaryResponse({ 'content-type': 'text/plain' })).toBe(false);
      expect(ResponseParser.isBinaryResponse({ 'content-type': 'application/json' })).toBe(false);
    });
  });

  describe('validateResponse', () => {
    it('should validate correct responses', () => {
      const response: HttpResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { message: 'success' },
        request: mockRequest,
        duration: 100
      };
      
      expect(() => ResponseParser.validateResponse(response)).not.toThrow();
    });

    it('should throw for null response', () => {
      expect(() => ResponseParser.validateResponse(null as any)).toThrow('Response is null or undefined');
    });

    it('should throw for invalid status', () => {
      const response = {
        status: 'invalid',
        statusText: 'OK',
        headers: {},
        data: {},
        request: mockRequest,
        duration: 100
      } as any;
      
      expect(() => ResponseParser.validateResponse(response)).toThrow('Response status must be a number');
    });

    it('should throw for out-of-range status', () => {
      const response = {
        status: 999,
        statusText: 'Invalid',
        headers: {},
        data: {},
        request: mockRequest,
        duration: 100
      } as any;
      
      expect(() => ResponseParser.validateResponse(response)).toThrow('Invalid response status: 999');
    });

    it('should throw for invalid headers', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: null,
        data: {},
        request: mockRequest,
        duration: 100
      } as any;
      
      expect(() => ResponseParser.validateResponse(response)).toThrow('Response headers must be an object');
    });
  });

  describe('isSuccessStatus', () => {
    it('should return true for success status codes (200-299)', () => {
      expect(ResponseParser.isSuccessStatus(200)).toBe(true);
      expect(ResponseParser.isSuccessStatus(201)).toBe(true);
      expect(ResponseParser.isSuccessStatus(299)).toBe(true);
    });

    it('should return false for non-success status codes', () => {
      expect(ResponseParser.isSuccessStatus(199)).toBe(false);
      expect(ResponseParser.isSuccessStatus(300)).toBe(false);
      expect(ResponseParser.isSuccessStatus(404)).toBe(false);
      expect(ResponseParser.isSuccessStatus(500)).toBe(false);
    });

    it('should respect custom validation function', () => {
      const customValidator = (status: number) => status === 404 || (status >= 200 && status < 300);
      
      expect(ResponseParser.isSuccessStatus(404, customValidator)).toBe(true);
      expect(ResponseParser.isSuccessStatus(500, customValidator)).toBe(false);
    });
  });

  describe('createResponseFromError', () => {
    it('should create response from error with response data', () => {
      const error = {
        status: 404,
        statusText: 'Not Found',
        response: {
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'application/json' },
          data: { error: 'Resource not found' }
        }
      };
      
      const startTime = Date.now() - 100;
      const result = ResponseParser.createResponseFromError(error, mockRequest, startTime);
      
      expect(result.status).toBe(404);
      expect(result.statusText).toBe('Not Found');
      expect(result.data).toEqual({ error: 'Resource not found' });
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle errors without response data', () => {
      const error = { message: 'Network error' };
      const startTime = Date.now() - 50;
      const result = ResponseParser.createResponseFromError(error, mockRequest, startTime);
      
      expect(result.status).toBe(0);
      expect(result.statusText).toBe('Unknown Error');
      expect(result.data).toBe('Network error');
    });
  });

  describe('extractResponseMetadata', () => {
    it('should extract all metadata correctly', () => {
      const response: HttpResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '1024'
        },
        data: { message: 'success' },
        request: mockRequest,
        duration: 100
      };
      
      const metadata = ResponseParser.extractResponseMetadata(response);
      
      expect(metadata.contentType).toBe('application/json; charset=utf-8');
      expect(metadata.contentLength).toBe(1024);
      expect(metadata.isJson).toBe(true);
      expect(metadata.isText).toBe(false);
      expect(metadata.isBinary).toBe(false);
    });
  });
});