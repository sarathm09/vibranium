import React from 'react';
import { motion } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import { GlassPanel, GlassButton } from '../../components/Glass';
import { PlayIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const LiveMonitoringPage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Live Monitoring</h1>
      <p className="text-gray-400">Real-time execution monitoring and control</p>
    </div>

    <GlassPanel className="p-6">
      <div className="text-center py-12">
        <PlayIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Real-time Monitoring</h3>
        <p className="text-gray-400 mb-6">Monitor scenario executions in real-time with live updates</p>
        <GlassButton variant="success">Start Monitoring</GlassButton>
      </div>
    </GlassPanel>
  </motion.div>
);

const HistoryPage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Execution History</h1>
      <p className="text-gray-400">Browse past execution results and trends</p>
    </div>

    <GlassPanel className="p-6">
      <div className="text-center py-12">
        <ClockIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Execution History</h3>
        <p className="text-gray-400 mb-6">View detailed history of all scenario executions</p>
        <GlassButton variant="primary">View History</GlassButton>
      </div>
    </GlassPanel>
  </motion.div>
);

const ReportsPage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Execution Reports</h1>
      <p className="text-gray-400">Detailed reports and analytics</p>
    </div>

    <GlassPanel className="p-6">
      <div className="text-center py-12">
        <ChartBarIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Advanced Reports</h3>
        <p className="text-gray-400 mb-6">Generate comprehensive reports with charts and insights</p>
        <GlassButton variant="secondary">Generate Report</GlassButton>
      </div>
    </GlassPanel>
  </motion.div>
);

export const ExecutionPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<LiveMonitoringPage />} />
      <Route path="live" element={<LiveMonitoringPage />} />
      <Route path="history" element={<HistoryPage />} />
      <Route path="reports" element={<ReportsPage />} />
    </Routes>
  );
};

export default ExecutionPage;