"use strict";
/**
 * Variable namespace types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILTIN_NAMESPACES = void 0;
/**
 * Built-in namespace types
 */
exports.BUILTIN_NAMESPACES = {
    ENV: 'env', // Environment variables
    GLOBAL: 'global', // Global configuration
    CONTEXT: 'context', // Execution context
    RESPONSE: 'response', // Last response data
    REQUEST: 'request', // Last request data
    API: 'api', // Current API step
    RANDOM: 'random', // Random data generators
};
