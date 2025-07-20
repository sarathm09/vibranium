# Basic API Testing

This guide provides practical examples of basic API testing scenarios using Vibranium CLI. These examples demonstrate common testing patterns and best practices.

## Simple Health Check

Start with a basic health check to verify API availability:

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
        description: "API should be healthy"
      - identifier: "$.response.body.status"
        operator: equals
        expected: "ok"
        description: "Health status should be ok"
```

**Environment file (`environments/local.json`):**
```json
{
  "environment": "local",
  "variables": {
    "API_URL": "https://httpbin.org"
  }
}
```

**Run the test:**
```bash
vm run health-check.yaml --env local
```

## CRUD Operations

Test the complete Create, Read, Update, Delete cycle:

```yaml
name: user_crud_operations
description: "Complete CRUD operations for user management"
version: "1.0"
tags: ["crud", "user", "api"]

variables:
  baseUrl: "{{$.env.API_URL}}"
  testUser:
    name: "John Doe"
    email: "john@example.com"

steps:
  # CREATE - Create a new user
  - name: create_user
    description: "Create a new user"
    type: api
    method: POST
    url: "{{$.variables.baseUrl}}/users"
    headers:
      Content-Type: "application/json"
    body:
      name: "{{$.variables.testUser.name}}"
      email: "{{$.variables.testUser.email}}"
      job: "Software Engineer"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
        description: "User should be created successfully"
      - identifier: "$.response.body.name"
        operator: equals
        expected: "{{$.variables.testUser.name}}"
        description: "Name should match request"
      - identifier: "$.response.body.id"
        operator: exists
        description: "User ID should be generated"
    extract:
      - name: userId
        identifier: "$.response.body.id"

  # READ - Retrieve the created user
  - name: get_user
    description: "Retrieve the created user"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: GET
    url: "{{$.variables.baseUrl}}/users/{{$.user.extract.userId}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "User should be retrieved successfully"
      - identifier: "$.response.body.name"
        operator: equals
        expected: "{{$.variables.testUser.name}}"
        description: "Retrieved name should match created user"
      - identifier: "$.response.body.email"
        operator: equals
        expected: "{{$.variables.testUser.email}}"
        description: "Retrieved email should match created user"

  # UPDATE - Update the user information
  - name: update_user
    description: "Update user information"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: PUT
    url: "{{$.variables.baseUrl}}/users/{{$.user.extract.userId}}"
    headers:
      Content-Type: "application/json"
    body:
      name: "Jane Doe"
      email: "jane@example.com"
      job: "Senior Software Engineer"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "User should be updated successfully"
      - identifier: "$.response.body.name"
        operator: equals
        expected: "Jane Doe"
        description: "Name should be updated"

  # READ AGAIN - Verify the update
  - name: verify_update
    description: "Verify the user was updated"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: GET
    url: "{{$.variables.baseUrl}}/users/{{$.user.extract.userId}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.name"
        operator: equals
        expected: "Jane Doe"
        description: "Updated name should persist"

  # DELETE - Remove the user
  - name: delete_user
    description: "Delete the test user"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: DELETE
    url: "{{$.variables.baseUrl}}/users/{{$.user.extract.userId}}"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 204]
        description: "User should be deleted successfully"

  # VERIFY DELETE - Confirm user is gone
  - name: verify_delete
    description: "Verify user was deleted"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: GET
    url: "{{$.variables.baseUrl}}/users/{{$.user.extract.userId}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 404
        description: "Deleted user should not be found"
```

## Data Validation Examples

Test different types of data validation:

```yaml
name: data_validation_examples
description: "Examples of different validation operators"
steps:
  - name: get_user_data
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users/1"
    expect:
      # Status validation
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should return successful response"
      
      # Type validation
      - identifier: "$.response.body.data"
        operator: type
        expected: "object"
        description: "Data should be an object"
      
      # String validation
      - identifier: "$.response.body.data.email"
        operator: regex
        expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
        description: "Email should be valid format"
      
      # Numeric validation
      - identifier: "$.response.body.data.id"
        operator: gt
        expected: 0
        description: "ID should be positive number"
      
      # Existence validation
      - identifier: "$.response.body.data.first_name"
        operator: exists
        description: "First name should be present"
      
      # String content validation
      - identifier: "$.response.body.data.avatar"
        operator: starts_with
        expected: "https://"
        description: "Avatar should be HTTPS URL"
      
      # Array validation
      - identifier: "$.response.body.support"
        operator: type
        expected: "object"
        description: "Support should be an object"
      
      - identifier: "$.response.body.support.url"
        operator: contains
        expected: "reqres.in"
        description: "Support URL should contain domain"

  - name: get_users_list
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users"
    query:
      page: 1
      per_page: 5
    expect:
      # Array length validation
      - identifier: "$.response.body.data"
        operator: type
        expected: "array"
        description: "Data should be an array"
      
      - identifier: "$.response.body.data"
        operator: max_length
        expected: 5
        description: "Should not exceed per_page limit"
      
      - identifier: "$.response.body.data"
        operator: min_length
        expected: 1
        description: "Should have at least one user"
      
      # Pagination validation
      - identifier: "$.response.body.page"
        operator: equals
        expected: 1
        description: "Should return requested page"
      
      - identifier: "$.response.body.per_page"
        operator: equals
        expected: 5
        description: "Should return requested page size"
      
      - identifier: "$.response.body.total"
        operator: gt
        expected: 0
        description: "Total should be positive"
      
      # Set validation
      - identifier: "$.response.body.page"
        operator: in
        expected: [1, 2, 3, 4, 5]
        description: "Page should be valid number"
```

## Error Handling

Test error scenarios and edge cases:

```yaml
name: error_handling_tests
description: "Test error scenarios and edge cases"
steps:
  # Test 404 Not Found
  - name: test_not_found
    description: "Test 404 response for non-existent resource"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users/999999"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 404
        description: "Should return 404 for non-existent user"
      
      - identifier: "$.response.body"
        operator: type
        expected: "object"
        description: "Error response should be an object"

  # Test 400 Bad Request
  - name: test_bad_request
    description: "Test 400 response for invalid data"
    type: api
    method: POST
    url: "{{$.env.API_URL}}/users"
    headers:
      Content-Type: "application/json"
    body:
      # Missing required fields
      name: ""
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 400
        description: "Should return 400 for invalid data"

  # Test method not allowed
  - name: test_method_not_allowed
    description: "Test 405 response for unsupported method"
    type: api
    method: PATCH
    url: "{{$.env.API_URL}}/users"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [405, 501]
        description: "Should return 405 or 501 for unsupported method"
```

## Random Data Generation

Use random data generators for realistic testing:

```yaml
name: random_data_testing
description: "Testing with randomly generated data"
variables:
  iterations: 3

steps:
  - name: create_random_user
    description: "Create user with random data"
    type: api
    method: POST
    url: "{{$.env.API_URL}}/users"
    headers:
      Content-Type: "application/json"
    body:
      name: "{{$.random.name}}"
      email: "{{$.random.email}}"
      phone: "{{$.random.phone}}"
      website: "{{$.random.internet.url}}"
      company:
        name: "{{$.random.company.name}}"
        catchPhrase: "{{$.random.company.catchPhrase}}"
        bs: "{{$.random.company.bs}}"
      address:
        street: "{{$.random.address.streetAddress}}"
        suite: "{{$.random.address.secondaryAddress}}"
        city: "{{$.random.address.city}}"
        zipcode: "{{$.random.address.zipCode}}"
        geo:
          lat: "{{$.random.address.latitude}}"
          lng: "{{$.random.address.longitude}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
        description: "User should be created with random data"
      
      - identifier: "$.response.body.name"
        operator: type
        expected: "string"
        description: "Name should be a string"
      
      - identifier: "$.response.body.email"
        operator: regex
        expected: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
        description: "Generated email should be valid"
      
      - identifier: "$.response.body.phone"
        operator: exists
        description: "Phone should be generated"
      
      - identifier: "$.response.body.website"
        operator: starts_with
        expected: "http"
        description: "Website should be valid URL"
```

## Headers and Authentication

Test various authentication methods and headers:

```yaml
name: authentication_examples
description: "Different authentication and header examples"
steps:
  # Bearer token authentication
  - name: bearer_token_auth
    description: "Test with Bearer token authentication"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/protected/users"
    headers:
      Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
      Accept: "application/json"
      User-Agent: "VibraniumCLI/1.0"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 401]
        description: "Should return 200 or 401 based on token validity"

  # API key authentication
  - name: api_key_auth
    description: "Test with API key authentication"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/api/data"
    headers:
      X-API-Key: "{{$.env.API_KEY}}"
      Content-Type: "application/json"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 401, 403]
        description: "Should handle API key validation"

  # Custom headers
  - name: custom_headers
    description: "Test with custom headers"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users"
    headers:
      X-Request-ID: "{{$.context.executionId}}"
      X-Client-Version: "1.0.0"
      X-Feature-Flag: "new-ui"
      Accept-Language: "en-US,en;q=0.9"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      
      # Verify response headers
      - identifier: "$.response.headers['X-Request-ID']"
        operator: equals
        expected: "{{$.context.executionId}}"
        description: "Request ID should be echoed back"
```

## Query Parameters

Test different query parameter scenarios:

```yaml
name: query_parameters_testing
description: "Testing various query parameter scenarios"
steps:
  # Simple query parameters
  - name: simple_query_params
    description: "Test basic query parameters"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users"
    query:
      page: 1
      per_page: 3
      delay: 1
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      
      - identifier: "$.response.body.page"
        operator: equals
        expected: 1
        description: "Should return requested page"
      
      - identifier: "$.response.body.per_page"
        operator: equals
        expected: 3
        description: "Should return requested page size"

  # Array query parameters
  - name: array_query_params
    description: "Test array query parameters"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/search"
    query:
      tags: ["api", "testing", "automation"]
      categories: [1, 2, 3]
      fields: ["name", "email", "created_at"]
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 400]
        description: "Should handle array parameters"

  # URL encoding test
  - name: url_encoding_test
    description: "Test URL encoding of special characters"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/search"
    query:
      q: "user@example.com"
      filter: "name contains 'John Doe'"
      sort: "created_at desc"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 400]
        description: "Should handle URL-encoded parameters"
```

## Performance Testing

Basic performance validation:

```yaml
name: performance_testing
description: "Basic performance validation tests"
steps:
  - name: response_time_test
    description: "Test API response time"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users"
    timeout: 5000
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should return successful response"
      
      - identifier: "$.response.timing.duration"
        operator: lt
        expected: 2000
        description: "Response should be under 2 seconds"
      
      - identifier: "$.response.size"
        operator: lt
        expected: 10240
        description: "Response should be under 10KB"

  - name: concurrent_requests_simulation
    description: "Simulate concurrent load"
    type: api
    method: GET
    url: "{{$.env.API_URL}}/users/{{$.random.number(1, 10)}}"
    timeout: 10000
    retries: 0
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 404]
        description: "Should handle concurrent requests"
      
      - identifier: "$.response.timing.duration"
        operator: lt
        expected: 5000
        description: "Should respond within 5 seconds under load"
```

## Running the Examples

### Single Test
```bash
# Run a specific test
vm run examples/crud-operations.yaml --env local

# With verbose output
vm run examples/data-validation.yaml --env local --verbose

# Generate HTML report
vm run examples/error-handling.yaml --env local --report html
```

### Batch Testing
```bash
# Run all examples
vm batch examples/ --env local

# Run with parallel execution
vm batch examples/ --env local --parallel --concurrency 3

# Generate comprehensive report
vm batch examples/ --env local --report html --report junit
```

### CI/CD Integration
```bash
# For CI pipelines
vm batch examples/ --env ci --report junit --no-color --output json
```

## Best Practices Demonstrated

1. **Clear Naming**: Use descriptive names for scenarios and steps
2. **Validation Coverage**: Test success cases, error cases, and edge cases
3. **Data Extraction**: Extract and reuse data between steps
4. **Environment Variables**: Use environment-specific configuration
5. **Random Data**: Generate realistic test data
6. **Error Handling**: Explicitly test error scenarios
7. **Performance**: Include basic performance validations
8. **Documentation**: Add descriptions for all tests

These examples provide a solid foundation for API testing with Vibranium CLI. For more advanced scenarios, see [Authentication Flows](/examples/authentication) and [Complex Workflows](/examples/workflows).