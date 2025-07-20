import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { AnalyticsDashboardState, AnalyticsFilters } from '../types/analytics';
import { analyticsService } from '../services/analytics';

interface AnalyticsStore extends AnalyticsDashboardState {
  // Actions
  loadExecutionAnalytics: () => Promise<void>;
  loadPerformanceAnalytics: () => Promise<void>;
  loadQualityMetrics: () => Promise<void>;
  loadErrorAnalytics: () => Promise<void>;
  loadEnvironmentHealth: () => Promise<void>;
  loadPredictiveAnalytics: () => Promise<void>;
  loadTeamProductivity: () => Promise<void>;
  loadAllAnalytics: () => Promise<void>;
  
  updateFilters: (filters: Partial<AnalyticsFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Real-time updates
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
}

const defaultFilters: AnalyticsFilters = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    end: new Date().toISOString(),
    preset: '30d'
  },
  environments: [],
  scenarios: [],
  status: [],
  tags: [],
  customFilters: {}
};

const initialState: AnalyticsDashboardState = {
  executionAnalytics: null,
  performanceAnalytics: null,
  qualityMetrics: null,
  errorAnalytics: null,
  environmentHealth: null,
  predictiveAnalytics: null,
  teamProductivity: null,
  dashboards: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,
  lastUpdated: null
};

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      loadExecutionAnalytics: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await analyticsService.getExecutionAnalytics(get().filters);
          set({ 
            executionAnalytics: data, 
            isLoading: false, 
            lastUpdated: new Date().toISOString() 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load execution analytics',
            isLoading: false 
          });
        }
      },

      loadPerformanceAnalytics: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await analyticsService.getPerformanceAnalytics(get().filters);
          set({ 
            performanceAnalytics: data, 
            isLoading: false, 
            lastUpdated: new Date().toISOString() 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load performance analytics',
            isLoading: false 
          });
        }
      },

      loadQualityMetrics: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await analyticsService.getQualityMetrics(get().filters);
          set({ 
            qualityMetrics: data, 
            isLoading: false, 
            lastUpdated: new Date().toISOString() 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load quality metrics',
            isLoading: false 
          });
        }
      },

      loadErrorAnalytics: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await analyticsService.getErrorAnalytics(get().filters);
          set({ 
            errorAnalytics: data, 
            isLoading: false, 
            lastUpdated: new Date().toISOString() 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load error analytics',
            isLoading: false 
          });
        }
      },

      loadEnvironmentHealth: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await analyticsService.getEnvironmentHealth(get().filters);
          set({ 
            environmentHealth: data, 
            isLoading: false, 
            lastUpdated: new Date().toISOString() 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load environment health',
            isLoading: false 
          });
        }
      },

      loadPredictiveAnalytics: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await analyticsService.getPredictiveAnalytics(get().filters);
          set({ 
            predictiveAnalytics: data, 
            isLoading: false, 
            lastUpdated: new Date().toISOString() 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load predictive analytics',
            isLoading: false 
          });
        }
      },

      loadTeamProductivity: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await analyticsService.getTeamProductivity(get().filters);
          set({ 
            teamProductivity: data, 
            isLoading: false, 
            lastUpdated: new Date().toISOString() 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load team productivity',
            isLoading: false 
          });
        }
      },

      loadAllAnalytics: async () => {
        const actions = [
          get().loadExecutionAnalytics,
          get().loadPerformanceAnalytics,
          get().loadQualityMetrics,
          get().loadErrorAnalytics,
          get().loadEnvironmentHealth,
          get().loadTeamProductivity
        ];

        try {
          set({ isLoading: true, error: null });
          await Promise.all(actions.map(action => action()));
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load analytics data',
            isLoading: false 
          });
        }
      },

      updateFilters: (newFilters: Partial<AnalyticsFilters>) => {
        const currentFilters = get().filters;
        const updatedFilters = { ...currentFilters, ...newFilters };
        set({ filters: updatedFilters });
        
        // Automatically reload data when filters change
        setTimeout(() => {
          get().loadAllAnalytics();
        }, 100);
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
        setTimeout(() => {
          get().loadAllAnalytics();
        }, 100);
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ error }),

      startRealTimeUpdates: () => {
        // This would connect to real-time updates in a real implementation
        const unsubscribe = analyticsService.subscribeToRealTimeUpdates((update) => {
          // Handle real-time updates
          console.log('Real-time update:', update);
          
          // You could update specific parts of the state based on the update type
          // For now, we'll just update the timestamp to indicate fresh data
          set({ lastUpdated: new Date().toISOString() });
        });

        // Store the unsubscribe function
        (get() as any)._rtUnsubscribe = unsubscribe;
      },

      stopRealTimeUpdates: () => {
        const unsubscribe = (get() as any)._rtUnsubscribe;
        if (unsubscribe) {
          unsubscribe();
          delete (get() as any)._rtUnsubscribe;
        }
      }
    })),
    {
      name: 'analytics-store',
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
);

// Subscribe to filter changes and auto-reload
useAnalyticsStore.subscribe(
  (state) => state.filters,
  (filters, previousFilters) => {
    // Only reload if filters actually changed
    if (JSON.stringify(filters) !== JSON.stringify(previousFilters)) {
      const store = useAnalyticsStore.getState();
      // Debounce the reload to avoid excessive API calls
      setTimeout(() => {
        store.loadAllAnalytics();
      }, 500);
    }
  }
);