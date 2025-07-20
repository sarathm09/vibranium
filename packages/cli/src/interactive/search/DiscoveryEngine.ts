/**
 * Smart Discovery Engine for scenario analysis and insights
 * Provides intelligent discovery of patterns, dependencies, and optimization opportunities
 */

import { Scenario, Step, ScenarioResult } from '../types';
import { SearchResult } from './SearchEngine';

export interface SimilarityMatch {
  scenarioId: string;
  scenarioName: string;
  similarity: number;
  commonElements: string[];
  differences: string[];
}

export interface UnusedVariable {
  variable: string;
  declaredIn: string;
  declaredAt: string;
  usageCount: number;
  potentialImpact: 'low' | 'medium' | 'high';
}

export interface DependencyAnalysis {
  scenario: string;
  dependencies: string[];
  dependents: string[];
  cyclicDependencies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DuplicatePattern {
  pattern: string;
  type: 'exact' | 'similar' | 'structural';
  occurrences: {
    scenario: string;
    stepIndex: number;
    stepName: string;
    similarity: number;
  }[];
  suggestedAction: string;
}

export interface PerformanceBottleneck {
  scenario: string;
  step: string;
  stepIndex: number;
  avgDuration: number;
  p95Duration: number;
  executionCount: number;
  issues: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface OptimizationSuggestion {
  type: 'performance' | 'maintainability' | 'reliability' | 'structure';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedScenarios: string[];
  estimatedImpact: string;
  actionItems: string[];
}

/**
 * Engine for discovering patterns, dependencies, and optimization opportunities
 */
export class DiscoveryEngine {
  private scenarios: Map<string, Scenario> = new Map();
  private executionHistory: Map<string, ScenarioResult[]> = new Map();
  private variableUsage: Map<string, { scenarios: string[]; frequency: number }> = new Map();

  /**
   * Analyze scenarios and build internal knowledge base
   */
  analyzeScenarios(scenarios: Scenario[]): void {
    this.scenarios.clear();
    scenarios.forEach(scenario => {
      this.scenarios.set(scenario.name, scenario);
    });

    this.buildVariableUsageMap();
  }

  /**
   * Update execution history for performance analysis
   */
  updateExecutionHistory(scenarioName: string, results: ScenarioResult[]): void {
    this.executionHistory.set(scenarioName, results);
  }

  /**
   * Find scenarios similar to the given scenario
   */
  findSimilarScenarios(scenarioId: string): SearchResult[] {
    const targetScenario = this.scenarios.get(scenarioId);
    if (!targetScenario) return [];

    const similarities: SimilarityMatch[] = [];

    for (const [name, scenario] of this.scenarios) {
      if (name === scenarioId) continue;

      const similarity = this.calculateSimilarity(targetScenario, scenario);
      if (similarity.similarity > 0.3) { // 30% similarity threshold
        similarities.push({
          scenarioId: name,
          scenarioName: scenario.name,
          ...similarity
        });
      }
    }

    // Convert to SearchResult format
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10) // Top 10 similar scenarios
      .map(sim => ({
        id: `similarity:${sim.scenarioId}`,
        type: 'scenario' as const,
        name: sim.scenarioName,
        path: sim.scenarioId,
        relevanceScore: sim.similarity * 100,
        matches: [{
          field: 'similarity',
          text: `${Math.round(sim.similarity * 100)}% similar`,
          startIndex: 0,
          endIndex: 0,
          context: `Common elements: ${sim.commonElements.join(', ')}`
        }],
        metadata: {
          scenario: this.scenarios.get(sim.scenarioId),
          similarityScore: sim.similarity,
          commonElements: sim.commonElements,
          differences: sim.differences
        }
      }));
  }

  /**
   * Find unused variables across all scenarios
   */
  findUnusedVariables(): UnusedVariable[] {
    const unused: UnusedVariable[] = [];
    const variablePattern = /\$\{([^}]+)\}|\$\.([a-zA-Z0-9_.]+)/g;

    // Collect all variable declarations and usages
    const declarations = new Map<string, { scenario: string; context: string }>();
    const usages = new Map<string, number>();

    for (const [scenarioName, scenario] of this.scenarios) {
      const scenarioContent = JSON.stringify(scenario);
      let match;

      while ((match = variablePattern.exec(scenarioContent)) !== null) {
        const variable = match[1] || match[2];
        if (!variable) continue;

        // Simple heuristic: if it's in a URL or header, it's likely a usage
        // if it's in a more declarative context, it might be a declaration
        const context = scenarioContent.substring(
          Math.max(0, match.index - 50),
          Math.min(scenarioContent.length, match.index + 50)
        );

        if (this.isVariableDeclaration(context, variable)) {
          declarations.set(variable, { scenario: scenarioName, context });
        }

        usages.set(variable, (usages.get(variable) || 0) + 1);
      }
    }

    // Find variables that are declared but rarely used
    for (const [variable, declaration] of declarations) {
      const usageCount = usages.get(variable) || 0;
      
      if (usageCount <= 1) { // Only declared, not used elsewhere
        unused.push({
          variable,
          declaredIn: declaration.scenario,
          declaredAt: declaration.context.trim(),
          usageCount,
          potentialImpact: this.assessVariableImpact(variable, declaration.scenario)
        });
      }
    }

    return unused.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.potentialImpact] - impactOrder[a.potentialImpact];
    });
  }

  /**
   * Analyze dependencies between scenarios
   */
  analyzeDependencies(): DependencyAnalysis[] {
    const dependencies: DependencyAnalysis[] = [];
    const dependencyGraph = new Map<string, Set<string>>();

    // Build dependency graph based on variable usage and step references
    for (const [scenarioName, scenario] of this.scenarios) {
      const deps = new Set<string>();
      const scenarioContent = JSON.stringify(scenario);

      // Find references to other scenarios or shared variables
      for (const [otherName] of this.scenarios) {
        if (otherName !== scenarioName && scenarioContent.includes(otherName)) {
          deps.add(otherName);
        }
      }

      dependencyGraph.set(scenarioName, deps);
    }

    // Analyze each scenario's dependencies
    for (const [scenarioName, deps] of dependencyGraph) {
      const dependents = Array.from(dependencyGraph.entries())
        .filter(([, scenarioDeps]) => scenarioDeps.has(scenarioName))
        .map(([name]) => name);

      const cyclicDeps = this.findCyclicDependencies(scenarioName, dependencyGraph);
      const riskLevel = this.assessDependencyRisk(deps.size, dependents.length, cyclicDeps.length);

      dependencies.push({
        scenario: scenarioName,
        dependencies: Array.from(deps),
        dependents,
        cyclicDependencies: cyclicDeps,
        riskLevel
      });
    }

    return dependencies.sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - 
             (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0);
    });
  }

  /**
   * Find duplicate steps across scenarios
   */
  findDuplicateSteps(): DuplicatePattern[] {
    const patterns: DuplicatePattern[] = [];
    const stepSignatures = new Map<string, { scenario: string; stepIndex: number; step: Step }[]>();

    // Collect step signatures
    for (const [scenarioName, scenario] of this.scenarios) {
      scenario.steps.forEach((step, index) => {
        const signatures = this.generateStepSignatures(step);
        
        signatures.forEach(signature => {
          if (!stepSignatures.has(signature)) {
            stepSignatures.set(signature, []);
          }
          stepSignatures.get(signature)!.push({
            scenario: scenarioName,
            stepIndex: index,
            step
          });
        });
      });
    }

    // Find patterns with multiple occurrences
    for (const [signature, occurrences] of stepSignatures) {
      if (occurrences.length > 1) {
        const type = this.determinePatternType(occurrences);
        const suggestedAction = this.suggestDuplicateAction(type, occurrences.length);

        patterns.push({
          pattern: signature,
          type,
          occurrences: occurrences.map(occ => ({
            scenario: occ.scenario,
            stepIndex: occ.stepIndex,
            stepName: occ.step.name,
            similarity: this.calculateStepSimilarity(occurrences[0].step, occ.step)
          })),
          suggestedAction
        });
      }
    }

    return patterns.sort((a, b) => b.occurrences.length - a.occurrences.length);
  }

  /**
   * Identify performance bottlenecks
   */
  findPerformanceBottlenecks(): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];

    for (const [scenarioName, results] of this.executionHistory) {
      if (results.length === 0) continue;

      const scenario = this.scenarios.get(scenarioName);
      if (!scenario) continue;

      // Analyze step performance
      scenario.steps.forEach((step, stepIndex) => {
        const stepDurations = results
          .filter(result => result.stepResults && result.stepResults[stepIndex])
          .map(result => result.stepResults![stepIndex].duration || 0);

        if (stepDurations.length === 0) return;

        const avgDuration = stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length;
        const p95Duration = this.calculatePercentile(stepDurations, 0.95);

        // Identify issues
        const issues = this.identifyPerformanceIssues(step, avgDuration, p95Duration, stepDurations);
        
        if (issues.length > 0) {
          const severity = this.assessPerformanceSeverity(avgDuration, p95Duration, issues.length);
          const recommendations = this.generatePerformanceRecommendations(step, issues);

          bottlenecks.push({
            scenario: scenarioName,
            step: step.name,
            stepIndex,
            avgDuration,
            p95Duration,
            executionCount: stepDurations.length,
            issues,
            recommendations,
            severity
          });
        }
      });
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Performance optimizations
    const bottlenecks = this.findPerformanceBottlenecks();
    if (bottlenecks.length > 0) {
      suggestions.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize slow steps',
        description: `${bottlenecks.length} performance bottlenecks detected`,
        affectedScenarios: bottlenecks.map(b => b.scenario),
        estimatedImpact: 'Reduce execution time by 20-50%',
        actionItems: [
          'Review timeout configurations',
          'Optimize API endpoints',
          'Consider parallel execution',
          'Cache frequently accessed data'
        ]
      });
    }

    // Duplicate elimination
    const duplicates = this.findDuplicateSteps();
    const highDuplicates = duplicates.filter(d => d.occurrences.length > 3);
    if (highDuplicates.length > 0) {
      suggestions.push({
        type: 'maintainability',
        priority: 'medium',
        title: 'Eliminate duplicate steps',
        description: `${highDuplicates.length} patterns found in multiple scenarios`,
        affectedScenarios: [...new Set(highDuplicates.flatMap(d => d.occurrences.map(o => o.scenario)))],
        estimatedImpact: 'Improve maintainability and reduce test suite size',
        actionItems: [
          'Extract common steps to reusable components',
          'Create shared step library',
          'Implement step inheritance'
        ]
      });
    }

    // Unused variable cleanup
    const unusedVars = this.findUnusedVariables();
    const highImpactUnused = unusedVars.filter(v => v.potentialImpact === 'high');
    if (highImpactUnused.length > 0) {
      suggestions.push({
        type: 'maintainability',
        priority: 'low',
        title: 'Clean up unused variables',
        description: `${unusedVars.length} unused variables detected`,
        affectedScenarios: unusedVars.map(v => v.declaredIn),
        estimatedImpact: 'Reduce complexity and improve readability',
        actionItems: [
          'Remove unused variable declarations',
          'Audit variable usage patterns',
          'Implement variable validation'
        ]
      });
    }

    // Dependency simplification
    const dependencies = this.analyzeDependencies();
    const complexDeps = dependencies.filter(d => d.dependencies.length > 5 || d.cyclicDependencies.length > 0);
    if (complexDeps.length > 0) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        title: 'Simplify scenario dependencies',
        description: `${complexDeps.length} scenarios have complex dependencies`,
        affectedScenarios: complexDeps.map(d => d.scenario),
        estimatedImpact: 'Improve test isolation and reduce brittleness',
        actionItems: [
          'Break down complex scenarios',
          'Resolve cyclic dependencies',
          'Implement better isolation'
        ]
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }

  // Private helper methods

  private calculateSimilarity(scenario1: Scenario, scenario2: Scenario): {
    similarity: number;
    commonElements: string[];
    differences: string[];
  } {
    const common: string[] = [];
    const diff: string[] = [];

    // Compare step types
    const types1 = scenario1.steps.map(s => s.type);
    const types2 = scenario2.steps.map(s => s.type);
    const commonTypes = types1.filter(t => types2.includes(t));
    const diffTypes = types1.filter(t => !types2.includes(t)).concat(
      types2.filter(t => !types1.includes(t))
    );

    common.push(...commonTypes.map(t => `step type: ${t}`));
    diff.push(...diffTypes.map(t => `unique step type: ${t}`));

    // Compare environments
    const envs1 = scenario1.environments || [];
    const envs2 = scenario2.environments || [];
    const commonEnvs = envs1.filter(e => envs2.includes(e));
    
    common.push(...commonEnvs.map(e => `environment: ${e}`));

    // Calculate similarity score
    const totalElements = Math.max(
      scenario1.steps.length + envs1.length,
      scenario2.steps.length + envs2.length
    );
    const similarity = totalElements > 0 ? (commonTypes.length + commonEnvs.length) / totalElements : 0;

    return {
      similarity,
      commonElements: common,
      differences: diff
    };
  }

  private buildVariableUsageMap(): void {
    this.variableUsage.clear();
    
    for (const [scenarioName, scenario] of this.scenarios) {
      const content = JSON.stringify(scenario);
      const variablePattern = /\$\{([^}]+)\}|\$\.([a-zA-Z0-9_.]+)/g;
      let match;

      while ((match = variablePattern.exec(content)) !== null) {
        const variable = match[1] || match[2];
        if (!variable) continue;

        if (!this.variableUsage.has(variable)) {
          this.variableUsage.set(variable, { scenarios: [], frequency: 0 });
        }

        const usage = this.variableUsage.get(variable)!;
        if (!usage.scenarios.includes(scenarioName)) {
          usage.scenarios.push(scenarioName);
        }
        usage.frequency++;
      }
    }
  }

  private isVariableDeclaration(context: string, variable: string): boolean {
    // Simple heuristics to determine if this is a variable declaration
    const declarationKeywords = ['set', 'assign', 'define', 'var', 'let', 'const'];
    const lowerContext = context.toLowerCase();
    
    return declarationKeywords.some(keyword => lowerContext.includes(keyword)) ||
           lowerContext.includes('=') ||
           lowerContext.includes(':');
  }

  private assessVariableImpact(variable: string, scenarioName: string): 'low' | 'medium' | 'high' {
    const usage = this.variableUsage.get(variable);
    if (!usage) return 'low';

    // High impact: used across multiple scenarios
    if (usage.scenarios.length > 3) return 'high';
    
    // Medium impact: used multiple times in same scenario
    if (usage.frequency > 3) return 'medium';
    
    return 'low';
  }

  private findCyclicDependencies(scenarioName: string, dependencyGraph: Map<string, Set<string>>): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);

      const dependencies = dependencyGraph.get(node) || new Set();
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          dfs(dep, [...path, dep]);
        } else if (recursionStack.has(dep)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep);
          if (cycleStart >= 0) {
            cycles.push(path.slice(cycleStart).join(' -> '));
          }
        }
      }

      recursionStack.delete(node);
    };

    dfs(scenarioName, [scenarioName]);
    return cycles;
  }

  private assessDependencyRisk(depsCount: number, dependentsCount: number, cyclicCount: number): 'low' | 'medium' | 'high' {
    if (cyclicCount > 0) return 'high';
    if (depsCount > 5 || dependentsCount > 5) return 'high';
    if (depsCount > 3 || dependentsCount > 3) return 'medium';
    return 'low';
  }

  private generateStepSignatures(step: Step): string[] {
    const signatures: string[] = [];
    
    // Type-based signature
    signatures.push(`type:${step.type}`);
    
    // Type + name pattern
    if (step.name) {
      const normalizedName = step.name.toLowerCase().replace(/\s+/g, '_');
      signatures.push(`type-name:${step.type}-${normalizedName}`);
    }

    // For API steps, include method and URL pattern
    if (step.type === 'api' && (step as any).method) {
      const method = (step as any).method;
      signatures.push(`api:${method}`);
      
      if ((step as any).url) {
        const urlPattern = this.extractUrlPattern((step as any).url);
        signatures.push(`api-pattern:${method}-${urlPattern}`);
      }
    }

    return signatures;
  }

  private extractUrlPattern(url: string): string {
    // Extract URL pattern by replacing dynamic parts
    return url
      .replace(/\/\d+/g, '/{id}')
      .replace(/\$\{[^}]+\}/g, '{var}')
      .replace(/\?.*/, '');
  }

  private determinePatternType(occurrences: { step: Step }[]): 'exact' | 'similar' | 'structural' {
    if (occurrences.length < 2) return 'exact';
    
    const firstStep = occurrences[0].step;
    const isExact = occurrences.every(occ => 
      JSON.stringify(occ.step) === JSON.stringify(firstStep)
    );
    
    if (isExact) return 'exact';
    
    const isSimilar = occurrences.every(occ => 
      occ.step.type === firstStep.type && 
      this.calculateStepSimilarity(firstStep, occ.step) > 0.8
    );
    
    return isSimilar ? 'similar' : 'structural';
  }

  private calculateStepSimilarity(step1: Step, step2: Step): number {
    if (step1.type !== step2.type) return 0;
    
    const keys1 = Object.keys(step1);
    const keys2 = Object.keys(step2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    let matches = 0;
    for (const key of allKeys) {
      if (step1[key] === step2[key]) {
        matches++;
      }
    }
    
    return matches / allKeys.size;
  }

  private suggestDuplicateAction(type: 'exact' | 'similar' | 'structural', count: number): string {
    if (type === 'exact') {
      return `Extract to reusable component (${count} exact duplicates)`;
    } else if (type === 'similar') {
      return `Parameterize common step pattern (${count} similar steps)`;
    } else {
      return `Consider structural refactoring (${count} structural similarities)`;
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  private identifyPerformanceIssues(step: Step, avgDuration: number, p95Duration: number, durations: number[]): string[] {
    const issues: string[] = [];
    
    if (avgDuration > 5000) {
      issues.push('High average duration');
    }
    
    if (p95Duration > avgDuration * 3) {
      issues.push('High variability in execution time');
    }
    
    if (step.type === 'api' && avgDuration > 3000) {
      issues.push('Slow API response time');
    }
    
    const variance = this.calculateVariance(durations);
    if (variance > avgDuration) {
      issues.push('Inconsistent performance');
    }
    
    return issues;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private assessPerformanceSeverity(avgDuration: number, p95Duration: number, issueCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (avgDuration > 10000 || issueCount > 3) return 'critical';
    if (avgDuration > 5000 || issueCount > 2) return 'high';
    if (avgDuration > 3000 || issueCount > 1) return 'medium';
    return 'low';
  }

  private generatePerformanceRecommendations(step: Step, issues: string[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.includes('High average duration')) {
      recommendations.push('Optimize step implementation');
      recommendations.push('Review timeout settings');
    }
    
    if (issues.includes('Slow API response time') && step.type === 'api') {
      recommendations.push('Optimize API endpoint performance');
      recommendations.push('Consider caching responses');
      recommendations.push('Review API rate limiting');
    }
    
    if (issues.includes('High variability in execution time')) {
      recommendations.push('Investigate environmental factors');
      recommendations.push('Add retry logic with backoff');
    }
    
    if (issues.includes('Inconsistent performance')) {
      recommendations.push('Monitor system resources during execution');
      recommendations.push('Consider load balancing');
    }
    
    return recommendations;
  }
}