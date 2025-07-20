# Plugin System Overview

Vibranium CLI features a powerful plugin architecture that allows you to extend its capabilities beyond basic API testing. The plugin system enables custom step types, validation operators, report formats, and integration with external tools.

## Architecture

The plugin system is built around a simple interface that allows plugins to:

- **Register new step types** (e.g., `ui`, `database`, `webhook`)
- **Add custom validation operators** (e.g., `custom_business_rule`)
- **Provide report generators** (e.g., `slack`, `email`, `custom-html`)
- **Hook into the execution lifecycle** (e.g., setup, teardown, monitoring)

### Plugin Interface

```typescript
export interface VibraniumPlugin {
  name: string;                    // Plugin identifier
  version: string;                 // Plugin version
  stepTypes?: string[];            // Step types this plugin handles
  validationOperators?: string[];  // Custom validation operators
  reportFormats?: string[];        // Custom report formats
  
  // Lifecycle methods
  initialize?(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;
  
  // Step execution
  executeStep?(step: Step, context: ExecutionContext): Promise<StepResult>;
  
  // Validation
  validateStep?(step: Step): ValidationResult[];
  executeValidation?(identifier: string, operator: string, expected: any, actual: any): boolean;
  
  // Reporting
  generateReport?(results: ExecutionResults, format: string): Promise<string>;
}
```

## Core Plugins

Vibranium CLI includes several core plugins that provide essential functionality:

### API Plugin

The built-in API plugin handles HTTP requests and is always available.

**Step Types:** `api`

**Features:**
- All HTTP methods (GET, POST, PUT, PATCH, DELETE, etc.)
- Authentication (Bearer, Basic, API Key, OAuth)
- Multiple content types (JSON, XML, Form Data, Multipart)
- Request/response interceptors
- Retry logic and timeout handling

**Example:**
```yaml
- name: api_request
  type: api
  method: POST
  url: "{{$.env.API_URL}}/users"
  body:
    name: "John Doe"
    email: "john@example.com"
```

### Validation Plugin

Provides comprehensive validation operators for response testing.

**Operators:** `equals`, `contains`, `regex`, `gt`, `lt`, `type`, `exists`, `schema`, etc.

**Example:**
```yaml
expect:
  - identifier: "$.response.body.email"
    operator: regex
    expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
```

### Report Plugin

Generates various report formats from execution results.

**Formats:** `html`, `json`, `junit`, `markdown`

**Example:**
```bash
vm run scenario.yaml --report html --report junit
```

## Available Third-Party Plugins

### UI Testing Plugin <span class="badge beta">Beta</span>

Extends Vibranium CLI with browser automation capabilities using Playwright.

**Package:** `@vibranium/ui-testing`

**Step Types:** `ui`

**Features:**
- Browser automation (Chrome, Firefox, Safari)
- Element interactions (click, type, select)
- Assertions (visible, hidden, text content)
- Screenshot capture
- Mobile device emulation

**Installation:**
```bash
npm install @vibranium/ui-testing
```

**Configuration:**
```json
{
  "plugins": {
    "enabled": ["@vibranium/ui-testing"],
    "config": {
      "@vibranium/ui-testing": {
        "browser": "chromium",
        "headless": true,
        "viewport": {
          "width": 1920,
          "height": 1080
        }
      }
    }
  }
}
```

**Example:**
```yaml
steps:
  - name: login_ui
    type: ui
    action: goto
    url: "{{$.env.APP_URL}}/login"
  
  - name: enter_credentials
    type: ui
    action: type
    selector: "#email"
    text: "{{$.env.USER_EMAIL}}"
  
  - name: click_login
    type: ui
    action: click
    selector: "#login-button"
  
  - name: verify_dashboard
    type: ui
    action: waitFor
    selector: "#dashboard"
    expect:
      - identifier: "$.ui.element.visible"
        operator: equals
        expected: true
```

### Database Plugin <span class="badge beta">Beta</span>

Enables database operations and validations.

**Package:** `@vibranium/database`

**Step Types:** `database`, `sql`

**Features:**
- Multiple database support (PostgreSQL, MySQL, MongoDB)
- SQL query execution
- Data validation
- Transaction support
- Connection pooling

**Example:**
```yaml
steps:
  - name: verify_user_in_db
    type: database
    connection: "postgres://localhost/testdb"
    query: "SELECT * FROM users WHERE email = $1"
    parameters: ["{{$.api_response.body.email}}"]
    expect:
      - identifier: "$.database.rows"
        operator: length
        expected: 1
      - identifier: "$.database.rows[0].status"
        operator: equals
        expected: "active"
```

### Performance Plugin <span class="badge beta">Beta</span>

Advanced performance testing and monitoring.

**Package:** `@vibranium/performance`

**Step Types:** `load`, `stress`

**Features:**
- Load testing with configurable concurrency
- Response time percentile analysis
- Memory and CPU monitoring
- Custom performance metrics
- Real-time dashboards

**Example:**
```yaml
steps:
  - name: load_test_api
    type: load
    target: "{{$.env.API_URL}}/users"
    duration: 60
    rps: 100
    expect:
      - identifier: "$.performance.p95"
        operator: lt
        expected: 500
      - identifier: "$.performance.errorRate"
        operator: lt
        expected: 0.01
```

### Webhook Plugin

HTTP webhook notifications and integrations.

**Package:** `@vibranium/webhook`

**Step Types:** `webhook`, `notify`

**Example:**
```yaml
steps:
  - name: notify_slack
    type: webhook
    url: "{{$.env.SLACK_WEBHOOK_URL}}"
    method: POST
    body:
      text: "Test {{$.context.name}} completed with {{$.context.status}}"
```

## Plugin Management

### Installing Plugins

```bash
# Install from npm
vm plugin install @vibranium/ui-testing

# Install specific version
vm plugin install @vibranium/database@1.2.0

# Install from local path
vm plugin install ./my-custom-plugin

# Install from git
vm plugin install git+https://github.com/company/vibranium-plugin.git
```

### Listing Plugins

```bash
# List installed plugins
vm plugin list

# List available plugins
vm plugin list --available

# Show plugin details
vm plugin info @vibranium/ui-testing
```

### Configuring Plugins

Add plugin configuration to `vibranium.config.json`:

```json
{
  "plugins": {
    "enabled": [
      "@vibranium/api",
      "@vibranium/ui-testing",
      "@vibranium/database"
    ],
    "config": {
      "@vibranium/ui-testing": {
        "browser": "chromium",
        "headless": false,
        "slowMo": 100,
        "viewport": {
          "width": 1920,
          "height": 1080
        },
        "recordVideo": true,
        "recordTrace": true
      },
      "@vibranium/database": {
        "connections": {
          "default": "postgres://localhost/testdb",
          "analytics": "mongodb://localhost/analytics"
        },
        "timeout": 30000
      }
    }
  }
}
```

### Plugin Discovery

Vibranium CLI automatically discovers plugins in several ways:

1. **npm packages** with `vibranium-plugin` keyword
2. **Local plugins** in `./plugins/` directory
3. **Explicitly configured** plugins in configuration file

## Creating Custom Plugins

### Basic Plugin Structure

Create a new plugin by implementing the `VibraniumPlugin` interface:

```typescript
// my-plugin.ts
import { VibraniumPlugin, Step, ExecutionContext, StepResult } from '@vibranium/types';

export class MyCustomPlugin implements VibraniumPlugin {
  name = 'my-custom-plugin';
  version = '1.0.0';
  stepTypes = ['custom'];

  async initialize(context: PluginContext): Promise<void> {
    console.log('Initializing my custom plugin');
  }

  async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    if (step.type === 'custom') {
      // Implement custom step logic
      const result = await this.handleCustomStep(step, context);
      return result;
    }
    
    throw new Error(`Unsupported step type: ${step.type}`);
  }

  private async handleCustomStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    // Your custom implementation
    return {
      success: true,
      data: { message: 'Custom step executed' },
      timing: { duration: 100 }
    };
  }
}

// Export plugin
export default new MyCustomPlugin();
```

### Plugin Package Structure

```
my-vibranium-plugin/
├── package.json
├── src/
│   ├── index.ts
│   ├── step-handler.ts
│   └── validator.ts
├── tests/
│   └── plugin.test.ts
└── README.md
```

**package.json:**
```json
{
  "name": "@company/vibranium-custom-plugin",
  "version": "1.0.0",
  "description": "Custom plugin for Vibranium CLI",
  "keywords": ["vibranium-plugin", "testing", "automation"],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@vibranium/types": "^1.0.0"
  },
  "vibranium": {
    "plugin": true,
    "stepTypes": ["custom"],
    "validationOperators": ["custom_validator"]
  }
}
```

### Advanced Plugin Features

#### Custom Validation Operators

```typescript
export class MyPlugin implements VibraniumPlugin {
  validationOperators = ['business_rule'];

  executeValidation(identifier: string, operator: string, expected: any, actual: any): boolean {
    if (operator === 'business_rule') {
      return this.validateBusinessRule(expected, actual);
    }
    return false;
  }

  private validateBusinessRule(rule: string, value: any): boolean {
    // Implement business logic validation
    switch (rule) {
      case 'valid_email_domain':
        return value.endsWith('@company.com');
      case 'working_hours':
        const hour = new Date().getHours();
        return hour >= 9 && hour <= 17;
      default:
        return false;
    }
  }
}
```

#### Custom Report Formats

```typescript
export class MyPlugin implements VibraniumPlugin {
  reportFormats = ['slack', 'teams'];

  async generateReport(results: ExecutionResults, format: string): Promise<string> {
    if (format === 'slack') {
      return this.generateSlackReport(results);
    }
    if (format === 'teams') {
      return this.generateTeamsReport(results);
    }
    throw new Error(`Unsupported format: ${format}`);
  }

  private generateSlackReport(results: ExecutionResults): string {
    // Generate Slack-formatted report
    return JSON.stringify({
      text: `Test Results: ${results.passed}/${results.total} passed`,
      attachments: [
        {
          color: results.success ? 'good' : 'danger',
          fields: [
            { title: 'Scenario', value: results.scenarioName, short: true },
            { title: 'Duration', value: `${results.duration}ms`, short: true }
          ]
        }
      ]
    });
  }
}
```

#### Lifecycle Hooks

```typescript
export class MyPlugin implements VibraniumPlugin {
  async initialize(context: PluginContext): Promise<void> {
    // Setup resources, connections, etc.
    console.log('Plugin initializing...');
  }

  async destroy(): Promise<void> {
    // Cleanup resources
    console.log('Plugin shutting down...');
  }

  // Hook into execution lifecycle
  async beforeScenario(scenario: Scenario): Promise<void> {
    console.log(`Starting scenario: ${scenario.name}`);
  }

  async afterScenario(scenario: Scenario, result: ScenarioResult): Promise<void> {
    console.log(`Completed scenario: ${scenario.name} - ${result.success ? 'PASSED' : 'FAILED'}`);
  }
}
```

## Plugin Best Practices

### 1. Error Handling

```typescript
async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
  try {
    const result = await this.performAction(step);
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

```typescript
async initialize(context: PluginContext): Promise<void> {
  const config = context.config[this.name];
  
  if (!config) {
    throw new Error(`Configuration required for ${this.name}`);
  }
  
  if (!config.apiKey) {
    throw new Error('API key is required');
  }
  
  // Validate configuration
  this.validateConfig(config);
}
```

### 3. Resource Management

```typescript
export class MyPlugin implements VibraniumPlugin {
  private connections: Map<string, Connection> = new Map();

  async initialize(context: PluginContext): Promise<void> {
    // Initialize connections
  }

  async destroy(): Promise<void> {
    // Clean up all connections
    for (const [name, connection] of this.connections) {
      await connection.close();
    }
    this.connections.clear();
  }
}
```

### 4. Type Safety

```typescript
interface CustomStepConfig {
  action: 'send' | 'receive' | 'process';
  target: string;
  payload?: any;
  timeout?: number;
}

async executeStep(step: Step & { config: CustomStepConfig }, context: ExecutionContext): Promise<StepResult> {
  // Type-safe step execution
}
```

For detailed plugin development instructions, see the [Plugin Development Guide](/plugins/development).