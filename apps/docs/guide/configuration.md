# Configuration

Vibranium CLI uses a hierarchical configuration system that supports project-level, user-level, and global settings. This guide covers all configuration options and best practices.

## Configuration File

The main configuration file is `vibranium.config.json` located in your project root:

```json
{
  "version": "1.0",
  "environments": {
    "default": "local",
    "directory": "./environments"
  },
  "scenarios": {
    "directory": "./scenarios",
    "patterns": ["**/*.yaml", "**/*.yml", "**/*.json"]
  },
  "reports": {
    "directory": "./reports",
    "formats": ["html", "json"],
    "timestamp": true
  },
  "execution": {
    "parallel": false,
    "maxConcurrency": 5,
    "timeout": 30000,
    "retries": 0,
    "continueOnFailure": false
  },
  "http": {
    "client": "got",
    "timeout": 10000,
    "retries": 3,
    "userAgent": "vibranium-cli/0.1.0"
  },
  "validation": {
    "strict": true,
    "allowUndefined": false
  },
  "logging": {
    "level": "info",
    "colors": true,
    "timestamp": true
  },
  "globals": {
    "defaultTimeout": 10000,
    "maxRetries": 3,
    "userAgent": "VibraniumCLI/1.0"
  }
}
```

## Creating Configuration

Initialize a new configuration file:

```bash
vm init
```

This creates a basic configuration file with sensible defaults.

## Configuration Sections

### Environments

Configure how environments are handled:

```json
{
  "environments": {
    "default": "local",           // Default environment
    "directory": "./environments", // Environment files location
    "required": ["API_URL"],       // Required variables
    "validation": true            // Validate environment files
  }
}
```

### Scenarios

Control scenario discovery and execution:

```json
{
  "scenarios": {
    "directory": "./scenarios",
    "patterns": [
      "**/*.yaml",
      "**/*.yml", 
      "**/*.json"
    ],
    "exclude": [
      "**/node_modules/**",
      "**/.git/**"
    ],
    "recursive": true
  }
}
```

### Reports

Configure report generation:

```json
{
  "reports": {
    "directory": "./reports",
    "formats": ["html", "json", "junit"],
    "timestamp": true,
    "filename": "vibranium-report",
    "includePassedTests": true,
    "includeMetadata": true
  }
}
```

### Execution

Control how scenarios are executed:

```json
{
  "execution": {
    "parallel": false,           // Enable parallel execution
    "maxConcurrency": 5,         // Max parallel scenarios
    "timeout": 30000,            // Default timeout (ms)
    "retries": 0,                // Default retry count
    "continueOnFailure": false,  // Continue if scenario fails
    "bailOnFirst": false,        // Stop on first failure
    "randomize": false           // Randomize execution order
  }
}
```

### HTTP Client

Configure the HTTP client behavior:

```json
{
  "http": {
    "client": "got",                    // HTTP client (got, axios, fetch)
    "timeout": 10000,                   // Request timeout
    "retries": 3,                       // Retry attempts
    "userAgent": "vibranium-cli/0.1.0", // User-Agent header
    "followRedirects": true,            // Follow redirects
    "maxRedirects": 5,                  // Max redirect count
    "validateStatus": false,            // Validate HTTP status
    "proxy": {
      "http": "http://proxy.company.com:8080",
      "https": "https://proxy.company.com:8080"
    },
    "auth": {
      "type": "basic",
      "username": "user",
      "password": "pass"
    }
  }
}
```

### Validation

Configure validation behavior:

```json
{
  "validation": {
    "strict": true,              // Strict validation mode
    "allowUndefined": false,     // Allow undefined values
    "dateFormat": "iso",         // Date format for validation
    "numericPrecision": 2,       // Numeric comparison precision
    "caseSensitive": true        // Case-sensitive string comparison
  }
}
```

### Logging

Control logging output:

```json
{
  "logging": {
    "level": "info",           // Log level (debug, info, warn, error)
    "colors": true,            // Enable colored output
    "timestamp": true,         // Include timestamps
    "format": "pretty",        // Output format (pretty, json)
    "file": "./logs/vibranium.log", // Log to file
    "maxFileSize": "10MB",     // Max log file size
    "maxFiles": 5              // Max log files to keep
  }
}
```

## Environment-Specific Configuration

Override configuration per environment:

```json
{
  "environments": {
    "local": {
      "http": {
        "timeout": 5000
      },
      "logging": {
        "level": "debug"
      }
    },
    "staging": {
      "execution": {
        "parallel": true,
        "maxConcurrency": 3
      },
      "http": {
        "retries": 1
      }
    },
    "production": {
      "execution": {
        "parallel": true,
        "maxConcurrency": 10
      },
      "logging": {
        "level": "warn",
        "file": "./logs/prod-vibranium.log"
      }
    }
  }
}
```

## CLI Configuration

Manage configuration via command line:

```bash
# View current configuration
vm config

# Get specific value
vm config get http.timeout

# Set configuration value
vm config set http.timeout 15000

# Set nested configuration
vm config set http.proxy.http "http://proxy.company.com:8080"

# Reset to defaults
vm config reset

# Validate configuration
vm config validate
```

## User-Level Configuration

Create user-level configuration in `~/.vibranium/config.json`:

```json
{
  "defaults": {
    "environment": "local",
    "reporter": "html"
  },
  "http": {
    "userAgent": "MyCompany VibraniumCLI",
    "timeout": 15000
  },
  "logging": {
    "level": "info",
    "colors": true
  }
}
```

## Configuration Precedence

Configuration is loaded in this order (later overrides earlier):

1. **Built-in defaults**
2. **User configuration** (`~/.vibranium/config.json`)
3. **Project configuration** (`./vibranium.config.json`)
4. **Environment-specific overrides**
5. **Command-line flags**

## Environment Variables

Override configuration using environment variables:

```bash
# Set environment
export VIBRANIUM_ENV=staging

# Set HTTP timeout
export VIBRANIUM_HTTP_TIMEOUT=20000

# Set log level
export VIBRANIUM_LOG_LEVEL=debug

# Set parallel execution
export VIBRANIUM_PARALLEL=true

# Run with environment variables
vm run scenario.yaml
```

## Configuration Schema

Validate your configuration against the schema:

```bash
# Validate current configuration
vm config validate

# Validate specific file
vm config validate ./custom-config.json

# Generate schema file
vm config schema > vibranium-config.schema.json
```

## Advanced Configuration

### Custom HTTP Client

Configure different HTTP clients for different scenarios:

```json
{
  "http": {
    "clients": {
      "default": {
        "type": "got",
        "timeout": 10000
      },
      "slow-api": {
        "type": "axios", 
        "timeout": 60000,
        "retries": 5
      },
      "streaming": {
        "type": "fetch",
        "timeout": 0
      }
    }
  }
}
```

Use in scenarios:

```yaml
steps:
  - name: slow_endpoint
    type: api
    httpClient: slow-api
    method: GET
    url: "{{$.env.API_URL}}/slow-endpoint"
```

### Plugin Configuration

Configure plugins and their settings:

```json
{
  "plugins": {
    "enabled": ["@vibranium/api", "@vibranium/ui"],
    "config": {
      "@vibranium/ui": {
        "browser": "chromium",
        "headless": true,
        "viewport": {
          "width": 1920,
          "height": 1080
        }
      }
    }
  }
}
```

### Report Templates

Customize report templates:

```json
{
  "reports": {
    "templates": {
      "html": "./templates/custom-report.html",
      "email": "./templates/email-report.html"
    },
    "customFields": {
      "buildNumber": "{{$.env.BUILD_NUMBER}}",
      "gitCommit": "{{$.env.GIT_COMMIT}}"
    }
  }
}
```

## Configuration Examples

### Development Team Setup

```json
{
  "environments": {
    "default": "local",
    "directory": "./environments"
  },
  "execution": {
    "parallel": false,
    "timeout": 15000
  },
  "logging": {
    "level": "debug",
    "colors": true
  },
  "reports": {
    "formats": ["html"],
    "includePassedTests": true
  }
}
```

### CI/CD Pipeline Setup

```json
{
  "environments": {
    "default": "ci",
    "directory": "./environments"
  },
  "execution": {
    "parallel": true,
    "maxConcurrency": 10,
    "continueOnFailure": false
  },
  "logging": {
    "level": "warn",
    "colors": false,
    "format": "json"
  },
  "reports": {
    "formats": ["junit", "json"],
    "timestamp": true
  }
}
```

### Load Testing Setup

```json
{
  "execution": {
    "parallel": true,
    "maxConcurrency": 50,
    "timeout": 60000
  },
  "http": {
    "timeout": 30000,
    "retries": 0,
    "keepAlive": true
  },
  "logging": {
    "level": "error"
  }
}
```

## Best Practices

### 1. Use Environment-Specific Settings

```json
{
  "environments": {
    "local": {
      "execution": { "parallel": false },
      "logging": { "level": "debug" }
    },
    "ci": {
      "execution": { "parallel": true },
      "logging": { "level": "warn", "colors": false }
    }
  }
}
```

### 2. Version Your Configuration

Include configuration in version control and document changes:

```json
{
  "version": "1.2",
  "meta": {
    "lastUpdated": "2024-01-15",
    "updatedBy": "team@company.com",
    "changes": "Added staging environment configuration"
  }
}
```

### 3. Use Configuration Validation

```bash
# Validate before committing
vm config validate

# Add to pre-commit hooks
echo "vm config validate" >> .git/hooks/pre-commit
```

### 4. Document Team Settings

```json
{
  "_comments": {
    "timeout": "Increased for slow CI environment",
    "parallel": "Disabled locally for easier debugging",
    "retries": "Set to 3 for flaky staging APIs"
  }
}
```

## Troubleshooting

### Configuration Not Loading

1. Check file location and name
2. Validate JSON syntax
3. Check file permissions
4. Use `vm config` to view loaded configuration

### Environment Variables Not Working

1. Verify variable names (use `VIBRANIUM_` prefix)
2. Check variable format (use underscores for nested keys)
3. Restart shell session

### Plugin Configuration Issues

1. Verify plugin is installed
2. Check plugin name in configuration
3. Validate plugin-specific settings

For more advanced configuration scenarios, see the [Reference](/reference/configuration) section.