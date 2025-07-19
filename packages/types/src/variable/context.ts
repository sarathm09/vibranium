/**
 * Variable context types
 */

import type { VariableNamespace } from './namespace';
import type { DotNotationResolver } from './resolver';

export interface VariableContext {
  namespaces: Map<string, VariableNamespace>;
  resolver: DotNotationResolver;
  
  get(path: string): Promise<any>;
  set(path: string, value: any): Promise<void>;
  has(path: string): Promise<boolean>;
  delete(path: string): Promise<boolean>;
  
  createScope(name: string, data: Record<string, any>): void;
  removeScope(name: string): void;
  
  interpolate(template: string): Promise<string>;
  
  clone(): VariableContext;
  merge(other: VariableContext): VariableContext;
}

export interface ContextManager {
  create(config?: ContextConfig): VariableContext;
  getDefault(): VariableContext;
  setDefault(context: VariableContext): void;
}

export interface ContextConfig {
  strictMode?: boolean;
  enableCache?: boolean;
  cacheTtl?: number;
  maxDepth?: number;
}