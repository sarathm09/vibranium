# Plugin Development Guide

This comprehensive guide walks you through creating custom plugins for Vibranium CLI, from basic step handlers to advanced validation operators and report generators.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- TypeScript knowledge
- Familiarity with Vibranium CLI concepts

### Plugin Structure

A Vibranium CLI plugin is a Node.js module that exports a class implementing the `VibraniumPlugin` interface:

```typescript
import { VibraniumPlugin, Step, ExecutionContext, StepResult } from '@vibranium/types';

export class MyPlugin implements VibraniumPlugin {
  name = 'my-plugin';
  version = '1.0.0';
  stepTypes = ['custom'];

  async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    // Plugin implementation
  }
}

export default new MyPlugin();
```

## Creating Your First Plugin

### 1. Project Setup

Create a new directory and initialize the project:

```bash
mkdir vibranium-plugin-example
cd vibranium-plugin-example
npm init -y
```

Install dependencies:

```bash
npm install @vibranium/types
npm install -D typescript @types/node
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. Basic Plugin Implementation

Create `src/index.ts`:

```typescript
import { 
  VibraniumPlugin, 
  Step, 
  ExecutionContext, 
  StepResult,
  PluginContext
} from '@vibranium/types';

export class ExamplePlugin implements VibraniumPlugin {
  name = 'example-plugin';
  version = '1.0.0';
  stepTypes = ['example'];

  async initialize(context: PluginContext): Promise<void> {
    console.log(`Initializing ${this.name} v${this.version}`);
    
    // Access plugin configuration
    const config = context.config[this.name];
    if (config) {
      console.log('Plugin configuration:', config);
    }
  }

  async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    const startTime = Date.now();
    
    try {
      if (step.type === 'example') {
        return await this.handleExampleStep(step, context);
      }
      
      throw new Error(`Unsupported step type: ${step.type}`);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timing: {
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async handleExampleStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    // Example step implementation
    const message = step.message || 'Hello from example plugin!';
    
    console.log(`Executing example step: ${step.name}`);
    console.log(`Message: ${message}`);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      data: {
        message,
        timestamp: new Date().toISOString(),
        stepName: step.name
      },
      timing: {
        duration: 100
      }
    };
  }

  async destroy(): Promise<void> {
    console.log(`Shutting down ${this.name}`);
  }
}

export default new ExamplePlugin();
```

### 3. Package Configuration

Update `package.json`:

```json
{
  "name": "vibranium-plugin-example",
  "version": "1.0.0",
  "description": "Example plugin for Vibranium CLI",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "vibranium-plugin",
    "testing",
    "automation"
  ],
  "peerDependencies": {
    "@vibranium/types": "^1.0.0"
  },
  "vibranium": {
    "plugin": true,
    "stepTypes": ["example"],
    "validationOperators": [],
    "reportFormats": []
  }
}
```

### 4. Build and Test

Build the plugin:

```bash
npm run build
```

## Advanced Plugin Features

### Custom Validation Operators

Add custom validation logic to your plugin:

```typescript
export class AdvancedPlugin implements VibraniumPlugin {
  name = 'advanced-plugin';
  validationOperators = ['business_rule', 'custom_format'];

  executeValidation(
    identifier: string, 
    operator: string, 
    expected: any, 
    actual: any
  ): boolean {
    switch (operator) {
      case 'business_rule':
        return this.validateBusinessRule(expected, actual);
      case 'custom_format':
        return this.validateCustomFormat(expected, actual);
      default:
        return false;
    }
  }

  private validateBusinessRule(rule: string, value: any): boolean {
    switch (rule) {
      case 'valid_user_status':
        return ['active', 'pending', 'suspended'].includes(value);
      case 'business_hours':
        const hour = new Date().getHours();
        return hour >= 9 && hour <= 17;
      case 'valid_email_domain':
        return typeof value === 'string' && value.endsWith('@company.com');
      default:
        return false;
    }
  }

  private validateCustomFormat(format: string, value: any): boolean {
    switch (format) {
      case 'sku':
        return /^[A-Z]{2}\d{6}$/.test(value);
      case 'product_code':
        return /^PROD-\d{4}-[A-Z]{3}$/.test(value);
      default:
        return false;
    }
  }
}
```

### Report Generation

Create custom report formats:

```typescript
export class ReportPlugin implements VibraniumPlugin {
  name = 'report-plugin';
  reportFormats = ['slack', 'teams', 'email'];

  async generateReport(
    results: ExecutionResults, 
    format: string, 
    options?: any
  ): Promise<string> {
    switch (format) {
      case 'slack':
        return this.generateSlackReport(results, options);
      case 'teams':
        return this.generateTeamsReport(results, options);
      case 'email':
        return this.generateEmailReport(results, options);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  private generateSlackReport(results: ExecutionResults, options?: any): string {
    const color = results.success ? 'good' : 'danger';
    const emoji = results.success ? ':white_check_mark:' : ':x:';
    
    return JSON.stringify({
      text: `${emoji} Test Results: ${results.scenario}`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Status',
              value: results.success ? 'PASSED' : 'FAILED',
              short: true
            },
            {
              title: 'Duration',
              value: `${results.duration}ms`,
              short: true
            },
            {
              title: 'Steps',
              value: `${results.passed}/${results.total}`,
              short: true
            },
            {
              title: 'Environment',
              value: results.environment,
              short: true
            }
          ],
          footer: 'Vibranium CLI',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    });
  }

  private generateTeamsReport(results: ExecutionResults, options?: any): string {
    const color = results.success ? '00FF00' : 'FF0000';
    
    return JSON.stringify({
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": color,
      "summary": `Test Results: ${results.scenario}`,
      "sections": [
        {
          "activityTitle": `Test Results: ${results.scenario}`,
          "activitySubtitle": `Environment: ${results.environment}`,
          "facts": [
            {
              "name": "Status",
              "value": results.success ? "PASSED" : "FAILED"
            },
            {
              "name": "Duration",
              "value": `${results.duration}ms`
            },
            {
              "name": "Steps",
              "value": `${results.passed}/${results.total}`
            }
          ]
        }
      ]
    });
  }

  private generateEmailReport(results: ExecutionResults, options?: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Results: ${results.scenario}</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background-color: ${results.success ? '#4CAF50' : '#f44336'}; color: white; padding: 20px; }
        .content { padding: 20px; }
        .summary { background-color: #f5f5f5; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Results: ${results.scenario}</h1>
        <p>Status: ${results.success ? 'PASSED' : 'FAILED'}</p>
    </div>
    <div class="content">
        <div class="summary">
            <h3>Summary</h3>
            <p><strong>Environment:</strong> ${results.environment}</p>
            <p><strong>Duration:</strong> ${results.duration}ms</p>
            <p><strong>Steps:</strong> ${results.passed}/${results.total}</p>
        </div>
    </div>
</body>
</html>`;
  }
}
```

### Lifecycle Hooks

Handle plugin lifecycle events:

```typescript
export class LifecyclePlugin implements VibraniumPlugin {
  name = 'lifecycle-plugin';
  private connections: Map<string, any> = new Map();

  async initialize(context: PluginContext): Promise<void> {
    console.log('Plugin initializing...');
    
    // Setup resources, connections, etc.
    const config = context.config[this.name];
    if (config?.database) {
      // Initialize database connection
      const db = await this.connectToDatabase(config.database);
      this.connections.set('database', db);
    }
  }

  async beforeScenario(scenario: Scenario, context: ExecutionContext): Promise<void> {
    console.log(`Starting scenario: ${scenario.name}`);
    
    // Log scenario start to external system
    await this.logEvent('scenario_start', {
      scenarioName: scenario.name,
      environment: context.environment,
      timestamp: new Date().toISOString()
    });
  }

  async afterScenario(
    scenario: Scenario, 
    result: ScenarioResult, 
    context: ExecutionContext
  ): Promise<void> {
    console.log(`Completed scenario: ${scenario.name} - ${result.success ? 'PASSED' : 'FAILED'}`);
    
    // Log scenario completion
    await this.logEvent('scenario_complete', {
      scenarioName: scenario.name,
      success: result.success,
      duration: result.duration,
      environment: context.environment,
      timestamp: new Date().toISOString()
    });
  }

  async beforeStep(step: Step, context: ExecutionContext): Promise<void> {
    console.log(`Executing step: ${step.name}`);
  }

  async afterStep(
    step: Step, 
    result: StepResult, 
    context: ExecutionContext
  ): Promise<void> {
    console.log(`Step ${step.name} ${result.success ? 'passed' : 'failed'}`);
    
    // Store step metrics
    if (result.timing) {
      await this.recordMetric('step_duration', result.timing.duration, {
        stepName: step.name,
        stepType: step.type,
        success: result.success
      });
    }
  }

  async destroy(): Promise<void> {
    console.log('Plugin shutting down...');
    
    // Clean up all connections
    for (const [name, connection] of this.connections) {
      console.log(`Closing connection: ${name}`);
      if (connection.close) {
        await connection.close();
      }
    }
    this.connections.clear();
  }

  private async connectToDatabase(config: any): Promise<any> {
    // Database connection logic
    return { connection: 'mock' };
  }

  private async logEvent(type: string, data: any): Promise<void> {
    // External logging logic
    console.log(`Event: ${type}`, data);
  }

  private async recordMetric(name: string, value: number, tags: any): Promise<void> {
    // Metrics recording logic
    console.log(`Metric: ${name} = ${value}`, tags);
  }
}
```

## Plugin Testing

### Unit Tests

Create comprehensive tests for your plugin:

```typescript
// tests/plugin.test.ts
import { ExamplePlugin } from '../src';
import { Step, ExecutionContext } from '@vibranium/types';

describe('ExamplePlugin', () => {
  let plugin: ExamplePlugin;

  beforeEach(() => {
    plugin = new ExamplePlugin();
  });

  describe('executeStep', () => {
    it('should handle example steps', async () => {
      const step: Step = {
        name: 'test-step',
        type: 'example',
        message: 'Test message'
      };

      const context: ExecutionContext = {
        scenario: { name: 'test-scenario' },
        environment: 'test',
        variables: {}
      };

      const result = await plugin.executeStep(step, context);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Test message');
      expect(result.data.stepName).toBe('test-step');
    });

    it('should handle unsupported step types', async () => {
      const step: Step = {
        name: 'test-step',
        type: 'unsupported'
      };

      const context: ExecutionContext = {
        scenario: { name: 'test-scenario' },
        environment: 'test',
        variables: {}
      };

      const result = await plugin.executeStep(step, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported step type');
    });
  });
});
```

### Integration Tests

Test your plugin with actual Vibranium CLI scenarios:

```yaml
# tests/scenarios/plugin-test.yaml
name: plugin_integration_test
description: "Test custom plugin functionality"
steps:
  - name: example_step
    type: example
    message: "Integration test message"
    expect:
      - identifier: "$.response.data.message"
        operator: equals
        expected: "Integration test message"
      - identifier: "$.response.data.stepName"
        operator: equals
        expected: "example_step"
```

## Publishing Your Plugin

### 1. Prepare for Publishing

Ensure your plugin is ready:

```bash
# Build the plugin
npm run build

# Run tests
npm test

# Check package contents
npm pack --dry-run
```

### 2. Publish to npm

```bash
# Login to npm
npm login

# Publish the plugin
npm publish
```

### 3. Document Your Plugin

Create comprehensive documentation:

```markdown
# My Vibranium Plugin

Description of what your plugin does.

## Installation

```bash
npm install vibranium-plugin-example
```

## Configuration

```json
{
  "plugins": {
    "enabled": ["vibranium-plugin-example"],
    "config": {
      "vibranium-plugin-example": {
        "option1": "value1",
        "option2": "value2"
      }
    }
  }
}
```

## Usage

```yaml
steps:
  - name: example_step
    type: example
    message: "Hello, World!"
```
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
  const startTime = Date.now();
  
  try {
    const result = await this.performAction(step, context);
    return {
      success: true,
      data: result,
      timing: { duration: Date.now() - startTime }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timing: { duration: Date.now() - startTime }
    };
  }
}
```

### 2. Configuration Validation

Validate plugin configuration:

```typescript
async initialize(context: PluginContext): Promise<void> {
  const config = context.config[this.name];
  
  if (!config) {
    throw new Error(`Configuration required for ${this.name}`);
  }
  
  this.validateConfig(config);
}

private validateConfig(config: any): void {
  if (!config.requiredField) {
    throw new Error('requiredField is mandatory');
  }
  
  if (config.timeout && config.timeout < 1000) {
    throw new Error('timeout must be at least 1000ms');
  }
}
```

### 3. Resource Management

Properly manage resources:

```typescript
export class ResourceAwarePlugin implements VibraniumPlugin {
  private resources: Array<{ name: string; cleanup: () => Promise<void> }> = [];

  async initialize(context: PluginContext): Promise<void> {
    const connection = await this.createConnection();
    this.resources.push({
      name: 'database',
      cleanup: () => connection.close()
    });
  }

  async destroy(): Promise<void> {
    await Promise.all(
      this.resources.map(resource => resource.cleanup())
    );
    this.resources = [];
  }
}
```

### 4. Type Safety

Use TypeScript effectively:

```typescript
interface CustomStepConfig {
  action: 'send' | 'receive' | 'process';
  target: string;
  payload?: any;
  timeout?: number;
}

interface CustomStepResult {
  actionPerformed: string;
  target: string;
  responseTime: number;
}

async executeStep(
  step: Step & { config: CustomStepConfig }, 
  context: ExecutionContext
): Promise<StepResult<CustomStepResult>> {
  // Type-safe implementation
}
```

For more examples and advanced patterns, see the [Plugin Overview](/plugins/overview).