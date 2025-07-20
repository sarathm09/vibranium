# Validation & Testing

Vibranium CLI provides a comprehensive validation system to verify API responses, data integrity, and business logic. This guide covers all validation operators, assertion strategies, and testing best practices.

## Validation Structure

Validations are defined in the `expect` section of each step:

```yaml
steps:
  - name: api_call
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should return success status"
      - identifier: "$.response.body.data"
        operator: type
        expected: "array"
        description: "Response should contain array of users"
```

## Core Validation Fields

| Field | Required | Description |
|-------|----------|-------------|
| `identifier` | Yes | JSONPath or XPath to the value being tested |
| `operator` | Yes | Validation operator to use |
| `expected` | Yes | Expected value or pattern |
| `description` | No | Human-readable description of the validation |
| `condition` | No | JavaScript expression to conditionally run validation |

## Validation Operators

### Equality Operators

#### `equals`
Strict equality comparison:

```yaml
expect:
  - identifier: "$.response.status"
    operator: equals
    expected: 200
  
  - identifier: "$.response.body.user.name"
    operator: equals
    expected: "John Doe"
  
  - identifier: "$.response.body.isActive"
    operator: equals
    expected: true
```

#### `not_equals`
Strict inequality comparison:

```yaml
expect:
  - identifier: "$.response.status"
    operator: not_equals
    expected: 404
  
  - identifier: "$.response.body.error"
    operator: not_equals
    expected: null
```

### String Operators

#### `contains`
Check if string contains substring or array contains element:

```yaml
expect:
  - identifier: "$.response.body.message"
    operator: contains
    expected: "success"
  
  - identifier: "$.response.body.tags"
    operator: contains
    expected: "important"
  
  - identifier: "$.response.headers['Content-Type']"
    operator: contains
    expected: "application/json"
```

#### `not_contains`
Check if string/array does not contain value:

```yaml
expect:
  - identifier: "$.response.body.errors"
    operator: not_contains
    expected: "critical"
  
  - identifier: "$.response.body.permissions"
    operator: not_contains
    expected: "admin"
```

#### `starts_with`
Check if string starts with specific prefix:

```yaml
expect:
  - identifier: "$.response.body.id"
    operator: starts_with
    expected: "user_"
  
  - identifier: "$.response.body.url"
    operator: starts_with
    expected: "https://"
```

#### `ends_with`
Check if string ends with specific suffix:

```yaml
expect:
  - identifier: "$.response.body.email"
    operator: ends_with
    expected: "@example.com"
  
  - identifier: "$.response.body.filename"
    operator: ends_with
    expected: ".pdf"
```

#### `regex`
Regular expression pattern matching:

```yaml
expect:
  - identifier: "$.response.body.email"
    operator: regex
    expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
  
  - identifier: "$.response.body.phone"
    operator: regex
    expected: "^\\+?[1-9]\\d{1,14}$"
  
  - identifier: "$.response.body.uuid"
    operator: regex
    expected: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
```

### Numeric Operators

#### `gt` (Greater Than)
```yaml
expect:
  - identifier: "$.response.body.age"
    operator: gt
    expected: 18
  
  - identifier: "$.response.body.price"
    operator: gt
    expected: 0
  
  - identifier: "$.response.headers['Content-Length']"
    operator: gt
    expected: 100
```

#### `gte` (Greater Than or Equal)
```yaml
expect:
  - identifier: "$.response.body.score"
    operator: gte
    expected: 0
  
  - identifier: "$.response.body.inventory"
    operator: gte
    expected: 1
```

#### `lt` (Less Than)
```yaml
expect:
  - identifier: "$.response.body.responseTime"
    operator: lt
    expected: 1000
  
  - identifier: "$.response.body.errorCount"
    operator: lt
    expected: 5
```

#### `lte` (Less Than or Equal)
```yaml
expect:
  - identifier: "$.response.body.maxUsers"
    operator: lte
    expected: 100
  
  - identifier: "$.response.body.timeout"
    operator: lte
    expected: 30000
```

#### `between`
Check if numeric value is within range:

```yaml
expect:
  - identifier: "$.response.body.age"
    operator: between
    expected: [18, 65]
  
  - identifier: "$.response.body.score"
    operator: between
    expected: [0, 100]
```

### Type Validation

#### `type`
Validate data type:

```yaml
expect:
  - identifier: "$.response.body.name"
    operator: type
    expected: "string"
  
  - identifier: "$.response.body.age"
    operator: type
    expected: "number"
  
  - identifier: "$.response.body.isActive"
    operator: type
    expected: "boolean"
  
  - identifier: "$.response.body.tags"
    operator: type
    expected: "array"
  
  - identifier: "$.response.body.metadata"
    operator: type
    expected: "object"
  
  - identifier: "$.response.body.optional"
    operator: type
    expected: "null"
```

### Existence Operators

#### `exists`
Check if value exists (not null or undefined):

```yaml
expect:
  - identifier: "$.response.body.id"
    operator: exists
  
  - identifier: "$.response.body.createdAt"
    operator: exists
  
  - identifier: "$.response.headers['X-Request-ID']"
    operator: exists
```

#### `not_exists`
Check if value does not exist (null or undefined):

```yaml
expect:
  - identifier: "$.response.body.error"
    operator: not_exists
  
  - identifier: "$.response.body.deletedAt"
    operator: not_exists
```

### Array and Object Operators

#### `length`
Check array length or string length:

```yaml
expect:
  - identifier: "$.response.body.users"
    operator: length
    expected: 10
  
  - identifier: "$.response.body.name"
    operator: length
    expected: 8
  
  - identifier: "$.response.body.tags"
    operator: length
    expected: 0  # Empty array
```

#### `min_length`
Check minimum length:

```yaml
expect:
  - identifier: "$.response.body.users"
    operator: min_length
    expected: 1
  
  - identifier: "$.response.body.password"
    operator: min_length
    expected: 8
```

#### `max_length`
Check maximum length:

```yaml
expect:
  - identifier: "$.response.body.description"
    operator: max_length
    expected: 500
  
  - identifier: "$.response.body.tags"
    operator: max_length
    expected: 10
```

#### `empty`
Check if array or object is empty:

```yaml
expect:
  - identifier: "$.response.body.errors"
    operator: empty
  
  - identifier: "$.response.body.warnings"
    operator: empty
```

#### `not_empty`
Check if array or object is not empty:

```yaml
expect:
  - identifier: "$.response.body.data"
    operator: not_empty
  
  - identifier: "$.response.body.results"
    operator: not_empty
```

### Set Operators

#### `in`
Check if value is in a set of values:

```yaml
expect:
  - identifier: "$.response.status"
    operator: in
    expected: [200, 201, 202]
  
  - identifier: "$.response.body.status"
    operator: in
    expected: ["active", "pending", "verified"]
  
  - identifier: "$.response.body.role"
    operator: in
    expected: ["admin", "user", "moderator"]
```

#### `not_in`
Check if value is not in a set of values:

```yaml
expect:
  - identifier: "$.response.status"
    operator: not_in
    expected: [400, 401, 403, 404, 500]
  
  - identifier: "$.response.body.status"
    operator: not_in
    expected: ["banned", "deleted", "suspended"]
```

### Schema Validation

#### `schema`
Validate against JSON Schema or XSD:

```yaml
expect:
  - identifier: "$.response.body"
    operator: schema
    expected: "./schemas/user-response.json"
  
  - identifier: "$.response.body.user"
    operator: schema
    expected: "./schemas/user-object.json"
```

JSON Schema example (`schemas/user-response.json`):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "email"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^user_[0-9a-f]+$"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "isActive": {
      "type": "boolean"
    }
  }
}
```

### Custom Operators

#### `javascript`
Execute custom JavaScript validation:

```yaml
expect:
  - identifier: "$.response.body.createdAt"
    operator: javascript
    expected: "new Date(value) <= new Date()"
    description: "Created date should not be in the future"
  
  - identifier: "$.response.body.tags"
    operator: javascript
    expected: "Array.isArray(value) && value.every(tag => typeof tag === 'string')"
    description: "Tags should be array of strings"
  
  - identifier: "$.response.body.score"
    operator: javascript
    expected: "value >= 0 && value <= 100 && Number.isInteger(value)"
    description: "Score should be integer between 0 and 100"
```

## Content-Type Specific Validation

### JSON Response Validation

```yaml
steps:
  - name: json_api_call
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users"
    expect:
      # JSONPath syntax
      - identifier: "$.response.body.data[0].id"
        operator: exists
      
      - identifier: "$.response.body.pagination.total"
        operator: gt
        expected: 0
      
      - identifier: "$.response.body.data[*].email"
        operator: regex
        expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
```

### XML Response Validation

```yaml
steps:
  - name: xml_api_call
    type: api
    method: GET
    url: "{{$.env.API_URL}}/data.xml"
    expect:
      # XPath syntax
      - identifier: "$.response.body.root.users.user[1].@id"
        operator: exists
      
      - identifier: "$.response.body.root.metadata.total"
        operator: type
        expected: "number"
      
      - identifier: "$.response.body.root.users.user[*].email"
        operator: regex
        expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
```

### Text Response Validation

```yaml
steps:
  - name: text_api_call
    type: api
    method: GET
    url: "{{$.env.API_URL}}/status.txt"
    expect:
      - identifier: "$.response.body"
        operator: contains
        expected: "OK"
      
      - identifier: "$.response.body"
        operator: regex
        expected: "^Status: (OK|HEALTHY)$"
```

## Headers Validation

```yaml
steps:
  - name: header_validation
    type: api
    method: GET
    url: "{{$.env.API_URL}}/api/data"
    expect:
      # Standard headers
      - identifier: "$.response.headers['Content-Type']"
        operator: equals
        expected: "application/json; charset=utf-8"
      
      - identifier: "$.response.headers['Cache-Control']"
        operator: contains
        expected: "no-cache"
      
      # Custom headers
      - identifier: "$.response.headers['X-Rate-Limit-Remaining']"
        operator: gt
        expected: 0
      
      - identifier: "$.response.headers['X-Response-Time']"
        operator: lt
        expected: 1000
      
      # Headers with spaces
      - identifier: "$.response.headers['X-Custom Header']"
        operator: exists
```

## Conditional Validation

Execute validations based on conditions:

```yaml
steps:
  - name: conditional_validation
    type: api
    method: GET
    url: "{{$.env.API_URL}}/user/{{$.userId}}"
    expect:
      # Always validate
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      
      # Conditional validations
      - identifier: "$.response.body.isAdmin"
        operator: equals
        expected: true
        condition: "$.response.body.role === 'admin'"
      
      - identifier: "$.response.body.permissions"
        operator: not_empty
        condition: "$.response.body.isActive === true"
      
      - identifier: "$.response.body.lastLogin"
        operator: exists
        condition: "$.response.body.loginCount > 0"
```

## Complex Validation Examples

### API Response Validation

```yaml
steps:
  - name: comprehensive_user_validation
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users/{{$.userId}}"
    expect:
      # Status validation
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should return success status"
      
      # Response structure
      - identifier: "$.response.body"
        operator: type
        expected: "object"
        description: "Response should be an object"
      
      # Required fields
      - identifier: "$.response.body.id"
        operator: exists
        description: "User ID is required"
      
      - identifier: "$.response.body.email"
        operator: regex
        expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
        description: "Valid email format required"
      
      # Data integrity
      - identifier: "$.response.body.createdAt"
        operator: javascript
        expected: "new Date(value) <= new Date()"
        description: "Created date cannot be in future"
      
      - identifier: "$.response.body.age"
        operator: between
        expected: [0, 150]
        description: "Age must be realistic"
      
      # Business logic
      - identifier: "$.response.body.status"
        operator: in
        expected: ["active", "inactive", "pending"]
        description: "Status must be valid enum value"
      
      # Schema validation
      - identifier: "$.response.body"
        operator: schema
        expected: "./schemas/user.json"
        description: "Must match user schema"
```

### Error Response Validation

```yaml
steps:
  - name: error_handling_validation
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users/invalid-id"
    expect:
      # Error status
      - identifier: "$.response.status"
        operator: equals
        expected: 404
        description: "Should return not found status"
      
      # Error structure
      - identifier: "$.response.body.error"
        operator: type
        expected: "object"
        description: "Error should be structured object"
      
      - identifier: "$.response.body.error.code"
        operator: exists
        description: "Error code should be provided"
      
      - identifier: "$.response.body.error.message"
        operator: type
        expected: "string"
        description: "Error message should be string"
      
      - identifier: "$.response.body.error.timestamp"
        operator: exists
        description: "Error timestamp should be included"
```

### Performance Validation

```yaml
steps:
  - name: performance_validation
    type: api
    method: GET
    url: "{{$.env.API_URL}}/heavy-operation"
    expect:
      # Response time
      - identifier: "$.response.timing.duration"
        operator: lt
        expected: 5000
        description: "Response should be under 5 seconds"
      
      # Response size
      - identifier: "$.response.size"
        operator: lt
        expected: 1048576  # 1MB
        description: "Response should be under 1MB"
      
      # Headers
      - identifier: "$.response.headers['X-Response-Time']"
        operator: exists
        description: "Performance header should be present"
```

## Validation Best Practices

### 1. Use Descriptive Messages

```yaml
expect:
  - identifier: "$.response.status"
    operator: equals
    expected: 200
    description: "User creation should return 200 OK status"
  
  - identifier: "$.response.body.id"
    operator: regex
    expected: "^user_[0-9a-f]{8}$"
    description: "User ID should follow format: user_xxxxxxxx"
```

### 2. Validate Different Aspects

```yaml
expect:
  # Status validation
  - identifier: "$.response.status"
    operator: equals
    expected: 201
  
  # Data validation
  - identifier: "$.response.body.email"
    operator: equals
    expected: "{{$.request.body.email}}"
  
  # Type validation
  - identifier: "$.response.body.createdAt"
    operator: type
    expected: "string"
  
  # Business logic validation
  - identifier: "$.response.body.status"
    operator: equals
    expected: "pending"
  
  # Schema validation
  - identifier: "$.response.body"
    operator: schema
    expected: "./schemas/user-created.json"
```

### 3. Group Related Validations

```yaml
expect:
  # Authentication validations
  - identifier: "$.response.status"
    operator: in
    expected: [200, 201]
    description: "Authentication should succeed"
  
  - identifier: "$.response.body.token"
    operator: exists
    description: "Auth token should be provided"
  
  - identifier: "$.response.body.expiresAt"
    operator: javascript
    expected: "new Date(value) > new Date()"
    description: "Token should not be expired"
  
  # User data validations
  - identifier: "$.response.body.user.id"
    operator: exists
    description: "User ID should be present"
  
  - identifier: "$.response.body.user.role"
    operator: in
    expected: ["admin", "user", "guest"]
    description: "User role should be valid"
```

### 4. Use Schema Validation for Complex Objects

Instead of multiple field validations:

```yaml
# Avoid this approach for complex objects
expect:
  - identifier: "$.response.body.name"
    operator: type
    expected: "string"
  - identifier: "$.response.body.email"
    operator: regex
    expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
  - identifier: "$.response.body.age"
    operator: between
    expected: [0, 150]
  # ... many more validations

# Use schema validation instead
expect:
  - identifier: "$.response.body"
    operator: schema
    expected: "./schemas/user.json"
    description: "User object should match schema"
```

### 5. Handle Edge Cases

```yaml
expect:
  # Happy path
  - identifier: "$.response.status"
    operator: equals
    expected: 200
  
  # Edge cases
  - identifier: "$.response.body.data"
    operator: type
    expected: "array"
    condition: "$.response.body.total > 0"
  
  - identifier: "$.response.body.data"
    operator: empty
    condition: "$.response.body.total === 0"
  
  - identifier: "$.response.body.nextPage"
    operator: exists
    condition: "$.response.body.hasMore === true"
```

For advanced validation scenarios and custom operators, see the [Reference Guide](/reference/validation-operators).