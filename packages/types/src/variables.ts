/**
 * Variable system types for Vibranium CLI
 */

export interface VariableMap {
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
  resolve(expression: string, variables: VariableMap): any;
  set(path: string, value: any, variables: VariableMap): void;
  has(path: string, variables: VariableMap): boolean;
  interpolate(template: string, variables: VariableMap): string;
}

export interface VariableContext {
  variables: VariableMap;
  resolver: DotNotationResolver;
  
  get(path: string): any;
  set(path: string, value: any): void;
  has(path: string): boolean;
  interpolate(template: string): string;
  createScope(alias: string, data: Record<string, any>): void;
  removeScope(alias: string): void;
}