import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel, GlassButton } from '../../components/Glass';
import { 
  PlayIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import './DashboardPage.scss';

export const DashboardPage: React.FC = () => {
  const stats = [
    {
      title: 'Total Scenarios',
      value: '24',
      change: '+3 this week',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      color: 'primary',
    },
    {
      title: 'Successful Runs',
      value: '1,247',
      change: '+12% from last month',
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: 'success',
    },
    {
      title: 'Failed Tests',
      value: '23',
      change: '-5% from last month',
      icon: <ExclamationTriangleIcon className="w-6 h-6" />,
      color: 'warning',
    },
    {
      title: 'Avg Response Time',
      value: '245ms',
      change: '+2ms from yesterday',
      icon: <ClockIcon className="w-6 h-6" />,
      color: 'info',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'execution',
      title: 'API Test Suite completed',
      description: 'All 15 scenarios passed successfully',
      time: '2 minutes ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'scenario',
      title: 'New scenario created',
      description: 'User Authentication Flow',
      time: '15 minutes ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'execution',
      title: 'Performance test failed',
      description: 'Timeout exceeded in step 3',
      time: '1 hour ago',
      status: 'error',
    },
    {
      id: 4,
      type: 'environment',
      title: 'Environment updated',
      description: 'Production environment variables refreshed',
      time: '2 hours ago',
      status: 'info',
    },
  ];

  const quickActions = [
    {
      title: 'Run All Scenarios',
      description: 'Execute complete test suite',
      icon: <PlayIcon className="w-5 h-5" />,
      action: () => console.log('Run all scenarios'),
      variant: 'primary' as const,
    },
    {
      title: 'Create Scenario',
      description: 'Build new test scenario',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      action: () => console.log('Create scenario'),
      variant: 'secondary' as const,
    },
    {
      title: 'View Reports',
      description: 'Check execution reports',
      icon: <ChartBarIcon className="w-5 h-5" />,
      action: () => console.log('View reports'),
      variant: 'default' as const,
    },
    {
      title: 'Manage Plugins',
      description: 'Configure integrations',
      icon: <BoltIcon className="w-5 h-5" />,
      action: () => console.log('Manage plugins'),
      variant: 'default' as const,
    },
  ];

  return (
    <motion.div
      className="dashboard-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Dashboard</h1>
        <p className="dashboard-page__subtitle">
          Welcome back! Here's an overview of your Vibranium workspace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-page__stats">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <GlassPanel 
              variant={stat.color as any} 
              className="dashboard-stat-card"
              hover
            >
              <div className="dashboard-stat-card__icon">
                {stat.icon}
              </div>
              <div className="dashboard-stat-card__content">
                <div className="dashboard-stat-card__value">{stat.value}</div>
                <div className="dashboard-stat-card__title">{stat.title}</div>
                <div className="dashboard-stat-card__change">{stat.change}</div>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-page__content">
        {/* Quick Actions */}
        <div className="dashboard-page__section">
          <GlassPanel className="dashboard-quick-actions">
            <h2 className="dashboard-section-title">Quick Actions</h2>
            <div className="dashboard-quick-actions__grid">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <GlassButton
                    variant={action.variant}
                    size="lg"
                    onClick={action.action}
                    className="dashboard-quick-action"
                    leftIcon={action.icon}
                  >
                    <div className="dashboard-quick-action__content">
                      <div className="dashboard-quick-action__title">
                        {action.title}
                      </div>
                      <div className="dashboard-quick-action__description">
                        {action.description}
                      </div>
                    </div>
                  </GlassButton>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-page__section">
          <GlassPanel className="dashboard-recent-activity">
            <h2 className="dashboard-section-title">Recent Activity</h2>
            <div className="dashboard-activity-list">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  className={`dashboard-activity-item dashboard-activity-item--${activity.status}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="dashboard-activity-item__indicator" />
                  <div className="dashboard-activity-item__content">
                    <div className="dashboard-activity-item__title">
                      {activity.title}
                    </div>
                    <div className="dashboard-activity-item__description">
                      {activity.description}
                    </div>
                    <div className="dashboard-activity-item__time">
                      {activity.time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="dashboard-recent-activity__footer">
              <GlassButton variant="ghost" size="sm">
                View All Activity
              </GlassButton>
            </div>
          </GlassPanel>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;