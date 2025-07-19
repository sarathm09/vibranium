import type { VibraniumPlugin } from './plugin';

export interface PluginRegistry {
  register(plugin: VibraniumPlugin): void;
  unregister(name: string): void;
  get(name: string): VibraniumPlugin | undefined;
  getForStepType(stepType: string): VibraniumPlugin | undefined;
  list(): VibraniumPlugin[];
  has(name: string): boolean;
  isStepTypeSupported(stepType: string): boolean;
}