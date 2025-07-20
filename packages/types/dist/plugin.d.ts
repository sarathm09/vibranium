/**
 * Plugin system types for Vibranium CLI
 */
import type { Step, StepResult, ExecutionContext } from './core';
import type { ValidationResult } from './validation';
export interface VibraniumPlugin {
    name: string;
    version: string;
    supportedStepTypes: string[];
    executeStep(step: Step, context: ExecutionContext): Promise<StepResult>;
    validateStep?(step: Step): ValidationResult;
    beforeStep?(step: Step, context: ExecutionContext): Promise<void>;
    afterStep?(step: Step, result: StepResult, context: ExecutionContext): Promise<void>;
}
export interface PluginRegistry {
    register(plugin: VibraniumPlugin): void;
    unregister(pluginName: string): void;
    getPlugin(stepType: string): VibraniumPlugin | undefined;
    getAllPlugins(): VibraniumPlugin[];
    isStepTypeSupported(stepType: string): boolean;
}
//# sourceMappingURL=plugin.d.ts.map