import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassPanel, GlassButton } from '../../components/Glass';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <GlassPanel className="p-12 text-center max-w-md">
        <ExclamationTriangleIcon className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-3">
          <GlassButton 
            variant="primary" 
            fullWidth
            leftIcon={<HomeIcon className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </GlassButton>
          <GlassButton 
            variant="ghost" 
            fullWidth
            onClick={() => navigate(-1)}
          >
            Go Back
          </GlassButton>
        </div>
      </GlassPanel>
    </motion.div>
  );
};

export default NotFoundPage;