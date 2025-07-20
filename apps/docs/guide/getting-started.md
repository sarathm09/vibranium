# Getting Started

This guide will walk you through creating your first Vibranium CLI scenario and understanding the basic concepts.

## Your First Scenario

Let's create a simple API health check scenario to get you started.

### 1. Create a Scenario File

Create a file named `health-check.yaml`:

```yaml
name: api_health_check
description: "Basic API health check scenario"
steps:
  - name: health_endpoint
    type: api
    method: GET
    url: "https://httpbin.org/status/200"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
```

### 2. Run the Scenario

Execute your scenario using the CLI:

```bash
vm run health-check.yaml
```

You should see output similar to:

```
✅ api_health_check completed successfully
├─ ✅ health_endpoint (GET https://httpbin.org/status/200)
   └─ ✅ $.response.status equals 200
```

Congratulations! You've just run your first Vibranium CLI scenario.

## Understanding the Scenario Structure

Let's break down the scenario file:

```yaml
name: api_health_check              # Scenario identifier
description: "Basic API health check scenario"  # Human-readable description
steps:                              # Array of steps to execute
  - name: health_endpoint           # Step identifier
    type: api                       # Step type (api, ui, etc.)
    method: GET                     # HTTP method
    url: "https://httpbin.org/status/200"  # Request URL
    expect:                         # Validation rules
      - identifier: "$.response.status"   # What to check
        operator: equals                   # How to check
        expected: 200                      # Expected value
```

## Interactive Mode

Launch the interactive terminal UI for a richer experience:

```bash
vm
```

This opens a three-pane interface:
- **Left**: File tree navigation
- **Center**: Scenario editor with syntax highlighting
- **Right**: Variable preview and execution status

Use keyboard shortcuts:
- `↑/↓` - Navigate files
- `Enter` - Open/edit file
- `Ctrl+R` - Run current scenario
- `Ctrl+E` - Switch environment
- `Ctrl+Q` - Quit

## Using Variables

Variables make scenarios dynamic and reusable. Here's an example with environment variables:

### 1. Create an Environment File

Create `environments/local.json`:

```json
{
  "environment": "local",
  "variables": {
    "API_URL": "https://httpbin.org",
    "TIMEOUT": 5000
  }
}
```

### 2. Update Your Scenario

Modify `health-check.yaml` to use variables:

```yaml
name: api_health_check
description: "Health check with environment variables"
steps:
  - name: health_endpoint
    type: api
    method: GET
    url: "{{$.env.API_URL}}/status/200"
    timeout: "{{$.env.TIMEOUT}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
```

### 3. Run with Environment

```bash
vm run health-check.yaml --env local
```

## Working with Response Data

You can use data from one step in subsequent steps:

```yaml
name: user_workflow
description: "Create user and fetch profile"
steps:
  - name: create_user
    type: api
    method: POST
    url: "https://httpbin.org/post"
    body:
      name: "John Doe"
      email: "john@example.com"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200

  - name: get_user_echo
    type: api
    method: GET
    url: "https://httpbin.org/get"
    headers:
      User-ID: "{{$.create_user.response.body.json.name}}"
    expect:
      - identifier: "$.response.headers.User-ID"
        operator: equals
        expected: "John Doe"
```

## Random Data Generation

Generate realistic test data using the built-in random generators:

```yaml
name: user_registration
description: "Register user with random data"
steps:
  - name: register_user
    type: api
    method: POST
    url: "https://httpbin.org/post"
    body:
      name: "{{$.random.name}}"
      email: "{{$.random.email}}"
      age: "{{$.random.number(18, 65)}}"
      bio: "{{$.random.lorem(50)}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.json.email"
        operator: regex
        expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
```

## Validation Examples

Vibranium CLI supports many validation operators:

```yaml
name: validation_examples
description: "Demonstrate various validation operators"
steps:
  - name: complex_validation
    type: api
    method: GET
    url: "https://httpbin.org/json"
    expect:
      # Status code validation
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      
      # Type validation
      - identifier: "$.response.body.slideshow"
        operator: type
        expected: "object"
      
      # String contains validation
      - identifier: "$.response.body.slideshow.title"
        operator: contains
        expected: "Sample"
      
      # Array length validation
      - identifier: "$.response.body.slideshow.slides"
        operator: length
        expected: 2
      
      # Numeric comparison
      - identifier: "$.response.headers.Content-Length"
        operator: gt
        expected: 100
      
      # Value in set
      - identifier: "$.response.status"
        operator: in
        expected: [200, 201, 202]
```

## Error Handling

When a step fails, Vibranium CLI provides detailed error information:

```yaml
name: intentional_failure
description: "Scenario that demonstrates error handling"
steps:
  - name: will_fail
    type: api
    method: GET
    url: "https://httpbin.org/status/404"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200  # This will fail since we get 404
```

Running this scenario will show:

```
❌ intentional_failure failed
├─ ❌ will_fail (GET https://httpbin.org/status/404)
   └─ ❌ $.response.status equals 200
      Expected: 200
      Actual: 404
```

## Configuration

Initialize a configuration file for your project:

```bash
vm init
```

This creates a `vibranium.config.json` file:

```json
{
  "version": "1.0",
  "environments": {
    "default": "local",
    "directory": "./environments"
  },
  "scenarios": {
    "directory": "./scenarios"
  },
  "reports": {
    "directory": "./reports",
    "formats": ["html", "json"]
  },
  "globals": {
    "timeout": 10000,
    "retries": 3
  }
}
```

## Batch Execution

Run multiple scenarios at once:

```bash
# Run all scenarios in a directory
vm batch scenarios/

# Run with specific environment and generate reports
vm batch scenarios/ --env staging --report html

# Run in parallel for faster execution
vm batch scenarios/ --parallel 5
```

## Next Steps

Now that you understand the basics:

1. **[Writing Scenarios](/guide/writing-scenarios)** - Learn advanced scenario syntax
2. **[Variable System](/guide/variables)** - Master the dot-notation variable system
3. **[Validation](/guide/validation)** - Explore all validation operators
4. **[Environments](/guide/environments)** - Set up multiple environments
5. **[Examples](/examples/basic-testing)** - See real-world scenarios

## Quick Reference

### Common Commands

```bash
# Run a single scenario
vm run scenario.yaml --env production

# Interactive mode
vm

# Batch execution
vm batch scenarios/ --env staging

# Generate reports
vm run scenario.yaml --report html

# View help
vm --help
vm run --help
```

### Variable Namespaces

- `$.env.*` - Environment variables
- `$.global.*` - Global configuration
- `$.response.*` - Current step response
- `$.request.*` - Current step request
- `$.random.*` - Random data generators
- `$.<step_name>.*` - Data from previous steps

### Validation Operators

- `equals` - Exact match
- `contains` - Substring/element check
- `regex` - Regular expression match
- `type` - Data type validation
- `gt/lt` - Numeric comparison
- `length` - Array/string length
- `in` - Value in set
- `exists` - Non-null/undefined check

Ready to dive deeper? Continue with the [Writing Scenarios](/guide/writing-scenarios) guide!