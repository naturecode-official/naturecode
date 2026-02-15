# AGENTS.md - Development Guide for NatureCode

## IMPORTANT: Language Requirements

- **User-Agent Conversations**: Use Chinese (中文)
- **All Other Content**: Use English (code, docs, configs, errors)
- **Emoji Policy**: STRICTLY PROHIBITED in all contexts
- **GitHub Commits**: Must use English for commit messages
- **Error Messages**: User-friendly Chinese prompts, technical details in English

## Project Overview

Cross-platform terminal AI assistant supporting DeepSeek, OpenAI, and Ollama. Built with Node.js ES modules.

## Project Structure

```
src/
├── cli/              # CLI interface and command handlers
├── config/           # Configuration management and secure storage
├── providers/        # AI provider implementations (DeepSeek, OpenAI, Ollama)
├── plugins/          # Plugin system (commands, manager, types)
├── utils/           # Utilities (filesystem, git, formatter, code analyzer)
└── tests/           # Test files
```

## Build and Development Commands

### Environment Setup

```bash
npm install
cp .env.example .env
```

### Development Commands

```bash
# Run application
npm run dev

# Build executables
npm run build

# Run all tests
npm test

# Run single test file
npm test -- --testPathPattern="filename"
# Example: npm test -- --testPathPattern="filesystem"
# Example: npm test -- --testPathPattern="git"

# Run specific test by name
npm test -- --testNamePattern="test description"

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Lint code
npm run lint

# Type checking
npm run typecheck

# Format code
npm run format
```

### Makefile Commands

```bash
make install      # Install dependencies
make build        # Build application
make test         # Run tests
make lint         # Lint code
make clean        # Clean build files
make package      # Create release package
make dmg          # Create macOS DMG (macOS only)
make release      # Full release process
make dev          # Development mode
make all          # Clean, install, build, test, lint, package
```

### Version Management

```bash
make version-patch  # Update patch version (1.4.5.5 → 1.4.5.6)
make version-minor  # Update minor version (1.4.5.4 → 1.4.6.0)
make version-major  # Update major version (1.4.5.4 → 2.0.0.0)
```

### Application Commands

```bash
naturecode model     # Configure AI model and API
naturecode start     # Start interactive session
naturecode git       # Git operations
naturecode code      # Code analysis and refactoring
naturecode project   # Project management
naturecode plugin    # Plugin management
naturecode session   # Session management
naturecode review    # Code review
naturecode team      # Team collaboration
naturecode --help    # Show help
naturecode --version # Show version
```

## Code Style Guidelines

### Architecture Overview

- **CLI Interface**: commander.js for argument parsing
- **Configuration Manager**: API keys, model preferences, secure storage
- **AI Provider Interface**: Abstract interface for providers
- **Session Manager**: Interactive chat sessions
- **Utilities**: ASCII art, file system, formatters, code analyzer

### JavaScript Standards

#### Imports/Exports

```javascript
// Use ES modules (project uses "type": "module")
import { Command } from "commander";
import { configManager } from "../config/manager.js";

// Export classes and functions
export class DeepSeekProvider extends AIProvider {
  // implementation
}
```

#### Naming Conventions

- **Classes**: `PascalCase` (DeepSeekProvider, ConfigManager)
- **Variables/Functions**: `camelCase` (apiKey, getUserInput)
- **Constants**: `UPPER_SNAKE_CASE` (DEEPSEEK_API_URL, MAX_TOKENS)
- **Private Members**: `_prefixWithUnderscore` (\_internalState)
- **Configuration Keys**: `kebab-case` (api-key, model-type)

#### Error Handling Pattern

```javascript
async function callAI(provider, prompt) {
  try {
    const response = await provider.generate(prompt);
    return response;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error(
        "Invalid API key. Please reconfigure with naturecode model",
      );
    } else {
      throw new Error(`AI service error: ${error.message}`);
    }
  }
}
```

#### Formatting & Spacing

- 2 spaces for indentation (no tabs)
- Semicolons at end of statements
- Maximum line length: 100 characters
- Use template literals for string concatenation
- Double quotes for strings (ESLint rule)
- Space after function name: `function name() {`
- Space after control keywords: `if (condition) {`
- Opening braces on same line as statement
- Consistent spacing around operators: `x = y + z`
- Blank lines between logical sections

#### ESLint Rules

- `no-console`: off (allowed for CLI application)
- `no-unused-vars`: error (ignore args starting with underscore)
- `no-undef`: error
- `semi`: error (always)
- `quotes`: error (double quotes, allow escaping)
- `indent`: error (2 spaces)
- `comma-dangle`: error (always-multiline)
- `object-curly-spacing`: error (always)
- `array-bracket-spacing`: error (never)
- `space-before-function-paren`: error (always)
- `keyword-spacing`: error (before: true, after: true)

## Agent Instructions

### Before Making Changes

1. Understand modular architecture: CLI → Config → Provider → Session
2. Check existing provider implementations for patterns
3. Review configuration schema and validation rules
4. Test current functionality with `naturecode start`

### When Editing Code

1. Maintain backward compatibility with existing configuration files
2. Follow established patterns for new AI providers
3. Add comprehensive error handling for network operations
4. Validate all user input and configuration data
5. Use environment variables for sensitive data

### After Changes

1. Run `npm run lint` to check code style
2. Run `npm run typecheck` for TypeScript validation
3. Test CLI commands with various inputs
4. Verify configuration loading and saving works
5. Update documentation if APIs change

### Testing Framework (Jest)

- Test environment: Node.js with ES modules
- Test match pattern: `**/tests/**/*.test.js`
- Test path ignore: `/node_modules/`, `/releases/`
- Coverage threshold: 70% for branches, functions, lines, statements
- Uses experimental VM modules for ES module support: `NODE_OPTIONS=--experimental-vm-modules`
- Coverage collection: `src/**/*.js`, excludes test files and node_modules

### Security Considerations

- Never log or expose API keys in error messages
- Validate and sanitize all user input
- Use secure storage for configuration files
- Implement rate limiting for API calls
- Use HTTPS for all API communications
- Implement timeout for network requests
- Store sensitive data in `~/.naturecode/config.json` with proper permissions

### Code References

When referencing specific functions or pieces of code include the pattern `file_path:line_number` to allow easy navigation to the source code location.

Example:

```
Clients are marked as failed in the `connectToServer` function in src/services/process.ts:712.
```

### GitHub Push Requirements

**CRITICAL**: After making code changes, you MUST push to GitHub to keep the repository synchronized.

#### Push Scripts Available:

```bash
./push-with-key-md.sh        # Read token from key.md file (Recommended)
./push-with-interactive-token.sh  # Interactive token input
./push-simple.sh             # Simple push for small changes
./push-to-github-final.sh    # Full-featured push with validation
```

#### Commit Message Format:

```bash
# Must use English for commit messages
git commit -m "feat: add new AI provider interface"
git commit -m "fix: resolve color display issue in non-interactive terminals"
```

#### Complete Push Workflow:

1. Generate GitHub Token with `repo` permissions
2. Save token to `key.md` (temporary)
3. Run `./push-with-key-md.sh`
4. Verify installation command works: `curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run`
5. Delete `key.md` after successful push

### Tool Usage Guidelines

- Use `npm run lint` before committing changes
- Use `npm run typecheck` to validate TypeScript types
- Use `npm test -- --testPathPattern="filename"` for specific test files
- Use `npm test -- --testNamePattern="test description"` for specific tests
- Always run tests after making changes: `npm test`
- Use `make all` for complete build and test cycle
- **MUST push to GitHub** after code changes using provided push scripts
