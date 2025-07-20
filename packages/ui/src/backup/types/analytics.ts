// Analytics and dashboard specific types
export interface MetricValue {
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
  target?: number;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | 'duration' | 'bytes';
}

export interface KPIMetric {
  id: string;
  name: string;
  description?: string;
  value: MetricValue;
  icon?: string;
  color?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'execution' | 'performance' | 'quality' | 'reliability' | 'productivity';
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface ChartData {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'heatmap' | 'treemap';
  data: TimeSeriesData[] | any[];
  config?: ChartConfig;
}

export interface ChartConfig {
  title?: string;
  subtitle?: string;
  xAxis?: {
    label?: string;
    type?: 'time' | 'category' | 'numeric';
    format?: string;
  };
  yAxis?: {
    label?: string;
    format?: string;
    min?: number;
    max?: number;
  };
  colors?: string[];
  legend?: boolean;
  tooltip?: boolean;
  animations?: boolean;
  responsive?: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  data?: any;
  config?: any;
  refreshInterval?: number;
  lastUpdated?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'flex' | 'custom';
  theme?: 'light' | 'dark' | 'auto';
  isPublic?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionAnalytics {
  totalExecutions: number;
  successRate: MetricValue;
  averageDuration: MetricValue;
  failureRate: MetricValue;
  trendsOverTime: TimeSeriesData[];
  executionsByEnvironment: Record<string, number>;
  executionsByScenario: Record<string, number>;
  recentExecutions: ExecutionSummary[];
}

export interface ExecutionSummary {
  id: string;
  scenarioName: string;
  environment: string;
  status: 'success' | 'failure' | 'running' | 'cancelled' | 'skipped';
  duration: number;
  timestamp: string;
  stepCount: number;
  failedSteps?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceAnalytics {
  responseTimeMetrics: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    average: number;
  };
  throughputMetrics: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  errorRates: {
    http4xx: number;
    http5xx: number;
    timeout: number;
    connection: number;
  };
  bottlenecks: PerformanceBottleneck[];
  trends: {
    responseTime: TimeSeriesData[];
    throughput: TimeSeriesData[];
    errorRate: TimeSeriesData[];
  };
}

export interface PerformanceBottleneck {
  type: 'api_endpoint' | 'scenario_step' | 'environment' | 'network';
  identifier: string;
  averageResponseTime: number;
  impact: 'high' | 'medium' | 'low';
  occurrences: number;
  suggestions: string[];
}

export interface QualityMetrics {
  testCoverage: {
    scenarios: number;
    endpoints: number;
    environments: number;
    branches: number;
  };
  reliability: {
    stability: MetricValue;
    consistency: MetricValue;
    flakiness: MetricValue;
  };
  maintainability: {
    complexity: MetricValue;
    duplication: MetricValue;
    documentation: MetricValue;
  };
  qualityScore: MetricValue;
  qualityTrends: TimeSeriesData[];
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByScenario: Record<string, number>;
  errorsByEnvironment: Record<string, number>;
  errorTrends: TimeSeriesData[];
  topErrors: ErrorSummary[];
  resolutionTime: MetricValue;
}

export interface ErrorSummary {
  id: string;
  type: string;
  message: string;
  scenario: string;
  environment: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface EnvironmentHealth {
  environment: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  uptime: MetricValue;
  responseTime: MetricValue;
  errorRate: MetricValue;
  lastChecked: string;
  issues: EnvironmentIssue[];
  metrics: Record<string, MetricValue>;
}

export interface EnvironmentIssue {
  id: string;
  type: 'performance' | 'availability' | 'error' | 'configuration';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  detectedAt: string;
  resolvedAt?: string;
  impact: string;
}

export interface PredictiveAnalytics {
  failurePredictions: FailurePrediction[];
  performanceForecasts: PerformanceForecast[];
  resourceOptimizations: ResourceOptimization[];
  qualityTrends: QualityTrend[];
  recommendations: Recommendation[];
}

export interface FailurePrediction {
  scenario: string;
  environment: string;
  probability: number;
  timeframe: string;
  confidence: number;
  factors: string[];
  preventiveMeasures: string[];
}

export interface PerformanceForecast {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeframe: string;
  confidence: number;
  trend: 'improving' | 'degrading' | 'stable';
}

export interface ResourceOptimization {
  type: 'execution_time' | 'resource_usage' | 'cost' | 'reliability';
  currentState: any;
  recommendedState: any;
  expectedImprovement: MetricValue;
  implementation: string[];
  effort: 'low' | 'medium' | 'high';
}

export interface QualityTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  velocity: number;
  projectedValue: number;
  timeframe: string;
}

export interface Recommendation {
  id: string;
  type: 'performance' | 'reliability' | 'quality' | 'cost' | 'productivity';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: string;
  timeline: string;
  actions: string[];
  metrics: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'executive' | 'detailed' | 'custom';
  sections: ReportSection[];
  schedule?: ReportSchedule;
  format: 'pdf' | 'html' | 'excel' | 'json';
  recipients?: string[];
  isActive: boolean;
}

export interface ReportSection {
  id: string;
  type: 'summary' | 'metrics' | 'charts' | 'tables' | 'text';
  title: string;
  content: any;
  config?: any;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  timezone: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  isActive: boolean;
}

export interface TeamProductivity {
  teamMembers: number;
  scenariosCreated: MetricValue;
  executionsRun: MetricValue;
  issuesResolved: MetricValue;
  averageResolutionTime: MetricValue;
  qualityScore: MetricValue;
  productivity: MetricValue;
  collaboration: MetricValue;
  trends: {
    productivity: TimeSeriesData[];
    quality: TimeSeriesData[];
    velocity: TimeSeriesData[];
  };
}

export interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
    preset?: 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom';
  };
  environments?: string[];
  scenarios?: string[];
  status?: string[];
  tags?: string[];
  customFilters?: Record<string, any>;
}

export interface AnalyticsDashboardState {
  executionAnalytics: ExecutionAnalytics | null;
  performanceAnalytics: PerformanceAnalytics | null;
  qualityMetrics: QualityMetrics | null;
  errorAnalytics: ErrorAnalytics | null;
  environmentHealth: EnvironmentHealth[] | null;
  predictiveAnalytics: PredictiveAnalytics | null;
  teamProductivity: TeamProductivity | null;
  dashboards: Dashboard[];
  filters: AnalyticsFilters;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}