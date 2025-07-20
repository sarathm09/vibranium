import React from 'react';
import { motion } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import { GlassPanel, GlassButton } from '../../components/Glass';
import { PuzzlePieceIcon, PlusIcon } from '@heroicons/react/24/outline';

const InstalledPluginsPage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Installed Plugins</h1>
      <p className="text-gray-400">Manage your currently installed plugins</p>
    </div>

    <GlassPanel className="p-6">
      <div className="text-center py-12">
        <PuzzlePieceIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Plugin Manager</h3>
        <p className="text-gray-400 mb-6">View and configure installed plugins</p>
        <GlassButton variant="primary">Manage Plugins</GlassButton>
      </div>
    </GlassPanel>
  </motion.div>
);

const MarketplacePage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Plugin Marketplace</h1>
      <p className="text-gray-400">Discover and install new plugins</p>
    </div>

    <GlassPanel className="p-6">
      <div className="text-center py-12">
        <PuzzlePieceIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Plugin Marketplace</h3>
        <p className="text-gray-400 mb-6">Browse and install plugins from the community</p>
        <GlassButton variant="success">Browse Marketplace</GlassButton>
      </div>
    </GlassPanel>
  </motion.div>
);

const DevelopmentPage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Plugin Development</h1>
      <p className="text-gray-400">Create and test your own plugins</p>
    </div>

    <GlassPanel className="p-6">
      <div className="text-center py-12">
        <PuzzlePieceIcon className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Plugin Development</h3>
        <p className="text-gray-400 mb-6">Tools and guides for building custom plugins</p>
        <GlassButton variant="warning">Start Developing</GlassButton>
      </div>
    </GlassPanel>
  </motion.div>
);

export const PluginsPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<InstalledPluginsPage />} />
      <Route path="installed" element={<InstalledPluginsPage />} />
      <Route path="marketplace" element={<MarketplacePage />} />
      <Route path="development" element={<DevelopmentPage />} />
    </Routes>
  );
};

export default PluginsPage;