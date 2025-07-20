/**
 * Scenario Manager Component
 * 
 * Comprehensive scenario file management with CRUD operations,
 * file browser, recent files, favorites, and import/export capabilities.
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../../state/app-context';
import { FileSystemNode, RecentFile, ScenarioMetadata } from './types';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';

interface ScenarioManagerProps {
  width: number;
  height: number;
  onSelectScenario: (filePath: string) => void;
  onCreateScenario: (template: string) => void;
  onClose: () => void;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  width,
  height,
  onSelectScenario,
  onCreateScenario,
  onClose
}) => {
  const { state, actions } = useAppContext();
  const [currentTab, setCurrentTab] = useState<'browser' | 'recent' | 'templates' | 'operations'>('browser');
  const [fileTree, setFileTree] = useState<FileSystemNode[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadFileTree();
    loadRecentFiles();
  }, []);

  const loadFileTree = async () => {
    try {
      const workspaceRoot = state.config?.workspaceRoot || process.cwd();
      setCurrentPath(workspaceRoot);
      const tree = await buildFileTree(workspaceRoot);
      setFileTree(tree);
    } catch (error) {
      actions.setStatus(`Failed to load file tree: ${error}`, 'error');
    }
  };

  const loadRecentFiles = async () => {
    try {
      // In a real implementation, this would load from a persistence layer
      const mockRecentFiles: RecentFile[] = [
        {
          path: '/path/to/api-test.yaml',
          name: 'api-test.yaml',
          lastOpened: new Date(Date.now() - 3600000), // 1 hour ago
          pinned: true
        },
        {
          path: '/path/to/user-flow.yaml',
          name: 'user-flow.yaml',
          lastOpened: new Date(Date.now() - 7200000), // 2 hours ago
        }
      ];
      setRecentFiles(mockRecentFiles);
    } catch (error) {
      actions.setStatus(`Failed to load recent files: ${error}`, 'error');
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.tab) {
      const tabs = ['browser', 'recent', 'templates', 'operations'] as const;
      const currentIndex = tabs.indexOf(currentTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setCurrentTab(tabs[nextIndex]);
      setSelectedIndex(0);
      return;
    }

    if (key.ctrl && input.toLowerCase() === 'f') {
      setShowSearch(!showSearch);
      return;
    }

    if (showSearch) {
      if (key.return) {
        setShowSearch(false);
        performSearch();
      } else if (key.backspace && searchQuery.length > 0) {
        setSearchQuery(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl) {
        setSearchQuery(prev => prev + input);
      }
      return;
    }

    switch (currentTab) {
      case 'browser':
        handleBrowserInput(input, key);
        break;
      case 'recent':
        handleRecentInput(input, key);
        break;
      case 'templates':
        handleTemplatesInput(input, key);
        break;
      case 'operations':
        handleOperationsInput(input, key);
        break;
    }
  });

  const handleBrowserInput = (input: string, key: any) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(fileTree.length - 1, prev + 1));
    } else if (key.return) {
      const selectedNode = fileTree[selectedIndex];
      if (selectedNode) {
        if (selectedNode.type === 'directory') {
          navigateToDirectory(selectedNode.path);
        } else if (selectedNode.isScenario) {
          onSelectScenario(selectedNode.path);
        }
      }
    } else if (key.backspace) {
      navigateToParent();
    } else if (input.toLowerCase() === 'n' && key.ctrl) {
      createNewScenario();
    } else if (input.toLowerCase() === 'd' && !key.ctrl) {
      deleteSelectedFile();
    } else if (input.toLowerCase() === 'r' && !key.ctrl) {
      renameSelectedFile();
    }
  };

  const handleRecentInput = (input: string, key: any) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(recentFiles.length - 1, prev + 1));
    } else if (key.return) {
      const selectedFile = recentFiles[selectedIndex];
      if (selectedFile) {
        onSelectScenario(selectedFile.path);
      }
    } else if (input.toLowerCase() === 'p' && !key.ctrl) {
      togglePinFile();
    }
  };

  const handleTemplatesInput = (input: string, key: any) => {
    const templates = getScenarioTemplates();
    
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(templates.length - 1, prev + 1));
    } else if (key.return) {
      const selectedTemplate = templates[selectedIndex];
      if (selectedTemplate) {
        onCreateScenario(selectedTemplate.template);
      }
    }
  };

  const handleOperationsInput = (input: string, key: any) => {
    const operations = [
      'Import Scenario',
      'Export Current Scenario',
      'Backup All Scenarios',
      'Cleanup Old Files',
      'Validate All Scenarios'
    ];

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(operations.length - 1, prev + 1));
    } else if (key.return) {
      executeOperation(operations[selectedIndex]);
    }
  };

  const navigateToDirectory = async (dirPath: string) => {
    try {
      setCurrentPath(dirPath);
      const tree = await buildFileTree(dirPath);
      setFileTree(tree);
      setSelectedIndex(0);
    } catch (error) {
      actions.setStatus(`Failed to navigate to directory: ${error}`, 'error');
    }
  };

  const navigateToParent = async () => {
    const parentPath = path.dirname(currentPath);
    if (parentPath !== currentPath) {
      await navigateToDirectory(parentPath);
    }
  };

  const createNewScenario = async () => {
    const templates = getScenarioTemplates();
    // For now, use the basic template
    const basicTemplate = templates.find(t => t.id === 'basic-api') || templates[0];
    onCreateScenario(basicTemplate.template);
  };

  const deleteSelectedFile = async () => {
    const selectedNode = fileTree[selectedIndex];
    if (selectedNode && selectedNode.type === 'file') {
      try {
        await fs.unlink(selectedNode.path);
        await loadFileTree();
        actions.setStatus(`Deleted ${selectedNode.name}`, 'success');
      } catch (error) {
        actions.setStatus(`Failed to delete file: ${error}`, 'error');
      }
    }
  };

  const renameSelectedFile = async () => {
    // In a full implementation, this would open a text input dialog
    actions.setStatus('Rename functionality would be implemented here', 'info');
  };

  const togglePinFile = () => {
    const selectedFile = recentFiles[selectedIndex];
    if (selectedFile) {
      setRecentFiles(prev => prev.map(file => 
        file.path === selectedFile.path 
          ? { ...file, pinned: !file.pinned }
          : file
      ));
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      // Simple search implementation
      const searchResults = fileTree.filter(node => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFileTree(searchResults);
    } catch (error) {
      actions.setStatus(`Search failed: ${error}`, 'error');
    }
  };

  const executeOperation = async (operation: string) => {
    switch (operation) {
      case 'Import Scenario':
        actions.setStatus('Import functionality would be implemented here', 'info');
        break;
      case 'Export Current Scenario':
        actions.setStatus('Export functionality would be implemented here', 'info');
        break;
      case 'Backup All Scenarios':
        actions.setStatus('Backup functionality would be implemented here', 'info');
        break;
      case 'Cleanup Old Files':
        actions.setStatus('Cleanup functionality would be implemented here', 'info');
        break;
      case 'Validate All Scenarios':
        actions.setStatus('Validation functionality would be implemented here', 'info');
        break;
    }
  };

  const renderTabs = () => {
    const tabs = [
      { key: 'browser', label: 'File Browser' },
      { key: 'recent', label: 'Recent Files' },
      { key: 'templates', label: 'Templates' },
      { key: 'operations', label: 'Operations' }
    ];

    return (
      <Box borderStyle="single" borderBottom={false}>
        <Box flexDirection="row" paddingX={1}>
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.key}>
              <Text 
                color={currentTab === tab.key ? 'cyan' : 'gray'}
                bold={currentTab === tab.key}
              >
                {tab.label}
              </Text>
              {index < tabs.length - 1 && <Text color="gray"> | </Text>}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    );
  };

  const renderBrowser = () => (
    <Box flexDirection="column">
      <Box paddingX={1} borderStyle="single" borderTop={false} borderBottom={false}>
        <Text color="cyan">📁 {path.basename(currentPath) || currentPath}</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {fileTree.map((node, index) => (
          <Box key={node.path} paddingX={1} backgroundColor={index === selectedIndex ? 'blue' : undefined}>
            <Text color={node.type === 'directory' ? 'yellow' : node.isScenario ? 'green' : 'white'}>
              {node.type === 'directory' ? '📁' : node.isScenario ? '📄' : '📄'} {node.name}
            </Text>
            {node.size && (
              <Text color="gray" marginLeft={1}>
                ({formatFileSize(node.size)})
              </Text>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderRecent = () => (
    <Box flexDirection="column" flexGrow={1}>
      {recentFiles.map((file, index) => (
        <Box key={file.path} paddingX={1} backgroundColor={index === selectedIndex ? 'blue' : undefined}>
          <Text color="green">
            {file.pinned ? '📌' : '📄'} {file.name}
          </Text>
          <Text color="gray" marginLeft={1}>
            {formatTimeAgo(file.lastOpened)}
          </Text>
        </Box>
      ))}
    </Box>
  );

  const renderTemplates = () => {
    const templates = getScenarioTemplates();
    
    return (
      <Box flexDirection="column" flexGrow={1}>
        {templates.map((template, index) => (
          <Box key={template.id} paddingX={1} backgroundColor={index === selectedIndex ? 'blue' : undefined}>
            <Text color="cyan">📋 {template.name}</Text>
            <Text color="gray" marginTop={1} marginLeft={2}>
              {template.description}
            </Text>
          </Box>
        ))}
      </Box>
    );
  };

  const renderOperations = () => {
    const operations = [
      { name: 'Import Scenario', description: 'Import scenario from file or URL' },
      { name: 'Export Current Scenario', description: 'Export current scenario to file' },
      { name: 'Backup All Scenarios', description: 'Create backup of all scenario files' },
      { name: 'Cleanup Old Files', description: 'Remove temporary and backup files' },
      { name: 'Validate All Scenarios', description: 'Validate syntax of all scenarios' }
    ];

    return (
      <Box flexDirection="column" flexGrow={1}>
        {operations.map((operation, index) => (
          <Box key={operation.name} paddingX={1} backgroundColor={index === selectedIndex ? 'blue' : undefined}>
            <Text color="yellow">⚙️ {operation.name}</Text>
            <Text color="gray" marginTop={1} marginLeft={2}>
              {operation.description}
            </Text>
          </Box>
        ))}
      </Box>
    );
  };

  const renderSearchBar = () => {
    if (!showSearch) return null;

    return (
      <Box borderStyle="single" borderTop={false} borderBottom={false}>
        <Box paddingX={1}>
          <Text color="cyan">🔍 Search: </Text>
          <Text color="white">{searchQuery}</Text>
          <Text color="yellow">█</Text>
        </Box>
      </Box>
    );
  };

  const renderStatusBar = () => (
    <Box borderStyle="single" borderTop={false}>
      <Box paddingX={1} justifyContent="space-between">
        <Text color="gray">
          Tab: Switch tabs | ↑↓: Navigate | Enter: Select | Esc: Close
        </Text>
        <Text color="gray">
          {currentTab === 'browser' && 'N: New | D: Delete | R: Rename | Ctrl+F: Search'}
          {currentTab === 'recent' && 'P: Pin/Unpin'}
          {currentTab === 'templates' && 'Enter: Create from template'}
          {currentTab === 'operations' && 'Enter: Execute operation'}
        </Text>
      </Box>
    </Box>
  );

  return (
    <Box flexDirection="column" width={width} height={height} borderStyle="double" borderColor="cyan">
      <Box paddingX={1} justifyContent="center" borderStyle="single" borderBottom={false}>
        <Text bold color="cyan">Scenario Manager</Text>
      </Box>
      
      {renderTabs()}
      {renderSearchBar()}
      
      <Box flexGrow={1}>
        {currentTab === 'browser' && renderBrowser()}
        {currentTab === 'recent' && renderRecent()}
        {currentTab === 'templates' && renderTemplates()}
        {currentTab === 'operations' && renderOperations()}
      </Box>
      
      {renderStatusBar()}
    </Box>
  );
};

// Helper functions
async function buildFileTree(dirPath: string): Promise<FileSystemNode[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileSystemNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // Skip hidden files

      const fullPath = path.join(dirPath, entry.name);
      const stats = await fs.stat(fullPath);
      
      const node: FileSystemNode = {
        path: fullPath,
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime,
        isScenario: entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml') || entry.name.endsWith('.json'))
      };

      nodes.push(node);
    }

    // Sort: directories first, then files, both alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    throw new Error(`Failed to read directory: ${error}`);
  }
}

function getScenarioTemplates() {
  return [
    {
      id: 'basic-api',
      name: 'Basic API Test',
      description: 'Simple API test with GET request and response validation',
      template: `name: Basic API Test
description: A simple API test scenario
version: 1.0

environment: local

steps:
  - name: Get user data
    type: api
    method: GET
    url: "\${baseUrl}/users/1"
    expect:
      status: 200
      body:
        type: object
        properties:
          id:
            type: number
          name:
            type: string
`
    },
    {
      id: 'crud-workflow',
      name: 'CRUD Workflow',
      description: 'Complete Create, Read, Update, Delete workflow',
      template: `name: CRUD Workflow
description: Complete CRUD operations test
version: 1.0

environment: local

variables:
  userId: null

steps:
  - name: Create user
    type: api
    method: POST
    url: "\${baseUrl}/users"
    body:
      name: "Test User"
      email: "test@example.com"
    expect:
      status: 201
      body:
        type: object
        properties:
          id: { type: number }
    extract:
      userId: body.id

  - name: Read user
    type: api
    method: GET
    url: "\${baseUrl}/users/\${userId}"
    expect:
      status: 200

  - name: Update user
    type: api
    method: PUT
    url: "\${baseUrl}/users/\${userId}"
    body:
      name: "Updated User"
    expect:
      status: 200

  - name: Delete user
    type: api
    method: DELETE
    url: "\${baseUrl}/users/\${userId}"
    expect:
      status: 204
`
    },
    {
      id: 'auth-flow',
      name: 'Authentication Flow',
      description: 'Login and authenticated requests',
      template: `name: Authentication Flow
description: Test authentication and protected endpoints
version: 1.0

environment: local

variables:
  token: null

steps:
  - name: Login
    type: api
    method: POST
    url: "\${baseUrl}/auth/login"
    body:
      username: "\${username}"
      password: "\${password}"
    expect:
      status: 200
      body:
        type: object
        properties:
          token: { type: string }
    extract:
      token: body.token

  - name: Access protected resource
    type: api
    method: GET
    url: "\${baseUrl}/protected"
    headers:
      Authorization: "Bearer \${token}"
    expect:
      status: 200
`
    }
  ];
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) {
    return 'Just now';
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