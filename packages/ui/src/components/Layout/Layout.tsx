import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { GlassPanel } from '../Glass';
import './Layout.scss';

export interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  rightPanel?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarCollapsed?: boolean;
  rightPanelCollapsed?: boolean;
  onSidebarToggle?: () => void;
  onRightPanelToggle?: () => void;
  sidebarWidth?: number;
  rightPanelWidth?: number;
  className?: string;
  animate?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  sidebar,
  rightPanel,
  header,
  footer,
  sidebarCollapsed = false,
  rightPanelCollapsed = false,
  onSidebarToggle,
  onRightPanelToggle,
  sidebarWidth = 280,
  rightPanelWidth = 320,
  className,
  animate = true,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const layoutClasses = clsx(
    'vibranium-layout',
    {
      'vibranium-layout--mobile': isMobile,
      'vibranium-layout--tablet': isTablet,
      'vibranium-layout--sidebar-collapsed': sidebarCollapsed,
      'vibranium-layout--right-panel-collapsed': rightPanelCollapsed,
      'vibranium-layout--has-sidebar': sidebar,
      'vibranium-layout--has-right-panel': rightPanel,
    },
    className
  );

  const sidebarVariants = {
    expanded: {
      width: sidebarWidth,
      opacity: 1,
      x: 0,
    },
    collapsed: {
      width: isMobile ? 0 : 60,
      opacity: isMobile ? 0 : 1,
      x: isMobile ? -sidebarWidth : 0,
    },
  };

  const rightPanelVariants = {
    expanded: {
      width: rightPanelWidth,
      opacity: 1,
      x: 0,
    },
    collapsed: {
      width: isMobile ? 0 : 60,
      opacity: isMobile ? 0 : 1,
      x: isMobile ? rightPanelWidth : 0,
    },
  };

  const mainContentVariants = {
    fullWidth: {
      marginLeft: 0,
      marginRight: 0,
    },
    withSidebar: {
      marginLeft: sidebarCollapsed ? (isMobile ? 0 : 60) : sidebarWidth,
    },
    withRightPanel: {
      marginRight: rightPanelCollapsed ? (isMobile ? 0 : 60) : rightPanelWidth,
    },
    withBoth: {
      marginLeft: sidebarCollapsed ? (isMobile ? 0 : 60) : sidebarWidth,
      marginRight: rightPanelCollapsed ? (isMobile ? 0 : 60) : rightPanelWidth,
    },
  };

  const getMainContentVariant = () => {
    if (sidebar && rightPanel) return 'withBoth';
    if (sidebar) return 'withSidebar';
    if (rightPanel) return 'withRightPanel';
    return 'fullWidth';
  };

  return (
    <div className={layoutClasses}>
      {/* Header */}
      {header && (
        <motion.header
          className="vibranium-layout__header"
          initial={animate ? { y: -100, opacity: 0 } : false}
          animate={animate ? { y: 0, opacity: 1 } : false}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <GlassPanel variant="dark" blur="md" padding={false} className="vibranium-layout__header-content">
            {header}
          </GlassPanel>
        </motion.header>
      )}

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebar && (
          <motion.aside
            className="vibranium-layout__sidebar"
            variants={sidebarVariants}
            initial={animate ? 'collapsed' : 'expanded'}
            animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
            exit="collapsed"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <GlassPanel
              variant="dark"
              blur="lg"
              padding={false}
              className="vibranium-layout__sidebar-content"
              animate={false}
            >
              {sidebar}
            </GlassPanel>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        className="vibranium-layout__main"
        variants={mainContentVariants}
        animate={getMainContentVariant()}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="vibranium-layout__main-content">
          {children}
        </div>
      </motion.main>

      {/* Right Panel */}
      <AnimatePresence mode="wait">
        {rightPanel && (
          <motion.aside
            className="vibranium-layout__right-panel"
            variants={rightPanelVariants}
            initial={animate ? 'collapsed' : 'expanded'}
            animate={rightPanelCollapsed ? 'collapsed' : 'expanded'}
            exit="collapsed"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <GlassPanel
              variant="dark"
              blur="lg"
              padding={false}
              className="vibranium-layout__right-panel-content"
              animate={false}
            >
              {rightPanel}
            </GlassPanel>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Footer */}
      {footer && (
        <motion.footer
          className="vibranium-layout__footer"
          initial={animate ? { y: 100, opacity: 0 } : false}
          animate={animate ? { y: 0, opacity: 1 } : false}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <GlassPanel variant="dark" blur="md" padding={false} className="vibranium-layout__footer-content">
            {footer}
          </GlassPanel>
        </motion.footer>
      )}

      {/* Mobile Overlay */}
      {isMobile && (!sidebarCollapsed || !rightPanelCollapsed) && (
        <motion.div
          className="vibranium-layout__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!sidebarCollapsed) onSidebarToggle?.();
            if (!rightPanelCollapsed) onRightPanelToggle?.();
          }}
        />
      )}
    </div>
  );
};

export default Layout;