/**
 * Scenario state management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

/**
 * Scenario information
 */
interface ScenarioInfo {
  /** File path */
  path: string;
  
  /** Scenario name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Version */
  version?: string;
  
  /** Tags */
  tags: string[];
  
  /** Environment requirements */
  environments: string[];
  
  /** Steps count */
  stepCount: number;
  
  /** Dependencies */
  dependencies: string[];
  
  /** Variables used */
  variables: string[];
  
  /** File size */
  fileSize: number;
  
  /** Last modified */
  lastModified: Date;
  
  /** Content hash */
  contentHash: string;
  
  /** Syntax validity */
  isValid: boolean;
  
  /** Validation errors */
  validationErrors: string[];
  
  /** Estimated execution time */
  estimatedDuration: number;
}

/**
 * Scenario content
 */
interface ScenarioContent {
  /** File path */
  path: string;
  
  /** Raw content */
  raw: string;
  
  /** Parsed content */
  parsed: any;
  
  /** Content type */
  type: 'yaml' | 'json';
  
  /** Last loaded */
  lastLoaded: Date;
  
  /** Loading state */
  loading: boolean;
  
  /** Error */
  error?: string;
}

/**
 * Scenario discovery result
 */
interface ScenarioDiscovery {
  /** Discovery ID */
  id: string;
  
  /** Root directory */
  rootDirectory: string;
  
  /** Discovered scenarios */
  scenarios: ScenarioInfo[];
  
  /** Discovery timestamp */
  discoveredAt: Date;
  
  /** Discovery status */
  status: 'discovering' | 'completed' | 'error';
  
  /** Discovery progress */
  progress: {
    current: number;
    total: number;
    currentFile: string;
  };
  
  /** Discovery error */
  error?: string;
}

/**
 * Scenarios state
 */
interface ScenariosState {
  /** Discovered scenarios */
  scenarios: Record<string, ScenarioInfo>;
  
  /** Loaded scenario contents */
  contents: Record<string, ScenarioContent>;
  
  /** Active discoveries */
  discoveries: Record<string, ScenarioDiscovery>;
  
  /** Selected scenario */
  selectedScenario: string | null;
  
  /** Search query */
  searchQuery: string;
  
  /** Filters */
  filters: {
    tags: string[];
    environments: string[];
    validOnly: boolean;
    recentOnly: boolean;
  };
  
  /** Sort options */
  sort: {
    field: 'name' | 'lastModified' | 'stepCount' | 'estimatedDuration';
    direction: 'asc' | 'desc';
  };
  
  /** View mode */
  viewMode: 'list' | 'grid' | 'tree';
  
  /** Loading states */
  loading: {
    discovery: boolean;
    content: boolean;
    validation: boolean;
  };
  
  /** Errors */
  errors: string[];
}

/**
 * Initial scenarios state
 */
const initialState: ScenariosState = {
  scenarios: {},
  contents: {},
  discoveries: {},
  selectedScenario: null,
  searchQuery: '',
  filters: {
    tags: [],
    environments: [],
    validOnly: false,
    recentOnly: false,
  },
  sort: {
    field: 'name',
    direction: 'asc',
  },
  viewMode: 'list',
  loading: {
    discovery: false,
    content: false,
    validation: false,
  },
  errors: [],
};

/**
 * Async thunks for scenario operations
 */

// Discover scenarios in directory
export const discoverScenarios = createAsyncThunk(
  'scenarios/discover',
  async (directory: string) => {
    const discoveryId = crypto.randomUUID();
    
    // Simulate scenario discovery
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock discovered scenarios
    const scenarios: ScenarioInfo[] = [
      {
        path: `${directory}/api-tests.yaml`,
        name: 'API Tests',
        description: 'Basic API endpoint testing',
        tags: ['api', 'smoke'],
        environments: ['development', 'staging'],
        stepCount: 5,
        dependencies: [],
        variables: ['$.env.API_URL', '$.context.userId'],
        fileSize: 1024,
        lastModified: new Date(),
        contentHash: 'abc123',
        isValid: true,
        validationErrors: [],
        estimatedDuration: 30000,
      },
      {
        path: `${directory}/user-flow.yaml`,
        name: 'User Registration Flow',
        description: 'End-to-end user registration and login',
        tags: ['e2e', 'user', 'auth'],
        environments: ['staging', 'production'],
        stepCount: 8,
        dependencies: ['api-tests.yaml'],
        variables: ['$.env.API_URL', '$.random.email'],
        fileSize: 2048,
        lastModified: new Date(),
        contentHash: 'def456',
        isValid: true,
        validationErrors: [],
        estimatedDuration: 60000,
      },
    ];
    
    const discovery: ScenarioDiscovery = {
      id: discoveryId,
      rootDirectory: directory,
      scenarios,
      discoveredAt: new Date(),
      status: 'completed',
      progress: {
        current: scenarios.length,
        total: scenarios.length,
        currentFile: '',
      },
    };
    
    return discovery;
  }
);

// Load scenario content
export const loadScenarioContent = createAsyncThunk(
  'scenarios/loadContent',
  async (path: string) => {
    // Simulate loading scenario content
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockContent = `
name: "Example Scenario"
description: "A test scenario for demonstration"
steps:
  - name: "Get User"
    type: "api"
    method: "GET"
    url: "{{$.env.API_URL}}/users/{{$.context.userId}}"
    expect:
      - identifier: "$.response.status"
        operator: "equals"
        expected: 200
`;
    
    const content: ScenarioContent = {
      path,
      raw: mockContent,
      parsed: {
        name: 'Example Scenario',
        description: 'A test scenario for demonstration',
        steps: [
          {
            name: 'Get User',
            type: 'api',
            method: 'GET',
            url: '{{$.env.API_URL}}/users/{{$.context.userId}}',
            expect: [
              {
                identifier: '$.response.status',
                operator: 'equals',
                expected: 200,
              },
            ],
          },
        ],
      },
      type: 'yaml',
      lastLoaded: new Date(),
      loading: false,
    };
    
    return content;
  }
);

// Validate scenario
export const validateScenario = createAsyncThunk(
  'scenarios/validate',
  async (path: string) => {
    // Simulate scenario validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      path,
      isValid: true,
      errors: [],
    };
  }
);

// Search scenarios
export const searchScenarios = createAsyncThunk(
  'scenarios/search',
  async (query: string, { getState }) => {
    const state = getState() as { scenarios: ScenariosState };
    
    // Simple search implementation
    const results = Object.values(state.scenarios.scenarios).filter(scenario =>
      scenario.name.toLowerCase().includes(query.toLowerCase()) ||
      scenario.description?.toLowerCase().includes(query.toLowerCase()) ||
      scenario.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    return {
      query,
      results: results.map(s => s.path),
    };
  }
);

/**
 * Scenarios slice
 */
const scenariosSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    // Selection
    selectScenario: (state, action: PayloadAction<string>) => {
      state.selectedScenario = action.payload;
    },

    deselectScenario: (state) => {
      state.selectedScenario = null;
    },

    // Search and filters
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    clearSearchQuery: (state) => {
      state.searchQuery = '';
    },

    addTagFilter: (state, action: PayloadAction<string>) => {
      if (!state.filters.tags.includes(action.payload)) {
        state.filters.tags.push(action.payload);
      }
    },

    removeTagFilter: (state, action: PayloadAction<string>) => {
      state.filters.tags = state.filters.tags.filter(tag => tag !== action.payload);
    },

    addEnvironmentFilter: (state, action: PayloadAction<string>) => {
      if (!state.filters.environments.includes(action.payload)) {
        state.filters.environments.push(action.payload);
      }
    },

    removeEnvironmentFilter: (state, action: PayloadAction<string>) => {
      state.filters.environments = state.filters.environments.filter(env => env !== action.payload);
    },

    toggleValidOnlyFilter: (state) => {
      state.filters.validOnly = !state.filters.validOnly;
    },

    toggleRecentOnlyFilter: (state) => {
      state.filters.recentOnly = !state.filters.recentOnly;
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Sorting
    setSortField: (state, action: PayloadAction<ScenariosState['sort']['field']>) => {
      if (state.sort.field === action.payload) {
        state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort.field = action.payload;
        state.sort.direction = 'asc';
      }
    },

    setSortDirection: (state, action: PayloadAction<ScenariosState['sort']['direction']>) => {
      state.sort.direction = action.payload;
    },

    // View mode
    setViewMode: (state, action: PayloadAction<ScenariosState['viewMode']>) => {
      state.viewMode = action.payload;
    },

    // Scenario management
    updateScenarioInfo: (state, action: PayloadAction<{ path: string; updates: Partial<ScenarioInfo> }>) => {
      const { path, updates } = action.payload;
      if (state.scenarios[path]) {
        state.scenarios[path] = {
          ...state.scenarios[path],
          ...updates,
        };
      }
    },

    removeScenario: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      delete state.scenarios[path];
      delete state.contents[path];
      
      if (state.selectedScenario === path) {
        state.selectedScenario = null;
      }
    },

    // Content management
    updateScenarioContent: (state, action: PayloadAction<{ path: string; content: string }>) => {
      const { path, content } = action.payload;
      if (state.contents[path]) {
        state.contents[path].raw = content;
        state.contents[path].lastLoaded = new Date();
      }
    },

    clearScenarioContent: (state, action: PayloadAction<string>) => {
      delete state.contents[action.payload];
    },

    // Error handling
    addError: (state, action: PayloadAction<string>) => {
      state.errors.push(action.payload);
    },

    removeError: (state, action: PayloadAction<number>) => {
      state.errors.splice(action.payload, 1);
    },

    clearErrors: (state) => {
      state.errors = [];
    },

    // Reset state
    resetScenarios: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Discover scenarios
      .addCase(discoverScenarios.pending, (state) => {
        state.loading.discovery = true;
      })
      .addCase(discoverScenarios.fulfilled, (state, action) => {
        const discovery = action.payload;
        state.discoveries[discovery.id] = discovery;
        
        // Add scenarios to state
        discovery.scenarios.forEach(scenario => {
          state.scenarios[scenario.path] = scenario;
        });
        
        state.loading.discovery = false;
      })
      .addCase(discoverScenarios.rejected, (state, action) => {
        state.loading.discovery = false;
        state.errors.push(`Discovery failed: ${action.error.message}`);
      })

      // Load scenario content
      .addCase(loadScenarioContent.pending, (state) => {
        state.loading.content = true;
      })
      .addCase(loadScenarioContent.fulfilled, (state, action) => {
        const content = action.payload;
        state.contents[content.path] = content;
        state.loading.content = false;
      })
      .addCase(loadScenarioContent.rejected, (state, action) => {
        state.loading.content = false;
        state.errors.push(`Failed to load content: ${action.error.message}`);
      })

      // Validate scenario
      .addCase(validateScenario.pending, (state) => {
        state.loading.validation = true;
      })
      .addCase(validateScenario.fulfilled, (state, action) => {
        const { path, isValid, errors } = action.payload;
        if (state.scenarios[path]) {
          state.scenarios[path].isValid = isValid;
          state.scenarios[path].validationErrors = errors;
        }
        state.loading.validation = false;
      })
      .addCase(validateScenario.rejected, (state, action) => {
        state.loading.validation = false;
        state.errors.push(`Validation failed: ${action.error.message}`);
      })

      // Search scenarios
      .addCase(searchScenarios.fulfilled, (state, action) => {
        // Search results are handled by the component directly
        // This could be extended to cache search results
      });
  },
});

export const {
  selectScenario,
  deselectScenario,
  setSearchQuery,
  clearSearchQuery,
  addTagFilter,
  removeTagFilter,
  addEnvironmentFilter,
  removeEnvironmentFilter,
  toggleValidOnlyFilter,
  toggleRecentOnlyFilter,
  clearFilters,
  setSortField,
  setSortDirection,
  setViewMode,
  updateScenarioInfo,
  removeScenario,
  updateScenarioContent,
  clearScenarioContent,
  addError,
  removeError,
  clearErrors,
  resetScenarios,
} = scenariosSlice.actions;

export default scenariosSlice.reducer;