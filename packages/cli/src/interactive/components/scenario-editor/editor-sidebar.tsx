/**
 * Editor Sidebar Component
 * 
 * Sidebar with file browser, outline, and quick actions
 * for enhanced scenario editing workflow.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../../state/app-context';
import { FileSystemNode, ScenarioMetadata } from './types';

interface EditorSidebarProps {
  width: number;
  height: number;
  isVisible: boolean;
  onToggle: () => void;
  onSelectFile: (filePath: string) => void;
  onCreateFile: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  width,
  height,
  isVisible,
  onToggle,
  onSelectFile,
  onCreateFile
}) => {
  const { state, actions } = useAppContext();
  const [activeTab, setActiveTab] = useState<'files' | 'outline' | 'history'>('files');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useInput((input, key) => {
    if (!isVisible) return;

    if (key.tab) {
      const tabs = ['files', 'outline', 'history'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
      setSelectedIndex(0);
      return;
    }

    if (activeTab === 'files') {
      handleFilesInput(input, key);
    } else if (activeTab === 'outline') {
      handleOutlineInput(input, key);
    } else if (activeTab === 'history') {
      handleHistoryInput(input, key);
    }
  });

  const handleFilesInput = (input: string, key: any) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      const fileList = getFileList();
      setSelectedIndex(prev => Math.min(fileList.length - 1, prev + 1));
    } else if (key.return) {
      const fileList = getFileList();
      const selected = fileList[selectedIndex];
      if (selected) {
        if (selected.type === 'directory') {
          toggleFolder(selected.path);
        } else {
          onSelectFile(selected.path);
        }
      }
    } else if (input.toLowerCase() === 'n' && key.ctrl) {
      onCreateFile();
    }
  };

  const handleOutlineInput = (input: string, key: any) => {
    const outline = getScenarioOutline();
    
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(outline.length - 1, prev + 1));
    } else if (key.return) {
      const selected = outline[selectedIndex];
      if (selected) {
        // Navigate to line in editor
        actions.setStatus(`Navigate to line ${selected.line}`, 'info');
      }
    }
  };

  const handleHistoryInput = (input: string, key: any) => {
    const history = getEditHistory();
    
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(history.length - 1, prev + 1));
    } else if (key.return) {
      const selected = history[selectedIndex];
      if (selected) {
        onSelectFile(selected.path);
      }
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const getFileList = (): FileSystemNode[] => {
    // This would normally come from the file system
    // For now, return mock data based on current scenarios
    const files: FileSystemNode[] = [];
    
    state.scenarios.forEach(scenarioPath => {
      const parts = scenarioPath.split('/');
      const name = parts[parts.length - 1];
      
      files.push({
        path: scenarioPath,
        name,
        type: 'file',
        isScenario: true,
        modified: new Date()
      });
    });

    return files.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const getScenarioOutline = () => {
    if (!state.currentScenario) return [];

    const outline: Array<{ name: string; type: string; line: number }> = [];
    
    // Add scenario metadata
    outline.push({
      name: state.currentScenario.name || 'Untitled',
      type: 'scenario',
      line: 1
    });

    if (state.currentScenario.description) {
      outline.push({
        name: 'Description',
        type: 'property',
        line: 2
      });
    }

    // Add environment info
    outline.push({
      name: `Environment: ${state.currentEnvironment}`,
      type: 'environment',
      line: 3
    });

    // Add variables if any
    if (state.currentScenario.variables && Object.keys(state.currentScenario.variables).length > 0) {
      outline.push({
        name: 'Variables',
        type: 'section',
        line: 5
      });
    }

    // Add steps
    if (state.currentScenario.steps) {
      outline.push({
        name: 'Steps',
        type: 'section',
        line: 10
      });

      state.currentScenario.steps.forEach((step, index) => {
        outline.push({
          name: `${index + 1}. ${step.name || `Step ${index + 1}`}`,
          type: 'step',
          line: 12 + index * 5
        });
      });
    }

    return outline;
  };

  const getEditHistory = () => {
    // Mock edit history - in a real implementation, this would be persisted
    return [
      {
        path: '/current/scenario.yaml',
        name: 'scenario.yaml',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        action: 'edited'
      },
      {
        path: '/previous/api-test.yaml',
        name: 'api-test.yaml',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        action: 'opened'
      }
    ];
  };

  const renderTabs = () => (
    <Box flexDirection="row" borderStyle="single" borderBottom={false}>
      <Text color={activeTab === 'files' ? 'cyan' : 'gray'} bold={activeTab === 'files'}>
        📁
      </Text>
      <Text color={activeTab === 'outline' ? 'cyan' : 'gray'} bold={activeTab === 'outline'} marginLeft={1}>
        📋
      </Text>
      <Text color={activeTab === 'history' ? 'cyan' : 'gray'} bold={activeTab === 'history'} marginLeft={1}>
        🕒
      </Text>
    </Box>
  );

  const renderFilesTab = () => {
    const files = getFileList();
    const visibleHeight = height - 4;

    return (
      <Box flexDirection="column" flexGrow={1}>
        {files.slice(0, visibleHeight).map((file, index) => (
          <Box 
            key={file.path} 
            paddingX={1} 
            backgroundColor={index === selectedIndex ? 'blue' : undefined}
          >
            <Text color={file.isScenario ? 'green' : 'white'}>
              {file.type === 'directory' ? 
                (expandedFolders.has(file.path) ? '📂' : '📁') : 
                (file.isScenario ? '📄' : '📝')
              } {file.name}
            </Text>
          </Box>
        ))}
        
        {files.length === 0 && (
          <Box paddingX={1} justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="gray">No files found</Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderOutlineTab = () => {
    const outline = getScenarioOutline();
    const visibleHeight = height - 4;

    return (
      <Box flexDirection="column" flexGrow={1}>
        {outline.slice(0, visibleHeight).map((item, index) => (
          <Box 
            key={index} 
            paddingX={1} 
            backgroundColor={index === selectedIndex ? 'blue' : undefined}
          >
            <Text 
              color={
                item.type === 'scenario' ? 'cyan' :
                item.type === 'section' ? 'yellow' :
                item.type === 'step' ? 'green' :
                'gray'
              }
              marginLeft={item.type === 'step' ? 2 : 0}
            >
              {getOutlineIcon(item.type)} {item.name}
            </Text>
          </Box>
        ))}
        
        {outline.length === 0 && (
          <Box paddingX={1} justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="gray">No scenario loaded</Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderHistoryTab = () => {
    const history = getEditHistory();
    const visibleHeight = height - 4;

    return (
      <Box flexDirection="column" flexGrow={1}>
        {history.slice(0, visibleHeight).map((item, index) => (
          <Box 
            key={index} 
            paddingX={1} 
            backgroundColor={index === selectedIndex ? 'blue' : undefined}
            flexDirection="column"
          >
            <Text color="white">
              📄 {item.name}
            </Text>
            <Text color="gray" marginLeft={2}>
              {item.action} {formatTimeAgo(item.timestamp)}
            </Text>
          </Box>
        ))}
        
        {history.length === 0 && (
          <Box paddingX={1} justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="gray">No recent activity</Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderStatusBar = () => (
    <Box borderStyle="single" borderTop={false} paddingX={1} height={1}>
      <Text color="gray" dimColor>
        {activeTab === 'files' && 'Enter: Open | Ctrl+N: New File'}
        {activeTab === 'outline' && 'Enter: Go to line'}
        {activeTab === 'history' && 'Enter: Open file'}
      </Text>
    </Box>
  );

  if (!isVisible) return null;

  return (
    <Box flexDirection="column" width={width} height={height} borderStyle="single" borderColor="gray">
      {renderTabs()}
      
      <Box flexGrow={1} borderStyle="single" borderTop={false} borderBottom={false}>
        {activeTab === 'files' && renderFilesTab()}
        {activeTab === 'outline' && renderOutlineTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </Box>
      
      {renderStatusBar()}
    </Box>
  );
};

function getOutlineIcon(type: string): string {
  switch (type) {
    case 'scenario':
      return '📋';
    case 'section':
      return '📂';
    case 'step':
      return '▶️';
    case 'property':
      return '🔧';
    case 'environment':
      return '🌍';
    default:
      return '•';
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) {
    return 'just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
}