import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { MetricCardProps } from './types';

const colorVariants = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-900 dark:text-green-100',
    accent: 'text-green-600 dark:text-green-400'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-100',
    accent: 'text-yellow-600 dark:text-yellow-400'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    accent: 'text-red-600 dark:text-red-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    accent: 'text-purple-600 dark:text-purple-400'
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-900 dark:text-gray-100',
    accent: 'text-gray-600 dark:text-gray-400'
  }
};

const sizeVariants = {
  sm: {
    container: 'p-4',
    title: 'text-sm',
    value: 'text-2xl',
    change: 'text-xs',
    icon: 'w-4 h-4'
  },
  md: {
    container: 'p-6',
    title: 'text-base',
    value: 'text-3xl',
    change: 'text-sm',
    icon: 'w-5 h-5'
  },
  lg: {
    container: 'p-8',
    title: 'text-lg',
    value: 'text-4xl',
    change: 'text-base',
    icon: 'w-6 h-6'
  }
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'blue',
  size = 'md',
  loading = false,
  className
}) => {
  const colorClasses = colorVariants[color];
  const sizeClasses = sizeVariants[size];

  const getChangeIcon = () => {
    if (!change) return null;
    
    switch (change.type) {
      case 'increase':
        return <ArrowUpIcon className={clsx(sizeClasses.icon, 'text-green-500')} />;
      case 'decrease':
        return <ArrowDownIcon className={clsx(sizeClasses.icon, 'text-red-500')} />;
      case 'neutral':
      default:
        return <MinusIcon className={clsx(sizeClasses.icon, 'text-gray-500')} />;
    }
  };

  const getChangeColor = () => {
    if (!change) return 'text-gray-500';
    
    switch (change.type) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={clsx(
        'rounded-lg border',
        colorClasses.bg,
        colorClasses.border,
        sizeClasses.container,
        'animate-pulse',
        className
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'rounded-lg border transition-all duration-200 hover:shadow-md',
      colorClasses.bg,
      colorClasses.border,
      sizeClasses.container,
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={clsx(
          'font-medium',
          sizeClasses.title,
          colorClasses.text
        )}>
          {title}
        </h3>
        {icon && (
          <div className={clsx(colorClasses.accent)}>
            {icon}
          </div>
        )}
      </div>
      
      <div className={clsx(
        'font-bold mb-1',
        sizeClasses.value,
        colorClasses.accent
      )}>
        {value}
      </div>
      
      {change && (
        <div className={clsx(
          'flex items-center space-x-1',
          sizeClasses.change,
          getChangeColor()
        )}>
          {getChangeIcon()}
          <span>
            {change.value > 0 ? '+' : ''}{change.value.toFixed(1)}%
          </span>
          <span className="text-gray-500 dark:text-gray-400">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;