import React from 'react';
import { motion } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import { GlassPanel, GlassButton } from '../../components/Glass';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';

const ScenariosListPage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Scenarios</h1>
      <p className="text-gray-400">Manage and execute your test scenarios</p>
    </div>

    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">All Scenarios</h2>
        <GlassButton variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>
          Create New Scenario
        </GlassButton>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <GlassPanel key={i} variant="primary" className="p-4 hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-start gap-3">
              <DocumentTextIcon className="w-6 h-6 text-blue-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-2">API Test Scenario {i}</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Tests authentication, data retrieval, and error handling
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last run: 2 hours ago</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">Passed</span>
                </div>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </GlassPanel>
  </motion.div>
);

const CreateScenarioPage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Create New Scenario</h1>
      <p className="text-gray-400">Build a new test scenario from scratch</p>
    </div>

    <GlassPanel className="p-6">
      <div className="text-center py-12">
        <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Scenario Builder</h3>
        <p className="text-gray-400 mb-6">Coming soon - Visual scenario builder with drag-and-drop interface</p>
        <GlassButton variant="primary">Start Building</GlassButton>
      </div>
    </GlassPanel>
  </motion.div>
);

const TemplatesPage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Scenario Templates</h1>
      <p className="text-gray-400">Pre-built templates to get you started quickly</p>
    </div>

    <GlassPanel className="p-6">
      <div className="text-center py-12">
        <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Template Library</h3>
        <p className="text-gray-400 mb-6">Browse and use community-contributed scenario templates</p>
        <GlassButton variant="secondary">Browse Templates</GlassButton>
      </div>
    </GlassPanel>
  </motion.div>
);

export const ScenariosPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ScenariosListPage />} />
      <Route path="create" element={<CreateScenarioPage />} />
      <Route path="templates" element={<TemplatesPage />} />
    </Routes>
  );
};

export default ScenariosPage;