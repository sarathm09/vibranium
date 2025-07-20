# Vibranium CLI Examples

This directory contains comprehensive examples demonstrating the capabilities of the Vibranium CLI tool for API testing and automation.

## Directory Structure

```
apps/examples/
├── scenarios/          # Example scenario files
│   ├── basic-api-test.yaml       # Basic CRUD operations
│   ├── crud-operations.yaml      # Complex workflows with dependencies
│   ├── authentication-test.yaml  # Authentication patterns
│   └── validation-examples.yaml  # All validation operators
├── environments/       # Environment configurations
│   ├── local.json      # Local development settings
│   └── staging.json    # Staging environment settings
├── schemas/           # JSON schemas for validation
│   ├── user-schema.json
│   └── post-schema.json
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Vibranium CLI built and available

### Running Examples

1. **Basic API Test**
   ```bash
   vibranium run scenarios/basic-api-test.yaml --env local
   ```

2. **CRUD Operations with Dependencies**
   ```bash
   vibranium run scenarios/crud-operations.yaml --env local
   ```

3. **Authentication Flow**
   ```bash
   vibranium run scenarios/authentication-test.yaml --env local
   ```

4. **Validation Showcase**
   ```bash
   vibranium run scenarios/validation-examples.yaml --env local
   ```

## Example Scenarios

### 1. Basic API Test (`basic-api-test.yaml`)

Demonstrates fundamental HTTP operations:
- **GET** requests with response validation
- **POST** requests with JSON payloads
- **PUT** requests for updates
- **DELETE** operations
- Status code validation
- JSON path assertions
- Array length checks

**Key Features:**
- Uses JSONPlaceholder API for realistic testing
- Shows variable substitution with `${$.variables.*}`
- Demonstrates multiple validation operators
- Tests all basic HTTP methods

### 2. CRUD Operations (`crud-operations.yaml`)

Shows advanced workflow patterns:
- **Step Dependencies** using `depends_on`
- **Response Data Extraction** with `saveResponse`
- **Variable Passing** between steps
- **Dynamic Data Generation** with random generators
- **Complex Object Creation** with nested structures

**Key Features:**
- Creates a user with random data
- Uses the created user ID in subsequent requests
- Shows how to build dependent workflows
- Demonstrates response data reuse

### 3. Authentication Test (`authentication-test.yaml`)

Covers authentication patterns:
- **Bearer Token Authentication**
- **API Key Headers**
- **Token Refresh Simulation**
- **Protected Resource Access**
- **Authentication Workflows**

**Key Features:**
- Mock authentication flow
- Token extraction and reuse
- Multiple authentication methods
- Realistic auth patterns

### 4. Validation Examples (`validation-examples.yaml`)

Comprehensive validation operator showcase:

#### Status Code Validation
- `statusCode`: Exact status code match
- `statusCodeIn`: Status code in range

#### Equality Operators
- `equals`: Exact value match
- `notEquals`: Value inequality
- `contains`: String/array contains
- `startsWith`: String prefix match
- `endsWith`: String suffix match

#### Numeric Comparisons
- `greaterThan`: Numeric comparison
- `lessThan`: Numeric comparison
- `between`: Range validation

#### String Operations
- `regex`: Regular expression matching
- `length`: String length validation

#### Array Operations
- `arrayLength`: Exact array length
- `arrayMinLength`: Minimum array length
- `arrayMaxLength`: Maximum array length
- `arrayContains`: Array element check
- `arrayNotContains`: Array exclusion check

#### Type and Existence Checks
- `exists`: Field presence validation
- `notExists`: Field absence validation
- `type`: Data type validation

#### Schema Validation
- `schema`: JSON Schema validation
- Complex nested object validation

#### Header Validation
- `headerExists`: HTTP header presence
- `headerEquals`: HTTP header value match
- `headerContains`: HTTP header partial match

#### Performance Validation
- `responseTime`: Response time limits

## Environment Configuration

### Local Environment (`environments/local.json`)

Development environment settings:
- Local API endpoints
- Debug mode enabled
- Detailed logging
- Development credentials
- Got HTTP adapter
- HTML and JSON reporting

### Staging Environment (`environments/staging.json`)

Production-like environment:
- Staging API endpoints
- Production-like settings
- Environment variable integration
- Axios HTTP adapter
- Bearer token authentication
- JUnit reporting for CI/CD

### Configuration Features

- **Variable Management**: Environment-specific variables
- **Secret Handling**: Secure credential management
- **HTTP Client Configuration**: Adapter selection and settings
- **Reporting Options**: Multiple output formats
- **Validation Settings**: Strict mode and fail-fast options

## Variable System

The Vibranium CLI supports a powerful variable system with dot notation:

### Environment Variables
```yaml
variables:
  baseUrl: "${$.env.API_BASE_URL}"
  apiKey: "${$.env.API_KEY}"
```

### Random Data Generation
```yaml
variables:
  email: "${$.random.email}"
  name: "${$.random.firstName} ${$.random.lastName}"
  userId: "${$.random.number(1, 1000)}"
```

### Response Data Extraction
```yaml
saveResponse:
  userId: "$.id"
  token: "$.access_token"

# Use in subsequent requests
url: "${$.variables.baseUrl}/users/${$.response.Create User.userId}"
```

### Static Variables
```yaml
variables:
  apiVersion: "v1"
  timeout: 5000
```

## Validation Patterns

### Basic Assertions
```yaml
expect:
  - operator: "statusCode"
    value: 200
  - operator: "equals"
    path: "$.id"
    value: 1
```

### Complex Validations
```yaml
expect:
  - operator: "schema"
    value:
      type: "object"
      required: ["id", "name", "email"]
      properties:
        id:
          type: "integer"
          minimum: 1
        name:
          type: "string"
          minLength: 1
        email:
          type: "string"
          format: "email"
```

### Array Validations
```yaml
expect:
  - operator: "arrayLength"
    path: "$"
    value: 100
  - operator: "arrayContains"
    path: "$[*].userId"
    value: 1
```

## JSON Schemas

The `schemas/` directory contains JSON Schema definitions for validation:

### User Schema (`schemas/user-schema.json`)
- Complete user object validation
- Nested address object validation
- Email format validation
- Company information validation

### Post Schema (`schemas/post-schema.json`)
- Blog post structure validation
- Required field validation
- String length constraints

## CLI Commands Reference

### Run Single Scenario
```bash
vibranium run <scenario-file> [options]
```

Options:
- `--env <environment>`: Environment configuration
- `--output <format>`: Report format (json, html, junit)
- `--verbose`: Detailed logging
- `--no-color`: Disable colored output

### Batch Execution
```bash
vibranium batch <directory> [options]
```

Options:
- `--parallel <count>`: Parallel execution
- `--fail-fast`: Stop on first failure
- `--output-dir <path>`: Report output directory

### Initialize New Scenario
```bash
vibranium init <scenario-name>
```

### Validate Scenario
```bash
vibranium validate <scenario-file>
```

### Version Information
```bash
vibranium version
```

### Help System
```bash
vibranium --help
vibranium <command> --help
```

## Testing Results

All example scenarios have been tested against the JSONPlaceholder API to ensure:

1. **Correct HTTP Methods**: All CRUD operations work as expected
2. **Variable Substitution**: Environment and dynamic variables resolve properly
3. **Validation Operators**: All assertion types pass with correct data
4. **Step Dependencies**: Workflow orchestration functions correctly
5. **Authentication Patterns**: Token handling and header management work
6. **Error Handling**: Invalid scenarios fail with appropriate messages

## Expected Outputs

### Successful Test Run
```
✅ Basic API Testing Examples
├── ✅ Get All Posts (200ms)
├── ✅ Get Single Post (150ms)
├── ✅ Create New Post (180ms)
├── ✅ Update Post (160ms)
└── ✅ Delete Post (140ms)

Summary: 5/5 passed, 0 failed, 830ms total
```

### Failed Test Example
```
❌ Authentication Flow Examples
├── ✅ Mock Authentication Request (200ms)
├── ❌ Protected Resource Access (250ms)
   └── Expected status code 201, got 401
└── ⏭️ Skipped: Token Refresh Simulation (depends on failed step)

Summary: 1/3 passed, 1 failed, 1 skipped, 450ms total
```

## Troubleshooting

### Common Issues

1. **Network Connectivity**
   - Ensure internet connection for JSONPlaceholder API
   - Check firewall settings

2. **Environment Variables**
   - Verify environment files are properly formatted
   - Check variable resolution in logs

3. **JSON Path Errors**
   - Validate JSON path syntax
   - Use array notation for array access

4. **Schema Validation**
   - Ensure JSON schemas are valid
   - Check required field definitions

### Debug Mode

Enable debug logging:
```bash
vibranium run scenario.yaml --env local --verbose
```

This provides:
- Detailed HTTP request/response logs
- Variable resolution traces
- Validation step-by-step results
- Timing information

## Contributing

To add new examples:

1. Create scenario files in `scenarios/`
2. Add environment configurations in `environments/`
3. Include JSON schemas in `schemas/` if needed
4. Update this README with documentation
5. Test scenarios against real APIs

## API References

The examples use these public APIs:
- **JSONPlaceholder**: https://jsonplaceholder.typicode.com
  - Free testing API
  - Supports all HTTP methods
  - Returns realistic JSON data
  - Perfect for demonstration purposes

## Performance Expectations

Typical execution times for examples:
- Basic API Test: ~1-2 seconds
- CRUD Operations: ~3-5 seconds
- Authentication Test: ~2-3 seconds
- Validation Examples: ~4-6 seconds

Times may vary based on network conditions and API response times.