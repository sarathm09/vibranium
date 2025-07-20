/**
 * Tests for logging utilities
 */

import { Logger } from '../logging/logger';
import { ConsoleTransport } from '../logging/console-transport';
import { PerformanceLogger } from '../logging/performance-logger';
import type { LogLevel, LogEntry } from '../logging/index';

// Mock console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

beforeEach(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('test-logger');
  });

  describe('Log Level Filtering', () => {
    it('should respect log level hierarchy', () => {
      logger.setLevel('warn');
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });

    it('should allow all logs when level is debug', () => {
      logger.setLevel('debug');
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Message Formatting', () => {
    it('should format messages with timestamp and level', () => {
      logger.info('Test message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[test-logger\] Test message/)
      );
    });

    it('should handle structured data', () => {
      const data = { userId: 123, action: 'login' };
      logger.info('User action', data);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('User action'),
        data
      );
    });

    it('should format error objects', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed'),
        expect.objectContaining({
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String)
        })
      );
    });
  });

  describe('Child Loggers', () => {
    it('should create child logger with combined name', () => {
      const childLogger = logger.child('child');
      childLogger.info('Child message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[test-logger:child]')
      );
    });

    it('should inherit parent log level', () => {
      logger.setLevel('error');
      const childLogger = logger.child('child');
      
      childLogger.info('This should not appear');
      childLogger.error('This should appear');
      
      expect(console.info).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('This should appear')
      );
    });
  });

  describe('Color Support', () => {
    it('should support disabling colors', () => {
      const transport = new ConsoleTransport({ colors: false });
      logger = new Logger('test', { transports: [transport] });
      
      logger.info('Colorless message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.not.stringMatching(/\u001b\[\d+m/) // No ANSI color codes
      );
    });

    it('should apply colors by default', () => {
      logger.info('Colored message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\u001b\[\d+m/) // Contains ANSI color codes
      );
    });
  });
});

describe('ConsoleTransport', () => {
  let transport: ConsoleTransport;

  beforeEach(() => {
    transport = new ConsoleTransport();
  });

  describe('Log Method Mapping', () => {
    it('should map log levels to console methods', () => {
      const entry: LogEntry = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date(),
        name: 'test'
      };
      
      transport.log(entry);
      expect(console.info).toHaveBeenCalled();
    });

    it('should handle unknown log levels', () => {
      const entry: LogEntry = {
        level: 'unknown' as LogLevel,
        message: 'Test message',
        timestamp: new Date(),
        name: 'test'
      };
      
      transport.log(entry);
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Format Customization', () => {
    it('should support custom formatters', () => {
      const customFormatter = (entry: LogEntry) => `CUSTOM: ${entry.message}`;
      transport = new ConsoleTransport({ formatter: customFormatter });
      
      const entry: LogEntry = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date(),
        name: 'test'
      };
      
      transport.log(entry);
      expect(console.info).toHaveBeenCalledWith('CUSTOM: Test message');
    });
  });
});

describe('PerformanceLogger', () => {
  let perfLogger: PerformanceLogger;
  let baseLogger: Logger;

  beforeEach(() => {
    baseLogger = new Logger('perf-test');
    perfLogger = new PerformanceLogger(baseLogger);
  });

  describe('Timing Operations', () => {
    it('should time operations with labels', async () => {
      perfLogger.time('test-operation');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      perfLogger.timeEnd('test-operation');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('test-operation completed in')
      );
    });

    it('should handle multiple concurrent timers', () => {
      perfLogger.time('operation-1');
      perfLogger.time('operation-2');
      
      perfLogger.timeEnd('operation-1');
      perfLogger.timeEnd('operation-2');
      
      expect(console.info).toHaveBeenCalledTimes(2);
    });

    it('should warn about unknown timers', () => {
      perfLogger.timeEnd('unknown-timer');
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Timer "unknown-timer" was not started')
      );
    });
  });

  describe('Performance Marks', () => {
    it('should create performance marks', () => {
      perfLogger.mark('checkpoint-1');
      perfLogger.mark('checkpoint-2');
      
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('Performance mark: checkpoint-1')
      );
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('Performance mark: checkpoint-2')
      );
    });
  });

  describe('Memory Usage', () => {
    it('should log memory usage', () => {
      perfLogger.logMemoryUsage('after-operation');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Memory usage (after-operation)'),
        expect.objectContaining({
          rss: expect.any(Number),
          heapTotal: expect.any(Number),
          heapUsed: expect.any(Number),
          external: expect.any(Number)
        })
      );
    });
  });

  describe('Performance Profiles', () => {
    it('should create and complete performance profiles', async () => {
      perfLogger.profile('test-profile');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      perfLogger.profileEnd('test-profile');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Profile "test-profile" completed')
      );
    });
  });
});

describe('Log Formatters', () => {
  describe('Default Formatter', () => {
    it('should format entries with all components', () => {
      const entry: LogEntry = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date('2024-01-01T10:00:00.000Z'),
        name: 'test-logger',
        data: { userId: 123 }
      };
      
      const logger = new Logger('test');
      logger.info('Test message', { userId: 123 });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[2024-01-01T10:00:00.000Z]'),
        expect.objectContaining({ userId: 123 })
      );
    });
  });

  describe('JSON Formatter', () => {
    it('should format entries as JSON', () => {
      const transport = new ConsoleTransport({
        formatter: (entry) => JSON.stringify(entry)
      });
      const logger = new Logger('test', { transports: [transport] });
      
      logger.info('JSON message', { key: 'value' });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/^{.*}$/)
      );
    });
  });
});
