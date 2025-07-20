/**
 * @fileoverview Plugin system for Vibranium CLI
 * Plugin registry, loading system, step type routing, lifecycle hooks
 */

// Plugin registry and core infrastructure
export * from './registry/plugin-registry';
export * from './registry/plugin-loader';
export * from './registry/lifecycle-manager';
export * from './registry/capability-checker';

// Base plugin framework
export * from './base/base-plugin';
export * from './base/plugin-context';
export * from './base/plugin-utils';

// Core API plugin implementation
export * from './core/api-plugin';
export * from './core/http-executor';
export * from './core/request-builder';
export * from './core/response-processor';
export * from './core/auth-handlers';

// Legacy exports for backward compatibility
export { PluginRegistry } from './registry/plugin-registry';
export { CoreApiPlugin } from './core/api-plugin';