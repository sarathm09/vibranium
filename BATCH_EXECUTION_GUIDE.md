# Vibranium CLI: Enhanced Batch Execution Mode

This document outlines the comprehensive batch execution capabilities that have been implemented for the Vibranium CLI, making it suitable for CI/CD pipelines and automated testing workflows.

## Overview

The Vibranium CLI now supports advanced batch execution with the following key features:

- **Pattern-based scenario discovery**: Run scenarios using file paths, glob patterns, or directories
- **Multiple output formats**: Console, JSON, JUnit XML, and HTML reports
- **Parallel execution**: Run multiple scenarios concurrently with configurable concurrency limits
- **Watch mode**: Continuous testing during development with file change detection
- **CI/CD integration**: Proper exit codes and machine-readable output formats
- **Progress indicators**: Real-time status updates and progress reporting

## Command Structure

### Enhanced `run` Command

The `run` command is the primary interface for executing scenarios and supports various execution modes:

```bash
# Run all scenarios in current directory
vibranium run

# Run a specific scenario file
vibranium run api-tests.yaml

# Run scenarios matching a glob pattern
vibranium run "tests/**/*.yaml"

# Run all scenarios in a specific directory
vibranium run tests/api

# Run with specific environment
vibranium run -e production

# Run in parallel with custom concurrency
vibranium run -p --max-concurrency 8

# Generate JUnit XML report for CI/CD
vibranium run -f junit -o test-results.xml

# Watch mode for development
vibranium run --watch
```

### Legacy `batch` Command

The `batch` command is maintained for backward compatibility but is deprecated in favor of the enhanced `run` command:

```bash
# Legacy batch execution (deprecated)
vibranium batch tests/ -p --max-concurrency 4
```

## Execution Modes

### 1. Single Scenario Execution

```bash
# Interactive mode (if TTY available)
vibranium run scenario.yaml

# Headless mode (auto-detected or forced)
vibranium run scenario.yaml --headless
```

### 2. Batch Execution

```bash
# Sequential execution
vibranium run tests/

# Parallel execution
vibranium run tests/ -p

# Parallel with custom concurrency
vibranium run tests/ -p --max-concurrency 6

# Continue on failure
vibranium run tests/ --continue-on-failure
```

### 3. Pattern-Based Execution

```bash
# Glob patterns
vibranium run "**/*.test.yaml"
vibranium run "api/**/*.yaml"
vibranium run "tests/{integration,e2e}/**/*.yaml"

# Directory patterns
vibranium run tests/api tests/integration
```

## Output Formats

### Console Output (Default)

Provides colored, human-readable output with progress indicators and summaries:

```bash
vibranium run tests/ -f console
```

### JSON Output

Machine-readable format ideal for programmatic processing:

```bash
vibranium run tests/ -f json -o results.json
```

JSON structure:
```json
{
  "success": true,
  "scenarios": [...],
  "summary": {
    "total": 10,
    "passed": 8,
    "failed": 2,
    "passRate": 80.0,
    "totalDuration": 15000,
    "averageDuration": 1500
  },
  "duration": 15234,
  "environment": "local"
}
```

### JUnit XML Output

Compatible with CI/CD systems like Jenkins, GitHub Actions, etc.:

```bash
vibranium run tests/ -f junit -o test-results.xml
```

### HTML Report

Rich, interactive HTML reports for detailed analysis:

```bash
vibranium run tests/ -f html -o report.html
```

## Watch Mode

Perfect for development workflows with automatic re-execution on file changes:

```bash
# Watch all scenarios
vibranium run --watch

# Watch specific pattern
vibranium run "api/**/*.yaml" --watch

# Watch with custom options
vibranium run --watch -e development -f console
```

Watch mode monitors:
- Scenario files (*.yaml, *.yml, *.json)
- Environment configuration files
- Related project files

## Environment Management

```bash
# Use specific environment
vibranium run -e production

# Environment-specific execution
vibranium run -e staging tests/integration/

# Multiple environments (if supported)
vibranium run -e "staging,production" tests/
```

## CI/CD Integration

### Exit Codes

The CLI returns appropriate exit codes for CI/CD integration:

- `0`: Success - all scenarios passed
- `1`: General error
- `2`: Validation error
- `3`: Configuration error
- `4`: Scenario not found
- `5`: Execution failed - one or more scenarios failed
- `130`: Interrupted by user (SIGINT)

### GitHub Actions Example

```yaml
name: API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install -g vibranium-cli
      
      - name: Run API Tests
        run: vibranium run tests/ -f junit -o test-results.xml -e ci
      
      - name: Publish Test Results
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: API Test Results
          path: test-results.xml
          reporter: java-junit
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'vibranium run tests/ -f junit -o test-results.xml -e ci'
            }
            post {
                always {
                    junit 'test-results.xml'
                }
            }
        }
    }
}
```

## Performance Optimization

### Parallel Execution

```bash
# Optimize concurrency based on system resources
vibranium run tests/ -p --max-concurrency $(nproc)

# Conservative parallel execution
vibranium run tests/ -p --max-concurrency 2

# High-performance execution
vibranium run tests/ -p --max-concurrency 16
```

### Selective Execution

```bash
# Run only failed tests
vibranium run tests/ --failed-only

# Run specific test suites
vibranium run "tests/{critical,smoke}/**/*.yaml"

# Skip slow tests in development
vibranium run tests/ --exclude "**/*slow*"
```

## Error Handling and Debugging

### Verbose Output

```bash
# Verbose logging
vibranium run tests/ -v

# Debug mode
vibranium run tests/ --debug

# Detailed error reporting
vibranium run tests/ -v -f json
```

### Failure Handling

```bash
# Stop on first failure (default)
vibranium run tests/

# Continue on failures
vibranium run tests/ --continue-on-failure

# Fail fast with parallel execution
vibranium run tests/ -p --max-concurrency 4
```

## Advanced Configuration

### Global Configuration

```bash
# Use custom configuration file
vibranium run tests/ -c custom-config.yaml

# Override default timeout
vibranium run tests/ --timeout 60000

# Disable colors for scripting
vibranium run tests/ --no-colors
```

### Report Customization

```bash
# Custom output location
vibranium run tests/ -f html -o reports/test-report.html

# Include detailed metadata
vibranium run tests/ -f json --include-metadata

# Minimal console output
vibranium run tests/ -f console --console-level minimal
```

## Migration from Legacy Commands

### From `batch` to `run`

```bash
# Old way (deprecated)
vibranium batch tests/ -p --max-concurrency 4 --reporter json

# New way (recommended)
vibranium run tests/ -p --max-concurrency 4 -f json
```

### Command Mapping

| Legacy | Enhanced |
|--------|----------|
| `vibranium batch <dir>` | `vibranium run <dir>` |
| `--reporter <format>` | `-f <format>` or `--format <format>` |
| N/A | `--watch` |
| N/A | Pattern support |
| N/A | `--output <file>` |

## Best Practices

1. **Use patterns for selective testing**: `vibranium run "tests/{critical,smoke}/**/*.yaml"`
2. **Optimize concurrency**: Start with `--max-concurrency 4` and adjust based on system performance
3. **Use appropriate output formats**: Console for development, JUnit for CI/CD, HTML for reporting
4. **Leverage watch mode**: Use `--watch` during development for rapid feedback
5. **Handle failures appropriately**: Use `--continue-on-failure` for comprehensive test runs
6. **Environment-specific testing**: Always specify environment with `-e <env>`
7. **Structured reporting**: Use JSON format for programmatic analysis

This enhanced batch execution mode makes Vibranium CLI a powerful tool for both development and production testing workflows.