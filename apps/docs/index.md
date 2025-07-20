---
layout: home

hero:
  name: "Vibranium CLI"
  text: "Modern API Testing"
  tagline: Scenario-driven testing with TypeScript, Nx, and Ink
  image:
    src: /vibranium-logo.svg
    alt: Vibranium CLI
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Examples
      link: /examples/basic-testing
    - theme: alt
      text: GitHub
      link: https://github.com/sarathm09/vibranium

features:
  - icon: ⚡
    title: Lightning Fast
    details: Built on Vite and Nx for instant feedback and blazing-fast builds. Modern tooling for modern developers.
  
  - icon: 🎯
    title: Scenario-Driven
    details: Write comprehensive test scenarios in YAML/JSON with powerful dot-notation variables and dependency management.
  
  - icon: 🔧
    title: Developer Experience
    details: Interactive terminal UI with Ink, intelligent auto-completion, and real-time variable preview.
  
  - icon: 🧩
    title: Extensible
    details: Plugin architecture supporting API testing today, UI testing tomorrow. Add custom step types and validation operators.
  
  - icon: 📊
    title: Rich Reporting
    details: Multiple output formats including HTML, JSON, JUnit XML. Perfect for CI/CD integration.
  
  - icon: 🔐
    title: Enterprise Ready
    details: Environment management, secret handling, authentication flows, and comprehensive validation system.
---

## Quick Start

Install Vibranium CLI globally:

```bash
npm install -g vibranium-cli
```

Create your first scenario:

```yaml
name: api_health_check
description: "Basic API health check"
steps:
  - name: health_endpoint
    type: api
    method: GET
    url: "{{$.env.API_URL}}/health"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.status"
        operator: equals
        expected: "healthy"
```

Run it:

```bash
vm run health-check.yaml --env production
```

## Why Vibranium CLI?

Vibranium CLI brings modern development practices to API testing:

- **Type-Safe**: Full TypeScript support with strict typing
- **Monorepo Ready**: Built with Nx for scalable development
- **Interactive UI**: Beautiful terminal interface with Ink
- **Variable System**: Powerful dot-notation variables (`$.env`, `$.response`, `$.random`)
- **Validation**: Comprehensive assertion system with JSON Schema support
- **Plugin Architecture**: Extensible for future UI testing and custom workflows

## Example Workflow

```yaml
name: user_registration_flow
description: "Complete user registration and verification"
steps:
  - name: register_user
    type: api
    method: POST
    url: "{{$.env.API_URL}}/auth/register"
    body:
      email: "{{$.random.email}}"
      password: "{{$.random.password}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201

  - name: verify_user
    type: api
    method: POST
    url: "{{$.env.API_URL}}/auth/verify"
    headers:
      Authorization: "Bearer {{$.register_user.response.body.token}}"
    body:
      verification_code: "{{$.register_user.response.body.verification_code}}"
    expect:
      - identifier: "$.response.body.verified"
        operator: equals
        expected: true
```

## What's Next?

<div class="vp-doc">

| Topic | Description |
|-------|-------------|
| [Getting Started](/guide/getting-started) | Installation and first steps |
| [Writing Scenarios](/guide/writing-scenarios) | Complete scenario syntax guide |
| [Variable System](/guide/variables) | Powerful dot-notation variables |
| [Plugin Development](/plugins/development) | Extend Vibranium with custom plugins |
| [Examples](/examples/basic-testing) | Real-world testing scenarios |

</div>