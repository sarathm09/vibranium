import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import './GlassPanel.scss';

export interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  padding?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  blur = 'lg',
  hover = true,
  padding = true,
  rounded = 'xl',
  shadow = 'md',
  onClick,
  animate = true,
  delay = 0,
}) => {
  const classes = clsx(
    'glass-panel',
    `glass-panel--${variant}`,
    `glass-panel--${size}`,
    `glass-panel--blur-${blur}`,
    `glass-panel--rounded-${rounded}`,
    `glass-panel--shadow-${shadow}`,
    {
      'glass-panel--hoverable': hover && onClick,
      'glass-panel--no-padding': !padding,
      'glass-panel--clickable': onClick,
    },
    className
  );

  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 20, backdropFilter: 'blur(0px)' },
        animate: { opacity: 1, y: 0, backdropFilter: `blur(${getBlurValue(blur)})` },
        transition: {
          duration: 0.5,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94], // glass-like easing
        },
        whileHover: hover
          ? {
              y: -2,
              transition: { duration: 0.2 },
            }
          : undefined,
        whileTap: onClick
          ? {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
          : undefined,
      }
    : {};

  return (
    <motion.div
      className={classes}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

function getBlurValue(blur: string): string {
  const blurMap = {
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
  };
  return blurMap[blur as keyof typeof blurMap] || blurMap.lg;
}

export default GlassPanel;