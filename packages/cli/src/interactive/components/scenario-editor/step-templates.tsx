/**
 * Step Templates Component
 * 
 * Library of predefined step templates and snippets
 * for quick scenario creation and editing.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { StepTemplate } from './types';

interface StepTemplatesProps {
  width: number;
  height: number;
  onSelectTemplate: (template: StepTemplate) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const StepTemplates: React.FC<StepTemplatesProps> = ({
  width,
  height,
  onSelectTemplate,
  onClose,
  isVisible
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'api' | 'ui' | 'validation' | 'flow' | 'custom'>('api');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const templates = getTemplatesByCategory();

  useInput((input, key) => {
    if (!isVisible) return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.tab) {
      const categories: Array<'api' | 'ui' | 'validation' | 'flow' | 'custom'> = 
        ['api', 'ui', 'validation', 'flow', 'custom'];
      const currentIndex = categories.indexOf(selectedCategory);
      const nextIndex = (currentIndex + 1) % categories.length;
      setSelectedCategory(categories[nextIndex]);
      setSelectedIndex(0);
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      const currentTemplates = templates[selectedCategory] || [];
      setSelectedIndex(prev => Math.min(currentTemplates.length - 1, prev + 1));
    } else if (key.return) {
      const currentTemplates = templates[selectedCategory] || [];
      const selected = currentTemplates[selectedIndex];
      if (selected) {
        onSelectTemplate(selected);
      }
    } else if (input.toLowerCase() === 'p' && !key.ctrl) {
      setShowPreview(!showPreview);
    }
  });

  const renderCategories = () => {
    const categories = [
      { key: 'api', label: 'API', icon: '🌐' },
      { key: 'ui', label: 'UI', icon: '🖥️' },
      { key: 'validation', label: 'Validation', icon: '✅' },
      { key: 'flow', label: 'Flow', icon: '🔄' },
      { key: 'custom', label: 'Custom', icon: '⚙️' }
    ];

    return (
      <Box flexDirection="row" paddingX={1} borderStyle="single" borderBottom={false}>
        {categories.map((category, index) => (
          <React.Fragment key={category.key}>
            <Text 
              color={selectedCategory === category.key ? 'cyan' : 'gray'}
              bold={selectedCategory === category.key}
            >
              {category.icon} {category.label}
            </Text>
            {index < categories.length - 1 && <Text color="gray"> | </Text>}
          </React.Fragment>
        ))}
      </Box>
    );
  };

  const renderTemplateList = () => {
    const currentTemplates = templates[selectedCategory] || [];
    const visibleHeight = height - 6; // Account for headers and controls
    
    return (
      <Box flexDirection="column" flexGrow={1}>
        {currentTemplates.slice(0, visibleHeight).map((template, index) => (
          <Box 
            key={template.id} 
            paddingX={1} 
            backgroundColor={index === selectedIndex ? 'blue' : undefined}
            flexDirection="column"
          >
            <Box flexDirection="row">
              <Text color="white" bold>
                {template.name}
              </Text>
              {template.variables && template.variables.length > 0 && (
                <Text color="yellow" marginLeft={1}>
                  ({template.variables.length} vars)
                </Text>
              )}
            </Box>
            <Text color="gray" marginLeft={2}>
              {template.description}
            </Text>
            {template.dependencies && template.dependencies.length > 0 && (
              <Text color="cyan" marginLeft={2} dimColor>
                Requires: {template.dependencies.join(', ')}
              </Text>
            )}
          </Box>
        ))}
        
        {currentTemplates.length === 0 && (
          <Box paddingX={1} justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="gray">
              No templates available in this category
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderPreview = () => {
    if (!showPreview) return null;

    const currentTemplates = templates[selectedCategory] || [];
    const selected = currentTemplates[selectedIndex];
    
    if (!selected) return null;

    return (
      <Box 
        borderStyle="single" 
        borderTop={false} 
        borderBottom={false}
        paddingX={1}
        height={Math.floor(height / 3)}
        flexDirection="column"
      >
        <Box justifyContent="center">
          <Text color="cyan" bold>
            Preview: {selected.name}
          </Text>
        </Box>
        
        <Box flexDirection="column" flexGrow={1} marginTop={1}>
          <Text color="gray">Template:</Text>
          <Box marginLeft={2} flexGrow={1}>
            <Text color="white">
              {formatTemplatePreview(selected.template)}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderControls = () => (
    <Box borderStyle="single" borderTop={false} paddingX={1}>
      <Box justifyContent="space-between">
        <Text color="gray">
          ↑↓: Navigate | Enter: Select | Tab: Switch Category
        </Text>
        <Text color="gray">
          P: Preview | Esc: Close
        </Text>
      </Box>
    </Box>
  );

  if (!isVisible) return null;

  return (
    <Box
      position="absolute"
      top={Math.floor(height / 8)}
      left={Math.floor(width / 8)}
      width={Math.floor(width * 3 / 4)}
      height={Math.floor(height * 3 / 4)}
      borderStyle="double"
      borderColor="cyan"
      backgroundColor="black"
      flexDirection="column"
    >
      <Box paddingX={1} justifyContent="center" borderStyle="single" borderBottom={false}>
        <Text bold color="cyan">
          Step Templates Library
        </Text>
      </Box>

      {renderCategories()}
      {renderTemplateList()}
      {renderPreview()}
      {renderControls()}
    </Box>
  );
};

function getTemplatesByCategory(): Record<string, StepTemplate[]> {
  return {
    api: [
      {
        id: 'api-get',
        name: 'HTTP GET Request',
        description: 'Simple GET request with response validation',
        category: 'api',
        template: `name: Get data
type: api
method: GET
url: "\${baseUrl}/endpoint"
headers:
  Accept: application/json
expect:
  status: 200
  body:
    type: object`,
        variables: ['baseUrl'],
        dependencies: []
      },
      {
        id: 'api-post',
        name: 'HTTP POST Request',
        description: 'POST request with JSON body',
        category: 'api',
        template: `name: Create resource
type: api
method: POST
url: "\${baseUrl}/endpoint"
headers:
  Content-Type: application/json
body:
  name: "example"
  value: 123
expect:
  status: 201
  body:
    type: object
    properties:
      id: { type: number }`,
        variables: ['baseUrl'],
        dependencies: []
      },
      {
        id: 'api-auth',
        name: 'Authenticated Request',
        description: 'Request with Bearer token authentication',
        category: 'api',
        template: `name: Authenticated request
type: api
method: GET
url: "\${baseUrl}/protected"
headers:
  Authorization: "Bearer \${token}"
expect:
  status: 200`,
        variables: ['baseUrl', 'token'],
        dependencies: []
      },
      {
        id: 'api-pagination',
        name: 'Paginated Request',
        description: 'Request with pagination parameters',
        category: 'api',
        template: `name: Get paginated data
type: api
method: GET
url: "\${baseUrl}/items"
query:
  page: 1
  limit: 10
expect:
  status: 200
  body:
    type: object
    properties:
      items: { type: array }
      total: { type: number }
      page: { type: number }`,
        variables: ['baseUrl'],
        dependencies: []
      }
    ],
    ui: [
      {
        id: 'ui-click',
        name: 'Click Element',
        description: 'Click on a UI element',
        category: 'ui',
        template: `name: Click button
type: ui
action: click
selector: "#submit-button"
wait: 1000`,
        variables: ['selector'],
        dependencies: []
      },
      {
        id: 'ui-input',
        name: 'Fill Input',
        description: 'Fill text input field',
        category: 'ui',
        template: `name: Fill input
type: ui
action: type
selector: "#username"
value: "\${username}"`,
        variables: ['username'],
        dependencies: []
      },
      {
        id: 'ui-wait',
        name: 'Wait for Element',
        description: 'Wait for element to be visible',
        category: 'ui',
        template: `name: Wait for element
type: ui
action: wait
selector: ".loading-spinner"
condition: hidden
timeout: 5000`,
        variables: [],
        dependencies: []
      }
    ],
    validation: [
      {
        id: 'validate-json',
        name: 'JSON Schema Validation',
        description: 'Validate response against JSON schema',
        category: 'validation',
        template: `name: Validate response
type: validation
target: "\${response.body}"
schema:
  type: object
  required: ["id", "name"]
  properties:
    id: { type: number }
    name: { type: string }`,
        variables: [],
        dependencies: []
      },
      {
        id: 'validate-custom',
        name: 'Custom Validation',
        description: 'Custom validation logic',
        category: 'validation',
        template: `name: Custom validation
type: validation
rules:
  - field: "status"
    operator: "equals"
    value: "success"
  - field: "data.count"
    operator: "greaterThan"
    value: 0`,
        variables: [],
        dependencies: []
      }
    ],
    flow: [
      {
        id: 'flow-condition',
        name: 'Conditional Step',
        description: 'Execute step based on condition',
        category: 'flow',
        template: `name: Conditional step
type: condition
if: "\${response.status} === 200"
then:
  - name: Success handler
    type: api
    method: GET
    url: "\${baseUrl}/success"
else:
  - name: Error handler
    type: api
    method: GET
    url: "\${baseUrl}/error"`,
        variables: ['baseUrl'],
        dependencies: []
      },
      {
        id: 'flow-loop',
        name: 'Loop Step',
        description: 'Repeat steps in a loop',
        category: 'flow',
        template: `name: Loop through items
type: loop
items: "\${response.body.items}"
steps:
  - name: Process item
    type: api
    method: GET
    url: "\${baseUrl}/items/\${item.id}"`,
        variables: ['baseUrl'],
        dependencies: []
      }
    ],
    custom: [
      {
        id: 'custom-script',
        name: 'Custom Script',
        description: 'Execute custom JavaScript',
        category: 'custom',
        template: `name: Custom script
type: script
language: javascript
code: |
  const result = Math.random() * 100;
  context.set('randomValue', result);
  return { success: true, value: result };`,
        variables: [],
        dependencies: []
      }
    ]
  };
}

function formatTemplatePreview(template: string): string {
  // Format template for preview (truncate if too long)
  const lines = template.split('\n');
  const maxLines = 8;
  
  if (lines.length <= maxLines) {
    return template;
  }
  
  return lines.slice(0, maxLines).join('\n') + '\n...';
}