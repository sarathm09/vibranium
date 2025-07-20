/**
 * Tests for HTTP request builder utilities
 */

import { RequestBuilder } from '../../utils/request-builder';
import type { HttpAuth, HttpRequest } from '../../types';

describe('RequestBuilder', () => {
  describe('applyAuth', () => {
    it('should apply bearer token authentication', () => {
      const headers = { 'content-type': 'application/json' };
      const auth: HttpAuth = { type: 'bearer', token: 'abc123' };
      
      const result = RequestBuilder.applyAuth(headers, auth);
      
      expect(result).toEqual({
        'content-type': 'application/json',
        'Authorization': 'Bearer abc123'
      });
    });

    it('should apply basic authentication', () => {
      const headers = {};
      const auth: HttpAuth = { type: 'basic', username: 'user', password: 'pass' };
      
      const result = RequestBuilder.applyAuth(headers, auth);
      
      expect(result.Authorization).toBe('Basic dXNlcjpwYXNz'); // base64 of 'user:pass'
    });

    it('should apply custom headers authentication', () => {
      const headers = { 'content-type': 'application/json' };
      const auth: HttpAuth = { 
        type: 'custom', 
        headers: { 'X-API-Key': 'secret', 'X-Client-ID': 'client123' }
      };
      
      const result = RequestBuilder.applyAuth(headers, auth);
      
      expect(result).toEqual({
        'content-type': 'application/json',
        'X-API-Key': 'secret',
        'X-Client-ID': 'client123'
      });
    });

    it('should not modify headers when auth data is missing', () => {
      const headers = { 'content-type': 'application/json' };
      
      const bearerAuth: HttpAuth = { type: 'bearer' };
      const basicAuth: HttpAuth = { type: 'basic', username: 'user' };
      
      expect(RequestBuilder.applyAuth(headers, bearerAuth)).toEqual(headers);
      expect(RequestBuilder.applyAuth(headers, basicAuth)).toEqual(headers);
    });
  });

  describe('buildUrl', () => {
    it('should combine base URL and relative path', () => {
      expect(RequestBuilder.buildUrl('https://api.example.com', '/users')).toBe('https://api.example.com/users');
      expect(RequestBuilder.buildUrl('https://api.example.com/', 'users')).toBe('https://api.example.com/users');
      expect(RequestBuilder.buildUrl('https://api.example.com/', '/users')).toBe('https://api.example.com/users');
    });

    it('should return absolute URLs as-is', () => {
      const absoluteUrl = 'https://other.example.com/api/data';
      expect(RequestBuilder.buildUrl('https://api.example.com', absoluteUrl)).toBe(absoluteUrl);
    });

    it('should return URL when no base URL provided', () => {
      expect(RequestBuilder.buildUrl(undefined, '/users')).toBe('/users');
      expect(RequestBuilder.buildUrl('', '/users')).toBe('/users');
    });
  });

  describe('normalizeHeaders', () => {
    it('should normalize header names to lowercase', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
        'X-CUSTOM-HEADER': 'value'
      };
      
      const result = RequestBuilder.normalizeHeaders(headers);
      
      expect(result).toEqual({
        'content-type': 'application/json',
        'authorization': 'Bearer token',
        'x-custom-header': 'value'
      });
    });

    it('should handle empty headers', () => {
      expect(RequestBuilder.normalizeHeaders()).toEqual({});
      expect(RequestBuilder.normalizeHeaders({})).toEqual({});
    });
  });

  describe('detectContentType', () => {
    it('should detect JSON content', () => {
      expect(RequestBuilder.detectContentType({ key: 'value' })).toBe('application/json');
      expect(RequestBuilder.detectContentType('{"key":"value"}')).toBe('application/json');
    });

    it('should detect form data content', () => {
      const formData = new FormData();
      expect(RequestBuilder.detectContentType(formData)).toBeUndefined(); // Let adapter handle boundary
    });

    it('should detect URL encoded content', () => {
      const params = new URLSearchParams();
      expect(RequestBuilder.detectContentType(params)).toBe('application/x-www-form-urlencoded');
    });

    it('should detect binary content', () => {
      const buffer = Buffer.from('binary data');
      expect(RequestBuilder.detectContentType(buffer)).toBe('application/octet-stream');
      
      const arrayBuffer = new ArrayBuffer(8);
      expect(RequestBuilder.detectContentType(arrayBuffer)).toBe('application/octet-stream');
    });

    it('should detect text content', () => {
      expect(RequestBuilder.detectContentType('plain text')).toBe('text/plain');
    });

    it('should return undefined for null/undefined', () => {
      expect(RequestBuilder.detectContentType(null)).toBeUndefined();
      expect(RequestBuilder.detectContentType(undefined)).toBeUndefined();
    });
  });

  describe('serializeBody', () => {
    it('should serialize objects to JSON', () => {
      const obj = { key: 'value', number: 42 };
      expect(RequestBuilder.serializeBody(obj)).toBe('{"key":"value","number":42}');
    });

    it('should return FormData as-is', () => {
      const formData = new FormData();
      expect(RequestBuilder.serializeBody(formData)).toBe(formData);
    });

    it('should return strings as-is', () => {
      expect(RequestBuilder.serializeBody('test string')).toBe('test string');
    });

    it('should convert URLSearchParams to string', () => {
      const params = new URLSearchParams();
      params.append('key', 'value');
      expect(RequestBuilder.serializeBody(params)).toBe('key=value');
    });

    it('should return undefined for null/undefined', () => {
      expect(RequestBuilder.serializeBody(null)).toBeUndefined();
      expect(RequestBuilder.serializeBody(undefined)).toBeUndefined();
    });
  });

  describe('normalizeTimeout', () => {
    it('should convert number to timeout config', () => {
      const result = RequestBuilder.normalizeTimeout(5000);
      expect(result).toEqual({
        request: 5000,
        connect: 5000,
        response: 5000
      });
    });

    it('should return timeout config as-is', () => {
      const config = { request: 5000, connect: 3000, response: 10000 };
      expect(RequestBuilder.normalizeTimeout(config)).toBe(config);
    });

    it('should return undefined for undefined input', () => {
      expect(RequestBuilder.normalizeTimeout(undefined)).toBeUndefined();
    });
  });

  describe('mergeConfig', () => {
    it('should merge request configurations', () => {
      const base: Partial<HttpRequest> = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: { 'Authorization': 'Bearer token' }
      };
      
      const override: Partial<HttpRequest> = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { data: 'test' }
      };
      
      const result = RequestBuilder.mergeConfig(base, override);
      
      expect(result.url).toBe('https://api.example.com');
      expect(result.method).toBe('POST');
      expect(result.body).toEqual({ data: 'test' });
      expect(result.headers).toEqual({
        'authorization': 'Bearer token',
        'content-type': 'application/json'
      });
    });

    it('should handle missing headers', () => {
      const base: Partial<HttpRequest> = { url: 'test' };
      const override: Partial<HttpRequest> = { method: 'GET' };
      
      const result = RequestBuilder.mergeConfig(base, override);
      expect(result.headers).toBeUndefined();
    });
  });

  describe('validateRequest', () => {
    it('should validate valid requests', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/users',
        method: 'GET'
      };
      
      expect(() => RequestBuilder.validateRequest(request)).not.toThrow();
    });

    it('should throw for missing URL', () => {
      const request = { method: 'GET' } as HttpRequest;
      expect(() => RequestBuilder.validateRequest(request)).toThrow('Request URL is required');
    });

    it('should throw for missing method', () => {
      const request = { url: 'https://api.example.com' } as HttpRequest;
      expect(() => RequestBuilder.validateRequest(request)).toThrow('Request method is required');
    });

    it('should throw for invalid method', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com',
        method: 'INVALID' as any
      };
      expect(() => RequestBuilder.validateRequest(request)).toThrow('Invalid HTTP method: INVALID');
    });

    it('should accept relative URLs', () => {
      const request: HttpRequest = {
        url: '/api/users',
        method: 'GET'
      };
      expect(() => RequestBuilder.validateRequest(request)).not.toThrow();
    });
  });
});