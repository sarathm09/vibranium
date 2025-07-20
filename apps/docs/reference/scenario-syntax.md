# Scenario Syntax Reference

This reference provides the complete syntax specification for Vibranium CLI scenario files. Scenarios can be written in YAML or JSON format.

## File Structure

```yaml
# Required fields
name: string                    # Unique scenario identifier
description: string            # Human-readable description

# Optional metadata
version: string                # Scenario version
tags: string[]                 # Tags for filtering and organization
author: string                 # Scenario author
created: string                # Creation date (ISO 8601)
updated: string                # Last updated date (ISO 8601)

# Configuration
timeout: number                # Global timeout in milliseconds
retries: number                # Default retry count
parallel: boolean              # Enable parallel step execution

# Variables and dependencies
variables: object              # Scenario-level variables
dependsOn: Dependency[]        # External scenario dependencies

# Lifecycle hooks
lifecycle: LifecycleHooks      # Event handlers

# Main content
steps: Step[]                  # Array of steps to execute
```

## Required Fields

### `name`
Unique identifier for the scenario.

**Type:** `string`  
**Required:** Yes  
**Pattern:** `^[a-zA-Z][a-zA-Z0-9_-]*$`

```yaml
name: user_registration_flow
name: api_health_check
name: payment_workflow_v2
```

### `description`
Human-readable description of what the scenario tests.

**Type:** `string`  
**Required:** Yes  
**Max Length:** 500 characters

```yaml
description: "Complete user registration and email verification flow"
description: "API health check for all critical endpoints"
description: "End-to-end payment processing with multiple providers"
```

### `steps`
Array of steps to execute in sequence.

**Type:** `Step[]`  
**Required:** Yes  
**Min Items:** 1

```yaml
steps:
  - name: step1
    type: api
    # ... step configuration
  - name: step2
    type: api
    # ... step configuration
```

## Optional Metadata

### `version`
Scenario version using semantic versioning.

**Type:** `string`  
**Pattern:** `^\d+\.\d+(\.\d+)?$`

```yaml
version: "1.0"
version: "2.1.3"
```

### `tags`
Tags for categorization and filtering.

**Type:** `string[]`

```yaml
tags: ["api", "integration", "user-management"]
tags: ["smoke", "critical"]
tags: ["payment", "regression"]
```

### `author`
Scenario author or team.

**Type:** `string`

```yaml
author: "api-team@company.com"
author: "John Doe"
author: "Integration Team"
```

### `created` / `updated`
Creation and modification timestamps.

**Type:** `string`  
**Format:** ISO 8601 date-time

```yaml
created: "2024-01-15T10:30:00Z"
updated: "2024-02-01T14:22:33Z"
```

## Configuration

### `timeout`
Global timeout for all steps in milliseconds.

**Type:** `number`  
**Default:** 30000  
**Range:** 1000 - 300000

```yaml
timeout: 15000  # 15 seconds
timeout: 60000  # 1 minute
```

### `retries`
Default number of retry attempts for failed steps.

**Type:** `number`  
**Default:** 0  
**Range:** 0 - 10

```yaml
retries: 3
retries: 0  # No retries
```

### `parallel`
Enable parallel execution of independent steps.

**Type:** `boolean`  
**Default:** false

```yaml
parallel: true
parallel: false
```

## Variables

Scenario-level variables accessible via `$.variables.*`

**Type:** `object`

```yaml
variables:
  baseUrl: "{{$.env.API_URL}}"
  apiVersion: "v2"
  timeout: 10000
  testUser:
    name: "Test User"
    email: "test@example.com"
  endpoints:
    users: "/users"
    orders: "/orders"
    payments: "/payments"
```

## Dependencies

External scenario dependencies that must execute before this scenario.

**Type:** `Dependency[]`

```yaml
dependsOn:
  - api: setup_test_data        # Scenario name
    as: testData               # Alias for referencing
    from: "./setup/data.yaml"  # File path (optional)
    env: local                 # Environment (optional)
  - api: create_admin_user
    as: admin
    from: "./users/admin.yaml"
```

### Dependency Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `api` | string | Yes | Name of the dependency scenario |
| `as` | string | Yes | Alias for referencing in variables |
| `from` | string | No | Path to scenario file (if external) |
| `env` | string | No | Environment to use for dependency |
| `condition` | string | No | JavaScript expression for conditional execution |

## Lifecycle Hooks

Event handlers for different phases of scenario execution.

**Type:** `LifecycleHooks`

```yaml
lifecycle:
  onStart: |
    console.log('Starting scenario:', $.context.name);
    console.log('Environment:', $.context.environment);
  
  onEnd: |
    console.log('Scenario completed in:', $.context.duration, 'ms');
    console.log('Total requests:', $.context.requestCount);
  
  beforeApi: |
    console.log('Making request:', $.request.method, $.request.url);
  
  afterApi: |
    console.log('Response:', $.response.status);
    if ($.response.status >= 400) {
      console.error('API Error:', $.response.body);
    }
  
  afterDependencies: |
    console.log('Dependencies loaded');
```

### Available Hooks

| Hook | Description | Available Variables |
|------|-------------|-------------------|
| `onStart` | Before scenario execution | `$.context`, `$.env`, `$.global`, `$.variables` |
| `onEnd` | After scenario completion | All variables including results |
| `beforeApi` | Before each API request | `$.context`, `$.request`, `$.api` |
| `afterApi` | After each API response | `$.context`, `$.request`, `$.response`, `$.api` |
| `afterDependencies` | After loading dependencies | `$.context`, dependency results |

## Steps

Individual actions to execute within the scenario.

### Step Structure

```yaml
- name: string                 # Required: Step identifier
  description: string          # Optional: Step description
  type: string                 # Required: Step type (api, ui, etc.)
  condition: string            # Optional: Execution condition
  timeout: number              # Optional: Step timeout
  retries: number              # Optional: Retry count
  continueOnFailure: boolean   # Optional: Continue if step fails
  
  # Dependencies
  dependsOn: Dependency[]      # Optional: Step dependencies
  
  # Type-specific configuration
  # (varies by step type)
  
  # Validation
  expect: Expectation[]        # Optional: Response validations
  
  # Data extraction
  extract: Extract[]           # Optional: Data extraction rules
```

### Step Types

#### API Steps (`type: api`)

HTTP API request steps.

```yaml
- name: api_request
  type: api
  method: string               # HTTP method (GET, POST, etc.)
  url: string                  # Request URL
  headers: object              # Request headers
  query: object                # Query parameters
  body: any                    # Request body
  auth: AuthConfig             # Authentication configuration
  timeout: number              # Request timeout
  retries: number              # Retry attempts
  followRedirects: boolean     # Follow HTTP redirects
  validateStatus: boolean      # Validate HTTP status
  httpClient: string           # Custom HTTP client
```

**Example:**
```yaml
- name: create_user
  type: api
  method: POST
  url: "{{$.env.API_URL}}/users"
  headers:
    Content-Type: "application/json"
    Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
  body:
    name: "{{$.random.name}}"
    email: "{{$.random.email}}"
  timeout: 10000
  retries: 3
```

#### Future Step Types

The plugin architecture supports additional step types:

```yaml
# UI testing step (future)
- name: ui_interaction
  type: ui
  action: click
  selector: "#submit-button"
  
# Database step (future)
- name: db_query
  type: database
  query: "SELECT * FROM users"
  
# Custom step (future)
- name: custom_action
  type: webhook
  url: "{{$.env.WEBHOOK_URL}}"
```

### HTTP Methods

Supported HTTP methods for API steps:

- `GET` - Retrieve data
- `POST` - Create new resource
- `PUT` - Update entire resource
- `PATCH` - Partial resource update
- `DELETE` - Remove resource
- `HEAD` - Get headers only
- `OPTIONS` - Get allowed methods

### Request Body Types

#### JSON Body
```yaml
body:
  name: "John Doe"
  email: "john@example.com"
  metadata:
    source: "api-test"
```

#### Form Data
```yaml
headers:
  Content-Type: "application/x-www-form-urlencoded"
body:
  username: "john"
  password: "secret"
```

#### Multipart Form Data
```yaml
headers:
  Content-Type: "multipart/form-data"
body:
  file: "@/path/to/file.pdf"
  description: "Document upload"
```

#### Raw Body
```yaml
headers:
  Content-Type: "text/plain"
body: |
  Raw text content
  that spans multiple lines
```

### Authentication

#### Bearer Token
```yaml
auth:
  type: bearer
  token: "{{$.env.AUTH_TOKEN}}"
```

#### Basic Authentication
```yaml
auth:
  type: basic
  username: "{{$.env.USERNAME}}"
  password: "{{$.env.PASSWORD}}"
```

#### API Key
```yaml
headers:
  X-API-Key: "{{$.env.API_KEY}}"
```

### Step Dependencies

Steps can depend on other steps within the same scenario:

```yaml
steps:
  - name: create_user
    type: api
    method: POST
    url: "{{$.env.API_URL}}/users"
    body:
      name: "John Doe"

  - name: get_user
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: GET
    url: "{{$.env.API_URL}}/users/{{$.user.response.body.id}}"
```

## Validation (Expect)

Response validation rules using various operators.

```yaml
expect:
  - identifier: string         # JSONPath/XPath to value
    operator: string           # Validation operator
    expected: any              # Expected value
    description: string        # Optional description
    condition: string          # Optional condition
```

### Validation Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Strict equality | `expected: 200` |
| `not_equals` | Strict inequality | `expected: null` |
| `contains` | String/array contains | `expected: "success"` |
| `not_contains` | Does not contain | `expected: "error"` |
| `starts_with` | String starts with | `expected: "user_"` |
| `ends_with` | String ends with | `expected: ".com"` |
| `regex` | Regular expression | `expected: "^\\d+$"` |
| `gt` | Greater than | `expected: 0` |
| `gte` | Greater than or equal | `expected: 1` |
| `lt` | Less than | `expected: 100` |
| `lte` | Less than or equal | `expected: 99` |
| `between` | Value in range | `expected: [0, 100]` |
| `type` | Data type check | `expected: "string"` |
| `exists` | Value exists | No expected value |
| `not_exists` | Value doesn't exist | No expected value |
| `length` | Array/string length | `expected: 5` |
| `min_length` | Minimum length | `expected: 1` |
| `max_length` | Maximum length | `expected: 100` |
| `empty` | Empty array/object | No expected value |
| `not_empty` | Not empty | No expected value |
| `in` | Value in set | `expected: [200, 201, 202]` |
| `not_in` | Value not in set | `expected: [400, 500]` |
| `schema` | JSON Schema validation | `expected: "./schema.json"` |
| `javascript` | Custom JS validation | `expected: "value > 0"` |

### Example Validations

```yaml
expect:
  # Status validation
  - identifier: "$.response.status"
    operator: equals
    expected: 200
    description: "Should return success status"
  
  # Type validation
  - identifier: "$.response.body.users"
    operator: type
    expected: "array"
    description: "Users should be an array"
  
  # String validation
  - identifier: "$.response.body.email"
    operator: regex
    expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
    description: "Valid email format"
  
  # Numeric validation
  - identifier: "$.response.body.age"
    operator: between
    expected: [0, 150]
    description: "Age must be realistic"
  
  # Schema validation
  - identifier: "$.response.body"
    operator: schema
    expected: "./schemas/user.json"
    description: "Must match user schema"
  
  # Conditional validation
  - identifier: "$.response.body.isAdmin"
    operator: equals
    expected: true
    condition: "$.response.body.role === 'admin'"
    description: "Admin users should have isAdmin flag"
```

## Data Extraction

Extract data from responses for use in subsequent steps.

```yaml
extract:
  - name: string               # Variable name
    identifier: string         # JSONPath/XPath to value
    transform: string          # Optional JavaScript transformation
```

### Example Extractions

```yaml
extract:
  - name: userId
    identifier: "$.response.body.id"
  
  - name: authToken
    identifier: "$.response.body.token"
  
  - name: userEmail
    identifier: "$.response.body.email"
    transform: "value.toLowerCase()"
  
  - name: userCount
    identifier: "$.response.body.users"
    transform: "value.length"
```

## Variable References

Access variables using double curly brace syntax:

```yaml
# Environment variables
url: "{{$.env.API_URL}}/users"

# Scenario variables
timeout: "{{$.variables.timeout}}"

# Step results
userId: "{{$.create_user.response.body.id}}"

# Random data
email: "{{$.random.email}}"

# Context data
timestamp: "{{$.context.timestamp}}"

# Complex expressions
message: "User {{$.user.response.body.name}} created at {{$.context.timestamp}}"
```

## Complete Example

```yaml
name: complete_user_workflow
description: "Comprehensive user management workflow testing"
version: "1.0"
tags: ["user", "integration", "workflow"]
author: "api-team@company.com"

timeout: 30000
retries: 1

variables:
  baseUrl: "{{$.env.API_URL}}"
  testUser:
    name: "Test User"
    email: "test@example.com"

lifecycle:
  onStart: |
    console.log('Starting user workflow test');
  onEnd: |
    console.log('Workflow completed in', $.context.duration, 'ms');

steps:
  - name: create_user
    description: "Create a new user account"
    type: api
    method: POST
    url: "{{$.variables.baseUrl}}/users"
    headers:
      Content-Type: "application/json"
      Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
    body:
      name: "{{$.variables.testUser.name}}"
      email: "{{$.random.email}}"
      role: "user"
    timeout: 10000
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
        description: "User creation should succeed"
      - identifier: "$.response.body.id"
        operator: exists
        description: "User ID should be returned"
      - identifier: "$.response.body.email"
        operator: equals
        expected: "{{$.request.body.email}}"
        description: "Email should match request"
    extract:
      - name: userId
        identifier: "$.response.body.id"
      - name: userEmail
        identifier: "$.response.body.email"

  - name: verify_user
    description: "Verify the created user"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: GET
    url: "{{$.variables.baseUrl}}/users/{{$.user.extract.userId}}"
    headers:
      Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.name"
        operator: equals
        expected: "{{$.variables.testUser.name}}"
      - identifier: "$.response.body.email"
        operator: equals
        expected: "{{$.user.extract.userEmail}}"

  - name: update_user
    description: "Update user information"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: PATCH
    url: "{{$.variables.baseUrl}}/users/{{$.user.extract.userId}}"
    headers:
      Content-Type: "application/json"
      Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
    body:
      name: "{{$.variables.testUser.name}} Updated"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.name"
        operator: ends_with
        expected: "Updated"

  - name: delete_user
    description: "Clean up: delete the test user"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: DELETE
    url: "{{$.variables.baseUrl}}/users/{{$.user.extract.userId}}"
    headers:
      Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 204]
        description: "User deletion should succeed"
```

This reference covers the complete syntax specification for Vibranium CLI scenarios. For practical examples, see the [Examples](/examples/basic-testing) section.