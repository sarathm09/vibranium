/**
 * Dependency manager for step execution ordering
 * Analyzes step dependencies and builds execution graph
 */

import type { Step } from '../types';
import { logger } from '@vibraniumjs/utils';

export interface DependencyNode {
  step: Step;
  dependencies: string[];
  dependents: string[];
  level: number;
  visited: boolean;
}

export interface ExecutionGraph {
  nodes: Map<string, DependencyNode>;
  levels: string[][];
  hasCycles: boolean;
  cycles: string[][];
}

export interface ExecutionPlan {
  batches: Step[][];
  totalSteps: number;
  maxParallelism: number;
  dependencies: Map<string, string[]>;
}

export class DependencyManager {
  /**
   * Analyze dependencies and create execution graph
   */
  analyzeDependencies(steps: Step[]): ExecutionGraph {
    logger.debug('Analyzing step dependencies', { stepCount: steps.length });
    
    const nodes = new Map<string, DependencyNode>();
    
    // Create nodes for all steps
    steps.forEach(step => {
      nodes.set(step.name, {
        step,
        dependencies: this.extractDependencies(step),
        dependents: [],
        level: 0,
        visited: false
      });
    });
    
    // Build dependency relationships
    this.buildDependencyGraph(nodes);
    
    // Detect cycles
    const cycles = this.detectCycles(nodes);
    const hasCycles = cycles.length > 0;
    
    if (hasCycles) {
      logger.warn('Circular dependencies detected', { cycles });
    }
    
    // Calculate execution levels (topological sorting)
    const levels = this.calculateLevels(nodes);
    
    const graph: ExecutionGraph = {
      nodes,
      levels,
      hasCycles,
      cycles
    };
    
    logger.debug('Dependency analysis complete', {
      nodeCount: nodes.size,
      levelCount: levels.length,
      hasCycles,
      cycleCount: cycles.length
    });
    
    return graph;
  }
  
  /**
   * Create execution plan with batches for parallel execution
   */
  createExecutionPlan(steps: Step[]): ExecutionPlan {
    const graph = this.analyzeDependencies(steps);
    
    if (graph.hasCycles) {
      throw new Error(
        `Cannot create execution plan: circular dependencies detected: ${graph.cycles.map(cycle => cycle.join(' -> ')).join(', ')}`
      );
    }
    
    // Convert levels to batches of steps
    const batches: Step[][] = graph.levels.map(level => 
      level.map(stepName => graph.nodes.get(stepName)!.step)
    );
    
    // Filter out empty batches
    const nonEmptyBatches = batches.filter(batch => batch.length > 0);
    
    const dependencies = new Map<string, string[]>();
    graph.nodes.forEach((node, name) => {
      dependencies.set(name, node.dependencies);
    });
    
    const plan: ExecutionPlan = {
      batches: nonEmptyBatches,
      totalSteps: steps.length,
      maxParallelism: Math.max(...nonEmptyBatches.map(batch => batch.length)),
      dependencies
    };
    
    logger.debug('Execution plan created', {
      batchCount: plan.batches.length,
      totalSteps: plan.totalSteps,
      maxParallelism: plan.maxParallelism
    });
    
    return plan;
  }
  
  /**
   * Validate dependencies (check if all referenced steps exist)
   */
  validateDependencies(steps: Step[]): { valid: boolean; errors: string[] } {
    const stepNames = new Set(steps.map(step => step.name));
    const errors: string[] = [];
    
    steps.forEach(step => {
      const dependencies = this.extractDependencies(step);
      
      dependencies.forEach(dep => {
        if (!stepNames.has(dep)) {
          errors.push(`Step '${step.name}' depends on non-existent step '${dep}'`);
        }
        
        if (dep === step.name) {
          errors.push(`Step '${step.name}' cannot depend on itself`);
        }
      });
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get steps that can be executed next based on completed steps
   */
  getExecutableSteps(
    allSteps: Step[],
    completedSteps: Set<string>,
    runningSteps: Set<string> = new Set()
  ): Step[] {
    const executable: Step[] = [];
    
    allSteps.forEach(step => {
      // Skip if already completed or running
      if (completedSteps.has(step.name) || runningSteps.has(step.name)) {
        return;
      }
      
      // Check if all dependencies are completed
      const dependencies = this.extractDependencies(step);
      const allDependenciesCompleted = dependencies.every(dep => 
        completedSteps.has(dep)
      );
      
      if (allDependenciesCompleted) {
        executable.push(step);
      }
    });
    
    return executable;
  }
  
  /**
   * Extract dependencies from a step
   */
  private extractDependencies(step: Step): string[] {
    if (!step.dependsOn) {
      return [];
    }
    
    // Handle both string and DependsOn object formats
    return step.dependsOn.map(dep => {
      if (typeof dep === 'string') {
        return dep;
      }
      // For future DependsOn object format
      return dep.toString();
    });
  }
  
  /**
   * Build dependency graph with dependents
   */
  private buildDependencyGraph(nodes: Map<string, DependencyNode>): void {
    nodes.forEach(node => {
      node.dependencies.forEach(depName => {
        const depNode = nodes.get(depName);
        if (depNode) {
          depNode.dependents.push(node.step.name);
        }
      });
    });
  }
  
  /**
   * Detect circular dependencies using DFS
   */
  private detectCycles(nodes: Map<string, DependencyNode>): string[][] {
    const cycles: string[][] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();
    
    const dfs = (nodeName: string, path: string[]): void => {
      if (visiting.has(nodeName)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeName);
        const cycle = path.slice(cycleStart).concat(nodeName);
        cycles.push(cycle);
        return;
      }
      
      if (visited.has(nodeName)) {
        return;
      }
      
      visiting.add(nodeName);
      path.push(nodeName);
      
      const node = nodes.get(nodeName);
      if (node) {
        node.dependencies.forEach(dep => {
          dfs(dep, [...path]);
        });
      }
      
      visiting.delete(nodeName);
      visited.add(nodeName);
    };
    
    nodes.forEach((_, nodeName) => {
      if (!visited.has(nodeName)) {
        dfs(nodeName, []);
      }
    });
    
    return cycles;
  }
  
  /**
   * Calculate execution levels using topological sorting
   */
  private calculateLevels(nodes: Map<string, DependencyNode>): string[][] {
    const levels: string[][] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    
    // Initialize in-degree for all nodes
    nodes.forEach((node, name) => {
      inDegree.set(name, node.dependencies.length);
      if (node.dependencies.length === 0) {
        queue.push(name);
        node.level = 0;
      }
    });
    
    let currentLevel = 0;
    
    while (queue.length > 0) {
      const currentLevelNodes: string[] = [];
      const queueSize = queue.length;
      
      // Process all nodes at current level
      for (let i = 0; i < queueSize; i++) {
        const nodeName = queue.shift()!;
        currentLevelNodes.push(nodeName);
        
        const node = nodes.get(nodeName)!;
        node.level = currentLevel;
        
        // Reduce in-degree for dependent nodes
        node.dependents.forEach(dependent => {
          const depInDegree = inDegree.get(dependent)! - 1;
          inDegree.set(dependent, depInDegree);
          
          if (depInDegree === 0) {
            queue.push(dependent);
          }
        });
      }
      
      if (currentLevelNodes.length > 0) {
        levels.push(currentLevelNodes);
        currentLevel++;
      }
    }
    
    return levels;
  }
}
