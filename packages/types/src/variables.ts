/**
 * Variable system types for Vibranium CLI
 */

// Simple variable map for backward compatibility  
export type VariableMap = Record<string, any>;

export interface VibraniumVariableMap {
  env: Record<string, any>;
  global: Record<string, any>;
  context: Record<string, any>;
  response: Record<string, any>;
  request: Record<string, any>;
  api: Record<string, any>;
  random: Record<string, any>;
  [alias: string]: Record<string, any>;
}

export interface DotNotationResolver {
  resolve(expression: string, variables: VibraniumVariableMap): any;
  set(path: string, value: any, variables: VibraniumVariableMap): void;
  has(path: string, variables: VibraniumVariableMap): boolean;
  interpolate(template: string, variables: VibraniumVariableMap): string;
}

export interface VariableContext {
  variables: VibraniumVariableMap;
  resolver: DotNotationResolver;
  
  get(path: string): any;
  set(path: string, value: any): void;
  has(path: string): boolean;
  interpolate(template: string): string;
  createScope(alias: string, data: Record<string, any>): void;
  removeScope(alias: string): void;
}