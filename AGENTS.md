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
npm run dev           # Run application
npm run build         # Build executables

# Testing
npm test              # Run all tests
npm test -- --testPathPattern="filename"  # Run single test file
npm test -- --testNamePattern="test description"  # Run specific test
npm test -- --coverage  # Run tests with coverage

# Code Quality
npm run lint          # Lint code
npm run typecheck     # Type checking
npm run format        # Format code
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
make release      # Complete release process
make all          # Clean, install, build, test, lint, package
make dev          # Start development mode
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
- **Run single test**: `npm test -- --testPathPattern="filesystem"`

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

## GitHub Push Requirements

**CRITICAL**: After code changes, MUST push to GitHub.

### Push Scripts

```bash
./push-with-key-md.sh        # Read token from key.md
./push-with-interactive-token.sh  # Interactive token input
./push-simple.sh             # Simple push for small changes
```

### Push Workflow

1. Generate GitHub Token with `repo` permissions
2. Save to `key.md` (temporary)
3. Run `./push-with-key-md.sh`
4. Verify: `curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run`
5. Delete `key.md`
