/**
 * Visual Scenario Builder Component
 * 
 * ASCII-based visual scenario builder with drag-and-drop step creation,
 * flow diagrams, and form-based editing for terminal environments.
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../../state/app-context';
import { VisualStepNode, VisualStepConnection, VisualFlowDiagram, StepTemplate } from './types';

interface VisualScenarioBuilderProps {
  width: number;
  height: number;
  onSave: (scenario: any) => void;
  onClose: () => void;
}

export const VisualScenarioBuilder: React.FC<VisualScenarioBuilderProps> = ({
  width,
  height,
  onSave,
  onClose
}) => {
  const { state, actions } = useAppContext();
  const [flowDiagram, setFlowDiagram] = useState<VisualFlowDiagram>({
    nodes: [],
    connections: [],
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 }
  });
  
  const [mode, setMode] = useState<'view' | 'add' | 'edit' | 'connect'>('view');
  const [selectedTemplate, setSelectedTemplate] = useState<StepTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [editingNode, setEditingNode] = useState<VisualStepNode | null>(null);

  // Calculate canvas dimensions
  const canvasWidth = width - 4; // Account for borders
  const canvasHeight = height - 8; // Account for header, status, and controls

  useInput((input, key) => {
    if (key.escape) {
      if (mode !== 'view') {
        setMode('view');
        setShowTemplateSelector(false);
        setEditingNode(null);
      } else {
        onClose();
      }
      return;
    }

    switch (mode) {
      case 'view':
        handleViewModeInput(input, key);
        break;
      case 'add':
        handleAddModeInput(input, key);
        break;
      case 'edit':
        handleEditModeInput(input, key);
        break;
      case 'connect':
        handleConnectModeInput(input, key);
        break;
    }
  });

  const handleViewModeInput = (input: string, key: any) => {
    if (input.toLowerCase() === 'a' && !key.ctrl) {
      setMode('add');
      setShowTemplateSelector(true);
    } else if (input.toLowerCase() === 'e' && !key.ctrl) {
      if (flowDiagram.selectedNode) {
        const node = flowDiagram.nodes.find(n => n.id === flowDiagram.selectedNode);
        if (node) {
          setEditingNode(node);
          setMode('edit');
        }
      }
    } else if (input.toLowerCase() === 'c' && !key.ctrl) {
      if (flowDiagram.selectedNode) {
        setMode('connect');
      }
    } else if (input.toLowerCase() === 'd' && !key.ctrl) {
      deleteSelectedNode();
    } else if (input.toLowerCase() === 's' && key.ctrl) {
      saveScenario();
    } else if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow) {
      navigateNodes(key);
    }
  };

  const handleAddModeInput = (input: string, key: any) => {
    if (showTemplateSelector) {
      // Handle template selection
      const templates = getStepTemplates();
      if (key.upArrow || key.downArrow) {
        // Navigate template selection
      } else if (key.return) {
        const template = templates[0]; // For now, use first template
        addNewStep(template);
        setMode('view');
        setShowTemplateSelector(false);
      }
    }
  };

  const handleEditModeInput = (input: string, key: any) => {
    if (key.return) {
      // Save changes and exit edit mode
      setMode('view');
      setEditingNode(null);
    }
  };

  const handleConnectModeInput = (input: string, key: any) => {
    if (key.return) {
      // Create connection
      setMode('view');
    }
  };

  const navigateNodes = (key: any) => {
    if (flowDiagram.nodes.length === 0) return;

    const currentNodeId = flowDiagram.selectedNode;
    let targetNode: VisualStepNode | null = null;

    if (!currentNodeId) {
      // Select first node
      targetNode = flowDiagram.nodes[0];
    } else {
      const currentNode = flowDiagram.nodes.find(n => n.id === currentNodeId);
      if (!currentNode) return;

      // Find the closest node in the direction of movement
      const candidates = flowDiagram.nodes.filter(n => n.id !== currentNodeId);
      
      candidates.forEach(candidate => {
        const dx = candidate.position.x - currentNode.position.x;
        const dy = candidate.position.y - currentNode.position.y;
        
        let isValidDirection = false;
        if (key.upArrow && dy < -1) isValidDirection = true;
        if (key.downArrow && dy > 1) isValidDirection = true;
        if (key.leftArrow && dx < -1) isValidDirection = true;
        if (key.rightArrow && dx > 1) isValidDirection = true;

        if (isValidDirection) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (!targetNode || distance < Math.sqrt(
            Math.pow(targetNode.position.x - currentNode.position.x, 2) +
            Math.pow(targetNode.position.y - currentNode.position.y, 2)
          )) {
            targetNode = candidate;
          }
        }
      });
    }

    if (targetNode) {
      setFlowDiagram(prev => ({
        ...prev,
        selectedNode: targetNode!.id
      }));
    }
  };

  const addNewStep = (template: StepTemplate) => {
    const newNode: VisualStepNode = {
      id: `step-${Date.now()}`,
      type: template.category,
      name: template.name,
      description: template.description,
      position: { 
        x: Math.floor(canvasWidth / 2), 
        y: Math.floor(canvasHeight / 2) 
      },
      inputs: [],
      outputs: [],
      status: 'pending',
      config: JSON.parse(template.template)
    };

    setFlowDiagram(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      selectedNode: newNode.id
    }));
  };

  const deleteSelectedNode = () => {
    if (!flowDiagram.selectedNode) return;

    setFlowDiagram(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== flowDiagram.selectedNode),
      connections: prev.connections.filter(
        c => c.sourceId !== flowDiagram.selectedNode && c.targetId !== flowDiagram.selectedNode
      ),
      selectedNode: undefined
    }));
  };

  const saveScenario = () => {
    const scenario = convertFlowToScenario(flowDiagram);
    onSave(scenario);
    actions.setStatus('Scenario saved successfully', 'success');
  };

  const renderCanvas = () => {
    const canvas: string[][] = Array(canvasHeight)
      .fill(null)
      .map(() => Array(canvasWidth).fill(' '));

    // Draw connections first (so they appear behind nodes)
    flowDiagram.connections.forEach(connection => {
      drawConnection(canvas, connection);
    });

    // Draw nodes
    flowDiagram.nodes.forEach(node => {
      drawNode(canvas, node, node.id === flowDiagram.selectedNode);
    });

    return canvas.map((row, y) => (
      <Box key={y}>
        <Text>{row.join('')}</Text>
      </Box>
    ));
  };

  const drawNode = (canvas: string[][], node: VisualStepNode, isSelected: boolean) => {
    const { x, y } = node.position;
    const nodeWidth = Math.max(12, node.name.length + 4);
    const nodeHeight = 3;

    // Ensure node is within canvas bounds
    if (x < 0 || y < 0 || x + nodeWidth >= canvasWidth || y + nodeHeight >= canvasHeight) {
      return;
    }

    const borderChar = isSelected ? '█' : '▓';
    const fillChar = isSelected ? '░' : ' ';

    // Draw border
    for (let dx = 0; dx < nodeWidth; dx++) {
      for (let dy = 0; dy < nodeHeight; dy++) {
        if (dx === 0 || dx === nodeWidth - 1 || dy === 0 || dy === nodeHeight - 1) {
          canvas[y + dy][x + dx] = borderChar;
        } else {
          canvas[y + dy][x + dx] = fillChar;
        }
      }
    }

    // Draw node content
    const truncatedName = node.name.length > nodeWidth - 2 
      ? node.name.substring(0, nodeWidth - 5) + '...'
      : node.name;
    
    const startX = x + Math.floor((nodeWidth - truncatedName.length) / 2);
    for (let i = 0; i < truncatedName.length && startX + i < canvasWidth; i++) {
      canvas[y + 1][startX + i] = truncatedName[i];
    }

    // Draw status indicator
    const statusChar = getStatusChar(node.status);
    canvas[y][x + nodeWidth - 2] = statusChar;
  };

  const drawConnection = (canvas: string[][], connection: VisualStepConnection) => {
    const sourceNode = flowDiagram.nodes.find(n => n.id === connection.sourceId);
    const targetNode = flowDiagram.nodes.find(n => n.id === connection.targetId);
    
    if (!sourceNode || !targetNode) return;

    const startX = sourceNode.position.x + 6; // Center of source node
    const startY = sourceNode.position.y + 1;
    const endX = targetNode.position.x + 6; // Center of target node
    const endY = targetNode.position.y + 1;

    // Simple line drawing (Bresenham's line algorithm simplified)
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = startX < endX ? 1 : -1;
    const sy = startY < endY ? 1 : -1;
    let err = dx - dy;

    let x = startX;
    let y = startY;

    while (true) {
      if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
        if (canvas[y][x] === ' ') {
          canvas[y][x] = connection.type === 'error' ? '!' : '-';
        }
      }

      if (x === endX && y === endY) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    // Draw arrow at the end
    if (endX >= 0 && endX < canvasWidth && endY >= 0 && endY < canvasHeight) {
      canvas[endY][endX] = '>';
    }
  };

  const renderTemplateSelector = () => {
    if (!showTemplateSelector) return null;

    const templates = getStepTemplates();

    return (
      <Box
        position="absolute"
        top={Math.floor(height / 4)}
        left={Math.floor(width / 4)}
        width={Math.floor(width / 2)}
        height={Math.floor(height / 2)}
        borderStyle="double"
        borderColor="cyan"
        backgroundColor="black"
        flexDirection="column"
      >
        <Box paddingX={1} justifyContent="center" borderStyle="single" borderBottom={false}>
          <Text bold color="cyan">Select Step Template</Text>
        </Box>
        
        <Box flexDirection="column" flexGrow={1} paddingX={1}>
          {templates.map((template, index) => (
            <Box key={template.id} backgroundColor={index === 0 ? 'blue' : undefined}>
              <Text color={template.category === 'api' ? 'green' : 'yellow'}>
                {getCategoryIcon(template.category)} {template.name}
              </Text>
            </Box>
          ))}
        </Box>

        <Box paddingX={1} borderStyle="single" borderTop={false}>
          <Text color="gray">↑↓: Navigate | Enter: Select | Esc: Cancel</Text>
        </Box>
      </Box>
    );
  };

  const renderEditDialog = () => {
    if (!editingNode) return null;

    return (
      <Box
        position="absolute"
        top={Math.floor(height / 6)}
        left={Math.floor(width / 6)}
        width={Math.floor(width * 2 / 3)}
        height={Math.floor(height * 2 / 3)}
        borderStyle="double"
        borderColor="yellow"
        backgroundColor="black"
        flexDirection="column"
      >
        <Box paddingX={1} justifyContent="center" borderStyle="single" borderBottom={false}>
          <Text bold color="yellow">Edit Step: {editingNode.name}</Text>
        </Box>
        
        <Box flexDirection="column" flexGrow={1} paddingX={1}>
          <Text color="cyan">Name:</Text>
          <Text>{editingNode.name}</Text>
          
          <Text color="cyan" marginTop={1}>Type:</Text>
          <Text>{editingNode.type}</Text>
          
          <Text color="cyan" marginTop={1}>Description:</Text>
          <Text>{editingNode.description || 'No description'}</Text>
          
          <Text color="cyan" marginTop={1}>Configuration:</Text>
          <Text>{JSON.stringify(editingNode.config, null, 2)}</Text>
        </Box>

        <Box paddingX={1} borderStyle="single" borderTop={false}>
          <Text color="gray">Enter: Save | Esc: Cancel</Text>
        </Box>
      </Box>
    );
  };

  const renderHeader = () => (
    <Box borderStyle="single" borderBottom={false} paddingX={1}>
      <Box justifyContent="space-between" width="100%">
        <Text bold color="cyan">Visual Scenario Builder</Text>
        <Text color="gray">
          Mode: {mode.toUpperCase()} | Nodes: {flowDiagram.nodes.length}
        </Text>
      </Box>
    </Box>
  );

  const renderControls = () => (
    <Box borderStyle="single" borderTop={false} paddingX={1}>
      <Box justifyContent="space-between" width="100%">
        <Text color="gray">
          A: Add Step | E: Edit | C: Connect | D: Delete | Ctrl+S: Save
        </Text>
        <Text color="gray">
          ↑↓←→: Navigate | Esc: Exit {mode !== 'view' ? 'Mode' : ''}
        </Text>
      </Box>
    </Box>
  );

  const renderStatus = () => (
    <Box borderStyle="single" borderTop={false} borderBottom={false} paddingX={1} height={2}>
      <Text color="cyan">
        {flowDiagram.selectedNode ? 
          `Selected: ${flowDiagram.nodes.find(n => n.id === flowDiagram.selectedNode)?.name || 'Unknown'}` :
          'No step selected'
        }
      </Text>
    </Box>
  );

  return (
    <Box flexDirection="column" width={width} height={height}>
      {renderHeader()}
      {renderStatus()}
      
      <Box 
        flexGrow={1} 
        borderStyle="single" 
        borderTop={false} 
        borderBottom={false}
      >
        {renderCanvas()}
      </Box>

      {renderControls()}
      {renderTemplateSelector()}
      {renderEditDialog()}
    </Box>
  );
};

// Helper functions
function getStepTemplates(): StepTemplate[] {
  return [
    {
      id: 'api-get',
      name: 'API GET',
      description: 'HTTP GET request',
      category: 'api',
      template: '{"method": "GET", "url": "", "expect": {"status": 200}}',
      variables: ['url'],
      dependencies: []
    },
    {
      id: 'api-post',
      name: 'API POST',
      description: 'HTTP POST request',
      category: 'api',
      template: '{"method": "POST", "url": "", "body": {}, "expect": {"status": 201}}',
      variables: ['url', 'body'],
      dependencies: []
    },
    {
      id: 'validation',
      name: 'Validation',
      description: 'Data validation step',
      category: 'validation',
      template: '{"type": "validation", "rules": []}',
      variables: ['rules'],
      dependencies: []
    }
  ];
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'api':
      return '🌐';
    case 'ui':
      return '🖥️';
    case 'validation':
      return '✅';
    case 'flow':
      return '🔄';
    default:
      return '⚙️';
  }
}

function getStatusChar(status?: string): string {
  switch (status) {
    case 'running':
      return '⏳';
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    default:
      return '⭕';
  }
}

function convertFlowToScenario(flow: VisualFlowDiagram): any {
  // Convert the visual flow back to a scenario object
  const steps = flow.nodes.map(node => ({
    name: node.name,
    type: node.type,
    ...node.config
  }));

  return {
    name: 'Visual Scenario',
    description: 'Created with Visual Scenario Builder',
    version: '1.0',
    steps
  };
}