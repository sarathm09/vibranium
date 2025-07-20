import React from 'react';
import PieChart from './PieChart';
import { ChartProps, ChartConfig } from './types';

interface DonutChartProps extends ChartProps {
  config?: ChartConfig;
  dataKey: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({
  innerRadius = 60,
  outerRadius = 100,
  ...props
}) => {
  return (
    <PieChart
      {...props}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
    />
  );
};

export default DonutChart;