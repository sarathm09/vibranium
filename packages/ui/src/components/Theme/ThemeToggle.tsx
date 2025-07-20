import React from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../hooks/useTheme';
import { GlassButton } from '../Glass/GlassButton';
import './ThemeToggle.scss';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  size = 'md',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconVariants = {
    light: {
      rotate: 0,
      scale: 1,
      opacity: 1,
    },
    dark: {
      rotate: 180,
      scale: 0.8,
      opacity: 0.9,
    },
  };

  const buttonVariants = {
    light: {
      background: 'rgba(255, 255, 255, 0.1)',
    },
    dark: {
      background: 'rgba(0, 0, 0, 0.2)',
    },
  };

  return (
    <motion.div 
      className={`theme-toggle ${className || ''}`}
      variants={buttonVariants}
      animate={theme}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassButton
        onClick={toggleTheme}
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        size={size}
        className="theme-toggle__button"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <motion.div
          className="theme-toggle__icon-container"
          variants={iconVariants}
          animate={theme}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {theme === 'light' ? (
            <MoonIcon className={iconSizes[size]} />
          ) : (
            <SunIcon className={iconSizes[size]} />
          )}
        </motion.div>
        
        {showLabel && (
          <motion.span
            className="theme-toggle__label"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </motion.span>
        )}
      </GlassButton>
    </motion.div>
  );
};

export default ThemeToggle;