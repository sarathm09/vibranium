import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import './GlassInput.scss';

export interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  onClear?: () => void;
  animate?: boolean;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(({
  label,
  error,
  hint,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  onClear,
  animate = true,
  value,
  onChange,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  const containerClasses = clsx(
    'glass-input-container',
    `glass-input-container--${size}`,
    `glass-input-container--${variant}`,
    {
      'glass-input-container--focused': isFocused,
      'glass-input-container--error': error,
      'glass-input-container--disabled': disabled,
      'glass-input-container--full-width': fullWidth,
      'glass-input-container--with-left-icon': leftIcon,
      'glass-input-container--with-right-icon': rightIcon || onClear,
      'glass-input-container--loading': loading,
      'glass-input-container--has-value': hasValue,
    },
    className
  );

  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
      }
    : {};

  return (
    <motion.div className={containerClasses} {...motionProps}>
      {label && (
        <label className="glass-input__label">
          {label}
        </label>
      )}
      
      <div className="glass-input__wrapper">
        {leftIcon && (
          <div className="glass-input__left-icon">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className="glass-input__field"
          disabled={disabled || loading}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {loading && (
          <div className="glass-input__spinner">
            <div className="glass-input__spinner-circle" />
          </div>
        )}
        
        {onClear && hasValue && !loading && (
          <button
            type="button"
            className="glass-input__clear-button"
            onClick={onClear}
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        
        {rightIcon && !onClear && !loading && (
          <div className="glass-input__right-icon">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <motion.div
          className="glass-input__error"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {error}
        </motion.div>
      )}
      
      {hint && !error && (
        <div className="glass-input__hint">
          {hint}
        </div>
      )}
    </motion.div>
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;