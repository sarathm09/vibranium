import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { GlassButton } from '../Glass';
import './Sidebar.scss';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: SidebarItem[];
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  activeItemId?: string;
  onItemClick?: (item: SidebarItem) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  collapsed = false,
  onToggle,
  activeItemId,
  onItemClick,
  header,
  footer,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarClasses = clsx(
    'sidebar',
    {
      'sidebar--collapsed': collapsed,
    },
    className
  );

  const renderItem = (item: SidebarItem, level = 0) => {
    const isActive = item.id === activeItemId;
    const hasChildren = item.children && item.children.length > 0;

    const itemClasses = clsx(
      'sidebar-item',
      `sidebar-item--level-${level}`,
      {
        'sidebar-item--active': isActive,
        'sidebar-item--disabled': item.disabled,
        'sidebar-item--has-children': hasChildren,
      }
    );

    const handleClick = () => {
      if (item.disabled) return;
      
      // Navigate to the item's path if it exists
      if (item.path) {
        navigate(item.path);
      }
      
      // Call the item's custom onClick handler
      item.onClick?.();
      
      // Call the parent's onItemClick handler
      onItemClick?.(item);
    };

    return (
      <motion.div
        key={item.id}
        className={itemClasses}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: level * 0.1 }}
      >
        <button
          className="sidebar-item__button"
          onClick={handleClick}
          disabled={item.disabled}
          title={collapsed ? item.label : undefined}
        >
          {item.icon && (
            <span className="sidebar-item__icon">
              {item.icon}
            </span>
          )}
          
          {!collapsed && (
            <span className="sidebar-item__label">
              {item.label}
            </span>
          )}
          
          {!collapsed && item.badge && (
            <span className="sidebar-item__badge">
              {item.badge}
            </span>
          )}
          
          {!collapsed && hasChildren && (
            <span className="sidebar-item__arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </span>
          )}
        </button>
        
        {!collapsed && hasChildren && (
          <motion.div
            className="sidebar-item__children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {item.children?.map(child => renderItem(child, level + 1))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={sidebarClasses}>
      {/* Header */}
      {header && (
        <div className="sidebar__header">
          {header}
        </div>
      )}
      
      {/* Toggle Button */}
      <div className="sidebar__toggle">
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="sidebar__toggle-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          {!collapsed && <span>Collapse</span>}
        </GlassButton>
      </div>
      
      {/* Navigation Items */}
      <nav className="sidebar__nav">
        <div className="sidebar__nav-items">
          {items.map(item => renderItem(item))}
        </div>
      </nav>
      
      {/* Footer */}
      {footer && (
        <div className="sidebar__footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Sidebar;