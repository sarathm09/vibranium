/**
 * Interactive CLI with Ink UI
 */

export * from './interactive/app';
export * from './interactive/state/app-context';
export * from './interactive/components/navigation-tree';
export * from './interactive/components/details-pane';
export * from './interactive/components/status-bar';
export * from './interactive/components/variable-preview';

import React from 'react';
import { render } from 'ink';
import { VibraniumApp, VibraniumAppProps } from './interactive/app';
import { ResolvedConfig } from './utils/config-resolver';

export interface InteractiveUIProps {
  scenarioPath?: string;
  environment?: string;
  config: ResolvedConfig;
}

export function startInteractiveMode(props: InteractiveUIProps) {
  const appProps: VibraniumAppProps = {
    scenarioPath: props.scenarioPath,
    environment: props.environment,
    config: props.config
  };
  
  // Configure render options to handle raw mode issues
  const renderOptions = {
    exitOnCtrlC: true,
    patchConsole: false
  };
  
  const result = render(React.createElement(VibraniumApp, appProps), renderOptions);
  
  // Keep process alive by preventing it from exiting
  const keepAlive = setInterval(() => {
    // Do nothing, just keep the event loop active
  }, 1000);
  
  // Clean up interval when app unmounts
  const originalUnmount = result.unmount;
  result.unmount = () => {
    clearInterval(keepAlive);
    originalUnmount();
  };
  
  return result;
}