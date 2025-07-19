# Vibranium CLI Implementation Todo

## 🚀 Phase 1: Foundation & Monorepo Setup (Priority 1)

### In Progress

### Planned
- [ ] **Setup @vibraniumjs namespace packages**
  - [ ] packages/types → @vibraniumjs/types
  - [ ] packages/http-client → @vibraniumjs/http-client  
  - [ ] packages/utils → @vibraniumjs/utils
  - [ ] packages/core → @vibraniumjs/core
  - [ ] packages/plugins → @vibraniumjs/plugins
  - [ ] packages/cli → @vibraniumjs/cli
  - [ ] packages/ui → @vibraniumjs/ui


- [ ] **Setup Vite configuration for UI packages**

## 🏗️ Phase 2: Abstraction Layers (Priority 1)

### Planned
- [ ] **HTTP Client Abstraction (@vibraniumjs/http-client)**
  - [ ] Define HttpClient interface with all HTTP methods
  - [ ] Implement Got adapter as default
  - [ ] Create Axios adapter for alternative
  - [ ] Create Fetch adapter for future use
  - [ ] Add comprehensive error handling and types

- [ ] **Type System (@vibraniumjs/types)**
  - [ ] Core interfaces (Step, Scenario, Environment, ExecutionContext)
  - [ ] Variable system types (VariableMap, DotNotationResolver)
  - [ ] Plugin interface (VibraniumPlugin)
  - [ ] Validation types (ExpectBlock, Operator, ValidationResult)
  - [ ] HTTP abstractions (HttpClient, HttpRequest, HttpResponse)

## ⚙️ Phase 3: Core Architecture (Priority 1)

### Planned
- [ ] **Core Engine (@vibraniumjs/core)**
  - [ ] Scenario parser (YAML/JSON with schema validation)
  - [ ] Variable resolver ($.env, $.context, $.response, $.api, $.random, $.<alias>)
  - [ ] Step executor with plugin delegation
  - [ ] Dependency manager for step execution order
  - [ ] Validation engine (all operators: equals, contains, regex, schema, etc.)
  - [ ] Content-type parsers (JSON/JSONPath, XML/XPath, text, binary)

- [ ] **Utilities (@vibraniumjs/utils)**
  - [ ] File system helpers (config loading, scenario discovery)
  - [ ] Random data generators integration
  - [ ] Environment manager with variable resolution
  - [ ] Structured logging system with colors
  - [ ] Global configuration management

## 💻 Phase 4: CLI Implementation (Priority 1)

### Planned
- [ ] **Main CLI Package (@vibraniumjs/cli)**
  - [ ] Binary setup (vibranium/vm commands)
  - [ ] Mode detection (interactive vs headless)
  - [ ] Command structure (run, batch, init, validate)
  - [ ] Global configuration and help system

- [ ] **Headless CLI**
  - [ ] Single scenario execution
  - [ ] Batch execution with parallel processing
  - [ ] Report generation (HTML, JSON, JUnit)
  - [ ] Proper exit codes and error handling

- [ ] **Interactive CLI (Ink UI)**
  - [ ] Three-pane layout (tree, details, status)
  - [ ] Navigation tree with keyboard controls
  - [ ] Live YAML/JSON editor with validation
  - [ ] Real-time variable preview
  - [ ] Keyboard shortcuts and status indicators

## 🔌 Phase 5: Plugin System (Priority 2)

### Planned
- [ ] **Plugin Architecture (@vibraniumjs/plugins)**
  - [ ] Plugin registry and loading system
  - [ ] Step type routing to plugins
  - [ ] Plugin lifecycle hooks
  - [ ] Extension points for custom operators

- [ ] **Core API Plugin**
  - [ ] HTTP step implementation for all methods
  - [ ] Request building with headers/auth/multipart
  - [ ] Response parsing delegation
  - [ ] Lifecycle hooks (beforeApi, afterApi)

## 🧪 Phase 6: Testing & Quality (Priority 1)

### Planned
- [ ] **Test Suite**
  - [ ] Unit tests for all packages with Jest
  - [ ] CLI snapshot tests with ink-testing-library
  - [ ] Integration tests with real HTTP calls
  - [ ] Validator tests for all operators
  - [ ] HTTP client tests for all implementations
  - [ ] Self-hosting tests using Vibranium + MSW

- [ ] **Code Quality**
  - [ ] TypeScript strict mode across all packages
  - [ ] ESLint configuration with Nx preset
  - [ ] Prettier formatting with workspace support
  - [ ] Build validation and dependency management

## 📚 Phase 7: Documentation & Examples (Priority 2)

### Planned
- [ ] **Example Scenarios (apps/examples)**
  - [ ] Basic API tests with explanations
  - [ ] Complex multi-step workflows
  - [ ] Validation examples for all operators
  - [ ] Environment configurations with secrets
  - [ ] Plugin examples and custom step types

- [ ] **Documentation Site (apps/docs)**
  - [ ] VitePress setup with navigation
  - [ ] Getting started guide
  - [ ] Complete scenario syntax reference
  - [ ] Variable system documentation
  - [ ] Plugin development guide
  - [ ] HTTP client swapping guide

## ✅ Completed

### Phase 1: Foundation & Monorepo Setup
- [x] **Initialize Nx workspace and monorepo structure** - Set up Nx 21.3.0 workspace with TypeScript, Jest, Vite, ESLint, Prettier. Updated package.json to Node 18+. Created tsconfig.base.json with @vibraniumjs/* path mappings. All configuration files in place.
- [x] **Update project configuration files** - Updated root package.json to modern stack (Node 18+, TypeScript, Nx), created nx.json with project configurations, created tsconfig.base.json with @vibraniumjs/* path aliases, added .eslintrc.json for Nx preset, added prettier.config.js for workspace, created jest.config.js and jest.preset.js for testing setup.