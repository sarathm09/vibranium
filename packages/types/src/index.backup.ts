/**
 * @fileoverview Comprehensive TypeScript types for Vibranium CLI
 * 
 * This package provides a complete type system for the Vibranium CLI ecosystem:
 * - Core domain types (Scenario, Step, Environment, Execution)
 * - HTTP abstraction layer with multiple adapter support
 * - Plugin system with lifecycle management
 * - Variable system with dot notation resolution
 * - Validation system with comprehensive operators
 * 
 * Design principles:
 * - Type safety with strict TypeScript
 * - Extensibility for future features
 * - Interoperability across all packages
 * - Well-documented interfaces
 * - Future-proof architecture
 */

// Core domain types
export * from './scenario';

// Environment and configuration types
export * from './environment';
// Variables are included in environment exports above

// Execution context and results (temporarily skip due to conflicts)
// export * from './execution';

// Variable system with dot notation (temporarily skip due to conflicts)
// export { 
//   DotNotationResolver as VibraniumDotNotationResolver, 
//   VariableContext as VibraniumVariableContext 
// } from './variable/resolver';
// export { VariableNamespace } from './variable/namespace';

// Plugin system
export { 
  VibraniumPlugin, 
  PluginMetadata, 
  PluginCapabilities 
} from './plugin/plugin';
export { PluginRegistry as VibraniumPluginRegistry } from './plugin/registry';
export { StepExecutor } from './plugin/executor';

// Validation system
export { 
  ExpectBlock, 
  Assertion as VibraniumAssertion 
} from './validation/expect';
export { 
  ValidationOperator, 
  CustomOperator, 
  OperatorRegistry 
} from './validation/operator';
export { 
  ValidationResult as VibraniumValidationResult, 
  ValidationSummary 
} from './validation/result';
export { ValidationEngine } from './validation/engine';

// HTTP types
export { HttpClient, HttpClientFactory } from './http/client';
export { HttpRequest, HttpRequestConfig } from './http/request';
export { HttpResponse, HttpError } from './http/response';
export { HttpConfig, RetryConfig as HttpRetryConfig } from './http/config';
export { HttpAdapter } from './http/adapter';

// Legacy exports for backward compatibility (non-conflicting only)
// export * from './core'; // Conflicts with scenario exports
// export * from './variables'; // Use explicit variable exports above