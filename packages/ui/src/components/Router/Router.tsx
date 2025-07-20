import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '../Layout/Layout';
import { Sidebar } from '../Navigation/Sidebar';

// Page Components (will be created)
import { DashboardPage } from '../../pages/Dashboard/DashboardPage';
import { ScenariosPage } from '../../pages/Scenarios/ScenariosPage';
import { ExecutionPage } from '../../pages/Execution/ExecutionPage';
import { EnvironmentsPage } from '../../pages/Environments/EnvironmentsPage';
import { PluginsPage } from '../../pages/Plugins/PluginsPage';
import { SettingsPage } from '../../pages/Settings/SettingsPage';
import { NotFoundPage } from '../../pages/NotFound/NotFoundPage';

// Icons (using Heroicons)
import {
  HomeIcon,
  DocumentTextIcon,
  PlayIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  CogIcon,
  ChartBarIcon,
  BoltIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export interface VibraniumRouterProps {
  children?: React.ReactNode;
}

export const VibraniumRouter: React.FC<VibraniumRouterProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = React.useState(true);

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <HomeIcon />,
      path: '/dashboard',
    },
    {
      id: 'scenarios',
      label: 'Scenarios',
      icon: <DocumentTextIcon />,
      path: '/scenarios',
      children: [
        {
          id: 'scenarios-list',
          label: 'All Scenarios',
          path: '/scenarios',
        },
        {
          id: 'scenarios-create',
          label: 'Create New',
          path: '/scenarios/create',
        },
        {
          id: 'scenarios-templates',
          label: 'Templates',
          path: '/scenarios/templates',
        },
      ],
    },
    {
      id: 'execution',
      label: 'Execution',
      icon: <PlayIcon />,
      path: '/execution',
      children: [
        {
          id: 'execution-live',
          label: 'Live Monitoring',
          path: '/execution/live',
        },
        {
          id: 'execution-history',
          label: 'History',
          path: '/execution/history',
        },
        {
          id: 'execution-reports',
          label: 'Reports',
          path: '/execution/reports',
        },
      ],
    },
    {
      id: 'environments',
      label: 'Environments',
      icon: <GlobeAltIcon />,
      path: '/environments',
    },
    {
      id: 'plugins',
      label: 'Plugins',
      icon: <PuzzlePieceIcon />,
      path: '/plugins',
      children: [
        {
          id: 'plugins-installed',
          label: 'Installed',
          path: '/plugins/installed',
        },
        {
          id: 'plugins-marketplace',
          label: 'Marketplace',
          path: '/plugins/marketplace',
        },
        {
          id: 'plugins-development',
          label: 'Development',
          path: '/plugins/development',
        },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <ChartBarIcon />,
      path: '/analytics',
      children: [
        {
          id: 'analytics-performance',
          label: 'Performance',
          path: '/analytics/performance',
        },
        {
          id: 'analytics-trends',
          label: 'Trends',
          path: '/analytics/trends',
        },
        {
          id: 'analytics-insights',
          label: 'Insights',
          path: '/analytics/insights',
        },
      ],
    },
    {
      id: 'automation',
      label: 'Automation',
      icon: <BoltIcon />,
      path: '/automation',
      children: [
        {
          id: 'automation-workflows',
          label: 'Workflows',
          path: '/automation/workflows',
        },
        {
          id: 'automation-schedules',
          label: 'Schedules',
          path: '/automation/schedules',
        },
        {
          id: 'automation-triggers',
          label: 'Triggers',
          path: '/automation/triggers',
        },
      ],
    },
    {
      id: 'collaboration',
      label: 'Collaboration',
      icon: <UserGroupIcon />,
      path: '/collaboration',
      children: [
        {
          id: 'collaboration-teams',
          label: 'Teams',
          path: '/collaboration/teams',
        },
        {
          id: 'collaboration-sharing',
          label: 'Sharing',
          path: '/collaboration/sharing',
        },
        {
          id: 'collaboration-reviews',
          label: 'Reviews',
          path: '/collaboration/reviews',
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <CogIcon />,
      path: '/settings',
    },
  ];

  const [activeItemId, setActiveItemId] = React.useState('dashboard');

  const handleSidebarItemClick = (item: any) => {
    setActiveItemId(item.id);
  };

  // Header component
  const Header = () => (
    <div className="flex items-center justify-between h-full px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BoltIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold text-white">Vibranium</h1>
        </div>
        <div className="text-sm text-gray-400">Web Interface</div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ClockIcon className="w-4 h-4" />
          <span>Last sync: 2 minutes ago</span>
        </div>
        
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>
    </div>
  );

  // Right panel component (for future use)
  const RightPanel = () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <div className="text-sm font-medium text-white">Run Last Scenario</div>
          <div className="text-xs text-gray-400">API Test Suite</div>
        </button>
        
        <button className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <div className="text-sm font-medium text-white">View Reports</div>
          <div className="text-xs text-gray-400">Latest execution results</div>
        </button>
        
        <button className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <div className="text-sm font-medium text-white">Environment Status</div>
          <div className="text-xs text-gray-400">All systems operational</div>
        </button>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Layout
        header={<Header />}
        sidebar={
          <Sidebar
            items={sidebarItems}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeItemId={activeItemId}
            onItemClick={handleSidebarItemClick}
          />
        }
        rightPanel={!rightPanelCollapsed ? <RightPanel /> : undefined}
        sidebarCollapsed={sidebarCollapsed}
        rightPanelCollapsed={rightPanelCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onRightPanelToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
      >
        <AnimatePresence mode="wait">
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Main routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/scenarios/*" element={<ScenariosPage />} />
            <Route path="/execution/*" element={<ExecutionPage />} />
            <Route path="/environments" element={<EnvironmentsPage />} />
            <Route path="/plugins/*" element={<PluginsPage />} />
            <Route path="/analytics/*" element={<div>Analytics (Coming Soon)</div>} />
            <Route path="/automation/*" element={<div>Automation (Coming Soon)</div>} />
            <Route path="/collaboration/*" element={<div>Collaboration (Coming Soon)</div>} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
        
        {children}
      </Layout>
    </BrowserRouter>
  );
};

export default VibraniumRouter;