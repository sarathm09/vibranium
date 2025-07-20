import { useState, useCallback } from 'react';
import type { Scenario, ExecutionResult } from '../types';

interface UseVibraniumState {
  currentScenario: Scenario | null;
  isExecuting: boolean;
  result: ExecutionResult | null;
  error: string | null;
}

interface UseVibraniumActions {
  loadScenario: (scenario: Scenario) => void;
  executeScenario: () => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

export interface UseVibraniumReturn extends UseVibraniumState, UseVibraniumActions {}

/**
 * Custom hook for managing Vibranium scenarios and execution
 * This will integrate with the core Vibranium functionality
 */
export const useVibranium = (): UseVibraniumReturn => {
  const [state, setState] = useState<UseVibraniumState>({
    currentScenario: null,
    isExecuting: false,
    result: null,
    error: null,
  });

  const loadScenario = useCallback((scenario: Scenario) => {
    setState(prev => ({
      ...prev,
      currentScenario: scenario,
      result: null,
      error: null,
    }));
  }, []);

  const executeScenario = useCallback(async () => {
    if (!state.currentScenario) {
      setState(prev => ({ ...prev, error: 'No scenario loaded' }));
      return;
    }

    setState(prev => ({ ...prev, isExecuting: true, error: null }));

    try {
      // TODO: Integrate with @vibraniumjs/core for actual execution
      // For now, simulate execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: ExecutionResult = {
        success: true,
        duration: 2000,
        steps: [],
        summary: {
          total: state.currentScenario.steps?.length || 0,
          passed: state.currentScenario.steps?.length || 0,
          failed: 0,
          skipped: 0,
        },
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        isExecuting: false,
        result: mockResult,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [state.currentScenario]);

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, result: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadScenario,
    executeScenario,
    clearResult,
    clearError,
  };
};

export default useVibranium;