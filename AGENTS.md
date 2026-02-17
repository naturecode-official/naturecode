# AGENTS.md - Development Guide for NatureCode

## Language Requirements

- **User-Agent Conversations**: Chinese (中文)
- **Code/Docs/Configs**: English
- **Emoji**: STRICTLY PROHIBITED
- **GitHub Commits**: English only
- **Error Messages**: User-friendly Chinese prompts, technical details in English

## Build and Development Commands

### Essential Commands

```bash
# Development
npm run dev           # Run CLI application
npm run build         # Build executables for all platforms

# Testing
npm test              # Run all tests (requires NODE_OPTIONS=--experimental-vm-modules)
npm test -- --testPathPattern="filename"  # Run single test file
npm test -- --testNamePattern="test description"  # Run specific test
npm test -- --coverage  # Run tests with coverage

# Code Quality
npm run lint          # Lint code with ESLint
npm run typecheck     # Type checking with TypeScript
npm run format        # Format code with Prettier
```

### Makefile Commands

```bash
make install      # Install dependencies
make build        # Build application using packager.js
make test         # Run tests (silently skips if fails)
make lint         # Lint code (silently skips if fails)
make clean        # Clean build files
make package      # Create release package
make dmg          # Create macOS DMG (macOS only)
make release      # Complete release process
make all          # Clean, install, build, test, lint, package
make dev          # Start development mode
make install-system  # Install to system using install.sh
make uninstall    # Uninstall from system
```

### Testing Commands

```bash
# Run specific test file
npm test -- --testPathPattern="config"          # Run config.test.js
npm test -- --testPathPattern="filesystem"      # Run filesystem.test.js
npm test -- --testPathPattern="git"             # Run git.test.js

# Run tests with specific name pattern
npm test -- --testNamePattern="should validate API key"

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run tests with verbose output
npm test -- --verbose

# Test with ES modules support
NODE_OPTIONS=--experimental-vm-modules npm test
```

## Code Style Guidelines

### JavaScript Standards

- **ES Modules**: Use `import/export` (project uses `"type": "module"`)
- **Naming**: Classes `PascalCase`, variables `camelCase`, constants `UPPER_SNAKE_CASE`
- **Formatting**: 2 spaces, semicolons, double quotes, max 100 chars per line
- **Error Handling**: Use try-catch with specific error messages

### ESLint Rules (from .eslintrc.json)

- `no-console`: off (allowed for CLI)
- `no-unused-vars`: error (ignore args starting with `_`)
- `semi`: error (always)
- `quotes`: error (double quotes)
- `indent`: error (2 spaces)
- `comma-dangle`: error (always-multiline)
- `object-curly-spacing`: error (always)
- `array-bracket-spacing`: error (never)
- `space-before-function-paren`: error (always)
- `keyword-spacing`: error (before: true, after: true)

### Import Order Pattern

```javascript
// 1. Built-in Node.js modules
import fs from "fs";
import path from "path";
import os from "os";

// 2. External dependencies
import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";

// 3. Internal modules
import { ConfigManager } from "../config/manager.js";
import { secureStore } from "../config/secure-store.js";
import { exitWithError } from "../utils/error-handler.js";
```

### Error Handling Pattern

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
    } else if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else {
      throw new Error(`AI service error: ${error.message}`);
    }
  }
}
```

## Testing Framework (Jest)

- **Test pattern**: `**/tests/**/*.test.js`
- **Coverage threshold**: 70% for branches, functions, lines, statements
- **ES module support**: `NODE_OPTIONS=--experimental-vm-modules`
- **Run single test**: `npm test -- --testPathPattern="filename"`
- **Test environment**: Node.js
- **Transform**: None (ES modules)

## Agent Instructions

### Before Making Changes

1. Understand architecture: CLI → Config → Provider → Session
2. Check existing provider patterns (DeepSeek, OpenAI, Ollama)
3. Review configuration schema in `src/config/`
4. Test with `naturecode start`

### When Editing Code

1. Maintain backward compatibility with config files
2. Follow established provider patterns
3. Add error handling for network operations
4. Validate all user input
5. Use environment variables for sensitive data

### After Changes

1. Run `npm run lint` and `npm run typecheck`
2. Test CLI commands with various inputs
3. Verify configuration loading/saving works
4. Update documentation if APIs change

## Security Considerations

- Never log/expose API keys in error messages
- Validate and sanitize all user input
- Use secure storage (`~/.naturecode/config.json`)
- Implement rate limiting for API calls
- Use HTTPS for all API communications

## Code References

Use `file_path:line_number` pattern for code references.

Example: `src/config/manager.js:45`

## Agent Instructions

### Before Making Changes

1. Understand architecture: CLI → Config → Provider → Session
2. Check existing provider patterns (DeepSeek, OpenAI, Ollama)
3. Review configuration schema in `src/config/`
4. Test with `naturecode start`

### When Editing Code

1. Maintain backward compatibility with config files
2. Follow established provider patterns
3. Add error handling for network operations
4. Validate all user input
5. Use environment variables for sensitive data

### After Changes

1. Run `npm run lint` and `npm run typecheck`
2. Test CLI commands with various inputs
3. Verify configuration loading/saving works
4. Update documentation if APIs change

## Security Considerations

- Never log/expose API keys in error messages
- Validate and sanitize all user input
- Use secure storage (`~/.naturecode/config.json`)
- Implement rate limiting for API calls
- Use HTTPS for all API communications

## Code References

Use `file_path:line_number` pattern for code references.

Example: `src/config/manager.js:45`

## GitHub Integration

### Push Commands

```bash
# Standard git push
git push

# Push with specific branch
git push origin main

# Push with tags
git push --tags
```

### Verification

After pushing changes, you can verify the installation script works:

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run
```

## Project Architecture

### Core Components

1. **Providers**: `src/providers/` - AI service integrations (DeepSeek, OpenAI, Anthropic, Gemini, Ollama)
2. **Config**: `src/config/` - Configuration management and secure storage
3. **CLI**: `src/cli/` - Command-line interface and commands
4. **Utils**: `src/utils/` - Shared utilities and helpers
5. **Sessions**: `src/sessions/` - Session management and storage
6. **Plugins**: `src/plugins/` - Plugin system and management

### Provider Pattern

All AI providers extend the `AIProvider` base class in `src/providers/base.js`. New providers must implement:

- `generate(prompt, options)` - Non-streaming generation
- `streamGenerate(prompt, options)` - Streaming generation
- File system integration methods

## Testing Details

### Jest Configuration (jest.config.js)

- **Test pattern**: `**/tests/**/*.test.js`
- **Coverage threshold**: 70% for branches, functions, lines, statements
- **ES module support**: `NODE_OPTIONS=--experimental-vm-modules`
- **Test environment**: Node.js
- **Transform**: None (ES modules)

### ESLint Rules (.eslintrc.json)

Key rules enforced:

- `no-console`: off (allowed for CLI applications)
- `no-unused-vars`: error (ignore args starting with `_`)
- `semi`: error (always)
- `quotes`: error (double quotes)
- `indent`: error (2 spaces)
- `comma-dangle`: error (always-multiline)
- `object-curly-spacing`: error (always)
- `array-bracket-spacing`: error (never)
- `space-before-function-paren`: error (always)
- `keyword-spacing`: error (before: true, after: true)

## File Structure Conventions

### Directory Organization

```
src/
├── cli/              # CLI interface and commands
│   ├── commands/     # Individual command implementations
│   └── index.js      # CLI entry point
├── config/           # Configuration management
├── providers/        # AI service providers
├── utils/            # Shared utilities
├── sessions/         # Session management
└── plugins/          # Plugin system
```

### Naming Conventions

- **Files**: `kebab-case.js` for multi-word filenames
- **Directories**: `kebab-case` for multi-word directory names
- **Test files**: `filename.test.js` in same directory as source
- **Constants**: `UPPER_SNAKE_CASE` in config files

## Development Workflow

### Adding New Features

1. **Understand existing patterns**: Review similar features in codebase
2. **Follow provider pattern**: Extend `AIProvider` for new AI services
3. **Update configuration**: Add to `src/config/manager.js` if needed
4. **Add CLI command**: Create new file in `src/cli/commands/`
5. **Test thoroughly**: Use existing test patterns
6. **Update documentation**: Add to relevant docs if APIs change

### Code Review Checklist

- [ ] Follows existing code style and patterns
- [ ] Includes proper error handling
- [ ] No hardcoded secrets or API keys
- [ ] Backward compatible with existing configs
- [ ] Tests pass with coverage requirements
- [ ] Linting passes without errors
- [ ] Type checking passes (if applicable)

## Performance Considerations

- **File operations**: Use async/await for all file system operations
- **API calls**: Implement timeout and retry logic
- **Memory usage**: Clean up large objects and streams properly
- **Network**: Use streaming for large responses when possible

## Troubleshooting

### Common Issues

1. **ES module issues**: Ensure `NODE_OPTIONS=--experimental-vm-modules` is set for tests
2. **Configuration errors**: Check `~/.naturecode/config.json` format and permissions
3. **Provider failures**: Verify API keys and network connectivity
4. **Build failures**: Clean build directory and reinstall dependencies

### Debug Commands

```bash
# Debug configuration loading
DEBUG=config node src/cli/index.js start

# Run specific test with verbose output
npm test -- --testPathPattern="config" --verbose

# Check ESLint issues
npx eslint src/ --format=codeframe
```
