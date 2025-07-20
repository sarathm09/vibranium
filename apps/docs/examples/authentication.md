# Authentication Flows

This guide demonstrates how to test various authentication patterns and flows with Vibranium CLI. Authentication is a critical part of API testing, and these examples show best practices for different auth methods.

## JWT Authentication Flow

Test complete JWT authentication including login, token usage, and refresh:

```yaml
name: jwt_authentication_flow
description: "Complete JWT authentication flow with token refresh"
version: "1.0"
tags: ["auth", "jwt", "security"]

variables:
  authUrl: "{{$.env.AUTH_URL}}"
  apiUrl: "{{$.env.API_URL}}"
  testUser:
    email: "{{$.env.TEST_USER_EMAIL}}"
    password: "{{$.env.TEST_USER_PASSWORD}}"

steps:
  # Step 1: Login and get JWT token
  - name: login
    description: "Authenticate user and obtain JWT token"
    type: api
    method: POST
    url: "{{$.variables.authUrl}}/login"
    headers:
      Content-Type: "application/json"
    body:
      email: "{{$.variables.testUser.email}}"
      password: "{{$.variables.testUser.password}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Login should succeed"
      
      - identifier: "$.response.body.access_token"
        operator: exists
        description: "Access token should be provided"
      
      - identifier: "$.response.body.refresh_token"
        operator: exists
        description: "Refresh token should be provided"
      
      - identifier: "$.response.body.token_type"
        operator: equals
        expected: "Bearer"
        description: "Token type should be Bearer"
      
      - identifier: "$.response.body.expires_in"
        operator: gt
        expected: 0
        description: "Token should have valid expiration"
    
    extract:
      - name: accessToken
        identifier: "$.response.body.access_token"
      - name: refreshToken
        identifier: "$.response.body.refresh_token"
      - name: expiresIn
        identifier: "$.response.body.expires_in"

  # Step 2: Use JWT token to access protected resource
  - name: access_protected_resource
    description: "Access protected API using JWT token"
    type: api
    dependsOn:
      - api: login
        as: auth
    method: GET
    url: "{{$.variables.apiUrl}}/profile"
    headers:
      Authorization: "Bearer {{$.auth.extract.accessToken}}"
      Accept: "application/json"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should access protected resource successfully"
      
      - identifier: "$.response.body.id"
        operator: exists
        description: "User profile should include ID"
      
      - identifier: "$.response.body.email"
        operator: equals
        expected: "{{$.variables.testUser.email}}"
        description: "Profile email should match logged in user"

  # Step 3: Test token validation
  - name: validate_token
    description: "Validate the JWT token"
    type: api
    dependsOn:
      - api: login
        as: auth
    method: POST
    url: "{{$.variables.authUrl}}/validate"
    headers:
      Authorization: "Bearer {{$.auth.extract.accessToken}}"
      Content-Type: "application/json"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Token should be valid"
      
      - identifier: "$.response.body.valid"
        operator: equals
        expected: true
        description: "Token validation should return true"

  # Step 4: Refresh the token
  - name: refresh_token
    description: "Refresh JWT token using refresh token"
    type: api
    dependsOn:
      - api: login
        as: auth
    method: POST
    url: "{{$.variables.authUrl}}/refresh"
    headers:
      Content-Type: "application/json"
    body:
      refresh_token: "{{$.auth.extract.refreshToken}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Token refresh should succeed"
      
      - identifier: "$.response.body.access_token"
        operator: exists
        description: "New access token should be provided"
      
      - identifier: "$.response.body.access_token"
        operator: not_equals
        expected: "{{$.auth.extract.accessToken}}"
        description: "New token should be different from old token"
    
    extract:
      - name: newAccessToken
        identifier: "$.response.body.access_token"

  # Step 5: Use refreshed token
  - name: use_refreshed_token
    description: "Use refreshed token to access API"
    type: api
    dependsOn:
      - api: refresh_token
        as: refreshed
    method: GET
    url: "{{$.variables.apiUrl}}/profile"
    headers:
      Authorization: "Bearer {{$.refreshed.extract.newAccessToken}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Refreshed token should work"

  # Step 6: Logout and invalidate token
  - name: logout
    description: "Logout and invalidate tokens"
    type: api
    dependsOn:
      - api: refreshed_token
        as: refreshed
    method: POST
    url: "{{$.variables.authUrl}}/logout"
    headers:
      Authorization: "Bearer {{$.refreshed.extract.newAccessToken}}"
      Content-Type: "application/json"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 204]
        description: "Logout should succeed"

  # Step 7: Verify token is invalidated
  - name: verify_token_invalidated
    description: "Verify token is no longer valid after logout"
    type: api
    dependsOn:
      - api: refresh_token
        as: refreshed
    method: GET
    url: "{{$.variables.apiUrl}}/profile"
    headers:
      Authorization: "Bearer {{$.refreshed.extract.newAccessToken}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 401
        description: "Should return unauthorized after logout"
```

## OAuth 2.0 Client Credentials Flow

Test OAuth 2.0 client credentials flow for service-to-service authentication:

```yaml
name: oauth2_client_credentials
description: "OAuth 2.0 Client Credentials Flow"
tags: ["oauth2", "client-credentials", "auth"]

variables:
  tokenUrl: "{{$.env.OAUTH_TOKEN_URL}}"
  clientId: "{{$.env.OAUTH_CLIENT_ID}}"
  clientSecret: "{{$.env.OAUTH_CLIENT_SECRET}}"
  scope: "api:read api:write"

steps:
  # Step 1: Get access token using client credentials
  - name: get_access_token
    description: "Obtain access token using client credentials"
    type: api
    method: POST
    url: "{{$.variables.tokenUrl}}"
    headers:
      Content-Type: "application/x-www-form-urlencoded"
      Authorization: "Basic {{$.helpers.base64Encode($.variables.clientId + ':' + $.variables.clientSecret)}}"
    body:
      grant_type: "client_credentials"
      scope: "{{$.variables.scope}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Token request should succeed"
      
      - identifier: "$.response.body.access_token"
        operator: exists
        description: "Access token should be returned"
      
      - identifier: "$.response.body.token_type"
        operator: equals
        expected: "Bearer"
        description: "Token type should be Bearer"
      
      - identifier: "$.response.body.expires_in"
        operator: gt
        expected: 0
        description: "Token should have valid expiration"
      
      - identifier: "$.response.body.scope"
        operator: contains
        expected: "api:read"
        description: "Token should include requested scope"
    
    extract:
      - name: accessToken
        identifier: "$.response.body.access_token"
      - name: tokenType
        identifier: "$.response.body.token_type"
      - name: expiresIn
        identifier: "$.response.body.expires_in"

  # Step 2: Use access token to call API
  - name: call_protected_api
    description: "Call protected API using OAuth token"
    type: api
    dependsOn:
      - api: get_access_token
        as: oauth
    method: GET
    url: "{{$.env.API_URL}}/protected/data"
    headers:
      Authorization: "{{$.oauth.extract.tokenType}} {{$.oauth.extract.accessToken}}"
      Accept: "application/json"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Protected API should be accessible with valid token"

  # Step 3: Test token introspection (if supported)
  - name: introspect_token
    description: "Introspect the access token"
    type: api
    dependsOn:
      - api: get_access_token
        as: oauth
    method: POST
    url: "{{$.env.OAUTH_INTROSPECT_URL}}"
    headers:
      Content-Type: "application/x-www-form-urlencoded"
      Authorization: "Basic {{$.helpers.base64Encode($.variables.clientId + ':' + $.variables.clientSecret)}}"
    body:
      token: "{{$.oauth.extract.accessToken}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      
      - identifier: "$.response.body.active"
        operator: equals
        expected: true
        description: "Token should be active"
      
      - identifier: "$.response.body.client_id"
        operator: equals
        expected: "{{$.variables.clientId}}"
        description: "Client ID should match"
```

## API Key Authentication

Test various API key authentication methods:

```yaml
name: api_key_authentication
description: "Test different API key authentication methods"
tags: ["api-key", "auth"]

variables:
  apiUrl: "{{$.env.API_URL}}"
  apiKey: "{{$.env.API_KEY}}"

steps:
  # Method 1: API key in header
  - name: header_api_key
    description: "API key authentication via header"
    type: api
    method: GET
    url: "{{$.variables.apiUrl}}/users"
    headers:
      X-API-Key: "{{$.variables.apiKey}}"
      Accept: "application/json"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should authenticate with API key in header"

  # Method 2: API key in query parameter
  - name: query_api_key
    description: "API key authentication via query parameter"
    type: api
    method: GET
    url: "{{$.variables.apiUrl}}/users"
    query:
      api_key: "{{$.variables.apiKey}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should authenticate with API key in query"

  # Method 3: Test invalid API key
  - name: invalid_api_key
    description: "Test with invalid API key"
    type: api
    method: GET
    url: "{{$.variables.apiUrl}}/users"
    headers:
      X-API-Key: "invalid-key-12345"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [401, 403]
        description: "Should reject invalid API key"
      
      - identifier: "$.response.body.error"
        operator: exists
        description: "Error message should be provided"

  # Method 4: Test missing API key
  - name: missing_api_key
    description: "Test without API key"
    type: api
    method: GET
    url: "{{$.variables.apiUrl}}/users"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [401, 403]
        description: "Should reject missing API key"
```

## Basic Authentication

Test HTTP Basic Authentication:

```yaml
name: basic_authentication
description: "HTTP Basic Authentication testing"
tags: ["basic-auth", "auth"]

variables:
  apiUrl: "{{$.env.API_URL}}"
  username: "{{$.env.BASIC_AUTH_USERNAME}}"
  password: "{{$.env.BASIC_AUTH_PASSWORD}}"

steps:
  # Method 1: Using explicit auth object
  - name: basic_auth_explicit
    description: "Basic auth using explicit credentials"
    type: api
    method: GET
    url: "{{$.variables.apiUrl}}/protected"
    auth:
      type: basic
      username: "{{$.variables.username}}"
      password: "{{$.variables.password}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should authenticate with valid credentials"

  # Method 2: Using Authorization header
  - name: basic_auth_header
    description: "Basic auth using Authorization header"
    type: api
    method: GET
    url: "{{$.variables.apiUrl}}/protected"
    headers:
      Authorization: "Basic {{$.helpers.base64Encode($.variables.username + ':' + $.variables.password)}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should authenticate with Authorization header"

  # Test invalid credentials
  - name: invalid_credentials
    description: "Test with invalid credentials"
    type: api
    method: GET
    url: "{{$.variables.apiUrl}}/protected"
    auth:
      type: basic
      username: "{{$.variables.username}}"
      password: "wrong-password"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 401
        description: "Should reject invalid credentials"
      
      - identifier: "$.response.headers['WWW-Authenticate']"
        operator: contains
        expected: "Basic"
        description: "Should include WWW-Authenticate header"
```

## Session-Based Authentication

Test cookie-based session authentication:

```yaml
name: session_authentication
description: "Cookie-based session authentication"
tags: ["session", "cookies", "auth"]

variables:
  authUrl: "{{$.env.AUTH_URL}}"
  apiUrl: "{{$.env.API_URL}}"
  credentials:
    username: "{{$.env.SESSION_USERNAME}}"
    password: "{{$.env.SESSION_PASSWORD}}"

steps:
  # Step 1: Login and establish session
  - name: login_session
    description: "Login and get session cookie"
    type: api
    method: POST
    url: "{{$.variables.authUrl}}/login"
    headers:
      Content-Type: "application/x-www-form-urlencoded"
    body:
      username: "{{$.variables.credentials.username}}"
      password: "{{$.variables.credentials.password}}"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 302]
        description: "Login should succeed"
      
      - identifier: "$.response.headers['Set-Cookie']"
        operator: exists
        description: "Session cookie should be set"
      
      - identifier: "$.response.headers['Set-Cookie']"
        operator: contains
        expected: "sessionid="
        description: "Session ID should be in cookie"
    
    extract:
      - name: sessionCookie
        identifier: "$.response.headers['Set-Cookie']"
        transform: "value.split(';')[0]"  # Extract just the cookie value

  # Step 2: Use session cookie for authenticated request
  - name: authenticated_request
    description: "Make authenticated request using session"
    type: api
    dependsOn:
      - api: login_session
        as: session
    method: GET
    url: "{{$.variables.apiUrl}}/profile"
    headers:
      Cookie: "{{$.session.extract.sessionCookie}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should access protected resource with session"

  # Step 3: Logout and invalidate session
  - name: logout_session
    description: "Logout and clear session"
    type: api
    dependsOn:
      - api: login_session
        as: session
    method: POST
    url: "{{$.variables.authUrl}}/logout"
    headers:
      Cookie: "{{$.session.extract.sessionCookie}}"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 302]
        description: "Logout should succeed"

  # Step 4: Verify session is invalidated
  - name: verify_session_invalid
    description: "Verify session is no longer valid"
    type: api
    dependsOn:
      - api: login_session
        as: session
    method: GET
    url: "{{$.variables.apiUrl}}/profile"
    headers:
      Cookie: "{{$.session.extract.sessionCookie}}"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [401, 302]
        description: "Should reject invalid session"
```

## Multi-Factor Authentication

Test MFA flow with TOTP:

```yaml
name: mfa_authentication
description: "Multi-factor authentication with TOTP"
tags: ["mfa", "totp", "2fa", "auth"]

variables:
  authUrl: "{{$.env.AUTH_URL}}"
  credentials:
    email: "{{$.env.MFA_USER_EMAIL}}"
    password: "{{$.env.MFA_USER_PASSWORD}}"
    totpSecret: "{{$.env.MFA_TOTP_SECRET}}"

steps:
  # Step 1: Initial login (first factor)
  - name: first_factor_login
    description: "First factor authentication"
    type: api
    method: POST
    url: "{{$.variables.authUrl}}/login"
    headers:
      Content-Type: "application/json"
    body:
      email: "{{$.variables.credentials.email}}"
      password: "{{$.variables.credentials.password}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "First factor should succeed"
      
      - identifier: "$.response.body.mfa_required"
        operator: equals
        expected: true
        description: "MFA should be required"
      
      - identifier: "$.response.body.mfa_token"
        operator: exists
        description: "MFA token should be provided"
    
    extract:
      - name: mfaToken
        identifier: "$.response.body.mfa_token"

  # Step 2: Generate TOTP code and complete MFA
  - name: complete_mfa
    description: "Complete MFA with TOTP code"
    type: api
    dependsOn:
      - api: first_factor_login
        as: firstFactor
    method: POST
    url: "{{$.variables.authUrl}}/mfa/verify"
    headers:
      Content-Type: "application/json"
    body:
      mfa_token: "{{$.firstFactor.extract.mfaToken}}"
      totp_code: "{{$.helpers.generateTOTP($.variables.credentials.totpSecret)}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "MFA verification should succeed"
      
      - identifier: "$.response.body.access_token"
        operator: exists
        description: "Access token should be provided after MFA"
    
    extract:
      - name: accessToken
        identifier: "$.response.body.access_token"

  # Step 3: Use the fully authenticated token
  - name: access_protected_resource
    description: "Access protected resource after MFA"
    type: api
    dependsOn:
      - api: complete_mfa
        as: mfa
    method: GET
    url: "{{$.env.API_URL}}/sensitive-data"
    headers:
      Authorization: "Bearer {{$.mfa.extract.accessToken}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
        description: "Should access sensitive data after MFA"
```

## Environment Configuration

**File: `environments/auth-testing.json`**
```json
{
  "environment": "auth-testing",
  "description": "Environment for authentication testing",
  "variables": {
    "AUTH_URL": "https://auth.staging.example.com",
    "API_URL": "https://api.staging.example.com",
    "OAUTH_TOKEN_URL": "https://auth.staging.example.com/oauth/token",
    "OAUTH_INTROSPECT_URL": "https://auth.staging.example.com/oauth/introspect"
  },
  "secrets": {
    "TEST_USER_EMAIL": "$.env.TEST_USER_EMAIL",
    "TEST_USER_PASSWORD": "$.env.TEST_USER_PASSWORD",
    "OAUTH_CLIENT_ID": "$.env.OAUTH_CLIENT_ID",
    "OAUTH_CLIENT_SECRET": "$.env.OAUTH_CLIENT_SECRET",
    "API_KEY": "$.env.API_KEY",
    "BASIC_AUTH_USERNAME": "$.env.BASIC_AUTH_USERNAME",
    "BASIC_AUTH_PASSWORD": "$.env.BASIC_AUTH_PASSWORD",
    "SESSION_USERNAME": "$.env.SESSION_USERNAME",
    "SESSION_PASSWORD": "$.env.SESSION_PASSWORD",
    "MFA_USER_EMAIL": "$.env.MFA_USER_EMAIL",
    "MFA_USER_PASSWORD": "$.env.MFA_USER_PASSWORD",
    "MFA_TOTP_SECRET": "$.env.MFA_TOTP_SECRET"
  }
}
```

## Running Authentication Tests

```bash
# Run JWT authentication flow
vm run jwt-auth.yaml --env auth-testing

# Run all authentication tests
vm batch auth-tests/ --env auth-testing --report html

# Run with different environments
vm run oauth2-client-credentials.yaml --env staging
vm run oauth2-client-credentials.yaml --env production
```

## Security Best Practices

### 1. Never Hardcode Secrets
```yaml
# ❌ Bad - hardcoded secret
headers:
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ✅ Good - use environment variables
headers:
  Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
```

### 2. Test Invalid Credentials
Always test failure scenarios:
```yaml
- name: test_invalid_credentials
  # ... test with wrong credentials
  expect:
    - identifier: "$.response.status"
      operator: equals
      expected: 401
```

### 3. Verify Token Expiration
Test token lifecycle:
```yaml
- name: verify_token_expiry
  # ... wait for token to expire, then test
  expect:
    - identifier: "$.response.status"
      operator: equals
      expected: 401
```

### 4. Test Permission Boundaries
```yaml
- name: test_insufficient_permissions
  # ... test with limited scope token
  expect:
    - identifier: "$.response.status"
      operator: equals
      expected: 403
```

These authentication examples provide comprehensive coverage of common auth patterns. Use them as templates for your specific authentication requirements.