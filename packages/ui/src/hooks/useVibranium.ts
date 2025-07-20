import { useState, useEffect } from 'react';
import type { Scenario, Environment, ExecutionResult } from '../types';

// Mock hook for Vibranium functionality
export const useVibranium = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);

  // Mock data for development
  useEffect(() => {
    setScenarios([
      {
        id: '1',
        name: 'API Authentication Test',
        description: 'Tests user authentication flow',
        version: '1.0.0',
        environments: ['dev', 'staging'],
        steps: [
          { id: '1', name: 'Login', type: 'http' },
          { id: '2', name: 'Verify Token', type: 'validation' },
        ],
      },
    ]);

    setEnvironments([
      {
        id: 'dev',
        name: 'Development',
        variables: { baseUrl: 'https://api-dev.example.com' },
        active: true,
      },
    ]);
  }, []);

  return {
    scenarios,
    environments,
    executions,
    loading: false,
    error: null,
  };
};