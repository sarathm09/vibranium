/**
 * @fileoverview Common utilities and helpers for Vibranium CLI
 * File system helpers, environment management, random data generators,
 * structured logging, and global configuration management
 */

// Filesystem utilities
export * from './filesystem';

// Environment management
export * from './environment';

// Random data generation
export * from './data';

// Structured logging
export * from './logging';

// Configuration management
export * from './config';

// Template processing
export * from './template';

// Performance utilities
export * from './performance';

// Legacy exports for backward compatibility
export { FileSystemHelper } from './file-system';
export type { FileSystemUtils } from './file-system';
export { RandomHelper } from './random';
export type { RandomDataGenerator } from './random';
export { VibraniumLogger as LegacyVibraniumLogger, vibraniumLogger } from './logger';
export type { Logger as LegacyLogger, LogLevel as LegacyLogLevel } from './logger';