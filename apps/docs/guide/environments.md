# Environment Management

Vibranium CLI provides robust environment management to handle different deployment stages, configurations, and secrets. This guide covers setting up and managing environments effectively.

## Environment Concepts

Environments in Vibranium CLI allow you to:
- **Separate configurations** for different stages (local, staging, production)
- **Manage secrets** securely without hardcoding values
- **Switch contexts** easily between different setups
- **Share configurations** across team members

## Environment Files

Environment files are JSON files that define variables and secrets for specific environments.

### Basic Structure

```json
{
  "environment": "staging",
  "description": "Staging environment configuration",
  "variables": {
    "API_URL": "https://api.staging.example.com",
    "APP_URL": "https://app.staging.example.com",
    "TIMEOUT": 10000,
    "MAX_RETRIES": 3,
    "DEBUG": true
  },
  "secrets": {
    "AUTH_TOKEN": "$.env.STAGING_AUTH_TOKEN",
    "API_KEY": "$.env.STAGING_API_KEY",
    "DATABASE_PASSWORD": "$.env.STAGING_DB_PASSWORD"
  },
  "metadata": {
    "created": "2024-01-15T10:30:00Z",
    "updated": "2024-02-01T14:22:33Z",
    "owner": "staging-team@company.com"
  }
}
```

### Directory Structure

```
environments/
├── local.json          # Local development
├── staging.json        # Staging environment
├── production.json     # Production environment
├── ci.json            # CI/CD environment
└── load-test.json     # Load testing environment
```

## Environment Configuration

### Local Development

**File: `environments/local.json`**
```json
{
  "environment": "local",
  "description": "Local development environment",
  "variables": {
    "API_URL": "http://localhost:3000",
    "APP_URL": "http://localhost:4200",
    "TIMEOUT": 5000,
    "MAX_RETRIES": 1,
    "DEBUG": true,
    "LOG_LEVEL": "debug"
  },
  "secrets": {
    "AUTH_TOKEN": "$.env.LOCAL_AUTH_TOKEN",
    "API_KEY": "dev-api-key-12345"
  }
}
```

### Staging Environment

**File: `environments/staging.json`**
```json
{
  "environment": "staging",
  "description": "Staging environment for integration testing",
  "variables": {
    "API_URL": "https://api.staging.example.com",
    "APP_URL": "https://app.staging.example.com",
    "TIMEOUT": 10000,
    "MAX_RETRIES": 3,
    "DEBUG": false,
    "LOG_LEVEL": "info",
    "RATE_LIMIT": 100
  },
  "secrets": {
    "AUTH_TOKEN": "$.env.STAGING_AUTH_TOKEN",
    "API_KEY": "$.env.STAGING_API_KEY",
    "DATABASE_URL": "$.env.STAGING_DATABASE_URL"
  }
}
```

### Production Environment

**File: `environments/production.json`**
```json
{
  "environment": "production",
  "description": "Production environment - use with caution",
  "variables": {
    "API_URL": "https://api.example.com",
    "APP_URL": "https://app.example.com",
    "TIMEOUT": 15000,
    "MAX_RETRIES": 5,
    "DEBUG": false,
    "LOG_LEVEL": "warn",
    "RATE_LIMIT": 1000
  },
  "secrets": {
    "AUTH_TOKEN": "$.env.PROD_AUTH_TOKEN",
    "API_KEY": "$.env.PROD_API_KEY",
    "DATABASE_URL": "$.env.PROD_DATABASE_URL"
  },
  "metadata": {
    "requiresApproval": true,
    "owner": "production-team@company.com",
    "restrictions": [
      "no-destructive-operations",
      "read-only-access"
    ]
  }
}
```

## Secret Management

### Environment Variables

Secrets are referenced using environment variables to keep sensitive data out of version control:

**`.env` file (git-ignored):**
```bash
# Local development
LOCAL_AUTH_TOKEN=local-dev-token-12345

# Staging
STAGING_AUTH_TOKEN=staging-jwt-token-abcdef
STAGING_API_KEY=staging-api-key-67890
STAGING_DATABASE_URL=postgres://user:pass@staging-db:5432/app

# Production (typically set in CI/CD)
PROD_AUTH_TOKEN=prod-jwt-token-xyz789
PROD_API_KEY=prod-api-key-secure-123
PROD_DATABASE_URL=postgres://user:pass@prod-db:5432/app
```

### Using Secrets in Scenarios

```yaml
name: authenticated_api_test
description: "Test API with authentication"
steps:
  - name: get_user_profile
    type: api
    method: GET
    url: "{{$.env.API_URL}}/profile"
    headers:
      Authorization: "Bearer {{$.env.AUTH_TOKEN}}"
      X-API-Key: "{{$.env.API_KEY}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
```

### CI/CD Secret Management

For CI/CD pipelines, set environment variables in your pipeline configuration:

#### GitHub Actions
```yaml
env:
  STAGING_AUTH_TOKEN: ${{ secrets.STAGING_AUTH_TOKEN }}
  STAGING_API_KEY: ${{ secrets.STAGING_API_KEY }}
  PROD_AUTH_TOKEN: ${{ secrets.PROD_AUTH_TOKEN }}
  PROD_API_KEY: ${{ secrets.PROD_API_KEY }}
```

#### GitLab CI
```yaml
variables:
  STAGING_AUTH_TOKEN: $STAGING_AUTH_TOKEN
  STAGING_API_KEY: $STAGING_API_KEY
```

## Environment Commands

### List Environments

```bash
# List all available environments
vm env list

# Example output:
# Available environments:
# ├── local (default)
# ├── staging  
# ├── production
# └── ci
```

### Show Environment Details

```bash
# Show environment configuration
vm env show staging

# Show with secrets (if you have access)
vm env show staging --include-secrets

# Example output:
# Environment: staging
# Description: Staging environment for integration testing
# Variables:
#   API_URL: https://api.staging.example.com
#   TIMEOUT: 10000
# Secrets:
#   AUTH_TOKEN: [PROTECTED]
#   API_KEY: [PROTECTED]
```

### Validate Environments

```bash
# Validate specific environment
vm env validate staging

# Validate all environments
vm env validate --all

# Example output:
# ✅ staging: Valid
# ❌ production: Missing required secret PROD_AUTH_TOKEN
```

### Create New Environment

```bash
# Create new environment from template
vm env create development --template local

# Create with specific variables
vm env create testing \
  --variable API_URL=http://test.api.com \
  --variable TIMEOUT=8000

# Interactive creation
vm env create qa --interactive
```

## Using Environments

### Command Line

```bash
# Use specific environment
vm run scenario.yaml --env staging

# Batch execution with environment
vm batch scenarios/ --env production

# Interactive mode with environment
vm --env local
```

### Default Environment

Set default environment in configuration:

**`vibranium.config.json`:**
```json
{
  "environments": {
    "default": "local",
    "directory": "./environments"
  }
}
```

### Environment Switching

In interactive mode, use `Ctrl+E` to switch environments:

```
Current Environment: local
Available Environments:
1. local (current)
2. staging
3. production
4. ci

Select environment (1-4): 2
Switched to staging environment
```

## Advanced Features

### Environment Inheritance

Create base environments that others can extend:

**`environments/base.json`:**
```json
{
  "environment": "base",
  "variables": {
    "TIMEOUT": 10000,
    "MAX_RETRIES": 3,
    "DEBUG": false
  }
}
```

**`environments/staging.json`:**
```json
{
  "extends": "base",
  "environment": "staging",
  "variables": {
    "API_URL": "https://api.staging.example.com",
    "DEBUG": true
  }
}
```

### Conditional Variables

Use JavaScript expressions for dynamic configuration:

```json
{
  "variables": {
    "API_URL": "{{$.env.NODE_ENV === 'production' ? 'https://api.example.com' : 'http://localhost:3000'}}",
    "TIMEOUT": "{{$.env.CI === 'true' ? 30000 : 10000}}",
    "LOG_LEVEL": "{{$.env.DEBUG === 'true' ? 'debug' : 'info'}}"
  }
}
```

### Environment Templates

Create reusable environment templates:

**`templates/microservice.json`:**
```json
{
  "variables": {
    "SERVICE_URL": "{{$.template.serviceUrl}}",
    "SERVICE_PORT": "{{$.template.servicePort || 3000}}",
    "HEALTH_ENDPOINT": "{{$.template.serviceUrl}}/health",
    "METRICS_ENDPOINT": "{{$.template.serviceUrl}}/metrics"
  },
  "secrets": {
    "SERVICE_TOKEN": "$.env.{{$.template.tokenVar}}"
  }
}
```

Use template:
```bash
vm env create user-service \
  --template microservice \
  --param serviceUrl=http://user-service.local \
  --param tokenVar=USER_SERVICE_TOKEN
```

### Multi-Region Environments

Support multiple regions with environment variants:

```
environments/
├── staging-us-east-1.json
├── staging-us-west-2.json
├── staging-eu-west-1.json
├── production-us-east-1.json
├── production-us-west-2.json
└── production-eu-west-1.json
```

### Environment Validation Rules

Define validation rules for environments:

```json
{
  "environment": "production",
  "validation": {
    "required": ["API_URL", "AUTH_TOKEN"],
    "rules": [
      {
        "field": "API_URL",
        "pattern": "^https://",
        "message": "Production API must use HTTPS"
      },
      {
        "field": "TIMEOUT",
        "min": 10000,
        "message": "Production timeout must be at least 10 seconds"
      }
    ]
  }
}
```

## Best Practices

### 1. Use Descriptive Names

```json
{
  "environment": "staging-integration-tests",
  "description": "Staging environment specifically for integration testing"
}
```

### 2. Keep Secrets Out of Version Control

```bash
# Add to .gitignore
.env
.env.local
.env.*.local
environments/*.local.json
```

### 3. Document Environment Purpose

```json
{
  "environment": "load-test",
  "description": "High-performance environment for load testing",
  "metadata": {
    "purpose": "Performance and load testing",
    "dataRetention": "7 days",
    "resetSchedule": "Daily at 2 AM UTC",
    "maxConcurrentUsers": 1000
  }
}
```

### 4. Use Environment-Specific Timeouts

```json
{
  "variables": {
    "TIMEOUT": 5000,    // Fast for local development
    "MAX_RETRIES": 1    // Fail fast locally
  }
}
```

```json
{
  "variables": {
    "TIMEOUT": 30000,   // More generous for production
    "MAX_RETRIES": 5    // More resilient
  }
}
```

### 5. Validate Required Variables

```yaml
# Add validation step to scenarios
steps:
  - name: validate_environment
    type: api
    method: GET
    url: "{{$.env.API_URL}}/health"
    expect:
      - identifier: "$.env.API_URL"
        operator: exists
        description: "API_URL must be configured"
      - identifier: "$.env.AUTH_TOKEN"
        operator: exists
        description: "AUTH_TOKEN must be provided"
```

### 6. Use Consistent Naming

```json
{
  "variables": {
    "USER_SERVICE_URL": "https://user-service.staging.com",
    "ORDER_SERVICE_URL": "https://order-service.staging.com",
    "PAYMENT_SERVICE_URL": "https://payment-service.staging.com"
  }
}
```

## Troubleshooting

### Missing Environment Variables

```bash
# Check which environment variables are available
env | grep -E "(STAGING|PROD|LOCAL)"

# Validate environment configuration
vm env validate staging --verbose
```

### Environment Not Found

```bash
# List available environments
vm env list

# Check environment directory configuration
vm config get environments.directory
```

### Secret Resolution Issues

```bash
# Test secret resolution
vm env show staging --include-secrets --verbose

# Check environment variable exists
echo $STAGING_AUTH_TOKEN
```

For more information about using environments in scenarios, see the [Writing Scenarios](/guide/writing-scenarios) guide.