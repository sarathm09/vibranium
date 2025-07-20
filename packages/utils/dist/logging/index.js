/**
 * Logging utilities exports
 */
export * from './logger';
export * from './formatters';
export * from './console-transport';
export * from './performance-logger';
// Re-export main classes for backward compatibility
export { VibraniumLogger as Logger } from './logger';
export { ConsoleTransport } from './console-transport';
export { PerformanceLogger } from './performance-logger';
export { FormatterFactory } from './formatters';
// Factory function for creating loggers
import { VibraniumLogger } from './logger';
export function createLogger(context, config) {
    const loggerConfig = {
        ...config,
        context: context || config?.context || ''
    };
    return new VibraniumLogger(loggerConfig);
}
//# sourceMappingURL=index.js.map