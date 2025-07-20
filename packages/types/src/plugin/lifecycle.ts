import type { VibraniumPlugin } from './plugin';
import type { ExecutionContext } from '../execution/context';

export interface PluginLifecycleManager {
  onLoad(plugin: VibraniumPlugin): Promise<void>;
  onUnload(plugin: VibraniumPlugin): Promise<void>;
  beforeScenario(context: ExecutionContext): Promise<void>;
  afterScenario(context: ExecutionContext): Promise<void>;
}

export interface LifecycleEvent {
  type: string;
  plugin: VibraniumPlugin;
  context?: ExecutionContext;
  timestamp: Date;
}