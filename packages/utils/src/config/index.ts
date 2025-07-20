/**
 * Configuration management exports
 */

export * from './config-manager';
export * from './config-validator';
export * from './defaults';

// Re-export main classes for backward compatibility
export { ConfigManager as GlobalConfigManager } from './config-manager';
export { ConfigValidator } from './config-validator';
export { ConfigPresets, getConfigPreset, applyPreset } from './defaults';