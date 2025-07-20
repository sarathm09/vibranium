import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '../Layout/Layout';
import { Sidebar } from '../Navigation/Sidebar';

// Page Components
import { ScenariosPage } from '../../pages/Scenarios/ScenariosPage';
import { ExecutionPage } from '../../pages/Execution/ExecutionPage';
import { EnvironmentsPage } from '../../pages/Environments/EnvironmentsPage';
import { PluginsPage } from '../../pages/Plugins/PluginsPage';
import { SettingsPage } from '../../pages/Settings/SettingsPage';
import { NotFoundPage } from '../../pages/NotFound/NotFoundPage';

// Icons (using Heroicons)
import {
  DocumentTextIcon,
  PlayIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  CogIcon,
  BoltIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export interface VibraniumRouterProps {
  children?: React.ReactNode;
}

// Main router content component to access useLocation
const RouterContent: React.FC<VibraniumRouterProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = React.useState(true);

  // Simplified sidebar navigation items - focusing on core functionality
  const sidebarItems = [
    {
      id: 'scenarios',
      label: 'Scenarios',
      icon: <DocumentTextIcon />,
      path: '/scenarios',
    },
    {
      id: 'execution',
      label: 'Execution',
      icon: <PlayIcon />,
      path: '/execution',
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
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <CogIcon />,
      path: '/settings',
    },
  ];

  // Determine active item based on current route
  const getActiveItemFromPath = (pathname: string) => {
    if (pathname.startsWith('/scenarios')) return 'scenarios';
    if (pathname.startsWith('/execution')) return 'execution';
    if (pathname.startsWith('/environments')) return 'environments';
    if (pathname.startsWith('/plugins')) return 'plugins';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'scenarios'; // default
  };

  const [activeItemId, setActiveItemId] = React.useState(() => getActiveItemFromPath(location.pathname));

  // Update active item when location changes
  React.useEffect(() => {
    setActiveItemId(getActiveItemFromPath(location.pathname));
  }, [location.pathname]);

  const handleSidebarItemClick = (item: any) => {
    setActiveItemId(item.id);
    if (item.path) {
      navigate(item.path);
    }
  };

  // Header component
  const Header = () => (
    <div className="flex items-center justify-between h-full px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BoltIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-inverse)' }}>Vibranium</h1>
        </div>
        <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Web Interface</div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
          <ClockIcon className="w-4 h-4" />
          <span>Last sync: 2 minutes ago</span>
        </div>
        
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>
    </div>
  );

  // Right panel component wrapper that uses navigation
  const RightPanelWrapper = () => {
    const navigate = useNavigate();
    
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button 
            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => navigate('/execution/live')}
          >
            <div className="text-sm font-medium text-white">Run Last Scenario</div>
            <div className="text-xs text-gray-400">API Test Suite</div>
          </button>
          
          <button 
            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => navigate('/execution/reports')}
          >
            <div className="text-sm font-medium text-white">View Reports</div>
            <div className="text-xs text-gray-400">Latest execution results</div>
          </button>
          
          <button 
            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => navigate('/environments')}
          >
            <div className="text-sm font-medium text-white">Environment Status</div>
            <div className="text-xs text-gray-400">All systems operational</div>
          </button>
        </div>
      </div>
    );
  };

  return (
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
          <Route path="/" element={<Navigate to="/scenarios" replace />} />
          
          {/* Main routes */}
          <Route path="/scenarios/*" element={<ScenariosPage />} />
          <Route path="/execution/*" element={<ExecutionPage />} />
          <Route path="/environments" element={<EnvironmentsPage />} />
          <Route path="/plugins/*" element={<PluginsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
      
      {children}
    </Layout>
  );
};

// Main router wrapper component
export const VibraniumRouter: React.FC<VibraniumRouterProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <RouterContent>{children}</RouterContent>
    </BrowserRouter>
  );
};

export default VibraniumRouter;