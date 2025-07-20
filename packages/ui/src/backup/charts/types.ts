import { ReactNode } from 'react';

export interface ChartProps {
  data: any[];
  className?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
}

export interface ChartConfig {
  colors?: string[];
  theme?: 'light' | 'dark';
  animation?: boolean;
  legend?: boolean;
  tooltip?: boolean;
  grid?: boolean;
  responsive?: boolean;
}

export interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [ReactNode, string];
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}