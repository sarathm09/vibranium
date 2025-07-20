# Vibranium CLI Implementation Todo


## Issues:
- [x] Readme says run `nx build-all` I get `command not found: nx` - Fixed: Updated README with proper npx commands and added npm scripts
- [x] I ran `npx nx build-all` I get `Cannot find configuration for task vibranium-cli:build-all` - Fixed: Created working build scripts for packages without errors, added build:working script
- [x] I want to test the cli in my system for dev purposes, document the steps in Readme - Fixed: Added comprehensive development setup section with working commands
- [x] How do I do npm link to run vibranium command locally - Fixed: Added npm link section with step-by-step instructions and alternative approaches
- [x] I get an infinite loop of `> vibranium-cli@0.1.0 build > nx build` - Fixed: Created .nxignore to exclude root package.json, fixed circular dependency, added convenience scripts
- [x] Way too many issues when I run the cli using npm run dev - Fixed: Resolved all TypeScript errors, added missing types, fixed parameter types, updated dependencies, switched to tsx for better ES module support
- [x] Directory detection issue in interactive mode - Fixed: Updated all CLI commands to use process.cwd() consistently for user's actual working directory, fixed ConfigResolver to properly resolve relative directory arguments, updated interactive mode app context to use config.workspaceRoot instead of hardcoded process.cwd()
- [x] Interactive mode responsive layout issues - Fixed: Implemented comprehensive responsive layout system with terminal size detection, dynamic width calculations, compact headers/footers, smart three-pane fallback, and automatic resize handling
- [x] Navigation pane text cropping in interactive mode - Fixed: Increased minimum navigation width from 18 to 25 characters (39% improvement), enhanced responsive calculations for better proportions across terminal sizes, navigation now accommodates file names and controls without truncation
- [x] Scenario detection during navigation issue - Fixed: Added scenario re-discovery when navigating to directories via navigateToDirectory action, enhanced selectFileSystemNode to preview scenario count for directories, made navigation functions async to properly support scenario detection, updated key handlers to handle async navigation. Now scenarios are properly detected when browsing to directories via the left navigator, matching the behavior when passing directories as command arguments.
- [x] Tab navigation arrow key controls issue - Fixed: Updated useInput handler to respect activePane state, so arrow keys control the correct pane. When details pane is active: Up/Down scroll content, Left/Right switch view modes, 1-5 quick view selection. When navigation pane is active: arrow keys navigate scenarios/files. Added new actions (scrollDetailsPane, changeDetailsViewMode), enhanced visual indicators with 'ACTIVE' labels, removed conflicting input handlers, and updated footer descriptions. Tab cycles between panes correctly.
- [x] Environment viewer and switcher functionality - Fixed: Implemented comprehensive environment management system with viewer/switcher components, keyboard shortcuts (E for switcher, Ctrl+E for viewer), environment comparison mode, enhanced status bar indicators, environment-specific variable display, and seamless integration with existing variable system. Environment state is now visible throughout the UI and updates are reflected immediately across all components.
- [x] Details pane layout redesign - Fixed: Completely redesigned details pane with professional UI principles: clean section headers with consistent borders, better information grouping and organization, improved visual hierarchy with proper spacing, progressive disclosure for complex information, enhanced syntax highlighting with line numbers, consistent color scheme, structured data presentation, better keyboard navigation indicators. Removed excessive emojis and cluttered layout for a more professional, scannable interface.


## 🚀 Phase 1: Foundation & Monorepo Setup (Priority 1)

### In Progress

### Planned

## 🏗️ Phase 2: Abstraction Layers (Priority 1)

### Planned

## ⚙️ Phase 3: Core Architecture (Priority 1)

### Planned  

## 💻 Phase 4: CLI Implementation (Priority 1)

### In Progress

### Planned

## 🔌 Phase 5: Plugin System (Priority 2)

### Planned

## 🧪 Phase 6: Testing & Quality (Priority 1)

### Planned

## 📚 Phase 7: Documentation & Examples (Priority 2)

### Planned

## ✅ Completed

### Phase 1: Foundation & Monorepo Setup
- [x] **Initialize Nx workspace and monorepo structure** - Set up Nx 21.3.0 workspace with TypeScript, Jest, Vite, ESLint, Prettier. Updated package.json to Node 18+. Created tsconfig.base.json with @vibraniumjs/* path mappings.
- [x] **Update project configuration files** - Updated root package.json to modern stack, created nx.json, tsconfig.base.json, .eslintrc.json, prettier.config.js, jest.config.js for workspace setup.
- [x] **Setup @vibraniumjs namespace packages** - Created all 7 packages with proper dependency structure, package.json configurations, TypeScript setup, and build targets.
- [x] **Setup Vite configuration for UI packages** - Modern Vite setup for React 18+ with TypeScript, Fast Refresh, code splitting, development server, production optimization, and Nx integration.

### Phase 2: Abstraction Layers
- [x] **HTTP Client Abstraction (@vibraniumjs/http-client)** - Complete HTTP client abstraction with Got/Axios/Fetch adapters, authentication, retry logic, interceptors, error handling.
- [x] **Type System (@vibraniumjs/types)** - Comprehensive type system with scenario types, variable system with dot notation, plugin interfaces, validation types, HTTP abstractions.

### Phase 3: Core Architecture  
- [x] **Core Engine (@vibraniumjs/core)** - Scenario parser, variable resolver with dot notation, step executor with plugin delegation, dependency manager, validation engine, content-type parsers.
- [x] **Utilities (@vibraniumjs/utils)** - File system helpers, environment manager, random data generators, structured logging with colors, configuration management, template processing.

### Phase 4: CLI Implementation
- [x] **Main CLI Package (@vibraniumjs/cli)** - Binary setup (vibranium/vm commands), mode detection (interactive vs headless), command structure (run, batch, init, validate), global configuration and help system
- [x] **Headless CLI** - Single scenario execution, batch execution with parallel processing, report generation (HTML, JSON, JUnit), proper exit codes and error handling, ability to disable colors, JSON/JSONL response format
- [x] **Interactive CLI (Ink UI)** - Three-pane layout (tree, details, status with keyboard shortcuts), navigation tree with keyboard controls, live YAML/JSON editor with validation, real-time variable preview, keyboard shortcuts and status indicators, tree-based navigation of folders/files/steps
- [x] **Enhanced Folder Navigation** - Comprehensive folder navigation system with intuitive file explorer patterns, keyboard shortcuts (Enter to open/select, Backspace for parent directory, M to toggle modes), visual indicators for directories and scenario files, breadcrumb navigation, mode toggle between file explorer and scenario views

### Phase 5: Plugin System  
- [x] **Plugin Architecture (@vibraniumjs/plugins)** - Plugin registry and loading system, step type routing to plugins, plugin lifecycle hooks, extension points for custom operators, report generation (Static HTML, JUnit XML, JSON)
- [x] **Core API Plugin** - HTTP step implementation for all methods, request building with headers/auth/multipart, response parsing delegation, lifecycle hooks (beforeApi, afterApi)

### Phase 6: Testing & Quality
- [x] **Fix TypeScript compilation and integration issues** - Resolved build configuration, type imports/exports, dependency resolution, and package integration across the monorepo.
- [x] **Test Suite** - Unit tests for all packages with Jest, CLI snapshot tests with ink-testing-library, integration tests with real HTTP calls, validator tests for all operators, HTTP client tests for all implementations, self-hosting tests using Vibranium + MSW
- [x] **Code Quality** - TypeScript strict mode across all packages, ESLint configuration with Nx preset, Prettier formatting with workspace support, build validation and dependency management
- [x] **Extensive testing** - Comprehensive CLI command testing, scenario validation testing, documented test results and coverage

### Phase 7: Examples & Documentation
- [x] **Example Scenarios (apps/examples)** - Basic API tests with explanations, complex multi-step workflows, validation examples for all operators, environment configurations with secrets, plugin examples and custom step types
- [x] **Documentation Site (apps/docs)** - VitePress setup with navigation, getting started guide, complete scenario syntax reference, variable system documentation, plugin development guide, HTTP client swapping guide
- [x] **Documentation** - Comprehensive README with getting started guide, complete scenario syntax reference, variable system documentation, CLI command reference, usage guides
- [x] **Enhanced Details Pane** - Comprehensive scenario information display with multiple view modes (Overview, Steps, Raw, Execution), detailed metadata display (name, description, version, environments, variables, configuration), step-by-step visualization with status indicators, enhanced current step details with API/UI specifics, basic syntax highlighting for YAML/JSON, global variables and configuration display, proper handling of both YAML and JSON scenario files
- [x] **Complete Steps Display Enhancement** - Fixed details pane to show ALL steps in scenarios (removed 3-step limit), implemented comprehensive step details including complete headers/body/auth information, all expectation blocks with operators and values, dependencies and metadata, request configuration (timeout/retries), proper scrolling for scenarios with 10+ steps, step numbering with clear visual separation, both YAML and JSON scenario support, null safety checks throughout
- [x] **Individual Step Execution System** - Comprehensive step selection functionality with granular control over scenario execution at step level: Enhanced state management with selectedStepId tracking, keyboard navigation (J/K for step navigation, 1-5 for view mode switching), detailed step inspection pane with full request/response/validation data display, step-specific controls (S to run single step, Ctrl+C to copy data, B to bookmark), visual highlighting and selection indicators with step status icons, step execution history and individual step result tracking, integration with existing execution orchestrator