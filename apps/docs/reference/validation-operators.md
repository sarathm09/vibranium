# Validation Operators Reference

This reference provides comprehensive documentation for all validation operators available in Vibranium CLI. Each operator includes syntax, examples, and use cases.

## Operator Categories

- **[Equality Operators](#equality-operators)** - Compare values for equality/inequality
- **[String Operators](#string-operators)** - String-specific validations
- **[Numeric Operators](#numeric-operators)** - Numeric comparisons and ranges
- **[Type Operators](#type-operators)** - Data type validation
- **[Existence Operators](#existence-operators)** - Check if values exist
- **[Collection Operators](#collection-operators)** - Array and object validations
- **[Set Operators](#set-operators)** - Value membership testing
- **[Schema Operators](#schema-operators)** - Schema-based validation
- **[Custom Operators](#custom-operators)** - Custom JavaScript validations

## Equality Operators

### `equals`

Performs strict equality comparison using `===`.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: equals
  expected: expectedValue
```

**Examples:**
```yaml
# Numeric equality
- identifier: "$.response.status"
  operator: equals
  expected: 200

# String equality
- identifier: "$.response.body.name"
  operator: equals
  expected: "John Doe"

# Boolean equality
- identifier: "$.response.body.isActive"
  operator: equals
  expected: true

# Null equality
- identifier: "$.response.body.deletedAt"
  operator: equals
  expected: null

# Object equality (deep comparison)
- identifier: "$.response.body.metadata"
  operator: equals
  expected: { "source": "api", "version": "1.0" }
```

**Use Cases:**
- Status code validation
- Exact string matches
- Boolean flag verification
- Null value checks

### `not_equals`

Performs strict inequality comparison using `!==`.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: not_equals
  expected: unexpectedValue
```

**Examples:**
```yaml
# Should not be error status
- identifier: "$.response.status"
  operator: not_equals
  expected: 500

# Should not be null
- identifier: "$.response.body.id"
  operator: not_equals
  expected: null

# Should not be empty string
- identifier: "$.response.body.name"
  operator: not_equals
  expected: ""
```

## String Operators

### `contains`

Checks if a string contains a substring or if an array contains an element.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: contains
  expected: substring_or_element
```

**Examples:**
```yaml
# String contains
- identifier: "$.response.body.message"
  operator: contains
  expected: "success"

# Array contains
- identifier: "$.response.body.tags"
  operator: contains
  expected: "important"

# Header contains
- identifier: "$.response.headers['Content-Type']"
  operator: contains
  expected: "application/json"

# Case-sensitive search
- identifier: "$.response.body.description"
  operator: contains
  expected: "API"
```

**Use Cases:**
- Message content validation
- Tag/category membership
- Content-Type verification
- Error message detection

### `not_contains`

Checks if a string does not contain a substring or if an array does not contain an element.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: not_contains
  expected: unwanted_substring_or_element
```

**Examples:**
```yaml
# Should not contain error keywords
- identifier: "$.response.body.message"
  operator: not_contains
  expected: "error"

# Array should not contain forbidden values
- identifier: "$.response.body.permissions"
  operator: not_contains
  expected: "admin"
```

### `starts_with`

Checks if a string starts with a specific prefix.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: starts_with
  expected: prefix
```

**Examples:**
```yaml
# ID prefix validation
- identifier: "$.response.body.id"
  operator: starts_with
  expected: "user_"

# URL protocol validation
- identifier: "$.response.body.avatar_url"
  operator: starts_with
  expected: "https://"

# Phone number format
- identifier: "$.response.body.phone"
  operator: starts_with
  expected: "+1"
```

### `ends_with`

Checks if a string ends with a specific suffix.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: ends_with
  expected: suffix
```

**Examples:**
```yaml
# Email domain validation
- identifier: "$.response.body.email"
  operator: ends_with
  expected: "@company.com"

# File extension validation
- identifier: "$.response.body.filename"
  operator: ends_with
  expected: ".pdf"

# URL path validation
- identifier: "$.response.body.callback_url"
  operator: ends_with
  expected: "/webhook"
```

### `regex`

Validates a string against a regular expression pattern.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: regex
  expected: "regex_pattern"
```

**Examples:**
```yaml
# Email validation
- identifier: "$.response.body.email"
  operator: regex
  expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"

# Phone number validation
- identifier: "$.response.body.phone"
  operator: regex
  expected: "^\\+?[1-9]\\d{1,14}$"

# UUID validation
- identifier: "$.response.body.id"
  operator: regex
  expected: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"

# Date format validation (ISO 8601)
- identifier: "$.response.body.created_at"
  operator: regex
  expected: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$"

# Credit card validation (basic)
- identifier: "$.response.body.card_number"
  operator: regex
  expected: "^\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}$"
```

## Numeric Operators

### `gt` (Greater Than)

Checks if a numeric value is greater than the expected value.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: gt
  expected: number
```

**Examples:**
```yaml
# Age validation
- identifier: "$.response.body.age"
  operator: gt
  expected: 18

# Price validation
- identifier: "$.response.body.price"
  operator: gt
  expected: 0

# Response time validation
- identifier: "$.response.timing.duration"
  operator: gt
  expected: 0

# Array length validation
- identifier: "$.response.body.items.length"
  operator: gt
  expected: 5
```

### `gte` (Greater Than or Equal)

Checks if a numeric value is greater than or equal to the expected value.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: gte
  expected: number
```

**Examples:**
```yaml
# Minimum score validation
- identifier: "$.response.body.score"
  operator: gte
  expected: 0

# Inventory check
- identifier: "$.response.body.stock"
  operator: gte
  expected: 1

# Rating validation
- identifier: "$.response.body.rating"
  operator: gte
  expected: 1
```

### `lt` (Less Than)

Checks if a numeric value is less than the expected value.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: lt
  expected: number
```

**Examples:**
```yaml
# Response time constraint
- identifier: "$.response.timing.duration"
  operator: lt
  expected: 1000

# Error count limit
- identifier: "$.response.body.error_count"
  operator: lt
  expected: 5

# Age limit
- identifier: "$.response.body.age"
  operator: lt
  expected: 65
```

### `lte` (Less Than or Equal)

Checks if a numeric value is less than or equal to the expected value.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: lte
  expected: number
```

**Examples:**
```yaml
# Maximum users limit
- identifier: "$.response.body.user_count"
  operator: lte
  expected: 100

# Timeout validation
- identifier: "$.response.body.timeout"
  operator: lte
  expected: 30000

# Percentage validation
- identifier: "$.response.body.completion"
  operator: lte
  expected: 100
```

### `between`

Checks if a numeric value is within a specified range (inclusive).

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: between
  expected: [min, max]
```

**Examples:**
```yaml
# Age range validation
- identifier: "$.response.body.age"
  operator: between
  expected: [18, 65]

# Score range validation
- identifier: "$.response.body.score"
  operator: between
  expected: [0, 100]

# Temperature range
- identifier: "$.response.body.temperature"
  operator: between
  expected: [-10, 50]

# Response time window
- identifier: "$.response.timing.duration"
  operator: between
  expected: [100, 2000]
```

## Type Operators

### `type`

Validates the JavaScript type of a value.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: type
  expected: "type_name"
```

**Supported Types:**
- `"string"` - String values
- `"number"` - Numeric values (integer or float)
- `"boolean"` - Boolean values (true/false)
- `"array"` - Array values
- `"object"` - Object values (excluding arrays and null)
- `"null"` - Null values
- `"undefined"` - Undefined values

**Examples:**
```yaml
# String validation
- identifier: "$.response.body.name"
  operator: type
  expected: "string"

# Number validation
- identifier: "$.response.body.age"
  operator: type
  expected: "number"

# Boolean validation
- identifier: "$.response.body.is_active"
  operator: type
  expected: "boolean"

# Array validation
- identifier: "$.response.body.tags"
  operator: type
  expected: "array"

# Object validation
- identifier: "$.response.body.metadata"
  operator: type
  expected: "object"

# Null validation
- identifier: "$.response.body.deleted_at"
  operator: type
  expected: "null"
```

## Existence Operators

### `exists`

Checks if a value exists (is not null or undefined).

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: exists
```

**Examples:**
```yaml
# Required field validation
- identifier: "$.response.body.id"
  operator: exists

# Header presence validation
- identifier: "$.response.headers['X-Request-ID']"
  operator: exists

# Nested property validation
- identifier: "$.response.body.user.profile.avatar"
  operator: exists

# Array element validation
- identifier: "$.response.body.items[0]"
  operator: exists
```

### `not_exists`

Checks if a value does not exist (is null or undefined).

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: not_exists
```

**Examples:**
```yaml
# Error should not exist
- identifier: "$.response.body.error"
  operator: not_exists

# Deleted timestamp should be null
- identifier: "$.response.body.deleted_at"
  operator: not_exists

# Optional field should not be present
- identifier: "$.response.body.internal_notes"
  operator: not_exists
```

## Collection Operators

### `length`

Validates the length of an array or string.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: length
  expected: number
```

**Examples:**
```yaml
# Array length validation
- identifier: "$.response.body.users"
  operator: length
  expected: 10

# String length validation
- identifier: "$.response.body.name"
  operator: length
  expected: 8

# Empty array validation
- identifier: "$.response.body.errors"
  operator: length
  expected: 0

# Object properties count
- identifier: "Object.keys($.response.body.metadata)"
  operator: length
  expected: 3
```

### `min_length`

Validates the minimum length of an array or string.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: min_length
  expected: number
```

**Examples:**
```yaml
# Minimum users required
- identifier: "$.response.body.users"
  operator: min_length
  expected: 1

# Password length requirement
- identifier: "$.response.body.password"
  operator: min_length
  expected: 8

# Minimum tags required
- identifier: "$.response.body.tags"
  operator: min_length
  expected: 2
```

### `max_length`

Validates the maximum length of an array or string.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: max_length
  expected: number
```

**Examples:**
```yaml
# Description length limit
- identifier: "$.response.body.description"
  operator: max_length
  expected: 500

# Maximum tags allowed
- identifier: "$.response.body.tags"
  operator: max_length
  expected: 10

# Username length limit
- identifier: "$.response.body.username"
  operator: max_length
  expected: 50
```

### `empty`

Checks if an array or object is empty.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: empty
```

**Examples:**
```yaml
# No errors should be present
- identifier: "$.response.body.errors"
  operator: empty

# No warnings
- identifier: "$.response.body.warnings"
  operator: empty

# Empty object validation
- identifier: "$.response.body.optional_data"
  operator: empty
```

### `not_empty`

Checks if an array or object is not empty.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: not_empty
```

**Examples:**
```yaml
# Should have data
- identifier: "$.response.body.data"
  operator: not_empty

# Should have results
- identifier: "$.response.body.search_results"
  operator: not_empty

# Should have metadata
- identifier: "$.response.body.metadata"
  operator: not_empty
```

## Set Operators

### `in`

Checks if a value is in a set of allowed values.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: in
  expected: [value1, value2, value3]
```

**Examples:**
```yaml
# Status code validation
- identifier: "$.response.status"
  operator: in
  expected: [200, 201, 202]

# Role validation
- identifier: "$.response.body.role"
  operator: in
  expected: ["admin", "user", "moderator"]

# Category validation
- identifier: "$.response.body.category"
  operator: in
  expected: ["electronics", "clothing", "books"]

# HTTP method validation
- identifier: "$.request.method"
  operator: in
  expected: ["GET", "POST", "PUT", "PATCH"]
```

### `not_in`

Checks if a value is not in a set of forbidden values.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: not_in
  expected: [forbidden1, forbidden2, forbidden3]
```

**Examples:**
```yaml
# Should not be error status
- identifier: "$.response.status"
  operator: not_in
  expected: [400, 401, 403, 404, 500, 502, 503]

# Should not have forbidden roles
- identifier: "$.response.body.role"
  operator: not_in
  expected: ["banned", "suspended", "deleted"]

# Should not contain test data
- identifier: "$.response.body.email"
  operator: not_in
  expected: ["test@test.com", "admin@test.com"]
```

## Schema Operators

### `schema`

Validates data against a JSON Schema or XSD file.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: schema
  expected: "path/to/schema.json"
```

**JSON Schema Example:**

**File: `schemas/user.json`**
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
    "is_active": {
      "type": "boolean"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "maxItems": 10
    }
  }
}
```

**Usage:**
```yaml
- identifier: "$.response.body"
  operator: schema
  expected: "./schemas/user.json"

- identifier: "$.response.body.profile"
  operator: schema
  expected: "./schemas/user-profile.json"

- identifier: "$.response.body.address"
  operator: schema
  expected: "./schemas/address.json"
```

## Custom Operators

### `javascript`

Executes custom JavaScript validation logic.

**Syntax:**
```yaml
- identifier: "path.to.value"
  operator: javascript
  expected: "javascript_expression"
```

**Available Variables:**
- `value` - The actual value being validated
- `context` - Execution context with access to other variables

**Examples:**
```yaml
# Date validation (not in future)
- identifier: "$.response.body.created_at"
  operator: javascript
  expected: "new Date(value) <= new Date()"

# Array of strings validation
- identifier: "$.response.body.tags"
  operator: javascript
  expected: "Array.isArray(value) && value.every(tag => typeof tag === 'string')"

# Score range validation
- identifier: "$.response.body.score"
  operator: javascript
  expected: "value >= 0 && value <= 100 && Number.isInteger(value)"

# Email domain validation
- identifier: "$.response.body.email"
  operator: javascript
  expected: "value.endsWith('@company.com')"

# Complex business rule
- identifier: "$.response.body"
  operator: javascript
  expected: |
    value.age >= 18 && 
    value.status === 'active' && 
    value.email_verified === true &&
    value.created_at > '2020-01-01'

# Cross-field validation
- identifier: "$.response.body"
  operator: javascript
  expected: "value.start_date < value.end_date"

# Array validation with custom logic
- identifier: "$.response.body.permissions"
  operator: javascript
  expected: |
    Array.isArray(value) &&
    value.length > 0 &&
    value.includes('read') &&
    (value.includes('admin') ? value.includes('write') : true)
```

## Operator Combinations

You can combine multiple operators to create comprehensive validations:

```yaml
expect:
  # Status validation
  - identifier: "$.response.status"
    operator: equals
    expected: 200
  
  # Type and existence validation
  - identifier: "$.response.body.users"
    operator: type
    expected: "array"
  
  - identifier: "$.response.body.users"
    operator: not_empty
  
  # Length constraints
  - identifier: "$.response.body.users"
    operator: min_length
    expected: 1
  
  - identifier: "$.response.body.users"
    operator: max_length
    expected: 100
  
  # String format validation
  - identifier: "$.response.body.users[0].email"
    operator: regex
    expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
  
  # Value constraints
  - identifier: "$.response.body.users[0].age"
    operator: between
    expected: [0, 150]
  
  # Schema validation
  - identifier: "$.response.body"
    operator: schema
    expected: "./schemas/users-response.json"
```

## Error Messages

Each operator provides descriptive error messages when validation fails:

```yaml
- identifier: "$.response.body.email"
  operator: regex
  expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
  description: "Email must be in valid format"
```

**Example Error Output:**
```
❌ Email validation failed
   Expected: Email must be in valid format
   Actual: "invalid-email"
   Pattern: ^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$
```

For more validation examples and patterns, see the [Validation Guide](/guide/validation).