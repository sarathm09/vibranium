import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import './GlassButton.scss';

export interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: string;
  animate?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  href,
  target,
  animate = true,
}) => {
  const classes = clsx(
    'glass-button',
    `glass-button--${variant}`,
    `glass-button--${size}`,
    {
      'glass-button--disabled': disabled || loading,
      'glass-button--loading': loading,
      'glass-button--full-width': fullWidth,
      'glass-button--with-left-icon': leftIcon,
      'glass-button--with-right-icon': rightIcon,
    },
    className
  );

  const motionProps = animate && !disabled
    ? {
        whileHover: {
          y: -2,
          scale: 1.02,
          transition: { duration: 0.2 },
        },
        whileTap: {
          y: 0,
          scale: 0.98,
          transition: { duration: 0.1 },
        },
      }
    : {};

  const content = (
    <>
      {loading && (
        <div className="glass-button__spinner">
          <div className="glass-button__spinner-circle" />
        </div>
      )}
      {leftIcon && !loading && (
        <span className="glass-button__left-icon">{leftIcon}</span>
      )}
      <span className="glass-button__text">{children}</span>
      {rightIcon && !loading && (
        <span className="glass-button__right-icon">{rightIcon}</span>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <motion.a
        href={href}
        target={target}
        className={classes}
        {...motionProps}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
};

export default GlassButton;