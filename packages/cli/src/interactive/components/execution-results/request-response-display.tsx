/**
 * Professional request/response display with syntax highlighting and collapsible sections
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { StepResult } from '../../types';

interface RequestResponseDisplayProps {
  stepResult: StepResult;
  showRequest?: boolean;
  showResponse?: boolean;
  compact?: boolean;
}

export const RequestResponseDisplay: React.FC<RequestResponseDisplayProps> = ({
  stepResult,
  showRequest = true,
  showResponse = true,
  compact = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['response']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatJsonPreview = (data: any, maxLines: number = 5): string[] => {
    if (!data) return ['(empty)'];
    
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const lines = jsonString.split('\n');
      
      if (lines.length <= maxLines) {
        return lines;
      }
      
      return [
        ...lines.slice(0, maxLines - 1),
        `... ${lines.length - maxLines + 1} more lines (expand to view all)`
      ];
    } catch {
      return [String(data)];
    }
  };

  const renderHeaders = (headers: Record<string, string>, title: string) => {
    if (!headers || Object.keys(headers).length === 0) return null;

    const isExpanded = expandedSections.has(title.toLowerCase());
    const headerEntries = Object.entries(headers);

    return (
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color="blue" bold>{title} ({headerEntries.length}):</Text>
          <Text color="gray" dimColor> [{isExpanded ? 'collapse' : 'expand'}]</Text>
        </Box>
        
        {isExpanded && (
          <Box paddingLeft={2} flexDirection="column">
            {headerEntries.map(([key, value]) => (
              <Text key={key}>
                <Text color="cyan">{key}:</Text> <Text color="white">{value}</Text>
              </Text>
            ))}
          </Box>
        )}
        
        {!isExpanded && compact && (
          <Box paddingLeft={2}>
            <Text color="gray" dimColor>
              {headerEntries.slice(0, 2).map(([key]) => key).join(', ')}
              {headerEntries.length > 2 && ` +${headerEntries.length - 2} more`}
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderBody = (body: any, title: string) => {
    if (!body) return null;

    const sectionKey = title.toLowerCase();
    const isExpanded = expandedSections.has(sectionKey);
    const lines = formatJsonPreview(body, compact ? 3 : 8);

    return (
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color="green" bold>{title}:</Text>
          <Text color="gray" dimColor> [{isExpanded ? 'collapse' : 'expand'}]</Text>
        </Box>
        
        <Box paddingLeft={2} flexDirection="column" borderLeft borderColor="gray">
          {isExpanded ? (
            lines.map((line, index) => (
              <Text key={index} color={line.includes('...') ? 'gray' : 'white'}>
                {line}
              </Text>
            ))
          ) : (
            <Text color="gray" dimColor>
              {typeof body === 'object' ? 'JSON Object' : 'Text Content'} - Click to expand
            </Text>
          )}
        </Box>
      </Box>
    );
  };

  const getResponseStatusInfo = () => {
    if (!stepResult.response) return null;
    
    const { status, statusText } = stepResult.response;
    const statusColor = status && status < 400 ? 'green' : 'red';
    const statusCategory = !status ? 'Unknown' :
                          status < 300 ? 'Success' :
                          status < 400 ? 'Redirect' :
                          status < 500 ? 'Client Error' : 'Server Error';

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text>
          <Text color="cyan" bold>Status:</Text>{' '}
          <Text color={statusColor} bold>
            {status || 'N/A'} {statusText || ''}
          </Text>
          <Text color="gray"> ({statusCategory})</Text>
        </Text>
        
        {/* Status interpretation */}
        {status && (
          <Box paddingLeft={2}>
            <Text color="gray" dimColor>
              {status >= 200 && status < 300 && '✅ Request completed successfully'}
              {status >= 300 && status < 400 && '🔄 Request was redirected'}
              {status >= 400 && status < 500 && '❌ Client error - check request format'}
              {status >= 500 && '🔥 Server error - service issue'}
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {/* Response Section */}
      {showResponse && stepResult.response && (
        <Box flexDirection="column" marginBottom={2} 
             borderStyle="single" borderColor="blue" 
             paddingX={1} paddingY={1}>
          <Text color="blue" bold>📥 HTTP Response</Text>
          
          {getResponseStatusInfo()}
          
          {renderHeaders(stepResult.response.headers || {}, 'Response Headers')}
          {renderBody(stepResult.response.body, 'Response Body')}
        </Box>
      )}

      {/* Error Section */}
      {stepResult.error && (
        <Box flexDirection="column" marginBottom={2}
             borderStyle="single" borderColor="red"
             paddingX={1} paddingY={1}>
          <Text color="red" bold>❌ Error Information</Text>
          <Box paddingLeft={2} marginTop={1}>
            <Text color="red">{stepResult.error}</Text>
          </Box>
          
          {/* Error suggestions */}
          <Box paddingLeft={2} marginTop={1}>
            <Text color="yellow" bold>💡 Troubleshooting:</Text>
            <Box paddingLeft={2} flexDirection="column">
              <Text color="gray">• Check request URL and method</Text>
              <Text color="gray">• Verify authentication credentials</Text>
              <Text color="gray">• Review request headers and body format</Text>
              <Text color="gray">• Check network connectivity</Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Performance Metrics */}
      {stepResult.duration && (
        <Box flexDirection="column" 
             borderStyle="single" borderColor="magenta"
             paddingX={1} paddingY={1}>
          <Text color="magenta" bold>⚡ Performance Metrics</Text>
          <Box paddingLeft={2} marginTop={1}>
            <Text>
              <Text color="cyan">Execution Time:</Text> {stepResult.duration}ms
            </Text>
            
            {/* Performance analysis */}
            <Box marginTop={1}>
              {stepResult.duration < 200 && (
                <Text color="green">🚀 Excellent response time</Text>
              )}
              {stepResult.duration >= 200 && stepResult.duration < 1000 && (
                <Text color="yellow">⏱️ Good response time</Text>
              )}
              {stepResult.duration >= 1000 && stepResult.duration < 3000 && (
                <Text color="orange">🐌 Slow response time</Text>
              )}
              {stepResult.duration >= 3000 && (
                <Text color="red">🔥 Very slow response time - consider optimization</Text>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};