import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel, GlassButton } from '../../components/Glass';
import { CogIcon } from '@heroicons/react/24/outline';

export const SettingsPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Settings</h1>
        <p className="text-gray-400">Configure your Vibranium workspace preferences</p>
      </div>

      <GlassPanel className="p-6">
        <div className="text-center py-12">
          <CogIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Application Settings</h3>
          <p className="text-gray-400 mb-6">Customize your workspace preferences and configurations</p>
          <GlassButton variant="primary">Open Settings</GlassButton>
        </div>
      </GlassPanel>
    </motion.div>
  );
};

export default SettingsPage;