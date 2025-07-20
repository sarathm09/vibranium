/**
 * Main Ink application for interactive CLI with three-pane layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, useApp, useInput, Text, useStdout } from 'ink';
import { AppProvider, useAppContext } from './state/app-context';
import { NavigationTree } from './components/navigation-tree';
import { DetailsPane } from './components/details-pane';
import { StatusBar } from './components/status-bar';
import { VariablePreview } from './components/variable-preview';
import { ExitCodes } from '../utils/exit-codes';

export interface VibraniumAppProps {
  scenarioPath?: string;
  environment?: string;
  config: any;
}

const VibraniumAppInner: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { 
    state, 
    actions: { 
      switchEnvironment, 
      runCurrentScenario, 
      togglePane,
      navigateScenarios,
      navigateFileSystem,
      navigateToDirectory,
      navigateToParentDirectory,
      selectFileSystemNode,
      toggleNavigationMode,
      setStatus,
      selectScenario
    } 
  } = useAppContext();
  
  const [readlineInterface, setReadlineInterface] = useState<any>(null);
  const commandPromptRef = useRef<boolean>(false);
  const [terminalSize, setTerminalSize] = useState({ width: 80, height: 24 });

  // Track terminal size changes
  useEffect(() => {
    const updateSize = () => {
      const width = stdout?.columns || process.stdout.columns || 80;
      const height = stdout?.rows || process.stdout.rows || 24;
      setTerminalSize({ width, height });
    };
    
    updateSize();
    
    // Listen for terminal resize events
    const resizeHandler = () => updateSize();
    process.stdout.on('resize', resizeHandler);
    
    return () => {
      process.stdout.off('resize', resizeHandler);
    };
  }, [stdout]);

  // Calculate responsive widths based on terminal size
  const getResponsiveWidths = () => {
    const { width } = terminalSize;
    
    // Enhanced minimum viable widths to prevent text cropping
    const minNavWidth = 25; // Increased from 18 to accommodate icons + file names
    const minDetailsWidth = 30; // Reduced slightly to make room for navigation
    const minVarWidth = 18;
    const borderSpace = 6; // Space for borders
    
    let navWidth, detailsWidth, varWidth;
    
    if (state.ui.showVariablePreview) {
      // Three-pane layout - ensure minimum details width is maintained
      const availableWidth = width - borderSpace;
      const minTotalRequired = minNavWidth + minDetailsWidth + minVarWidth;
      
      if (availableWidth < minTotalRequired) {
        // Terminal too narrow for three-pane, disable variable preview temporarily
        navWidth = Math.min(minNavWidth, Math.floor(availableWidth * 0.35));
        detailsWidth = availableWidth - navWidth;
        varWidth = 0;
      } else {
        if (width < 90) {
          // Very narrow terminal - give navigation more space
          navWidth = Math.max(minNavWidth, Math.floor(width * 0.25));
          varWidth = Math.max(minVarWidth, Math.floor(width * 0.20));
          detailsWidth = width - navWidth - varWidth - borderSpace;
        } else if (width < 120) {
          // Medium terminal - balanced approach with more navigation space
          navWidth = Math.max(minNavWidth, Math.floor(width * 0.22));
          varWidth = Math.max(minVarWidth, Math.floor(width * 0.25));
          detailsWidth = width - navWidth - varWidth - borderSpace;
        } else {
          // Wide terminal - comfortable spacing with larger navigation
          navWidth = Math.max(minNavWidth, Math.min(40, Math.floor(width * 0.25)));
          varWidth = Math.max(minVarWidth, Math.min(35, Math.floor(width * 0.27)));
          detailsWidth = width - navWidth - varWidth - borderSpace;
        }
        
        // Ensure details width is not too narrow
        if (detailsWidth < minDetailsWidth) {
          const excess = minDetailsWidth - detailsWidth;
          navWidth = Math.max(minNavWidth, navWidth - Math.floor(excess / 2));
          varWidth = Math.max(minVarWidth, varWidth - Math.ceil(excess / 2));
          detailsWidth = width - navWidth - varWidth - borderSpace;
        }
      }
    } else {
      // Two-pane layout - more generous navigation space
      const availableWidth = width - 4; // Space for borders
      
      if (width < 80) {
        // Very narrow - ensure navigation gets reasonable space
        navWidth = Math.max(minNavWidth, Math.min(Math.floor(width * 0.32), availableWidth - minDetailsWidth));
      } else if (width < 100) {
        // Narrow terminal - give navigation more space
        navWidth = Math.max(minNavWidth, Math.min(32, Math.floor(width * 0.28)));
      } else {
        // Wide terminal - comfortable navigation space
        navWidth = Math.max(minNavWidth, Math.min(40, Math.floor(width * 0.25)));
      }
      detailsWidth = availableWidth - navWidth;
      varWidth = 0;
      
      // Ensure details width is not too narrow
      if (detailsWidth < minDetailsWidth) {
        navWidth = Math.max(minNavWidth, availableWidth - minDetailsWidth);
        detailsWidth = availableWidth - navWidth;
      }
    }
    
    return { navWidth, detailsWidth, varWidth };
  };

  const { navWidth, detailsWidth, varWidth } = getResponsiveWidths();

  // Enhanced keyboard input handling with both readline and direct key capture
  useInput((input, key) => {
    // Don't interfere with readline when command prompt is active
    if (commandPromptRef.current) return;
    
    try {
      // Handle direct keyboard shortcuts without readline
      if (key.ctrl) {
        switch (input.toLowerCase()) {
          case 'q':
            setStatus('Goodbye!', 'info');
            exit();
            break;
          case 'r':
            if (!state.isRunning) {
              runCurrentScenario();
            }
            break;
          case 'e':
            togglePane('next'); // Cycle through environments
            break;
          case 'v':
            togglePane('variables');
            break;
          case 'c':
            // Toggle command prompt
            setupCommandPrompt();
            break;
        }
        return;
      }
      
      // Handle mode toggle
      if (input.toLowerCase() === 'm' && !key.ctrl) {
        toggleNavigationMode();
        return;
      }
      
      // Navigation without modifiers
      if (key.upArrow) {
        if (state.ui.navigationMode === 'folders') {
          navigateFileSystem('up');
        } else {
          navigateScenarios('up');
        }
      } else if (key.downArrow) {
        if (state.ui.navigationMode === 'folders') {
          navigateFileSystem('down');
        } else {
          navigateScenarios('down');
        }
      } else if (key.return) {
        if (state.ui.navigationMode === 'folders') {
          // Handle folder/file selection
          const selectedNode = state.fileSystemTree.find(node => node.path === state.selectedNodePath);
          if (selectedNode) {
            if (selectedNode.type === 'directory') {
              navigateToDirectory(selectedNode.path);
            } else if (selectedNode.name.endsWith('.json') || selectedNode.name.endsWith('.yaml') || selectedNode.name.endsWith('.yml')) {
              // Try to load the scenario file
              const scenarioIndex = state.scenarios.findIndex(s => s === selectedNode.path);
              if (scenarioIndex >= 0) {
                selectScenario(scenarioIndex);
                setStatus(`Loaded scenario: ${selectedNode.name}`, 'success');
              }
            }
          }
        } else {
          if (state.scenarios.length > 0) {
            selectScenario(state.ui.selectedScenarioIndex);
          }
        }
      } else if (key.backspace) {
        if (state.ui.navigationMode === 'folders') {
          navigateToParentDirectory();
        }
      } else if (key.tab) {
        togglePane('next');
      }
    } catch (error) {
      // Gracefully handle any input errors
      setStatus('Input error occurred', 'warning');
    }
  });
  
  const setupCommandPrompt = async () => {
    try {
      commandPromptRef.current = true;
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      setReadlineInterface(rl);
      
      console.log('\n🎮 Command Mode: Type commands and press Enter');
      console.log('Commands: up, down, select, run, env [name], mode, open, back, quit, help');
      
      const processCommand = (line: string) => {
        const cmd = line.trim().toLowerCase();
        const parts = cmd.split(' ');
        
        switch (parts[0]) {
          case 'up':
          case 'u':
            if (state.ui.navigationMode === 'folders') {
              navigateFileSystem('up');
            } else {
              navigateScenarios('up');
            }
            console.log('↑ Moved up');
            break;
            
          case 'down':  
          case 'd':
            if (state.ui.navigationMode === 'folders') {
              navigateFileSystem('down');
            } else {
              navigateScenarios('down');
            }
            console.log('↓ Moved down');
            break;
            
          case 'select':
          case 's':
            if (state.scenarios.length > 0) {
              selectScenario(state.ui.selectedScenarioIndex);
              const selected = state.scenarios[state.ui.selectedScenarioIndex];
              console.log(`✓ Selected: ${selected.split('/').pop()}`);
            }
            break;
            
          case 'run':
          case 'r':
            if (!state.isRunning) {
              runCurrentScenario();
              console.log('🏃 Running scenario...');
            } else {
              console.log('⏳ Scenario already running');
            }
            break;
            
          case 'env':
          case 'environment':
            if (parts[1]) {
              switchEnvironment(parts[1]);
              console.log(`🔄 Switching to environment: ${parts[1]}`);
            } else {
              console.log(`Current environment: ${state.currentEnvironment}`);
              console.log('Available: local, staging, production');
            }
            break;
            
          case 'vars':
          case 'variables':
            togglePane('variables');
            console.log('👁️ Toggled variable preview');
            break;
            
          case 'mode':
          case 'm':
            toggleNavigationMode();
            console.log(`🔄 Switched to ${state.ui.navigationMode === 'folders' ? 'scenarios' : 'folders'} mode`);
            break;
            
          case 'open':
          case 'o':
            if (state.ui.navigationMode === 'folders') {
              const selectedNode = state.fileSystemTree.find(node => node.path === state.selectedNodePath);
              if (selectedNode && selectedNode.type === 'directory') {
                navigateToDirectory(selectedNode.path);
                console.log(`📂 Opened directory: ${selectedNode.name}`);
              } else {
                console.log('❌ No directory selected or item is not a directory');
              }
            } else {
              console.log('❌ Open command only available in folder mode');
            }
            break;
            
          case 'back':
          case 'b':
            if (state.ui.navigationMode === 'folders') {
              navigateToParentDirectory();
              console.log('↩️ Navigated to parent directory');
            } else {
              console.log('❌ Back command only available in folder mode');
            }
            break;
            
          case 'quit':
          case 'q':
          case 'exit':
            console.log('Goodbye!');
            rl.close();
            exit();
            break;
            
          case 'help':
          case 'h':
            console.log('\nAvailable commands:');
            console.log('- up/u: Move selection up');
            console.log('- down/d: Move selection down');  
            console.log('- select/s: Select current scenario');
            console.log('- run/r: Run current scenario');
            console.log('- env [name]: Switch environment');
            console.log('- vars: Toggle variable preview');
            console.log('- mode/m: Toggle navigation mode (files/scenarios)');
            console.log('- open/o: Open selected folder (folder mode only)');
            console.log('- back/b: Go to parent directory (folder mode only)');
            console.log('- quit/q: Exit application');
            console.log('- help/h: Show this help');
            console.log('\nKeyboard shortcuts (direct mode):');
            console.log('- ↑↓: Navigate items');
            console.log('- Enter: Select/Open item');
            console.log('- Backspace: Go to parent (folder mode)');
            console.log('- M: Toggle navigation mode');
            console.log('- Tab: Switch panes');
            console.log('- Ctrl+R: Run scenario');
            console.log('- Ctrl+E: Switch environment');
            console.log('- Ctrl+V: Toggle variables');
            console.log('- Ctrl+C: Command mode');
            console.log('- Ctrl+Q: Quit');
            break;
            
          default:
            if (cmd) {
              console.log(`Unknown command: ${cmd}. Type 'help' for available commands.`);
            }
        }
        
        // Exit command mode after processing
        console.log('Returning to direct keyboard mode...');
        rl.close();
        commandPromptRef.current = false;
        setReadlineInterface(null);
      };

      rl.setPrompt('vibranium> ');
      rl.prompt();
      
      rl.on('line', processCommand);
      rl.on('SIGINT', () => {
        rl.close();
        commandPromptRef.current = false;
        setReadlineInterface(null);
      });

    } catch (error) {
      commandPromptRef.current = false;
      setStatus('Command mode not available', 'warning');
    }
  };
  
  // Setup initial help message
  useEffect(() => {
    setStatus('Ready! Use ↑↓ to navigate, Enter to select, Ctrl+C for commands, Ctrl+Q to quit', 'info');
  }, []);

  return (
    <Box flexDirection="column" width={terminalSize.width} height={terminalSize.height}>
      {/* Compact header with title and environment */}
      <Box borderStyle="single" paddingX={1} justifyContent="space-between" height={3}>
        <Text bold color="cyan">Vibranium CLI</Text>
        <Text>
          <Text color="yellow">ENV:</Text>
          <Text color="white" bold> {state.currentEnvironment}</Text>
          {state.isRunning && <Text color="yellow"> ⏳</Text>}
        </Text>
      </Box>

      {/* Main three-pane content area - uses calculated dimensions */}
      <Box flexGrow={1} flexDirection="row" height={terminalSize.height - 6}>
        {/* Left panel - Navigation Tree */}
        <Box 
          width={navWidth}
          borderStyle={state.ui.activePane === 'navigation' ? 'double' : 'single'} 
          borderColor={state.ui.activePane === 'navigation' ? 'blue' : 'gray'}
        >
          <NavigationTree />
        </Box>

        {/* Center panel - Details/Editor */}
        <Box 
          width={detailsWidth}
          borderStyle={state.ui.activePane === 'details' ? 'double' : 'single'}
          borderColor={state.ui.activePane === 'details' ? 'blue' : 'gray'}
        >
          <DetailsPane />
        </Box>

        {/* Right panel - Variable Preview (toggleable) */}
        {state.ui.showVariablePreview && (
          <Box 
            width={varWidth}
            borderStyle={state.ui.activePane === 'variables' ? 'double' : 'single'}
            borderColor={state.ui.activePane === 'variables' ? 'blue' : 'gray'}
          >
            <VariablePreview />
          </Box>
        )}
      </Box>

      {/* Compact bottom status bar */}
      <StatusBar />
    </Box>
  );
};

export const VibraniumApp: React.FC<VibraniumAppProps> = (props) => {
  return (
    <AppProvider initialProps={props}>
      <VibraniumAppInner />
    </AppProvider>
  );
};