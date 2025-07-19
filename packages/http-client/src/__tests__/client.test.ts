/**
 * Tests for HTTP client factory
 */

import { HttpClientFactory, type HttpAdapterType } from '../client';
import type { HttpClientConfig } from '../types';

// Mock the adapters
jest.mock('../adapters/got-adapter', () => ({
  GotAdapter: jest.fn().mockImplementation((config) => ({
    config,
    adapterType: 'got',
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  }))
}));

jest.mock('../adapters/axios-adapter', () => ({
  AxiosAdapter: jest.fn().mockImplementation((config) => ({
    config,
    adapterType: 'axios',
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  }))
}));

jest.mock('../adapters/fetch-adapter', () => ({
  FetchAdapter: jest.fn().mockImplementation((config) => ({
    config,
    adapterType: 'fetch',
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  }))
}));

describe('HttpClientFactory', () => {
  beforeEach(() => {
    HttpClientFactory.reset();
    jest.clearAllMocks();
  });

  describe('setDefaultClient and getDefaultClient', () => {
    it('should set and get default client', () => {
      const mockClient = { request: jest.fn() } as any;
      HttpClientFactory.setDefaultClient(mockClient);
      
      expect(HttpClientFactory.getDefaultClient()).toBe(mockClient);
    });

    it('should lazy-load Got adapter as default when no client set', () => {
      const client = HttpClientFactory.getDefaultClient();
      
      expect(client).toBeDefined();
      expect((client as any).adapterType).toBe('got');
    });
  });

  describe('setDefaultConfig', () => {
    it('should set default configuration', () => {
      const config: HttpClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: { 'User-Agent': 'Vibranium-Client' }
      };
      
      HttpClientFactory.setDefaultConfig(config);
      
      const client = HttpClientFactory.createGotClient();
      expect((client as any).config).toEqual(expect.objectContaining(config));
    });
  });

  describe('createClient', () => {
    it('should create Got client by default', () => {
      const client = HttpClientFactory.createClient();
      expect((client as any).adapterType).toBe('got');
    });

    it('should create client with specified adapter', () => {
      const gotClient = HttpClientFactory.createClient({ adapter: 'got' });
      const axiosClient = HttpClientFactory.createClient({ adapter: 'axios' });
      const fetchClient = HttpClientFactory.createClient({ adapter: 'fetch' });
      
      expect((gotClient as any).adapterType).toBe('got');
      expect((axiosClient as any).adapterType).toBe('axios');
      expect((fetchClient as any).adapterType).toBe('fetch');
    });

    it('should merge configuration with defaults', () => {
      HttpClientFactory.setDefaultConfig({
        timeout: 5000,
        headers: { 'User-Agent': 'Default' }
      });
      
      const client = HttpClientFactory.createClient({
        adapter: 'got',
        config: {
          baseURL: 'https://api.example.com',
          headers: { 'Authorization': 'Bearer token' }
        }
      });
      
      expect((client as any).config).toEqual(expect.objectContaining({
        timeout: 5000,
        baseURL: 'https://api.example.com',
        headers: expect.objectContaining({
          'User-Agent': 'Default',
          'Authorization': 'Bearer token'
        })
      }));
    });

    it('should throw error for unknown adapter', () => {
      expect(() => {
        HttpClientFactory.createClient({ adapter: 'unknown' as HttpAdapterType });
      }).toThrow('Unknown HTTP adapter: unknown');
    });
  });

  describe('specific adapter creators', () => {
    it('should create Got client with configuration', () => {
      const config: HttpClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 10000
      };
      
      const client = HttpClientFactory.createGotClient(config);
      
      expect((client as any).adapterType).toBe('got');
      expect((client as any).config).toEqual(expect.objectContaining(config));
    });

    it('should create Axios client with configuration', () => {
      const config: HttpClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 10000
      };
      
      const client = HttpClientFactory.createAxiosClient(config);
      
      expect((client as any).adapterType).toBe('axios');
      expect((client as any).config).toEqual(expect.objectContaining(config));
    });

    it('should create Fetch client with configuration', () => {
      const config: HttpClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 10000
      };
      
      const client = HttpClientFactory.createFetchClient(config);
      
      expect((client as any).adapterType).toBe('fetch');
      expect((client as any).config).toEqual(expect.objectContaining(config));
    });
  });

  describe('isAdapterAvailable', () => {
    it('should check Got availability', () => {
      // Mock require to simulate availability
      const originalRequire = require;
      (global as any).require = jest.fn().mockImplementation((module) => {
        if (module === 'got') return {}; // Simulate Got being available
        return originalRequire(module);
      });
      
      expect(HttpClientFactory.isAdapterAvailable('got')).toBe(true);
      
      (global as any).require = originalRequire;
    });

    it('should check Axios availability', () => {
      const originalRequire = require;
      (global as any).require = jest.fn().mockImplementation((module) => {
        if (module === 'axios') return {}; // Simulate Axios being available
        return originalRequire(module);
      });
      
      expect(HttpClientFactory.isAdapterAvailable('axios')).toBe(true);
      
      (global as any).require = originalRequire;
    });

    it('should check fetch availability', () => {
      // Mock fetch being available
      (global as any).fetch = jest.fn();
      
      expect(HttpClientFactory.isAdapterAvailable('fetch')).toBe(true);
      
      delete (global as any).fetch;
    });

    it('should return false for unavailable adapters', () => {
      const originalRequire = require;
      (global as any).require = jest.fn().mockImplementation((module) => {
        if (module === 'got' || module === 'axios') {
          throw new Error('Module not found');
        }
        return originalRequire(module);
      });
      
      expect(HttpClientFactory.isAdapterAvailable('got')).toBe(false);
      expect(HttpClientFactory.isAdapterAvailable('axios')).toBe(false);
      
      (global as any).require = originalRequire;
    });
  });

  describe('getAvailableAdapters', () => {
    it('should return list of available adapters', () => {
      // Mock all adapters as available
      const originalRequire = require;
      (global as any).require = jest.fn().mockImplementation((module) => {
        if (module === 'got' || module === 'axios') return {};
        return originalRequire(module);
      });
      (global as any).fetch = jest.fn();
      
      const adapters = HttpClientFactory.getAvailableAdapters();
      
      expect(adapters).toContain('got');
      expect(adapters).toContain('axios');
      expect(adapters).toContain('fetch');
      
      (global as any).require = originalRequire;
      delete (global as any).fetch;
    });

    it('should return empty array when no adapters available', () => {
      const originalRequire = require;
      (global as any).require = jest.fn().mockImplementation((module) => {
        if (module === 'got' || module === 'axios') {
          throw new Error('Module not found');
        }
        return originalRequire(module);
      });
      
      const adapters = HttpClientFactory.getAvailableAdapters();
      
      expect(adapters).toEqual([]);
      
      (global as any).require = originalRequire;
    });
  });

  describe('reset', () => {
    it('should reset factory to default state', () => {
      // Set some state
      HttpClientFactory.setDefaultClient({ request: jest.fn() } as any);
      HttpClientFactory.setDefaultConfig({ timeout: 5000 });
      
      // Reset
      HttpClientFactory.reset();
      
      // Check that new default client is created (Got adapter)
      const client = HttpClientFactory.getDefaultClient();
      expect((client as any).adapterType).toBe('got');
      expect((client as any).config).toEqual({});
    });
  });
});