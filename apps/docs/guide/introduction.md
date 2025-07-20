# Introduction

Vibranium CLI is a modern, developer-centric API testing framework that brings the power of scenario-driven testing to your development workflow. Built with TypeScript, Nx, and Ink, it provides both an interactive terminal interface and a robust headless execution mode.

## What is Vibranium CLI?

Vibranium CLI allows you to write comprehensive API test scenarios using YAML or JSON files, execute them with powerful variable interpolation, and validate responses with a rich assertion system. It's designed for modern development teams who need fast, reliable, and maintainable API testing.

## Key Features

### 🎯 Scenario-Driven Testing
Write test scenarios that describe complete workflows, not just individual API calls:

```yaml
name: e2e_checkout_flow
description: "Complete checkout process testing"
steps:
  - name: create_user
    type: api
    method: POST
    url: "{{$.env.API_URL}}/users"
    # ... user creation logic

  - name: add_to_cart
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: POST
    url: "{{$.env.API_URL}}/cart"
    headers:
      Authorization: "Bearer {{$.user.response.body.token}}"
    # ... cart logic

  - name: checkout
    type: api
    dependsOn:
      - api: add_to_cart
        as: cart
    method: POST
    url: "{{$.env.API_URL}}/checkout"
    # ... checkout logic
```

### 🔗 Powerful Variable System
Use dot-notation variables to access data from any part of your scenario:

- `$.env.*` - Environment variables
- `$.global.*` - Global configuration
- `$.response.*` - Current step response
- `$.random.*` - Generated test data
- `$.<alias>.*` - Data from dependent steps

### ⚡ Modern Development Experience
- **Interactive UI**: Beautiful terminal interface with live editing
- **TypeScript**: Full type safety and IntelliSense support
- **Nx Monorepo**: Scalable architecture with caching and task orchestration
- **Vite**: Lightning-fast builds and hot module replacement

### 🧩 Extensible Architecture
Plugin system that supports:
- Custom step types (UI testing, database operations, etc.)
- Custom validation operators
- Custom report formats
- Integration with existing tools

## Architecture Overview

Vibranium CLI is built as a monorepo with several focused packages:

```
vibranium/
├── packages/
│   ├── core/           # Execution engine
│   ├── cli/            # Terminal UI & CLI commands
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Shared utilities
│   ├── plugins/        # Plugin system
│   └── http-client/    # HTTP abstraction layer
├── apps/
│   ├── examples/       # Example scenarios
│   └── docs/           # This documentation site
```

## Use Cases

### API Testing & Validation
- REST API endpoint testing
- GraphQL query validation
- WebSocket connection testing
- Authentication flow verification

### Integration Testing
- Multi-service workflow testing
- Database state validation
- Third-party API integration
- Microservice communication testing

### Performance & Load Testing
- Response time validation
- Concurrent request handling
- Rate limiting verification
- Stress testing scenarios

### Development Workflows
- Local development testing
- CI/CD pipeline integration
- Environment smoke testing
- Regression test automation

## Comparison with Other Tools

| Feature | Vibranium CLI | Postman | Newman | Jest + Supertest |
|---------|---------------|---------|---------|------------------|
| Scenario-driven | ✅ | ❌ | ❌ | ❌ |
| Interactive UI | ✅ | ✅ | ❌ | ❌ |
| Type Safety | ✅ | ❌ | ❌ | ✅ |
| Version Control | ✅ | ❌ | ✅ | ✅ |
| Plugin System | ✅ | ✅ | ❌ | ✅ |
| Variable System | ✅ | ✅ | ✅ | ❌ |
| Dependency Management | ✅ | ❌ | ❌ | ❌ |
| Modern Tooling | ✅ | ❌ | ❌ | ✅ |

## Next Steps

Ready to get started? Here's what to do next:

1. **[Install Vibranium CLI](/guide/installation)** - Get up and running in minutes
2. **[Quick Start Guide](/guide/getting-started)** - Create your first scenario
3. **[Writing Scenarios](/guide/writing-scenarios)** - Learn the scenario syntax
4. **[Examples](/examples/basic-testing)** - See real-world use cases

## Community & Support

- **GitHub**: [sarathm09/vibranium](https://github.com/sarathm09/vibranium)
- **Issues**: [Report bugs or request features](https://github.com/sarathm09/vibranium/issues)
- **Discussions**: [Community discussions and Q&A](https://github.com/sarathm09/vibranium/discussions)

Vibranium CLI is open source and welcomes contributions from the community!