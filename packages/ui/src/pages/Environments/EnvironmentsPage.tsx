import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel, GlassButton } from '../../components/Glass';
import { GlobeAltIcon, PlusIcon } from '@heroicons/react/24/outline';

export const EnvironmentsPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Environments</h1>
        <p className="text-gray-400">Manage your testing environments and configurations</p>
      </div>

      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Environment Configurations</h2>
          <GlassButton variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>
            Add Environment
          </GlassButton>
        </div>
        
        <div className="text-center py-12">
          <GlobeAltIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Environment Manager</h3>
          <p className="text-gray-400 mb-6">Configure and manage multiple testing environments</p>
          <GlassButton variant="secondary">Configure Environments</GlassButton>
        </div>
      </GlassPanel>
    </motion.div>
  );
};

export default EnvironmentsPage;