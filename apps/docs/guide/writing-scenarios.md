# Writing Scenarios

Scenarios are the heart of Vibranium CLI. They define the sequence of steps to execute and the validations to perform. This guide covers the complete scenario syntax and best practices.

## Scenario Structure

A scenario file contains metadata, lifecycle hooks, dependencies, and steps:

```yaml
name: complete_scenario_example
description: "Demonstrates all scenario features"
version: "1.0"
tags: ["api", "integration", "user-management"]

lifecycle:
  onStart: "console.log('Starting scenario: ' + $.context.name)"
  onEnd: "console.log('Completed in: ' + $.context.duration + 'ms')"
  beforeApi: "console.log('Making request to: ' + $.request.url)"
  afterApi: "console.log('Response status: ' + $.response.status)"

dependsOn:
  - api: setup_test_data
    as: testData
    from: "./setup/data-setup.yaml"

variables:
  baseUrl: "{{$.env.API_URL}}"
  userId: null

steps:
  - name: create_user
    type: api
    method: POST
    url: "{{$.variables.baseUrl}}/users"
    headers:
      Content-Type: "application/json"
      Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
    body:
      name: "{{$.random.name}}"
      email: "{{$.random.email}}"
      role: "user"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
      - identifier: "$.response.body.id"
        operator: exists
    extract:
      - name: userId
        identifier: "$.response.body.id"

  - name: verify_user
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: GET
    url: "{{$.variables.baseUrl}}/users/{{$.user.response.body.id}}"
    expect:
      - identifier: "$.response.body.email"
        operator: equals
        expected: "{{$.user.response.body.email}}"
```

## Core Fields

### Metadata

```yaml
name: scenario_name          # Required: Unique scenario identifier
description: "What this scenario tests"  # Optional: Human-readable description
version: "1.0"              # Optional: Scenario version
tags: ["api", "smoke"]      # Optional: Tags for filtering
author: "team@company.com"  # Optional: Scenario author
```

### Variables

Define scenario-level variables:

```yaml
variables:
  baseUrl: "{{$.env.API_URL}}"
  timeout: 5000
  retryCount: 3
  testUser:
    name: "Test User"
    email: "test@example.com"
```

Use variables in steps:

```yaml
steps:
  - name: api_call
    type: api
    url: "{{$.variables.baseUrl}}/endpoint"
    timeout: "{{$.variables.timeout}}"
```

## Step Types

### API Steps

The most common step type for HTTP API testing:

```yaml
- name: api_request
  type: api
  method: GET                    # HTTP method
  url: "{{$.env.API_URL}}/users" # Request URL
  headers:                       # Request headers
    Authorization: "Bearer {{$.env.TOKEN}}"
    Content-Type: "application/json"
  query:                         # Query parameters
    page: 1
    limit: 10
    filter: "active"
  body:                          # Request body
    name: "John Doe"
    email: "john@example.com"
  timeout: 10000                 # Request timeout (ms)
  retries: 3                     # Retry attempts
  followRedirects: true          # Follow redirects
  validateStatus: false          # Don't throw on HTTP errors
```

### Future Step Types

The plugin architecture supports additional step types:

```yaml
# UI testing (future plugin)
- name: ui_interaction
  type: ui
  action: click
  selector: "#submit-button"
  waitFor:
    type: visible
    timeout: 5000

# Database step (future plugin)  
- name: db_query
  type: database
  connection: "postgres://localhost/test"
  query: "SELECT * FROM users WHERE email = ?"
  parameters: ["{{$.user.response.body.email}}"]

# Custom step (future plugin)
- name: custom_action
  type: webhook
  url: "{{$.env.WEBHOOK_URL}}"
  payload: "{{$.user.response.body}}"
```

## HTTP Methods

All standard HTTP methods are supported:

```yaml
# GET request
- name: get_users
  type: api
  method: GET
  url: "{{$.env.API_URL}}/users"

# POST request with JSON body
- name: create_user
  type: api
  method: POST
  url: "{{$.env.API_URL}}/users"
  headers:
    Content-Type: "application/json"
  body:
    name: "John Doe"
    email: "john@example.com"

# PUT request for updates
- name: update_user
  type: api
  method: PUT
  url: "{{$.env.API_URL}}/users/{{$.userId}}"
  body:
    name: "John Smith"

# PATCH request for partial updates
- name: patch_user
  type: api
  method: PATCH
  url: "{{$.env.API_URL}}/users/{{$.userId}}"
  body:
    status: "active"

# DELETE request
- name: delete_user
  type: api
  method: DELETE
  url: "{{$.env.API_URL}}/users/{{$.userId}}"

# HEAD request
- name: check_endpoint
  type: api
  method: HEAD
  url: "{{$.env.API_URL}}/health"

# OPTIONS request
- name: check_cors
  type: api
  method: OPTIONS
  url: "{{$.env.API_URL}}/users"
```

## Request Bodies

### JSON Body

```yaml
- name: json_request
  type: api
  method: POST
  url: "{{$.env.API_URL}}/users"
  headers:
    Content-Type: "application/json"
  body:
    name: "John Doe"
    email: "john@example.com"
    metadata:
      source: "api-test"
      timestamp: "{{$.context.timestamp}}"
```

### Form Data

```yaml
- name: form_request
  type: api
  method: POST
  url: "{{$.env.API_URL}}/upload"
  headers:
    Content-Type: "application/x-www-form-urlencoded"
  body:
    name: "John Doe"
    email: "john@example.com"
    subscribe: "true"
```

### Multipart Form Data

```yaml
- name: file_upload
  type: api
  method: POST
  url: "{{$.env.API_URL}}/upload"
  headers:
    Content-Type: "multipart/form-data"
  body:
    file: "@/path/to/file.pdf"
    description: "Test document"
    category: "legal"
```

### Raw Body

```yaml
- name: raw_request
  type: api
  method: POST
  url: "{{$.env.API_URL}}/webhook"
  headers:
    Content-Type: "text/plain"
  body: |
    This is raw text content
    that spans multiple lines
    and preserves formatting.
```

### XML Body

```yaml
- name: xml_request
  type: api
  method: POST
  url: "{{$.env.API_URL}}/soap"
  headers:
    Content-Type: "application/xml"
  body: |
    <?xml version="1.0" encoding="UTF-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <GetUser>
          <UserId>{{$.userId}}</UserId>
        </GetUser>
      </soap:Body>
    </soap:Envelope>
```

## Headers and Authentication

### Static Headers

```yaml
- name: with_headers
  type: api
  method: GET
  url: "{{$.env.API_URL}}/protected"
  headers:
    Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
    User-Agent: "VibraniumCLI/1.0"
    X-Request-ID: "{{$.context.requestId}}"
    Accept: "application/json"
    Cache-Control: "no-cache"
```

### Dynamic Headers

```yaml
- name: dynamic_headers
  type: api
  method: GET
  url: "{{$.env.API_URL}}/user-data"
  headers:
    Authorization: "Bearer {{$.login.response.body.token}}"
    User-ID: "{{$.user.response.body.id}}"
    Timestamp: "{{$.context.timestamp}}"
```

### Authentication Types

#### Bearer Token

```yaml
- name: bearer_auth
  type: api
  method: GET
  url: "{{$.env.API_URL}}/protected"
  headers:
    Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
```

#### Basic Authentication

```yaml
- name: basic_auth
  type: api
  method: GET
  url: "{{$.env.API_URL}}/protected"
  auth:
    type: basic
    username: "{{$.env.USERNAME}}"
    password: "{{$.env.PASSWORD}}"
```

#### API Key

```yaml
- name: api_key_auth
  type: api
  method: GET
  url: "{{$.env.API_URL}}/protected"
  headers:
    X-API-Key: "{{$.env.API_KEY}}"
```

#### OAuth 2.0 Flow

```yaml
- name: get_oauth_token
  type: api
  method: POST
  url: "{{$.env.AUTH_URL}}/oauth/token"
  body:
    grant_type: "client_credentials"
    client_id: "{{$.env.CLIENT_ID}}"
    client_secret: "{{$.env.CLIENT_SECRET}}"
  extract:
    - name: accessToken
      identifier: "$.response.body.access_token"

- name: use_oauth_token
  type: api
  method: GET
  url: "{{$.env.API_URL}}/protected"
  headers:
    Authorization: "Bearer {{$.get_oauth_token.extract.accessToken}}"
```

## Query Parameters

### Static Parameters

```yaml
- name: with_query_params
  type: api
  method: GET
  url: "{{$.env.API_URL}}/users"
  query:
    page: 1
    limit: 10
    sort: "name"
    filter: "active"
```

### Dynamic Parameters

```yaml
- name: dynamic_query
  type: api
  method: GET
  url: "{{$.env.API_URL}}/search"
  query:
    q: "{{$.searchTerm}}"
    page: "{{$.currentPage}}"
    timestamp: "{{$.context.timestamp}}"
```

### Array Parameters

```yaml
- name: array_params
  type: api
  method: GET
  url: "{{$.env.API_URL}}/users"
  query:
    ids: [1, 2, 3, 4, 5]
    tags: ["admin", "user", "guest"]
    fields: ["name", "email", "created_at"]
```

## Dependencies

### Step Dependencies

Reference data from previous steps:

```yaml
steps:
  - name: create_user
    type: api
    method: POST
    url: "{{$.env.API_URL}}/users"
    body:
      name: "John Doe"
      email: "john@example.com"

  - name: get_user
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: GET
    url: "{{$.env.API_URL}}/users/{{$.user.response.body.id}}"
```

### External Dependencies

Reference scenarios from other files:

```yaml
dependsOn:
  - api: setup_test_data
    as: testData
    from: "./setup/data-setup.yaml"
  - api: create_admin_user
    as: admin
    from: "./users/admin-setup.yaml"

steps:
  - name: use_test_data
    type: api
    method: POST
    url: "{{$.env.API_URL}}/process"
    body:
      data: "{{$.testData.response.body}}"
      adminId: "{{$.admin.response.body.id}}"
```

### Conditional Dependencies

```yaml
- name: conditional_step
  type: api
  dependsOn:
    - api: check_feature_flag
      as: feature
      condition: "$.feature.response.body.enabled === true"
  method: GET
  url: "{{$.env.API_URL}}/new-feature"
```

## Data Extraction

Extract data from responses for use in later steps:

```yaml
- name: login
  type: api
  method: POST
  url: "{{$.env.API_URL}}/auth/login"
  body:
    email: "{{$.env.USER_EMAIL}}"
    password: "{{$.env.USER_PASSWORD}}"
  extract:
    - name: authToken
      identifier: "$.response.body.token"
    - name: userId
      identifier: "$.response.body.user.id"
    - name: userRole
      identifier: "$.response.body.user.role"

- name: get_profile
  type: api
  method: GET
  url: "{{$.env.API_URL}}/users/{{$.login.extract.userId}}"
  headers:
    Authorization: "Bearer {{$.login.extract.authToken}}"
```

## Lifecycle Hooks

Execute code at different points in the scenario lifecycle:

```yaml
lifecycle:
  onStart: |
    console.log('Starting scenario at:', new Date().toISOString());
    console.log('Environment:', $.context.environment);
  
  onEnd: |
    console.log('Scenario completed in:', $.context.duration, 'ms');
    console.log('Total requests:', $.context.requestCount);
  
  beforeApi: |
    console.log('Making request:', $.request.method, $.request.url);
    
  afterApi: |
    console.log('Response:', $.response.status, $.response.statusText);
    if ($.response.status >= 400) {
      console.error('API error:', $.response.body);
    }
  
  afterDependencies: |
    console.log('Dependencies loaded:', Object.keys($.dependencies));
```

## Scenario Formats

### YAML Format (Recommended)

```yaml
name: yaml_scenario
description: "YAML format scenario"
steps:
  - name: api_call
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
```

### JSON Format

```json
{
  "name": "json_scenario",
  "description": "JSON format scenario",
  "steps": [
    {
      "name": "api_call",
      "type": "api",
      "method": "GET",
      "url": "{{$.env.API_URL}}/users",
      "expect": [
        {
          "identifier": "$.response.status",
          "operator": "equals",
          "expected": 200
        }
      ]
    }
  ]
}
```

## Best Practices

### 1. Use Descriptive Names

```yaml
# Good
- name: create_premium_user_with_subscription
  description: "Creates a premium user and activates subscription"

# Avoid
- name: step1
  description: "User stuff"
```

### 2. Group Related Steps

```yaml
name: user_management_workflow
description: "Complete user lifecycle testing"
steps:
  # User Creation
  - name: create_user
  - name: verify_user_email
  - name: activate_user_account
  
  # User Operations
  - name: update_user_profile
  - name: change_user_password
  - name: upload_profile_picture
  
  # User Cleanup
  - name: deactivate_user
  - name: delete_user_data
```

### 3. Use Variables for Reusability

```yaml
variables:
  apiBase: "{{$.env.API_URL}}"
  userEmail: "test-{{$.random.uuid}}@example.com"
  timeout: 10000

steps:
  - name: create_user
    url: "{{$.variables.apiBase}}/users"
    timeout: "{{$.variables.timeout}}"
    body:
      email: "{{$.variables.userEmail}}"
```

### 4. Implement Proper Error Handling

```yaml
- name: create_user
  type: api
  method: POST
  url: "{{$.env.API_URL}}/users"
  body:
    email: "{{$.random.email}}"
  expect:
    # Success case
    - identifier: "$.response.status"
      operator: in
      expected: [200, 201]
    # Error handling
    - identifier: "$.response.body.error"
      operator: exists
      condition: "$.response.status >= 400"
```

### 5. Document Complex Logic

```yaml
- name: complex_calculation
  description: |
    This step performs a complex business calculation that:
    1. Takes the user's subscription tier
    2. Applies regional pricing adjustments
    3. Calculates tax based on user location
    4. Returns final price with discounts applied
  type: api
  method: POST
  url: "{{$.env.API_URL}}/calculate-price"
```

## Advanced Features

### Conditional Execution

```yaml
- name: premium_feature_test
  type: api
  condition: "$.user.response.body.tier === 'premium'"
  method: GET
  url: "{{$.env.API_URL}}/premium-features"
```

### Retry Logic

```yaml
- name: flaky_endpoint
  type: api
  method: GET
  url: "{{$.env.API_URL}}/sometimes-fails"
  retries: 5
  retryDelay: 1000
  retryCondition: "$.response.status >= 500"
```

### Request Timeouts

```yaml
- name: slow_endpoint
  type: api
  method: GET
  url: "{{$.env.API_URL}}/slow-operation"
  timeout: 60000  # 60 seconds
```

### Custom HTTP Client

```yaml
- name: special_request
  type: api
  httpClient: "custom-client"
  method: GET
  url: "{{$.env.API_URL}}/special"
```

For validation syntax and operators, see the [Validation Guide](/guide/validation). For variable system details, see the [Variables Guide](/guide/variables).