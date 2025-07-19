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
export { 
  Scenario,
  ScenarioConfig, 
  ScenarioMetadata 
} from './scenario/scenario';
export { 
  Step, 
  ApiStep, 
  UiStep, 
  CustomStep, 
  AnyStep, 
  StepType, 
  StepStatus, 
  StepResult,
  HttpMethod,
  AuthConfig as ScenarioAuthConfig,
  UiAction,
  WaitConfig
} from './scenario/step';
export { LifecycleHooks, LifecycleHook } from './scenario/lifecycle';
export { DependsOn, DependencyMode } from './scenario/dependency';

// Environment and configuration types
export { 
  Environment as VibraniumEnvironment, 
  EnvironmentManager 
} from './environment/environment';
export { 
  EnvironmentVariable, 
  SecretConfig, 
  VariableResolver, 
  SecretManager 
} from './environment/variable';

// Execution context and results
export { 
  ExecutionContext as VibraniumExecutionContext, 
  ExecutionMetadata, 
  ExecutionMode, 
  ExecutionState 
} from './execution/context';
export { 
  ScenarioResult, 
  BatchResult, 
  ExecutionStatus,
  ExecutionSummary 
} from './execution/result';

// Variable system with dot notation
export { 
  DotNotationResolver as VibraniumDotNotationResolver, 
  VariableContext as VibraniumVariableContext 
} from './variable/resolver';
export { VariableNamespace } from './variable/namespace';

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

// Legacy exports for backward compatibility
export * from './core';
export * from './variables';