
## Project Overview
Refer to the comprehensive design document `./apps/docs/Design and Requirements.md` for full project details, architecture, and specifications. Check with user before deviating from this doc.


## Rules
1. **Task Organization System**: Maintain organized task tracking in `tasks/todo.md`. List down all tasks planned, in progress and completed ones. In progress ones should be at the top, planned/pending next and completed ones should be at the bottom.  **CRITICAL**: update task tracking as work progresses, adding short (max 2 line) summary and marking the task status in the todo file. 
2. **Session Start Process**: **CRITICAL** At the start of each session, go through the todo file, pick the list of bugs and tasks. First think through the problem, read the codebase for relevant files, and prepare a plan that groups then changes into isolated sub tasks so that things can be parallelized and done effectively without conflicts.
3. **Validation**: Before beginning work, check in with user to verify the plan
4. **Implementation**: **CRITICAL** Always use parallel Task agents for implementation work. Launch multiple Task tools concurrently for maximum efficiency. NEVER work sequentially when tasks can be parallelized. Each task handles ONLY specified files or file types
5. **Simplicity**: **CRITICAL** Make MINIMAL CHANGES to existing patterns and structures. Diligently follow the task organization system every session
6. **UX Standards**: Research standard UX best practices from FAANG/SaaS companies and grade implementation. Ensure app conforms to style guide across all screens
6. **Code Best Practices**: Research standard coding best practices from FAANG/SaaS companies and grade implementation. Have linting and static checks enabled on build.  **CRITICAL** Follow design patterns extensively and have extensible coding practices with interface/protocol based approach wherever possible.
8. **Technical Support**: Use context7 mcp for latest Typescript/Nx/Node/other library docs
9. **Quality & Security**: 
    -  **CRITICAL**: Check all code follows security best practices. Ensure no sensitive information exposure or exploitable vulnerabilities
    -  **CRITICAL**: Ensure all files are formatted, run lint checks if needed. 
    -  **CRITICAL**: Preserve existing naming conventions and file organization
    -  **CRITICAL**: Use existing utility functions and avoid duplicating functionality
    -  **CRITICAL**: Test everything you write, ensure nothing breaks and that errors and most warnings are addressed. Once all parallel sub tasks are done, build the code and fix issues. Once build succeeds, add the files to git.
10. **Context Optimization Rules**: Strip out all comments when reading code files for analysis. 


## CRITICAL WORKFLOW REMINDER
**ALWAYS USE PARALLEL TASK AGENTS FOR IMPLEMENTATION**
- IMMEDIATE EXECUTION: Launch parallel tasks immediately upon feature requests
- PARALLEL BY DEFAULT: Always use parallel task/agent method for efficiency. Use task tool for ALL implementation work - NEVER work sequentially when parallelization is possible. Ensure sub-tasks can run concurrently without conflicts. This is NOT optional - it's the required workflow for efficiency
- Use multiple Task tool calls in a single message for maximum efficiency
- Do what has been asked; nothing more, nothing less.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.


## **Post-Implementation**:
- **CRITICAL**: Build and test all changes, if build fails, make sure you fix them.
- **CRITICAL**: Update the tasks file with very crisp, 1-2 sentence summary and update the task status
- **CRITICAL**: Commit the changes to git with a crisp TWO LINE description. If there is a PR open for this branch, update the PR description with a very crisp changelog.


## Project Specific Guidelines

### Architecture & Design
- **Follow the established monorepo structure** using Nx workspace organization
- **Use the specified tech stack**: TypeScript, Node.js 18+, Ink, Vite, Nx, Got, AJV
- **Maintain the step-based architecture** with `type` field for extensibility (api, ui, etc.)
- **Implement proper dot notation variable system**: `$.env`, `$.global`, `$.context`, `$.response`, `$.request`, `$.api`, `$.random`, `$.<alias>`
- **Follow the established naming conventions**: `vibranium-cli` package, `sarathm09/vibranium` repo, `vibranium`/`vm` CLI commands
- **Handle all content types**: JSON (JSONPath), XML (XPath), text, binary, multipart

### Code Standards
- **Write TypeScript with strict type safety** - use proper interfaces and types
- **Support both YAML and JSON** scenario file formats consistently
- **Use modern async/await patterns** throughout the codebase
- **Write comprehensive tests** for all functionality (unit, integration, CLI snapshots)

### User Experience (CLI)
- **Maintain the three-pane Ink UI layout**: navigation tree, details pane, status bar
- **Implement environment switching** with visual indicators and keyboard shortcuts
- **Support both interactive and batch execution modes**
- **Provide clear error messages and validation feedback**
- **Follow consistent CLI command patterns and help text**
- **Follow colorful logs to indicate test status, logs reports and other metadata. Add option to disable color**

### Development Practices
- **Use Nx generators and executors** for consistent project setup
- **Implement proper error handling and logging**
- **Follow semantic versioning** and changelog practices
- **Write clear documentation** with examples for all features
- **Ensure backward compatibility** when making changes

## What Claude SHOULD NOT Do

### Architecture Violations
- **Don't change the established variable namespace** (`$.env`, `$.context`, etc.) without discussion
- **Don't break the step-based architecture** or change `steps` back to `endpoints`
- **Don't implement plugins differently** than the established interface pattern
- **Don't change the monorepo structure** or package organization arbitrarily

### Anti-Patterns
- **Don't hardcode values** that should use the variable system with constants files
- **Don't bypass the validation system** or create ad-hoc assertion methods
- **Don't mix content-type parsing** - use the established parsers for each type
- **Don't create duplicate functionality** across packages - use shared utilities
- **Don't skip error handling** or assume operations will always succeed

### Breaking Changes
- **Don't modify core interfaces** without considering backward compatibility
- **Don't alter the scenario file format** in breaking ways
- **Don't remove established features** without deprecation process

### Development Mistakes
- **Don't use outdated or deprecated libraries** - stick to the modern stack
- **Don't skip tests** - all code should have appropriate test coverage
- **Don't create circular dependencies** between packages
- **Don't ignore TypeScript errors** or use `any` types excessively
- **Don't implement features without proper error handling**


## Code Review Checklist

When reviewing or writing code, ensure:
- [ ] Follows TypeScript strict mode requirements
- [ ] Uses the established variable system correctly
- [ ] Handles all supported content types appropriately
- [ ] Includes comprehensive error handling
- [ ] Has appropriate test coverage
- [ ] Follows the plugin architecture where applicable
- [ ] Maintains consistency with established patterns
- [ ] Doesn't introduce breaking changes without justification
- [ ] Uses modern, performant approaches (Vite, Nx, async/await)

## Getting Help

When uncertain about implementation details:
1. **Refer to the comprehensive design document** for architecture decisions
2. **Check existing code patterns** in the monorepo for consistency
3. **Review the established interfaces** before creating new ones
4. **Consider extensibility** - will this work with future UI testing plugins?
5. **Ask for clarification** rather than making assumptions about requirements
6. **For library/framework documentation** use context7 mcp

## Quality Standards

All code should be:
- **Type-safe** with proper TypeScript interfaces
- **Well-tested** with unit and integration coverage
- **Properly documented** with clear examples
- **Performance-oriented** using modern tools and patterns
- **User-friendly** with clear error messages and help text
- **Maintainable** following established patterns and conventions