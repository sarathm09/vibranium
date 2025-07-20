# Vibranium CLI

[![npm version](https://badge.fury.io/js/@vibraniumjs/cli.svg)](https://www.npmjs.com/package/@vibraniumjs/cli) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

**Modern scenario-driven API testing with blazing-fast performance** 🚀

Vibranium CLI is a powerful, developer-centric test runner that executes complex, shareable scenarios for API testing. Built with TypeScript, Nx, Vite, and Ink for an exceptional developer experience.

## ✨ Key Features

- **📝 Scenario-driven Testing** - Write tests in YAML/JSON with intuitive syntax
- **🔗 Dot-notation Variables** - Dynamic variable system (`$.env`, `$.response`, `$.random`)
- **🖥️ Interactive Terminal UI** - Beautiful three-pane interface with Ink
- **⚡ Blazing Fast** - Parallel execution with Vite-powered builds
- **🔌 Plugin Architecture** - Extensible for API, UI, and performance testing
- **📊 Rich Reports** - HTML, JSON, and JUnit formats
- **🌍 Environment Management** - Easy switching between environments
- **🎯 Type Safe** - Full TypeScript support with strict typing

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g @vibraniumjs/cli

# Or use with npx
npx @vibraniumjs/cli --help
```

### Requirements

- **Node.js 18+** (for modern JavaScript features)
- **TypeScript 5.x** (for development)

### Basic Usage

```bash
# Interactive mode (default)
vibranium

# Run a single scenario
vibranium run scenarios/api-test.yaml --env staging

# Batch execution
vibranium batch scenarios/ --parallel --reporter html

# Initialize new project
vibranium init my-api-tests

# Validate scenarios
vibranium validate scenarios/
```

## 📖 Documentation

### Command Reference

| Command | Description | Examples |
|---------|-------------|----------|
| `vibranium` | Interactive mode with 3-pane UI | `vibranium` |
| `vibranium run <scenario>` | Execute single scenario | `vibranium run api-test.yaml --env prod` |
| `vibranium batch <directory>` | Execute multiple scenarios | `vibranium batch tests/ --parallel` |
| `vibranium init [project]` | Initialize new project | `vibranium init my-tests` |
| `vibranium validate <path>` | Validate scenario files | `vibranium validate scenarios/` |
| `vibranium version` | Show version information | `vibranium version` |

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `--env <environment>` | Environment to use | `local` |
| `--config <path>` | Configuration file path | `./vibranium.config.json` |
| `--reporter <format>` | Report format (html, json, junit) | `console` |
| `--output <path>` | Output directory for reports | `./reports` |
| `--parallel` | Enable parallel execution | `false` |
| `--max-concurrency <n>` | Max parallel scenarios | `4` |
| `--verbose` | Verbose output | `false` |
| `--debug` | Debug mode | `false` |
| `--no-colors` | Disable colored output | `false` |

## 📝 Writing Scenarios

### Basic Scenario Structure

```yaml
name: user_management_flow
description: "Complete user CRUD operations"

# Lifecycle hooks
lifecycle:
  onStart: logger.info("Starting user tests")
  onEnd: logger.info("User tests completed")

# Step dependencies
dependsOn:
  - api: create_user
    as: user

# Test steps
steps:
  - name: create_user
    type: api
    method: POST
    url: "{{$.env.API_URL}}/users"
    headers:
      Content-Type: application/json
      Authorization: "Bearer {{$.env.API_TOKEN}}"
    body:
      name: "{{$.random.names.first}}"
      email: "{{$.random.email}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
      - identifier: "$.response.body.id"
        operator: exists

  - name: get_user
    type: api
    dependsOn:
      - api: create_user
        as: newUser
    method: GET
    url: "{{$.env.API_URL}}/users/{{$.newUser.response.body.id}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.name"
        operator: equals
        expected: "{{$.newUser.response.body.name}}"
```

### Variable System

Vibranium supports a powerful dot-notation variable system:

| Namespace | Description | Example |
|-----------|-------------|---------|
| `$.env` | Environment variables | `{{$.env.API_URL}}` |
| `$.global` | Global configuration | `{{$.global.timeout}}` |
| `$.context` | Execution context | `{{$.context.executionId}}` |
| `$.response` | Previous step responses | `{{$.response.StepName.body.id}}` |
| `$.request` | Current request data | `{{$.request.url}}` |
| `$.api` | Current step definition | `{{$.api.name}}` |
| `$.random` | Random data generators | `{{$.random.uuid}}` |
| `$.<alias>` | Aliased step results | `{{$.user.response.body.token}}` |

### Validation Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Strict equality | `expected: 200` |
| `contains` | String/array contains | `expected: "success"` |
| `regex` | Regular expression | `expected: "^[a-zA-Z0-9]+$"` |
| `type` | Type checking | `expected: "string"` |
| `exists` | Non-undefined check | `expected: true` |
| `in` | Value in array | `expected: [200, 201, 204]` |
| `gt` / `lt` | Numeric comparison | `expected: 100` |
| `length` | Length equals | `expected: 5` |
| `schema` | JSON Schema validation | `expected: "./schemas/user.json"` |

### Environment Configuration

**environments/local.json**
```json
{
  "environment": "local",
  "variables": {
    "API_URL": "http://localhost:3000/api",
    "TIMEOUT": 5000
  },
  "secrets": {
    "API_TOKEN": "$.env.LOCAL_API_TOKEN"
  }
}
```

**environments/staging.json**
```json
{
  "environment": "staging",
  "variables": {
    "API_URL": "https://staging-api.example.com",
    "TIMEOUT": 10000
  },
  "secrets": {
    "API_TOKEN": "$.env.STAGING_API_TOKEN"
  }
}
```

## 🎨 Interactive Mode

Launch the interactive UI with `vibranium` (no arguments):

### Three-Pane Layout

1. **📁 Navigation Tree** - Browse scenarios and steps
2. **📝 Details Pane** - View/edit YAML with syntax highlighting  
3. **📊 Status Bar** - Environment, execution status, shortcuts

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+R` | Run current scenario |
| `Ctrl+E` | Switch environment |
| `Ctrl+B` | Batch run current folder |
| `Ctrl+V` | Toggle variable preview |
| `Ctrl+S` | Save changes |
| `Ctrl+Q` | Quit |
| `Tab` / `Shift+Tab` | Navigate panes |
| `↑` / `↓` | Navigate lists |

## 📊 Reports

### HTML Reports
Rich, interactive reports with step details, timings, and pass/fail indicators.

```bash
vibranium batch scenarios/ --reporter html --output ./reports
```

### JSON Reports  
Machine-readable format for CI/CD integration.

```bash
vibranium run api-test.yaml --reporter json --output ./results
```

### JUnit XML
Compatible with test reporting systems (Jenkins, GitHub Actions, etc.).

```bash
vibranium batch tests/ --reporter junit --output ./test-results
```

## 🔧 Configuration

**vibranium.config.json**
```json
{
  "timeout": 30000,
  "retries": 3,
  "environments": {
    "default": "local",
    "directory": "./environments"
  },
  "logging": {
    "level": "info",
    "colors": true
  },
  "http": {
    "adapter": "got",
    "maxConcurrency": 10
  },
  "reports": {
    "directory": "./reports",
    "formats": ["html", "json"]
  }
}
```

## 🔌 Plugin System

Vibranium features an extensible plugin architecture:

### Core API Plugin
Built-in support for HTTP operations with:
- All HTTP methods (GET, POST, PUT, DELETE, etc.)
- Authentication (Bearer, Basic, API Key)
- Multiple content types (JSON, XML, Form, Multipart)
- Advanced features (retries, timeouts, interceptors)

### Future Plugins
- **UI Testing** - Playwright/Puppeteer integration
- **Performance** - Load testing capabilities  
- **Custom Protocols** - GraphQL, gRPC, WebSocket

## 📁 Project Structure

```
my-api-tests/
├── scenarios/
│   ├── auth/
│   │   ├── login.yaml
│   │   └── logout.yaml
│   ├── users/
│   │   ├── crud-operations.yaml
│   │   └── permissions.yaml
│   └── products/
│       └── catalog.yaml
├── environments/
│   ├── local.json
│   ├── staging.json
│   └── production.json
├── schemas/
│   ├── user-schema.json
│   └── product-schema.json
├── reports/
└── vibranium.config.json
```

## 🌟 Examples

Check out comprehensive examples in the [`apps/examples`](./apps/examples) directory:

- **Basic API Tests** - Simple CRUD operations
- **Authentication Flows** - Token-based auth patterns
- **Complex Workflows** - Multi-step dependent scenarios
- **Validation Examples** - All operator demonstrations
- **Environment Configs** - Different environment setups

## 🛠️ Development

### Prerequisites

- **Node.js 18+** (Required for native fetch and modern ES features)
- **TypeScript 5.x** (For development)
- **npm 8+** (Package manager)

### Getting Started

```bash
# Clone repository
git clone https://github.com/sarathm09/vibranium.git
cd vibranium

# Install dependencies
npm install

# Build packages that currently work
npm run build:working

# Run CLI locally for development (works without building)
npm run dev

# Individual build commands for working packages
npx nx build types && npx nx build http-client && npx nx build ui && npx nx build docs
```

### Local CLI Development (npm link)

To test the CLI commands locally using `vibranium` and `vm` commands:

```bash
# Easy way: Use the convenience script
npm run cli:link

# Manual way:
npm run build:working    # Build dependencies
npx nx build cli         # Build CLI (may have TypeScript errors)
cd packages/cli && npm link

# Now you can use vibranium commands anywhere
vibranium --help
vm run scenarios/basic-api-test.yaml

# When done testing
npm run cli:unlink       # Easy way
# OR
npm unlink -g @vibraniumjs/cli  # Manual way
```

**Development Mode (recommended for testing):**
```bash
# Run CLI directly with tsx (fully working!)
npm run dev -- --help
npm run dev -- version
npm run dev -- run --help
npm run dev -- init my-project

# This runs: npx tsx packages/cli/src/bin/vibranium.ts
# All TypeScript errors have been resolved ✅
```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Build working packages (same as build:working) |
| `npm run build:working` | Build packages that currently work |
| `npm run build:cli` | Build CLI package specifically |
| `npm run dev` | Start CLI in development mode with ts-node |
| `npm run cli:link` | Build dependencies and link CLI globally |
| `npm run cli:unlink` | Remove global CLI link |
| `npm run test` | Run tests for working packages |
| `npm run lint` | Run linting for working packages |
| `npx nx build types` | Build types package individually |
| `npx nx test http-client` | Run tests for HTTP client |
| `nx reset` | Clean Nx cache |

### Individual Package Commands

```bash
# Build specific packages (these work)
npx nx build types        # Build type definitions
npx nx build http-client  # Build HTTP client
npx nx build ui           # Build UI components
npx nx build docs         # Build documentation

# Build packages with issues (require type fixes)
# npx nx build utils      # Has TypeScript errors 
# npx nx build core       # Depends on utils
# npx nx build plugins    # Depends on core
# npx nx build cli        # Depends on all above

# Test specific packages
npx nx test http-client   # Test HTTP client
npx nx test types         # Test type definitions

# Lint specific packages
npx nx lint types         # Lint type definitions
npx nx lint http-client   # Lint HTTP client
```

### Local CLI Testing

**Note**: The CLI package currently has build dependencies that need to be resolved. The following are the intended commands once the build issues are fixed:

```bash
# After building all dependencies, test CLI locally
node packages/cli/dist/bin/vibranium.js --help

# Use the development server (this works)
npx nx serve cli

# Test with sample scenarios (once built)
npx nx serve cli -- run examples/basic-api-test.yaml
```

**Current Status**: 
- ✅ Types, HTTP Client, UI, and Docs packages build successfully
- ⚠️ Utils, Core, Plugins, and CLI packages need TypeScript fixes before building

### Development Workflow

1. **Initial Setup**
   ```bash
   git clone https://github.com/sarathm09/vibranium.git
   cd vibranium
   npm install
   ```

2. **Building for Development**
   ```bash
   # Build packages that currently work
   npx nx build types
   npx nx build http-client
   npx nx build ui
   npx nx build docs
   
   # Note: Other packages need TypeScript fixes before building
   # npx nx build utils && npx nx build core && npx nx build plugins && npx nx build cli
   ```

3. **Running Tests**
   ```bash
   # Run tests for packages that build successfully
   npx nx test types
   npx nx test http-client
   
   # Other packages need to be built first
   # npx nx test utils
   # npx nx test core
   ```

4. **Development Testing**
   ```bash
   # Start CLI in development mode (works without building)
   npx nx serve cli
   
   # Test CLI functionality (requires building first)
   # node packages/cli/dist/bin/vibranium.js --version
   # node packages/cli/dist/bin/vibranium.js --help
   ```

5. **Code Quality**
   ```bash
   # Lint working packages
   npx nx lint types
   npx nx lint http-client
   npx nx lint ui
   
   # Type check all packages (shows current issues)
   npx nx run-many --target=typecheck --all
   
   # Format code
   npx prettier --write .
   ```

### Troubleshooting Development Issues

#### Build Errors
- **"Cannot find module '@vibraniumjs/types'"**: The types package builds but doesn't generate .d.ts files correctly
- **"Circular dependency detected"**: Fixed by updating core package dependencies  
- **Utils build errors**: TypeScript import errors need to be resolved
- **Nx cache issues**: Clean cache with `nx reset` then rebuild

#### Common Development Commands
```bash
# Full clean and rebuild working packages
nx reset && npm install && npx nx build types && npx nx build http-client && npx nx build ui

# Test working packages
npx nx test types && npx nx test http-client

# Lint working packages  
npx nx lint types && npx nx lint http-client && npx nx lint ui

# Serve CLI for development
npx nx serve cli
```

### Contributing

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Build and test working packages
   npx nx build types && npx nx build http-client && npx nx build ui
   npx nx test types && npx nx test http-client  
   npx nx lint types && npx nx lint http-client && npx nx lint ui
   npx nx run-many --target=typecheck --all
   ```

4. **Submit a pull request**
   - Ensure all tests pass
   - Provide clear description of changes
   - Reference any related issues

### Package Architecture

```
packages/
├── @vibraniumjs/types      # TypeScript type definitions
├── @vibraniumjs/http-client # HTTP client abstraction
├── @vibraniumjs/utils      # Common utilities
├── @vibraniumjs/core       # Execution engine
├── @vibraniumjs/plugins    # Plugin system
├── @vibraniumjs/cli        # CLI interface
└── @vibraniumjs/ui         # Future web GUI
```

## 📋 System Requirements

- **Node.js 18+** (Required for native fetch and latest ES features)
- **TypeScript 5.x** (For development)
- **Memory**: 512MB+ available RAM
- **Storage**: 100MB+ free space
- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full docs](./apps/docs)
- **Examples**: [Example scenarios](./apps/examples)
- **Issues**: [GitHub Issues](https://github.com/sarathm09/vibranium/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sarathm09/vibranium/discussions)

---

**Built with ❤️ by the Vibranium team**

*Scenario-driven testing made simple and powerful* ⚡