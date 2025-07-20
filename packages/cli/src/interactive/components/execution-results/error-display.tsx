/**
 * Professional error display with context and actionable suggestions
 */

import React from 'react';
import { Box, Text } from 'ink';

interface ErrorDisplayProps {
  error: string;
  stepName?: string;
  stepType?: string;
  context?: {
    url?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
  };
  suggestions?: string[];
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  stepName,
  stepType,
  context,
  suggestions
}) => {
  const getErrorCategory = (error: string): { category: string; icon: string; color: string } => {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return { category: 'Timeout Error', icon: '⏰', color: 'yellow' };
    }
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return { category: 'Network Error', icon: '🌐', color: 'red' };
    }
    if (errorLower.includes('auth') || errorLower.includes('unauthorized') || errorLower.includes('403') || errorLower.includes('401')) {
      return { category: 'Authentication Error', icon: '🔐', color: 'red' };
    }
    if (errorLower.includes('not found') || errorLower.includes('404')) {
      return { category: 'Resource Not Found', icon: '🔍', color: 'orange' };
    }
    if (errorLower.includes('validation') || errorLower.includes('schema')) {
      return { category: 'Validation Error', icon: '✅', color: 'orange' };
    }
    if (errorLower.includes('server') || errorLower.includes('500') || errorLower.includes('503')) {
      return { category: 'Server Error', icon: '🔥', color: 'red' };
    }
    if (errorLower.includes('parse') || errorLower.includes('json') || errorLower.includes('syntax')) {
      return { category: 'Data Format Error', icon: '📝', color: 'orange' };
    }
    
    return { category: 'General Error', icon: '❌', color: 'red' };
  };

  const getContextualSuggestions = (error: string, context?: ErrorDisplayProps['context']): string[] => {
    const errorLower = error.toLowerCase();
    const suggestions: string[] = [];
    
    // Timeout suggestions
    if (errorLower.includes('timeout')) {
      suggestions.push('Increase timeout value in step configuration');
      suggestions.push('Check server response time and performance');
      suggestions.push('Verify network stability and latency');
    }
    
    // Network suggestions
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      suggestions.push('Check internet connectivity');
      suggestions.push('Verify the target URL is accessible');
      suggestions.push('Check for firewall or proxy restrictions');
    }
    
    // Authentication suggestions
    if (errorLower.includes('auth') || errorLower.includes('unauthorized') || context?.statusCode === 401 || context?.statusCode === 403) {
      suggestions.push('Verify authentication credentials are correct');
      suggestions.push('Check if API key or token has expired');
      suggestions.push('Ensure proper authorization headers are set');
      suggestions.push('Confirm user has required permissions');
    }
    
    // Not found suggestions
    if (errorLower.includes('not found') || context?.statusCode === 404) {
      suggestions.push('Verify the endpoint URL is correct');
      suggestions.push('Check if the resource exists in the target environment');
      suggestions.push('Ensure proper HTTP method is being used');
    }
    
    // Server error suggestions
    if (errorLower.includes('server') || (context?.statusCode && context.statusCode >= 500)) {
      suggestions.push('Check server status and availability');
      suggestions.push('Retry the request after some time');
      suggestions.push('Contact the API provider if issue persists');
    }
    
    // Validation suggestions
    if (errorLower.includes('validation') || errorLower.includes('schema')) {
      suggestions.push('Review request body structure and data types');
      suggestions.push('Check API documentation for required fields');
      suggestions.push('Validate JSON schema compliance');
    }
    
    // Parse error suggestions
    if (errorLower.includes('parse') || errorLower.includes('json')) {
      suggestions.push('Check response content type and format');
      suggestions.push('Verify the response is valid JSON');
      suggestions.push('Review response body for syntax errors');
    }
    
    // General suggestions if none specific found
    if (suggestions.length === 0) {
      suggestions.push('Review step configuration and parameters');
      suggestions.push('Check application logs for more details');
      suggestions.push('Verify environment variables and settings');
    }
    
    return suggestions;
  };

  const errorInfo = getErrorCategory(error);
  const allSuggestions = suggestions || getContextualSuggestions(error, context);

  return (
    <Box flexDirection="column" 
         borderStyle="double" 
         borderColor={errorInfo.color} 
         paddingX={1} 
         paddingY={1}
         marginY={1}>
      
      {/* Error header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={errorInfo.color} bold>
          {errorInfo.icon} {errorInfo.category}
        </Text>
        {stepName && (
          <Text color="gray">
            Step: {stepName}
          </Text>
        )}
      </Box>

      {/* Error message */}
      <Box flexDirection="column" marginBottom={1} 
           borderLeft borderColor={errorInfo.color} 
           paddingLeft={2}>
        <Text color={errorInfo.color}>{error}</Text>
      </Box>

      {/* Context information */}
      {context && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="cyan" bold>📋 Context Information:</Text>
          <Box paddingLeft={2} flexDirection="column">
            {context.url && (
              <Text>
                <Text color="cyan">URL:</Text> {context.url}
              </Text>
            )}
            {context.method && (
              <Text>
                <Text color="cyan">Method:</Text> {context.method}
              </Text>
            )}
            {context.statusCode && (
              <Text>
                <Text color="cyan">Status Code:</Text>{' '}
                <Text color={context.statusCode < 400 ? 'green' : 'red'}>
                  {context.statusCode}
                </Text>
              </Text>
            )}
            {context.responseTime && (
              <Text>
                <Text color="cyan">Response Time:</Text> {context.responseTime}ms
              </Text>
            )}
            {stepType && (
              <Text>
                <Text color="cyan">Step Type:</Text> {stepType}
              </Text>
            )}
          </Box>
        </Box>
      )}

      {/* Error severity indicator */}
      <Box marginBottom={1}>
        <Text color="magenta" bold>🚨 Severity:</Text>
        <Text color={errorInfo.color} paddingLeft={1}>
          {errorInfo.color === 'red' ? 'High - Execution Failed' :
           errorInfo.color === 'orange' ? 'Medium - Recoverable Issue' :
           'Low - Minor Issue'}
        </Text>
      </Box>

      {/* Actionable suggestions */}
      {allSuggestions.length > 0 && (
        <Box flexDirection="column">
          <Text color="yellow" bold>💡 Suggested Actions:</Text>
          <Box paddingLeft={2} flexDirection="column">
            {allSuggestions.map((suggestion, index) => (
              <Text key={index} color="white">
                <Text color="yellow">{index + 1}.</Text> {suggestion}
              </Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Quick actions */}
      <Box marginTop={1} paddingTop={1} borderTop borderColor="gray">
        <Text color="gray" dimColor>
          💾 Press C to copy error details • 🔄 Press R to retry step • 📋 Press L to view logs
        </Text>
      </Box>
    </Box>
  );
};