# Configuration Reference

This reference provides comprehensive documentation for all configuration options available in Vibranium CLI.

## Configuration File Structure

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
    "formats": ["html", "json"]
  },
  "execution": {
    "parallel": false,
    "maxConcurrency": 5,
    "timeout": 30000
  },
  "http": {
    "client": "got",
    "timeout": 10000,
    "retries": 3
  },
  "logging": {
    "level": "info",
    "colors": true
  },
  "globals": {
    "defaultTimeout": 10000
  }
}
```

## Configuration Sections

### Environment Configuration

```json
{
  "environments": {
    "default": "local",
    "directory": "./environments",
    "required": ["API_URL"],
    "validation": true
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `default` | string | `"default"` | Default environment to use |
| `directory` | string | `"./environments"` | Directory containing environment files |
| `required` | string[] | `[]` | Required environment variables |
| `validation` | boolean | `true` | Validate environment files on load |

### Scenario Configuration

```json
{
  "scenarios": {
    "directory": "./scenarios",
    "patterns": ["**/*.yaml", "**/*.yml", "**/*.json"],
    "exclude": ["**/node_modules/**"],
    "recursive": true
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `directory` | string | `"./scenarios"` | Base directory for scenarios |
| `patterns` | string[] | `["**/*.yaml", "**/*.yml", "**/*.json"]` | File patterns to include |
| `exclude` | string[] | `["**/node_modules/**"]` | Patterns to exclude |
| `recursive` | boolean | `true` | Search directories recursively |

### Report Configuration

```json
{
  "reports": {
    "directory": "./reports",
    "formats": ["html", "json", "junit"],
    "timestamp": true,
    "filename": "vibranium-report"
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `directory` | string | `"./reports"` | Output directory for reports |
| `formats` | string[] | `["html"]` | Report formats to generate |
| `timestamp` | boolean | `true` | Include timestamp in filenames |
| `filename` | string | `"vibranium-report"` | Base filename for reports |

### Execution Configuration

```json
{
  "execution": {
    "parallel": false,
    "maxConcurrency": 5,
    "timeout": 30000,
    "retries": 0,
    "continueOnFailure": false
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `parallel` | boolean | `false` | Enable parallel execution |
| `maxConcurrency` | number | `5` | Maximum concurrent scenarios |
| `timeout` | number | `30000` | Default timeout in milliseconds |
| `retries` | number | `0` | Default retry count |
| `continueOnFailure` | boolean | `false` | Continue execution if scenario fails |

### HTTP Configuration

```json
{
  "http": {
    "client": "got",
    "timeout": 10000,
    "retries": 3,
    "userAgent": "vibranium-cli/0.1.0",
    "followRedirects": true,
    "maxRedirects": 5
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `client` | string | `"got"` | HTTP client to use (got, axios, fetch) |
| `timeout` | number | `10000` | Request timeout in milliseconds |
| `retries` | number | `3` | Number of retry attempts |
| `userAgent` | string | `"vibranium-cli/x.x.x"` | User-Agent header |
| `followRedirects` | boolean | `true` | Follow HTTP redirects |
| `maxRedirects` | number | `5` | Maximum redirect count |

### Logging Configuration

```json
{
  "logging": {
    "level": "info",
    "colors": true,
    "timestamp": true,
    "format": "pretty"
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `level` | string | `"info"` | Log level (debug, info, warn, error) |
| `colors` | boolean | `true` | Enable colored output |
| `timestamp` | boolean | `true` | Include timestamps in logs |
| `format` | string | `"pretty"` | Log format (pretty, json) |

For complete configuration examples, see the [Configuration Guide](/guide/configuration).