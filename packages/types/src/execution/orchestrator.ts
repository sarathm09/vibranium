import type { Scenario } from '../scenario';
import type { ExecutionContext } from './context';
import type { ScenarioResult } from './result';

export interface ExecutionOrchestrator {
  execute(scenario: Scenario, context: ExecutionContext): Promise<ScenarioResult>;
  pause(): void;
  resume(): void;
  cancel(): void;
  getStatus(): ExecutionStatus;
}

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';