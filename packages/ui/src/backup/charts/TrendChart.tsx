import React from 'react';
import LineChart from './LineChart';
import { ChartProps, ChartConfig } from './types';

interface TrendChartProps extends ChartProps {
  config?: ChartConfig;
  dataKey: string;
  showTrendLine?: boolean;
  trendColor?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({
  showTrendLine = true,
  trendColor = '#10b981',
  ...props
}) => {
  return (
    <LineChart
      {...props}
      strokeWidth={2}
      dot={false}
      activeDot={true}
    />
  );
};

export default TrendChart;