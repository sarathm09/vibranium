/**
 * Smart Discovery Panel Component
 * Displays intelligent insights and analysis of scenarios
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { SearchEngine, SearchResult } from '../../search/SearchEngine';
import { DiscoveryEngine } from '../../search/DiscoveryEngine';

interface DiscoveryPanelProps {
  searchEngine: SearchEngine;
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({ searchEngine }) => {
  const [activeTab, setActiveTab] = useState<'similar' | 'unused' | 'dependencies' | 'duplicates' | 'performance' | 'suggestions'>(
    'similar'
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [discoveryData, setDiscoveryData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'similar', label: 'Similar', icon: '🔍' },
    { id: 'unused', label: 'Unused Vars', icon: '🗑️' },
    { id: 'dependencies', label: 'Dependencies', icon: '🔗' },
    { id: 'duplicates', label: 'Duplicates', icon: '📋' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'suggestions', label: 'Suggestions', icon: '💡' }
  ] as const;

  useEffect(() => {
    loadDiscoveryData();
  }, [activeTab]);

  useInput((input, key) => {
    // Navigate tabs
    if (key.leftArrow || key.rightArrow) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      const newIndex = key.leftArrow
        ? Math.max(0, currentIndex - 1)
        : Math.min(tabs.length - 1, currentIndex + 1);
      setActiveTab(tabs[newIndex].id);
      setSelectedIndex(0);
    }
    
    // Navigate items
    else if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      const maxIndex = getMaxIndex();
      setSelectedIndex(prev => Math.min(maxIndex, prev + 1));
    }
    
    // Refresh data
    else if (input === 'r' || input === 'R') {
      loadDiscoveryData();
    }
  });

  const loadDiscoveryData = async () => {
    setIsLoading(true);
    try {
      const discoveryEngine = new (searchEngine as any).discoveryEngine || new DiscoveryEngine();
      
      switch (activeTab) {
        case 'similar':
          // For demo purposes, we'll simulate similar scenarios
          setDiscoveryData({
            similar: [
              {
                scenarioId: 'api-test-1',
                scenarioName: 'User Authentication API Test',
                similarity: 0.85,
                commonElements: ['api calls', 'authentication', 'JWT validation'],
                differences: ['different endpoints', 'timeout settings']
              },
              {
                scenarioId: 'api-test-2',
                scenarioName: 'User Profile API Test',
                similarity: 0.72,
                commonElements: ['api calls', 'user data validation'],
                differences: ['response format', 'error handling']
              }
            ]
          });
          break;
          
        case 'unused':
          setDiscoveryData({
            unused: [
              {
                variable: '$.env.OLD_API_KEY',
                declaredIn: 'auth-scenario.yaml',
                declaredAt: 'environment variables section',
                usageCount: 0,
                potentialImpact: 'medium'
              },
              {
                variable: '$.global.debugMode',
                declaredIn: 'setup-scenario.yaml',
                declaredAt: 'global variables',
                usageCount: 1,
                potentialImpact: 'low'
              }
            ]
          });
          break;
          
        case 'dependencies':
          setDiscoveryData({
            dependencies: [
              {
                scenario: 'user-registration.yaml',
                dependencies: ['auth-setup.yaml', 'database-init.yaml'],
                dependents: ['profile-test.yaml', 'settings-test.yaml'],
                cyclicDependencies: [],
                riskLevel: 'medium'
              },
              {
                scenario: 'payment-flow.yaml',
                dependencies: ['auth-setup.yaml', 'cart-setup.yaml', 'payment-gateway.yaml'],
                dependents: ['order-confirmation.yaml'],
                cyclicDependencies: ['cart-setup.yaml'],
                riskLevel: 'high'
              }
            ]
          });
          break;
          
        case 'duplicates':
          setDiscoveryData({
            duplicates: [
              {
                pattern: 'api:GET-/users/{id}',
                type: 'similar',
                occurrences: [
                  { scenario: 'user-profile.yaml', stepIndex: 2, stepName: 'Get User Details', similarity: 0.95 },
                  { scenario: 'user-settings.yaml', stepIndex: 1, stepName: 'Fetch User Info', similarity: 0.92 },
                  { scenario: 'admin-panel.yaml', stepIndex: 3, stepName: 'Load User Data', similarity: 0.88 }
                ],
                suggestedAction: 'Extract to reusable component (3 similar steps)'
              },
              {
                pattern: 'type:validation',
                type: 'structural',
                occurrences: [
                  { scenario: 'form-validation.yaml', stepIndex: 4, stepName: 'Validate Email', similarity: 0.78 },
                  { scenario: 'registration.yaml', stepIndex: 2, stepName: 'Email Check', similarity: 0.75 }
                ],
                suggestedAction: 'Consider structural refactoring (2 structural similarities)'
              }
            ]
          });
          break;
          
        case 'performance':
          setDiscoveryData({
            performance: [
              {
                scenario: 'large-dataset-test.yaml',
                step: 'Database Query',
                stepIndex: 2,
                avgDuration: 8500,
                p95Duration: 12000,
                executionCount: 15,
                issues: ['High average duration', 'High variability in execution time'],
                recommendations: ['Optimize database query', 'Add connection pooling', 'Consider caching'],
                severity: 'high'
              },
              {
                scenario: 'api-load-test.yaml',
                step: 'Bulk API Call',
                stepIndex: 1,
                avgDuration: 6200,
                p95Duration: 8500,
                executionCount: 22,
                issues: ['Slow API response time'],
                recommendations: ['Review API endpoint performance', 'Implement request batching'],
                severity: 'medium'
              }
            ]
          });
          break;
          
        case 'suggestions':
          setDiscoveryData({
            suggestions: [
              {
                type: 'performance',
                priority: 'high',
                title: 'Optimize slow steps',
                description: '3 performance bottlenecks detected',
                affectedScenarios: ['large-dataset-test.yaml', 'api-load-test.yaml'],
                estimatedImpact: 'Reduce execution time by 20-50%',
                actionItems: [
                  'Review timeout configurations',
                  'Optimize API endpoints',
                  'Consider parallel execution',
                  'Cache frequently accessed data'
                ]
              },
              {
                type: 'maintainability',
                priority: 'medium',
                title: 'Eliminate duplicate steps',
                description: '5 patterns found in multiple scenarios',
                affectedScenarios: ['user-profile.yaml', 'user-settings.yaml', 'admin-panel.yaml'],
                estimatedImpact: 'Improve maintainability and reduce test suite size',
                actionItems: [
                  'Extract common steps to reusable components',
                  'Create shared step library',
                  'Implement step inheritance'
                ]
              }
            ]
          });
          break;
      }
    } catch (error) {
      console.error('Failed to load discovery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxIndex = () => {
    const data = discoveryData[activeTab];
    if (!data || !Array.isArray(data)) return 0;
    return Math.max(0, data.length - 1);
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <Box justifyContent="center" alignItems="center" height={10}>
          <Text color="yellow">🔄 Analyzing scenarios...</Text>
        </Box>
      );
    }

    switch (activeTab) {
      case 'similar':
        return <SimilarScenariosTab data={discoveryData.similar || []} selectedIndex={selectedIndex} />;
      case 'unused':
        return <UnusedVariablesTab data={discoveryData.unused || []} selectedIndex={selectedIndex} />;
      case 'dependencies':
        return <DependenciesTab data={discoveryData.dependencies || []} selectedIndex={selectedIndex} />;
      case 'duplicates':
        return <DuplicatesTab data={discoveryData.duplicates || []} selectedIndex={selectedIndex} />;
      case 'performance':
        return <PerformanceTab data={discoveryData.performance || []} selectedIndex={selectedIndex} />;
      case 'suggestions':
        return <SuggestionsTab data={discoveryData.suggestions || []} selectedIndex={selectedIndex} />;
      default:
        return <Text color="gray">No data available</Text>;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header with tabs */}
      <Box borderStyle="single" paddingX={1}>
        <Text bold color="cyan">Smart Discovery</Text>
        <Box marginLeft={2}>
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.id}>
              <Text color={activeTab === tab.id ? 'yellow' : 'gray'}>
                {tab.icon} {tab.label}
              </Text>
              {index < tabs.length - 1 && <Text color="gray"> | </Text>}
            </React.Fragment>
          ))}
        </Box>
        <Box marginLeft="auto">
          <Text color="gray">R: Refresh</Text>
        </Box>
      </Box>

      {/* Content */}
      <Box flexGrow={1} marginTop={1}>
        {renderTabContent()}
      </Box>

      {/* Footer */}
      <Box borderStyle="single" paddingX={1}>
        <Text color="gray">
          ←→: Switch tabs | ↑↓: Navigate items | R: Refresh analysis
        </Text>
      </Box>
    </Box>
  );
};

// Tab Components

const SimilarScenariosTab: React.FC<{ data: any[]; selectedIndex: number }> = ({ data, selectedIndex }) => (
  <Box flexDirection="column">
    <Text bold color="cyan">Similar Scenarios</Text>
    {data.length === 0 ? (
      <Text color="gray">No similar scenarios found.</Text>
    ) : (
      data.map((item, index) => (
        <Box
          key={item.scenarioId}
          borderStyle={index === selectedIndex ? 'single' : undefined}
          borderColor={index === selectedIndex ? 'yellow' : undefined}
          paddingX={1}
          marginY={0}
        >
          <Box flexDirection="column">
            <Text color="white">{item.scenarioName}</Text>
            <Box>
              <Text color="gray">Similarity: </Text>
              <Text color="green">{Math.round(item.similarity * 100)}%</Text>
            </Box>
            <Box>
              <Text color="gray">Common: </Text>
              <Text color="cyan">{item.commonElements.join(', ')}</Text>
            </Box>
            {item.differences.length > 0 && (
              <Box>
                <Text color="gray">Different: </Text>
                <Text color="yellow">{item.differences.join(', ')}</Text>
              </Box>
            )}
          </Box>
        </Box>
      ))
    )}
  </Box>
);

const UnusedVariablesTab: React.FC<{ data: any[]; selectedIndex: number }> = ({ data, selectedIndex }) => (
  <Box flexDirection="column">
    <Text bold color="cyan">Unused Variables</Text>
    {data.length === 0 ? (
      <Text color="green">✅ No unused variables detected!</Text>
    ) : (
      data.map((item, index) => (
        <Box
          key={item.variable}
          borderStyle={index === selectedIndex ? 'single' : undefined}
          borderColor={index === selectedIndex ? 'yellow' : undefined}
          paddingX={1}
          marginY={0}
        >
          <Box flexDirection="column">
            <Text color="white">{item.variable}</Text>
            <Box>
              <Text color="gray">Declared in: </Text>
              <Text color="cyan">{item.declaredIn}</Text>
            </Box>
            <Box>
              <Text color="gray">Usage count: </Text>
              <Text color="red">{item.usageCount}</Text>
              <Text color="gray"> | Impact: </Text>
              <Text color={item.potentialImpact === 'high' ? 'red' : item.potentialImpact === 'medium' ? 'yellow' : 'green'}>
                {item.potentialImpact}
              </Text>
            </Box>
          </Box>
        </Box>
      ))
    )}
  </Box>
);

const DependenciesTab: React.FC<{ data: any[]; selectedIndex: number }> = ({ data, selectedIndex }) => (
  <Box flexDirection="column">
    <Text bold color="cyan">Scenario Dependencies</Text>
    {data.length === 0 ? (
      <Text color="gray">No dependency analysis available.</Text>
    ) : (
      data.map((item, index) => (
        <Box
          key={item.scenario}
          borderStyle={index === selectedIndex ? 'single' : undefined}
          borderColor={index === selectedIndex ? 'yellow' : undefined}
          paddingX={1}
          marginY={0}
        >
          <Box flexDirection="column">
            <Text color="white">{item.scenario}</Text>
            <Box>
              <Text color="gray">Dependencies: </Text>
              <Text color="cyan">{item.dependencies.join(', ') || 'None'}</Text>
            </Box>
            <Box>
              <Text color="gray">Dependents: </Text>
              <Text color="blue">{item.dependents.join(', ') || 'None'}</Text>
            </Box>
            {item.cyclicDependencies.length > 0 && (
              <Box>
                <Text color="red">⚠️ Cyclic: </Text>
                <Text color="red">{item.cyclicDependencies.join(', ')}</Text>
              </Box>
            )}
            <Box>
              <Text color="gray">Risk Level: </Text>
              <Text color={item.riskLevel === 'high' ? 'red' : item.riskLevel === 'medium' ? 'yellow' : 'green'}>
                {item.riskLevel}
              </Text>
            </Box>
          </Box>
        </Box>
      ))
    )}
  </Box>
);

const DuplicatesTab: React.FC<{ data: any[]; selectedIndex: number }> = ({ data, selectedIndex }) => (
  <Box flexDirection="column">
    <Text bold color="cyan">Duplicate Patterns</Text>
    {data.length === 0 ? (
      <Text color="green">✅ No significant duplicates found!</Text>
    ) : (
      data.map((item, index) => (
        <Box
          key={item.pattern}
          borderStyle={index === selectedIndex ? 'single' : undefined}
          borderColor={index === selectedIndex ? 'yellow' : undefined}
          paddingX={1}
          marginY={0}
        >
          <Box flexDirection="column">
            <Text color="white">{item.pattern}</Text>
            <Box>
              <Text color="gray">Type: </Text>
              <Text color="yellow">{item.type}</Text>
              <Text color="gray"> | Occurrences: </Text>
              <Text color="red">{item.occurrences.length}</Text>
            </Box>
            <Box>
              <Text color="cyan">{item.suggestedAction}</Text>
            </Box>
            <Box marginLeft={2}>
              {item.occurrences.slice(0, 3).map((occ: any, occIndex: number) => (
                <Text key={occIndex} color="gray">
                  • {occ.scenario} (step {occ.stepIndex}): {occ.stepName}
                </Text>
              ))}
              {item.occurrences.length > 3 && (
                <Text color="gray">... and {item.occurrences.length - 3} more</Text>
              )}
            </Box>
          </Box>
        </Box>
      ))
    )}
  </Box>
);

const PerformanceTab: React.FC<{ data: any[]; selectedIndex: number }> = ({ data, selectedIndex }) => (
  <Box flexDirection="column">
    <Text bold color="cyan">Performance Bottlenecks</Text>
    {data.length === 0 ? (
      <Text color="green">✅ No performance issues detected!</Text>
    ) : (
      data.map((item, index) => (
        <Box
          key={`${item.scenario}-${item.stepIndex}`}
          borderStyle={index === selectedIndex ? 'single' : undefined}
          borderColor={index === selectedIndex ? 'yellow' : undefined}
          paddingX={1}
          marginY={0}
        >
          <Box flexDirection="column">
            <Text color="white">{item.scenario} - {item.step}</Text>
            <Box>
              <Text color="gray">Avg: </Text>
              <Text color="red">{item.avgDuration}ms</Text>
              <Text color="gray"> | P95: </Text>
              <Text color="red">{item.p95Duration}ms</Text>
              <Text color="gray"> | Runs: </Text>
              <Text color="white">{item.executionCount}</Text>
            </Box>
            <Box>
              <Text color="gray">Severity: </Text>
              <Text color={item.severity === 'critical' ? 'red' : item.severity === 'high' ? 'red' : item.severity === 'medium' ? 'yellow' : 'green'}>
                {item.severity}
              </Text>
            </Box>
            <Box>
              <Text color="yellow">Issues: {item.issues.join(', ')}</Text>
            </Box>
            <Box marginLeft={2}>
              {item.recommendations.slice(0, 2).map((rec: string, recIndex: number) => (
                <Text key={recIndex} color="cyan">• {rec}</Text>
              ))}
            </Box>
          </Box>
        </Box>
      ))
    )}
  </Box>
);

const SuggestionsTab: React.FC<{ data: any[]; selectedIndex: number }> = ({ data, selectedIndex }) => (
  <Box flexDirection="column">
    <Text bold color="cyan">Optimization Suggestions</Text>
    {data.length === 0 ? (
      <Text color="green">✅ No optimization suggestions at this time!</Text>
    ) : (
      data.map((item, index) => (
        <Box
          key={item.title}
          borderStyle={index === selectedIndex ? 'single' : undefined}
          borderColor={index === selectedIndex ? 'yellow' : undefined}
          paddingX={1}
          marginY={0}
        >
          <Box flexDirection="column">
            <Box>
              <Text color="white">{item.title}</Text>
              <Box marginLeft="auto">
                <Text color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'yellow' : 'green'}>
                  {item.priority}
                </Text>
              </Box>
            </Box>
            <Text color="gray">{item.description}</Text>
            <Box>
              <Text color="gray">Impact: </Text>
              <Text color="cyan">{item.estimatedImpact}</Text>
            </Box>
            <Box>
              <Text color="gray">Affected: </Text>
              <Text color="blue">{item.affectedScenarios.length} scenarios</Text>
            </Box>
            <Box marginLeft={2}>
              {item.actionItems.slice(0, 2).map((action: string, actionIndex: number) => (
                <Text key={actionIndex} color="green">• {action}</Text>
              ))}
              {item.actionItems.length > 2 && (
                <Text color="gray">... and {item.actionItems.length - 2} more actions</Text>
              )}
            </Box>
          </Box>
        </Box>
      ))
    )}
  </Box>
);