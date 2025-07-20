# Variable System

Vibranium CLI features a powerful dot-notation variable system that allows you to access and manipulate data throughout your scenarios. Variables enable dynamic content, data sharing between steps, and flexible scenario configuration.

## Variable Namespaces

Variables are organized into namespaces accessed using dot notation:

| Namespace | Source | Example |
|-----------|--------|---------|
| `$.env` | Environment files | `\{\{$.env.API_URL\}\}` |
| `$.global` | Global configuration | `\{\{$.global.timeout\}\}` |
| `$.context` | Execution metadata | `\{\{$.context.startedAt\}\}` |
| `$.request` | Current step request | `\{\{$.request.url\}\}` |
| `$.response` | Current step response | `\{\{$.response.body.id\}\}` |
| `$.api` | Current step definition | `\{\{$.api.name\}\}` |
| `$.random` | Random data generators | `\{\{$.random.email\}\}` |
| `$.<alias>` | Step outputs (by alias) | `\{\{$.user.response.body.id\}\}` |
| `$.variables` | Scenario variables | `\{\{$.variables.baseUrl\}\}` |
| `$.extract` | Extracted data | `\{\{$.login.extract.token\}\}` |

## Environment Variables (`$.env`)

Access environment-specific configuration:

### Environment File Structure

```json
{
  "environment": "staging",
  "variables": {
    "API_URL": "https://api.staging.example.com",
    "TIMEOUT": 10000,
    "MAX_RETRIES": 3,
    "DATABASE_URL": "postgres://localhost/staging_db"
  },
  "secrets": {
    "AUTH_TOKEN": "$.env.STAGING_AUTH_TOKEN",
    "API_KEY": "$.env.STAGING_API_KEY"
  }
}
```

### Using Environment Variables

```yaml
steps:
  - name: api_call
    type: api
    method: GET
    url: "\{\{$.env.API_URL\}\}/users"
    timeout: "\{\{$.env.TIMEOUT\}\}"
    headers:
      Authorization: "Bearer \{\{$.env.AUTH_TOKEN\}\}"
      X-API-Key: "\{\{$.env.API_KEY\}\}"
```

### Nested Environment Variables

```json
{
  "variables": {
    "api": {
      "base_url": "https://api.example.com",
      "version": "v2",
      "endpoints": {
        "users": "/users",
        "orders": "/orders"
      }
    },
    "database": {
      "host": "db.example.com",
      "port": 5432,
      "name": "production"
    }
  }
}
```

```yaml
steps:
  - name: get_users
    type: api
    url: "\{\{$.env.api.base_url\}\}/\{\{$.env.api.version\}\}\{\{$.env.api.endpoints.users\}\}"
```

## Global Variables (`$.global`)

Access global configuration from `vibranium.config.json`:

```json
{
  "globals": {
    "defaultTimeout": 10000,
    "maxRetries": 3,
    "userAgent": "VibraniumCLI/1.0",
    "companyInfo": {
      "name": "ACME Corp",
      "domain": "acme.com"
    }
  }
}
```

```yaml
steps:
  - name: api_call
    type: api
    method: GET
    url: "\{\{$.env.API_URL\}\}/info"
    timeout: "\{\{$.global.defaultTimeout\}\}"
    headers:
      User-Agent: "\{\{$.global.userAgent\}\}"
      X-Company: "\{\{$.global.companyInfo.name\}\}"
```

## Context Variables (`$.context`)

Access execution metadata:

```yaml
lifecycle:
  onStart: |
    console.log('Scenario:', $.context.name);
    console.log('Environment:', $.context.environment);
    console.log('Started at:', $.context.startedAt);
    console.log('Execution ID:', $.context.executionId);

steps:
  - name: metadata_call
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/analytics"
    body:
      executionId: "\{\{$.context.executionId\}\}"
      scenario: "\{\{$.context.name\}\}"
      timestamp: "\{\{$.context.timestamp\}\}"
      environment: "\{\{$.context.environment\}\}"
```

### Available Context Variables

- `$.context.name` - Scenario name
- `$.context.description` - Scenario description
- `$.context.environment` - Current environment
- `$.context.executionId` - Unique execution identifier
- `$.context.startedAt` - Execution start time (ISO 8601)
- `$.context.timestamp` - Current timestamp
- `$.context.duration` - Execution duration (ms)
- `$.context.stepCount` - Total number of steps
- `$.context.currentStep` - Current step index
- `$.context.requestCount` - Total HTTP requests made

## Request Variables (`$.request`)

Access current step's request data:

```yaml
lifecycle:
  beforeApi: |
    console.log('Making request:', $.request.method, $.request.url);
    console.log('Headers:', JSON.stringify($.request.headers, null, 2));

steps:
  - name: log_request
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/users"
    body:
      name: "John Doe"
      email: "john@example.com"
```

### Available Request Variables

- `$.request.method` - HTTP method
- `$.request.url` - Request URL
- `$.request.headers` - Request headers object
- `$.request.body` - Request body
- `$.request.query` - Query parameters object
- `$.request.timeout` - Request timeout

## Response Variables (`$.response`)

Access current step's response data:

```yaml
steps:
  - name: create_user
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/users"
    body:
      name: "John Doe"
      email: "john@example.com"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
      - identifier: "$.response.body.id"
        operator: exists

lifecycle:
  afterApi: |
    console.log('Response status:', $.response.status);
    console.log('Response time:', $.response.timing.duration, 'ms');
    if ($.response.status >= 400) {
      console.error('Error response:', $.response.body);
    }
```

### Available Response Variables

- `$.response.status` - HTTP status code
- `$.response.statusText` - HTTP status text
- `$.response.headers` - Response headers object
- `$.response.body` - Parsed response body
- `$.response.raw` - Raw response body (string)
- `$.response.timing` - Request timing information
- `$.response.size` - Response size in bytes

### Response Body Parsing

Response bodies are automatically parsed based on Content-Type:

```yaml
# JSON response (application/json)
- identifier: "$.response.body.user.id"
- identifier: "$.response.body.data[0].name"

# XML response (application/xml)
- identifier: "$.response.body.root.user.@id"
- identifier: "$.response.body.users.user[1].name"

# Text response (text/plain)
- identifier: "$.response.body"  # Entire text content

# Headers with spaces
- identifier: "$.response.headers['Content-Type']"
- identifier: "$.response.headers['X-Custom-Header']"
```

## Random Data (`$.random`)

Generate realistic test data:

### Basic Generators

```yaml
steps:
  - name: create_user
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/users"
    body:
      # Basic data types
      name: "\{\{$.random.name\}\}"
      email: "\{\{$.random.email\}\}"
      phone: "\{\{$.random.phone\}\}"
      age: "\{\{$.random.number(18, 65)\}\}"
      
      # Text content
      bio: "\{\{$.random.lorem(100)\}\}"
      description: "\{\{$.random.sentence\}\}"
      
      # Identifiers
      id: "\{\{$.random.uuid\}\}"
      username: "\{\{$.random.username\}\}"
      
      # Dates
      birthDate: "\{\{$.random.date\}\}"
      createdAt: "\{\{$.random.timestamp\}\}"
```

### Advanced Generators

```yaml
steps:
  - name: create_complex_data
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/complex"
    body:
      # Address data
      address:
        street: "\{\{$.random.address.street\}\}"
        city: "\{\{$.random.address.city\}\}"
        state: "\{\{$.random.address.state\}\}"
        zipCode: "\{\{$.random.address.zipCode\}\}"
        country: "\{\{$.random.address.country\}\}"
      
      # Company data
      company:
        name: "\{\{$.random.company.name\}\}"
        department: "\{\{$.random.company.department\}\}"
        jobTitle: "\{\{$.random.company.jobTitle\}\}"
      
      # Finance data
      account:
        creditCard: "\{\{$.random.finance.creditCard\}\}"
        iban: "\{\{$.random.finance.iban\}\}"
        amount: "\{\{$.random.finance.amount(100, 10000)\}\}"
      
      # Internet data
      website: "\{\{$.random.internet.url\}\}"
      avatar: "\{\{$.random.internet.avatar\}\}"
      password: "\{\{$.random.internet.password(12)\}\}"
```

### Custom Random Data

```yaml
variables:
  userRoles: ["admin", "user", "moderator", "guest"]
  statusOptions: ["active", "inactive", "pending"]

steps:
  - name: create_user
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/users"
    body:
      name: "\{\{$.random.name\}\}"
      role: "\{\{$.random.arrayElement($.variables.userRoles)\}\}"
      status: "\{\{$.random.arrayElement($.variables.statusOptions)\}\}"
      score: "\{\{$.random.float(0, 100, 2)\}\}"
      tags: "\{\{$.random.array(3, $.variables.availableTags)\}\}"
```

## Step Alias Variables (`$.<alias>`)

Reference data from previous steps using aliases:

```yaml
steps:
  - name: create_user
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/users"
    body:
      name: "John Doe"
      email: "john@example.com"

  - name: create_profile
    type: api
    dependsOn:
      - api: create_user
        as: user  # Creates $.user namespace
    method: POST
    url: "\{\{$.env.API_URL\}\}/profiles"
    body:
      userId: "\{\{$.user.response.body.id\}\}"
      displayName: "\{\{$.user.response.body.name\}\}"
    headers:
      Authorization: "Bearer \{\{$.user.response.body.token\}\}"

  - name: upload_avatar
    type: api
    dependsOn:
      - api: create_profile
        as: profile
    method: POST
    url: "\{\{$.env.API_URL\}\}/avatars"
    body:
      profileId: "\{\{$.profile.response.body.id\}\}"
      userId: "\{\{$.user.response.body.id\}\}"  # Still available
```

## Scenario Variables (`$.variables`)

Define scenario-level variables:

```yaml
variables:
  baseUrl: "\{\{$.env.API_URL\}\}"
  apiVersion: "v2"
  timeout: 15000
  testUser:
    name: "Test User"
    email: "test@example.com"
    preferences:
      theme: "dark"
      notifications: true

steps:
  - name: create_user
    type: api
    method: POST
    url: "\{\{$.variables.baseUrl\}\}/\{\{$.variables.apiVersion\}\}/users"
    timeout: "\{\{$.variables.timeout\}\}"
    body:
      name: "\{\{$.variables.testUser.name\}\}"
      email: "\{\{$.variables.testUser.email\}\}"
      preferences: "\{\{$.variables.testUser.preferences\}\}"
```

## Extracted Data (`$.extract`)

Extract and reuse data from responses:

```yaml
steps:
  - name: login
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/auth/login"
    body:
      email: "\{\{$.env.USER_EMAIL\}\}"
      password: "\{\{$.env.USER_PASSWORD\}\}"
    extract:
      - name: authToken
        identifier: "$.response.body.token"
      - name: userId
        identifier: "$.response.body.user.id"
      - name: userRole
        identifier: "$.response.body.user.role"
      - name: expiresAt
        identifier: "$.response.body.expiresAt"

  - name: get_user_profile
    type: api
    method: GET
    url: "\{\{$.env.API_URL\}\}/users/\{\{$.login.extract.userId\}\}"
    headers:
      Authorization: "Bearer \{\{$.login.extract.authToken\}\}"

  - name: check_permissions
    type: api
    condition: "$.login.extract.userRole === 'admin'"
    method: GET
    url: "\{\{$.env.API_URL\}\}/admin/dashboard"
```

## Variable Interpolation

### Template Syntax

Variables use double curly braces `\{\{\}\}` for interpolation:

```yaml
# Simple variable
url: "\{\{$.env.API_URL\}\}/users"

# Nested properties
userId: "\{\{$.user.response.body.id\}\}"

# Array access
firstUser: "\{\{$.users.response.body.data[0].name\}\}"

# Complex expressions
message: "User \{\{$.user.response.body.name\}\} created at \{\{$.context.timestamp\}\}"
```

### JavaScript Expressions

Use JavaScript expressions inside variable templates:

```yaml
# Arithmetic
total: "\{\{$.price.response.body.amount + $.tax.response.body.amount\}\}"
percentage: "\{\{($.completed / $.total) * 100\}\}"

# String manipulation
upperName: "\{\{$.user.response.body.name.toUpperCase()\}\}"
slug: "\{\{$.product.response.body.title.toLowerCase().replace(/ /g, '-')\}\}"

# Date manipulation
futureDate: "\{\{new Date($.response.body.createdAt).getTime() + (7 * 24 * 60 * 60 * 1000)\}\}"

# Conditional logic
status: "\{\{$.user.response.body.verified ? 'active' : 'pending'\}\}"
```

### Helper Functions

Access built-in helper functions:

```yaml
# String helpers
capitalizedName: "\{\{$.helpers.capitalize($.user.response.body.name)\}\}"
cleanPhone: "\{\{$.helpers.sanitizePhone($.user.response.body.phone)\}\}"

# Date helpers
formattedDate: "\{\{$.helpers.formatDate($.response.body.createdAt, 'YYYY-MM-DD')\}\}"
relativeTime: "\{\{$.helpers.timeAgo($.response.body.updatedAt)\}\}"

# Array helpers
joinedTags: "\{\{$.helpers.join($.product.response.body.tags, ', ')\}\}"
uniqueItems: "\{\{$.helpers.unique($.response.body.items)\}\}"

# Encoding helpers
encodedUrl: "\{\{$.helpers.encodeUrl($.response.body.redirectUrl)\}\}"
base64Data: "\{\{$.helpers.base64Encode($.response.body.data)\}\}"
```

## Advanced Variable Techniques

### Conditional Variables

```yaml
variables:
  endpoint: "\{\{$.env.USE_V2_API === 'true' ? '/v2/users' : '/v1/users'\}\}"
  timeout: "\{\{$.env.ENVIRONMENT === 'production' ? 30000 : 10000\}\}"

steps:
  - name: adaptive_call
    type: api
    method: GET
    url: "\{\{$.env.API_URL\}\}\{\{$.variables.endpoint\}\}"
    timeout: "\{\{$.variables.timeout\}\}"
```

### Dynamic Headers

```yaml
steps:
  - name: dynamic_headers
    type: api
    method: GET
    url: "\{\{$.env.API_URL\}\}/data"
    headers:
      Authorization: "Bearer \{\{$.auth.extract.token\}\}"
      X-User-ID: "\{\{$.auth.extract.userId\}\}"
      X-Request-ID: "\{\{$.context.executionId\}\}-\{\{$.context.currentStep\}\}"
      X-Timestamp: "\{\{$.context.timestamp\}\}"
      Accept: "\{\{$.env.PREFER_JSON === 'true' ? 'application/json' : 'application/xml'\}\}"
```

### Variable Transformation

```yaml
steps:
  - name: transformed_data
    type: api
    method: POST
    url: "\{\{$.env.API_URL\}\}/process"
    body:
      # Transform arrays
      userIds: "\{\{$.users.response.body.data.map(user => user.id)\}\}"
      
      # Filter data
      activeUsers: "\{\{$.users.response.body.data.filter(user => user.status === 'active')\}\}"
      
      # Aggregate data
      totalValue: "\{\{$.orders.response.body.data.reduce((sum, order) => sum + order.total, 0)\}\}"
      
      # Transform objects
      userLookup: "\{\{Object.fromEntries($.users.response.body.data.map(user => [user.id, user.name]))\}\}"
```

## Debugging Variables

### Logging Variable Values

```yaml
lifecycle:
  beforeApi: |
    console.log('Environment:', $.env.ENVIRONMENT);
    console.log('Current user:', $.user ? $.user.response.body.name : 'none');
    console.log('Request URL:', $.request.url);

  afterApi: |
    console.log('Response status:', $.response.status);
    console.log('Response body keys:', Object.keys($.response.body || {}));
```

### Variable Inspector

Use the interactive mode to inspect variables:

1. Launch interactive mode: `vm`
2. Navigate to your scenario
3. View the "Variables" panel
4. See real-time variable values as you step through

### Variable Validation

```yaml
steps:
  - name: validate_environment
    type: api
    method: GET
    url: "\{\{$.env.API_URL || 'http://localhost:3000'\}\}/health"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Ensure API_URL environment variable is set correctly"
```

## Best Practices

### 1. Use Descriptive Variable Names

```yaml
# Good
variables:
  primaryApiEndpoint: "\{\{$.env.API_URL\}\}"
  defaultRequestTimeout: 10000
  testUserCredentials:
    email: "test@example.com"
    password: "secure123"

# Avoid
variables:
  url: "\{\{$.env.API_URL\}\}"
  timeout: 10000
  user: { email: "test@example.com" }
```

### 2. Group Related Variables

```yaml
variables:
  api:
    baseUrl: "\{\{$.env.API_URL\}\}"
    version: "v2"
    timeout: 15000
  
  testData:
    user:
      name: "Test User"
      email: "test@example.com"
    product:
      name: "Test Product"
      price: 99.99
```

### 3. Use Environment-Specific Defaults

```yaml
variables:
  apiTimeout: "\{\{$.env.API_TIMEOUT || 10000\}\}"
  maxRetries: "\{\{$.env.MAX_RETRIES || 3\}\}"
  debugMode: "\{\{$.env.DEBUG === 'true'\}\}"
```

### 4. Validate Critical Variables

```yaml
steps:
  - name: validate_config
    type: api
    method: GET
    url: "\{\{$.env.API_URL\}\}/health"
    expect:
      - identifier: "$.env.API_URL"
        operator: exists
        description: "API_URL must be configured"
      - identifier: "$.env.AUTH_TOKEN"
        operator: exists
        description: "AUTH_TOKEN must be provided"
```

For more information on using variables in validation, see the [Validation Guide](/guide/validation).