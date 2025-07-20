# CLI Commands

Vibranium CLI provides a comprehensive set of commands for running scenarios, managing configurations, and generating reports. This reference covers all available commands and their options.

## Global Options

These options are available for all commands:

```bash
vm [command] [options]
```

| Option | Alias | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help information |
| `--version` | `-V` | Show version number |
| `--verbose` | `-v` | Enable verbose logging |
| `--quiet` | `-q` | Suppress non-essential output |
| `--no-color` |  | Disable colored output |
| `--config` | `-c` | Path to configuration file |

## Core Commands

### `run`

Execute a single scenario file.

```bash
vm run <scenario> [options]
```

#### Arguments

- `<scenario>` - Path to scenario file (YAML or JSON)

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--env` | `-e` | Environment to use | `default` |
| `--output` | `-o` | Output format (pretty, json, jsonl) | `pretty` |
| `--report` | `-r` | Generate report (html, json, junit) | - |
| `--report-dir` |  | Report output directory | `./reports` |
| `--timeout` | `-t` | Global timeout in milliseconds | `30000` |
| `--retries` |  | Default retry count | `0` |
| `--fail-fast` |  | Stop on first failure | `false` |
| `--dry-run` |  | Validate without executing | `false` |
| `--variables` |  | Override variables (JSON string) | - |

#### Examples

```bash
# Basic execution
vm run scenarios/health-check.yaml

# With specific environment
vm run scenarios/user-flow.yaml --env staging

# Generate HTML report
vm run scenarios/api-test.yaml --report html

# Override variables
vm run scenarios/test.yaml --variables '{"apiUrl":"http://localhost:3000"}'

# Dry run (validation only)
vm run scenarios/complex.yaml --dry-run

# JSON output for CI/CD
vm run scenarios/smoke-test.yaml --output json --no-color
```

### `batch`

Execute multiple scenarios from a directory.

```bash
vm batch <directory> [options]
```

#### Arguments

- `<directory>` - Directory containing scenario files

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--env` | `-e` | Environment to use | `default` |
| `--parallel` | `-p` | Enable parallel execution | `false` |
| `--concurrency` |  | Maximum concurrent scenarios | `5` |
| `--pattern` |  | File pattern to match | `**/*.{yaml,yml,json}` |
| `--exclude` |  | Patterns to exclude | - |
| `--report` | `-r` | Generate report format | `html` |
| `--report-dir` |  | Report output directory | `./reports` |
| `--continue-on-failure` |  | Continue if scenario fails | `false` |
| `--randomize` |  | Randomize execution order | `false` |
| `--timeout` | `-t` | Global timeout in milliseconds | `30000` |

#### Examples

```bash
# Run all scenarios in directory
vm batch scenarios/

# Parallel execution
vm batch scenarios/ --parallel --concurrency 10

# With file pattern
vm batch tests/ --pattern "**/*integration*.yaml"

# Exclude patterns
vm batch scenarios/ --exclude "**/wip/**" --exclude "**/*draft*"

# Continue on failures
vm batch scenarios/ --continue-on-failure --report junit

# Randomized execution
vm batch scenarios/ --randomize --parallel
```

### `interactive` (default)

Launch the interactive terminal UI.

```bash
vm [interactive] [options]
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--directory` | `-d` | Starting directory | `./scenarios` |
| `--env` | `-e` | Default environment | `default` |
| `--theme` |  | UI theme (dark, light, auto) | `auto` |

#### Examples

```bash
# Launch interactive mode
vm

# Start in specific directory
vm --directory tests/integration

# Use specific environment
vm --env production

# Force dark theme
vm --theme dark
```

## Configuration Commands

### `config`

Manage configuration settings.

```bash
vm config [subcommand] [options]
```

#### Subcommands

##### `get`
Get configuration value:

```bash
vm config get [key]
```

```bash
# Get all configuration
vm config get

# Get specific value
vm config get http.timeout

# Get nested value
vm config get environments.default
```

##### `set`
Set configuration value:

```bash
vm config set <key> <value>
```

```bash
# Set simple value
vm config set http.timeout 15000

# Set nested value
vm config set environments.default staging

# Set object value
vm config set http.proxy.http "http://proxy.company.com:8080"
```

##### `unset`
Remove configuration value:

```bash
vm config unset <key>
```

```bash
# Remove configuration
vm config unset http.proxy

# Remove nested value
vm config unset environments.staging
```

##### `reset`
Reset configuration to defaults:

```bash
vm config reset [--confirm]
```

```bash
# Reset with confirmation prompt
vm config reset

# Force reset without prompt
vm config reset --confirm
```

##### `validate`
Validate configuration:

```bash
vm config validate [file]
```

```bash
# Validate current configuration
vm config validate

# Validate specific file
vm config validate ./custom-config.json
```

##### `schema`
Generate configuration schema:

```bash
vm config schema [--output file]
```

```bash
# Print schema to stdout
vm config schema

# Save schema to file
vm config schema --output vibranium-config.schema.json
```

### `init`

Initialize new project with configuration files.

```bash
vm init [directory] [options]
```

#### Arguments

- `[directory]` - Target directory (default: current directory)

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--template` | `-t` | Template to use | `basic` |
| `--force` | `-f` | Overwrite existing files | `false` |
| `--env` |  | Create environment files | `true` |
| `--examples` |  | Include example scenarios | `true` |

#### Templates

- `basic` - Basic configuration with minimal setup
- `advanced` - Full configuration with all features
- `ci` - CI/CD optimized configuration
- `team` - Team development configuration

#### Examples

```bash
# Initialize in current directory
vm init

# Initialize in new directory
vm init my-api-tests

# Use advanced template
vm init --template advanced

# Skip examples
vm init --no-examples

# Force overwrite
vm init --force --template ci
```

## Environment Commands

### `env`

Manage environments.

```bash
vm env [subcommand] [options]
```

#### Subcommands

##### `list`
List available environments:

```bash
vm env list
```

##### `show`
Show environment details:

```bash
vm env show <environment>
```

```bash
# Show staging environment
vm env show staging

# Show with secrets (if accessible)
vm env show staging --include-secrets
```

##### `validate`
Validate environment file:

```bash
vm env validate <environment>
```

```bash
# Validate specific environment
vm env validate staging

# Validate all environments
vm env validate --all
```

##### `create`
Create new environment:

```bash
vm env create <name> [options]
```

```bash
# Create from template
vm env create development --template local

# Create with specific variables
vm env create testing --variable API_URL=http://test.api.com
```

## Validation Commands

### `validate`

Validate scenario files without execution.

```bash
vm validate <path> [options]
```

#### Arguments

- `<path>` - Scenario file or directory path

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--env` | `-e` | Environment for validation | `default` |
| `--strict` |  | Enable strict validation | `false` |
| `--schema` |  | Custom schema file | - |
| `--format` |  | Output format (pretty, json) | `pretty` |

#### Examples

```bash
# Validate single scenario
vm validate scenarios/user-test.yaml

# Validate directory
vm validate scenarios/ --env staging

# Strict validation
vm validate scenarios/ --strict

# Custom schema
vm validate scenarios/ --schema ./custom-schema.json

# JSON output
vm validate scenarios/ --format json
```

## Report Commands

### `report`

Generate reports from previous executions.

```bash
vm report [subcommand] [options]
```

#### Subcommands

##### `generate`
Generate report from execution data:

```bash
vm report generate <input> [options]
```

```bash
# Generate HTML report from JSON results
vm report generate results.json --format html

# Generate JUnit report
vm report generate results.json --format junit --output test-results.xml

# Custom template
vm report generate results.json --template ./custom-template.html
```

##### `serve`
Serve HTML reports locally:

```bash
vm report serve [directory] [options]
```

```bash
# Serve reports directory
vm report serve reports/

# Custom port
vm report serve reports/ --port 8080

# Auto-refresh
vm report serve reports/ --watch
```

## Plugin Commands

### `plugin`

Manage plugins.

```bash
vm plugin [subcommand] [options]
```

#### Subcommands

##### `list`
List installed plugins:

```bash
vm plugin list [--available]
```

##### `install`
Install plugin:

```bash
vm plugin install <name|path>
```

```bash
# Install from npm
vm plugin install @vibranium/ui-testing

# Install from local path
vm plugin install ./local-plugin

# Install specific version
vm plugin install @vibranium/ui-testing@1.2.0
```

##### `uninstall`
Remove plugin:

```bash
vm plugin uninstall <name>
```

##### `info`
Show plugin information:

```bash
vm plugin info <name>
```

## Utility Commands

### `version`

Show version information.

```bash
vm version [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |
| `--full` | Show detailed version info |

```bash
# Basic version
vm version

# Detailed version info
vm version --full

# JSON format
vm version --json
```

### `doctor`

Diagnose common issues.

```bash
vm doctor [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--fix` | Attempt to fix issues |
| `--verbose` | Detailed diagnostics |

```bash
# Run diagnostics
vm doctor

# Fix issues automatically
vm doctor --fix

# Verbose output
vm doctor --verbose
```

### `clean`

Clean temporary files and caches.

```bash
vm clean [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--reports` | Clean report files |
| `--cache` | Clean cache files |
| `--logs` | Clean log files |
| `--all` | Clean everything |

```bash
# Clean all temporary files
vm clean --all

# Clean only reports
vm clean --reports

# Clean cache and logs
vm clean --cache --logs
```

## Exit Codes

Vibranium CLI uses standard exit codes:

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |
| `3` | Configuration error |
| `4` | Scenario validation error |
| `5` | Execution error |
| `6` | Environment error |
| `7` | Plugin error |

## Environment Variables

Override CLI behavior with environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VIBRANIUM_CONFIG` | Configuration file path | `./vibranium.config.json` |
| `VIBRANIUM_ENV` | Default environment | `default` |
| `VIBRANIUM_LOG_LEVEL` | Log level | `info` |
| `VIBRANIUM_NO_COLOR` | Disable colors | `false` |
| `VIBRANIUM_PARALLEL` | Enable parallel execution | `false` |
| `VIBRANIUM_TIMEOUT` | Default timeout (ms) | `30000` |
| `VIBRANIUM_RETRIES` | Default retries | `0` |

## Shell Completion

Enable shell completion for faster command entry:

### Bash

```bash
# Add to ~/.bashrc
eval "$(vm completion bash)"
```

### Zsh

```bash
# Add to ~/.zshrc
eval "$(vm completion zsh)"
```

### Fish

```bash
# Add to ~/.config/fish/config.fish
vm completion fish | source
```

### PowerShell

```powershell
# Add to PowerShell profile
vm completion powershell | Out-String | Invoke-Expression
```

## Common Patterns

### CI/CD Integration

```bash
# Simple CI test
vm batch scenarios/ --env ci --report junit --no-color

# Parallel CI execution
vm batch scenarios/ --parallel --concurrency 10 --env ci --fail-fast

# Generate multiple report formats
vm batch scenarios/ --report html --report json --report junit
```

### Development Workflow

```bash
# Quick single test
vm run scenarios/user-test.yaml --env local

# Watch mode (using external tools)
watchexec -e yaml,yml,json "vm run scenarios/user-test.yaml"

# Debug mode
vm run scenarios/problematic.yaml --verbose --dry-run
```

### Load Testing

```bash
# High concurrency
vm batch load-tests/ --parallel --concurrency 50 --env load

# With custom timeout
vm batch load-tests/ --timeout 60000 --retries 0
```

For more information about scenario syntax and validation, see the [Scenario Syntax Reference](/reference/scenario-syntax).