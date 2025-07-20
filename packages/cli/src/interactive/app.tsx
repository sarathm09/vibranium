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
import EnvironmentViewer from './components/environment-viewer';
import EnvironmentSwitcher from './components/environment-switcher';
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
      runCurrentStep,
      runSingleStep,
      copyStepData,
      toggleStepBookmark,
      setDetailsViewMode,
      toggleStepInspectionMode,
      stopExecution,
      retryExecution,
      togglePane,
      navigateScenarios,
      navigateFileSystem,
      navigateSteps,
      navigateToDirectory,
      navigateToParentDirectory,
      selectFileSystemNode,
      toggleNavigationMode,
      setStatus,
      selectScenario,
      selectOverviewStep,
      scrollDetailsPane,
      changeDetailsViewMode,
      toggleAutoScroll,
      showEnvironmentViewer,
      showEnvironmentSwitcher,
      reloadEnvironments,
      // Enhanced source view actions
      scrollSourcePageUp,
      scrollSourcePageDown,
      jumpToSourceStart,
      jumpToSourceEnd,
      copySourceContent,
      goToSourceLine,
      searchInSource,
      dispatch
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
          case 's':
            if (state.isRunning && state.canStop) {
              stopExecution();
            }
            break;
          case 't':
            if (!state.isRunning && state.lastResult && !state.lastResult.success) {
              retryExecution();
            }
            break;
          case 'e':
            showEnvironmentViewer();
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
      
      // Handle environment switcher (E key without Ctrl)
      if (input.toLowerCase() === 'e' && !key.ctrl) {
        showEnvironmentSwitcher();
        return;
      }
      
      // Handle environment reload (Shift+E)
      if (input.toLowerCase() === 'e' && key.shift) {
        reloadEnvironments();
        return;
      }
      
      // Handle single step execution (Shift+R)
      if (input.toLowerCase() === 'r' && key.shift && !state.isRunning) {
        runCurrentStep();
        return;
      }
      
      // Handle view mode switching with number keys (only when details pane is active)
      if (state.ui.activePane === 'details') {
        if (input === '1') {
          setDetailsViewMode('overview');
          return;
        } else if (input === '2') {
          setDetailsViewMode('steps');
          return;
        } else if (input === '3') {
          setDetailsViewMode('timeline');
          return;
        } else if (input === '4') {
          setDetailsViewMode('source');
          return;
        } else if (input === '5') {
          setDetailsViewMode('results');
          return;
        }
      }
      
      // Handle step inspection mode toggle (I key)
      if (input.toLowerCase() === 'i' && !key.ctrl) {
        toggleStepInspectionMode();
        return;
      }
      
      // Handle overview step navigation (J/K keys)
      if (state.ui.detailsViewMode === 'overview' && state.ui.activePane === 'details') {
        if (input.toLowerCase() === 'j' && !key.ctrl) {
          // Navigate down in overview steps
          if (state.currentScenario?.steps) {
            const newIndex = Math.min(state.ui.overviewSelectedStepIndex + 1, state.currentScenario.steps.length - 1);
            if (newIndex !== state.ui.overviewSelectedStepIndex) {
              actions.selectOverviewStep(newIndex);
            }
          }
          return;
        } else if (input.toLowerCase() === 'k' && !key.ctrl) {
          // Navigate up in overview steps
          const newIndex = Math.max(state.ui.overviewSelectedStepIndex - 1, 0);
          if (newIndex !== state.ui.overviewSelectedStepIndex) {
            actions.selectOverviewStep(newIndex);
          }
          return;
        }
      }
      
      // Handle auto-scroll toggle (A key)
      if (input.toLowerCase() === 'a' && !key.ctrl) {
        toggleAutoScroll();
        return;
      }
      
      // Enhanced Source View Mode Keyboard Shortcuts
      if (state.ui.activePane === 'details' && (state.ui.detailsViewMode === 'raw' || state.ui.detailsViewMode === 'source')) {
        // Page Up/Down for fast scrolling
        if (key.pageUp) {
          scrollSourcePageUp();
          return;
        } else if (key.pageDown) {
          scrollSourcePageDown();
          return;
        }
        
        // Home/End for jumping to start/end
        if (key.meta && key.upArrow) { // Cmd+Up on Mac, equivalent to Home
          jumpToSourceStart();
          return;
        } else if (key.meta && key.downArrow) { // Cmd+Down on Mac, equivalent to End
          jumpToSourceEnd();
          return;
        }
        
        // Ctrl+Home/End for cross-platform support
        if (key.ctrl && key.upArrow) {
          jumpToSourceStart();
          return;
        } else if (key.ctrl && key.downArrow) {
          jumpToSourceEnd();
          return;
        }
        
        // Copy source content (C key in source view)
        if (input.toLowerCase() === 'c' && !key.ctrl) {
          copySourceContent();
          return;
        }
        
        // Search in source (/ key)
        if (input === '/' && !key.ctrl) {
          searchInSource(); // Will show instructions
          return;
        }
        
        // Go to line (G key)
        if (input.toLowerCase() === 'g' && !key.ctrl) {
          goToSourceLine(); // Will show instructions
          return;
        }
        
        // Enhanced scrolling with J/K keys for vim-like navigation
        if (input.toLowerCase() === 'j' && !key.ctrl) {
          scrollDetailsPane('down');
          return;
        } else if (input.toLowerCase() === 'k' && !key.ctrl) {
          scrollDetailsPane('up');
          return;
        }
        
        // Space for page down, Shift+Space for page up (like less/more)
        if (input === ' ' && !key.shift && !key.ctrl) {
          scrollSourcePageDown();
          return;
        } else if (input === ' ' && key.shift) {
          scrollSourcePageUp();
          return;
        }
      }
      
      // Handle copy step data (C key) - works in non-source views
      if (input.toLowerCase() === 'c' && !key.ctrl && state.ui.activePane === 'details' && 
          state.ui.detailsViewMode !== 'raw' && state.ui.detailsViewMode !== 'source') {
        if (state.ui.detailsViewMode === 'overview') {
          copyStepData(state.ui.overviewSelectedStepIndex, 'full');
        } else {
          copyStepData(state.ui.selectedStepIndex, 'full');
        }
        return;
      }
      
      // Handle step navigation with J/K keys (when in details pane, but not in source view)
      if (state.ui.activePane === 'details' && 
          state.ui.detailsViewMode !== 'raw' && state.ui.detailsViewMode !== 'source') {
        if (input.toLowerCase() === 'j' && !key.ctrl) {
          // Navigate to next step
          if (state.currentScenario?.steps && state.ui.selectedStepIndex < state.currentScenario.steps.length - 1) {
            actions.selectStep(state.ui.selectedStepIndex + 1);
          }
          return;
        } else if (input.toLowerCase() === 'k' && !key.ctrl) {
          // Navigate to previous step
          if (state.currentScenario?.steps && state.ui.selectedStepIndex > 0) {
            actions.selectStep(state.ui.selectedStepIndex - 1);
          }
          return;
        }
      }
      
      // Navigation without modifiers - respect active pane
      if (key.upArrow) {
        if (state.ui.activePane === 'navigation') {
          if (state.ui.navigationMode === 'folders') {
            void navigateFileSystem('up');
          } else {
            navigateScenarios('up');
          }
        } else if (state.ui.activePane === 'details') {
          // In steps view, navigate between steps; otherwise scroll
          if (state.ui.detailsViewMode === 'steps' && state.currentScenario?.steps) {
            navigateSteps('up');
          } else {
            scrollDetailsPane('up');
          }
        }
      } else if (key.downArrow) {
        if (state.ui.activePane === 'navigation') {
          if (state.ui.navigationMode === 'folders') {
            void navigateFileSystem('down');
          } else {
            navigateScenarios('down');
          }
        } else if (state.ui.activePane === 'details') {
          // In steps view, navigate between steps; otherwise scroll
          if (state.ui.detailsViewMode === 'steps' && state.currentScenario?.steps) {
            navigateSteps('down');
          } else {
            scrollDetailsPane('down');
          }
        }
      } else if (key.leftArrow) {
        if (state.ui.activePane === 'details') {
          // Navigate view modes left in details pane
          changeDetailsViewMode('left');
        }
      } else if (key.rightArrow) {
        if (state.ui.activePane === 'details') {
          // Navigate view modes right in details pane
          changeDetailsViewMode('right');
        }
      } else if (key.return) {
        if (state.ui.activePane === 'navigation') {
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
        } else if (state.ui.activePane === 'details') {
          // Handle action in details pane (like running current step or switching mode)
          if (state.currentScenario?.steps && !state.isRunning) {
            if (state.ui.detailsViewMode === 'overview') {
              // Run the selected overview step
              runSingleStep(state.ui.overviewSelectedStepIndex);
            } else {
              runCurrentStep();
            }
          }
        }
      } else if (key.backspace) {
        if (state.ui.activePane === 'navigation' && state.ui.navigationMode === 'folders') {
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
            if (state.ui.activePane === 'navigation') {
              if (state.ui.navigationMode === 'folders') {
                void navigateFileSystem('up');
              } else {
                navigateScenarios('up');
              }
            }
            console.log('↑ Moved up');
            break;
            
          case 'down':  
          case 'd':
            if (state.ui.activePane === 'navigation') {
              if (state.ui.navigationMode === 'folders') {
                void navigateFileSystem('down');
              } else {
                navigateScenarios('down');
              }
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
          
          case 'step':
          case 'rs':
            if (!state.isRunning && state.currentScenario?.steps?.[state.ui.selectedStepIndex]) {
              runSingleStep(state.ui.selectedStepIndex);
              console.log('🔧 Running single step...');
            } else {
              console.log('❌ No step selected or execution in progress');
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
            console.log('- step/rs: Run single selected step');
            console.log('- quit/q: Exit application');
            console.log('- help/h: Show this help');
            console.log('\nKeyboard shortcuts (direct mode):');
            console.log('- ↑↓: Navigate items');
            console.log('- Enter: Select/Open item');
            console.log('- Backspace: Go to parent (folder mode)');
            console.log('- M: Toggle navigation mode');
            console.log('- Tab: Switch panes');
            console.log('- Ctrl+R: Run scenario');
            console.log('- Shift+R: Run single step');
            console.log('- I: Toggle step inspection mode');
            console.log('- 1-5: Switch details view modes (when in details pane)');
            console.log('- J/K: Navigate steps (when in details pane)');
            console.log('- ↑↓: Navigate steps in steps view, otherwise scroll');
            console.log('- E: Environment switcher');
            console.log('- Ctrl+E: Environment viewer');
            console.log('- Shift+E: Reload environments');
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

        {/* Right panel - Enhanced Variable Preview (toggleable) */}
        {state.ui.showVariablePreview && (
          <Box 
            width={varWidth}
            borderStyle={state.ui.activePane === 'variables' ? 'double' : 'single'}
            borderColor={state.ui.activePane === 'variables' ? 'blue' : 'gray'}
          >
            <EnhancedVariablePreview />
          </Box>
        )}
      </Box>

      {/* Compact bottom status bar */}
      <StatusBar />
      
      {/* Environment overlays */}
      <EnvironmentViewer 
        isVisible={state.ui.showEnvironmentViewer}
        onClose={() => dispatch({ type: 'SHOW_ENVIRONMENT_VIEWER', payload: false })}
      />
      <EnvironmentSwitcher 
        isVisible={state.ui.showEnvironmentSwitcher}
        onClose={() => dispatch({ type: 'SHOW_ENVIRONMENT_SWITCHER', payload: false })}
      />
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