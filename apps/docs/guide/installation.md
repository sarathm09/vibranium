# Installation

This guide will help you install Vibranium CLI and get it running on your system.

## Prerequisites

Before installing Vibranium CLI, ensure you have:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (or yarn/pnpm equivalent)

Check your versions:

```bash
node --version  # Should be 18.0+
npm --version   # Should be 8.0+
```

## Global Installation

Install Vibranium CLI globally to use it from anywhere:

```bash
npm install -g vibranium-cli
```

This makes the `vibranium` and `vm` commands available system-wide.

Verify the installation:

```bash
vibranium --version
# or
vm --version
```

## Local Project Installation

For project-specific installations, add Vibranium CLI to your project:

```bash
# Using npm
npm install --save-dev vibranium-cli

# Using yarn
yarn add --dev vibranium-cli

# Using pnpm
pnpm add --save-dev vibranium-cli
```

Then use it via npm scripts or npx:

```bash
# Via npx
npx vibranium run scenarios/health-check.yaml

# Via npm scripts (add to package.json)
npm run test:api
```

## Alternative Installation Methods

### From Source

Clone and build from the GitHub repository:

```bash
git clone https://github.com/sarathm09/vibranium.git
cd vibranium
npm install
npm run build
npm link
```

### Using Docker

Run Vibranium CLI in a Docker container:

```bash
# Pull the official image
docker pull sarathm09/vibranium-cli:latest

# Run a scenario
docker run --rm -v $(pwd):/workspace sarathm09/vibranium-cli:latest \
  run /workspace/scenarios/health-check.yaml --env production
```

### CI/CD Installation

For use in continuous integration pipelines:

#### GitHub Actions

```yaml
- name: Install Vibranium CLI
  run: npm install -g vibranium-cli

- name: Run API Tests
  run: vm batch scenarios/ --env staging --report junit
```

#### GitLab CI

```yaml
test:api:
  image: node:18
  before_script:
    - npm install -g vibranium-cli
  script:
    - vm batch scenarios/ --env staging --report html
  artifacts:
    reports:
      junit: reports/junit.xml
    paths:
      - reports/
```

#### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Install') {
            steps {
                sh 'npm install -g vibranium-cli'
            }
        }
        stage('Test') {
            steps {
                sh 'vm batch scenarios/ --env staging'
            }
        }
    }
}
```

## Command Aliases

Vibranium CLI provides two command aliases:

- `vibranium` - Full command name
- `vm` - Short alias for faster typing

Both commands are functionally identical:

```bash
vibranium run scenario.yaml
vm run scenario.yaml        # Same as above
```

## Verification

After installation, verify everything is working:

```bash
# Check version
vm --version

# View help
vm --help

# Test with a simple scenario
echo 'name: test
steps:
  - name: httpbin
    type: api
    method: GET
    url: https://httpbin.org/status/200
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200' > test.yaml

vm run test.yaml
```

## Updating

Keep Vibranium CLI up to date:

```bash
# Global installation
npm update -g vibranium-cli

# Local installation
npm update vibranium-cli
```

Check for the latest version:

```bash
npm view vibranium-cli version
```

## Troubleshooting

### Permission Issues (macOS/Linux)

If you encounter permission errors during global installation:

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g vibranium-cli

# Option 2: Configure npm to use a different directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g vibranium-cli
```

### Windows Issues

On Windows, you might need to:

1. Run Command Prompt or PowerShell as Administrator
2. Or use a Node.js version manager like `nvm-windows`

### Node.js Version Issues

If you're on an older Node.js version:

```bash
# Using nvm (macOS/Linux)
nvm install 18
nvm use 18

# Using nvm-windows
nvm install 18.0.0
nvm use 18.0.0
```

### Corporate Firewalls

If you're behind a corporate firewall:

```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use yarn
yarn config set proxy http://proxy.company.com:8080
yarn config set https-proxy http://proxy.company.com:8080
```

## Configuration

After installation, you may want to configure Vibranium CLI:

```bash
# Initialize configuration in current directory
vm init

# Set global configuration
vm config set default-env staging
vm config set timeout 30000
```

## Next Steps

Now that Vibranium CLI is installed:

1. **[Quick Start Guide](/guide/getting-started)** - Create your first scenario
2. **[Configuration](/guide/configuration)** - Set up environments and global settings
3. **[Writing Scenarios](/guide/writing-scenarios)** - Learn the scenario syntax
4. **[Examples](/examples/basic-testing)** - See real-world examples