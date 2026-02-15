# NatureCode Configuration Guide

This guide explains how to configure NatureCode to customize its behavior for your project.

## Configuration Files

NatureCode supports two levels of configuration:

1. **Global Configuration**: `~/.naturecode/config.json`
   - Applies to all projects
   - User-wide settings

2. **Project Configuration**: `.naturecode.json`
   - Project-specific settings
   - Overrides global settings

## Configuration Structure

```json
{
  "version": "1.0.0",
  "fileAccess": {
    "enabled": true,
    "rules": {
      "allowedExtensions": [".js", ".ts", ".json"],
      "deniedExtensions": [".env", ".key"],
      "allowedDirectories": [],
      "deniedDirectories": ["node_modules", ".git"],
      "maxFileSize": 10485760,
      "followSymlinks": false
    }
  },
  "permissions": {
    "level": "full",
    "allowRead": true,
    "allowWrite": true,
    "allowDelete": false,
    "allowExecute": false,
    "requireConfirmation": {
      "delete": true,
      "overwrite": true,
      "largeFiles": true
    }
  },
  "commands": {
    "aliases": {
      "gs": "git status",
      "gc": "git commit",
      "ll": "list files --detailed"
    }
  },
  "features": {
    "gitIntegration": true,
    "codeAnalysis": true,
    "projectManagement": true,
    "autoBackup": true
  }
}
```

## Configuration Commands

### View Configuration

```bash
# Show current configuration
naturecode config show

# Get specific value
naturecode config get permissions.level
```

### Set Configuration

```bash
# Set a value in project config
naturecode config set permissions.level readonly

# Set a value in global config
naturecode config set permissions.level readonly --scope global
```

### Reset Configuration

```bash
# Reset to defaults
naturecode config reset --confirm
```

## Permission Levels

### Readonly Mode

Prevents all modifications to files.

```bash
naturecode config permission readonly
```

Features:
- Read files only
- No write operations
- No delete operations
- Ideal for code review

### Restricted Mode

Allows reading and writing but prevents deletions.

```bash
naturecode config permission restricted
```

Features:
- Read and write files
- No delete operations
- Requires confirmation for overwrites
- Good for collaborative work

### Full Mode (Default)

Full access to all operations.

```bash
naturecode config permission full
```

Features:
- Read, write, and delete
- Full project access
- Best for individual development

## File Access Control

### Whitelist Extensions

```bash
# Show allowed extensions
naturecode config whitelist show

# Add extension to whitelist
naturecode config whitelist add --item .jsx

# Remove extension from whitelist
naturecode config whitelist remove --item .jsx
```

### Blacklist Extensions

```bash
# Show denied extensions
naturecode config blacklist show

# Add extension to blacklist
naturecode config blacklist add --item .secret

# Remove extension from blacklist
naturecode config blacklist remove --item .secret
```

### Directory Control

```bash
# Whitelist directory
naturecode config whitelist add --type directories --item src

# Blacklist directory
naturecode config blacklist add --type directories --item temp
```

## Command Aliases

Create shortcuts for frequently used commands.

### Manage Aliases

```bash
# List all aliases
naturecode config alias list

# Add an alias
naturecode config alias add --name gs --command "git status"

# Remove an alias
naturecode config alias remove --name gs
```

### Using Aliases

Once defined, use aliases like regular commands:

```bash
# Instead of: naturecode git status
naturecode gs

# Instead of: naturecode project analyze
naturecode pa  # if you create this alias
```

## Check Access Permissions

Verify if a file or operation is allowed.

```bash
# Check file access
naturecode config check --file path/to/file.js

# Check operation permission
naturecode config check --operation write
```

## Example Configurations

### Safe Mode for Untrusted Projects

```json
{
  "version": "1.0.0",
  "permissions": {
    "level": "readonly",
    "allowRead": true,
    "allowWrite": false,
    "allowDelete": false,
    "allowExecute": false
  },
  "fileAccess": {
    "enabled": true,
    "rules": {
      "deniedDirectories": [
        "node_modules",
        ".git",
        "dist",
        "build"
      ],
      "maxFileSize": 1048576
    }
  }
}
```

### Development Mode

```json
{
  "version": "1.0.0",
  "permissions": {
    "level": "full",
    "requireConfirmation": {
      "delete": true,
      "overwrite": false,
      "largeFiles": false
    }
  },
  "commands": {
    "aliases": {
      "gs": "git status",
      "gd": "git diff",
      "gc": "git commit",
      "pa": "project analyze",
      "ph": "project health",
      "ca": "code analyze"
    }
  }
}
```

### Production Review Mode

```json
{
  "version": "1.0.0",
  "permissions": {
    "level": "restricted",
    "requireConfirmation": {
      "delete": true,
      "overwrite": true,
      "largeFiles": true
    }
  },
  "fileAccess": {
    "enabled": true,
    "rules": {
      "allowedExtensions": [
        ".js",
        ".ts",
        ".json",
        ".md"
      ],
      "deniedDirectories": [
        "node_modules",
        ".git",
        "dist"
      ]
    }
  }
}
```

## Security Best Practices

1. **Use Readonly Mode for Code Review**
   - Prevents accidental modifications
   - Safe for reviewing unfamiliar code

2. **Blacklist Sensitive Files**
   - Always deny access to .env files
   - Block private keys and certificates

3. **Limit Directory Access**
   - Deny access to build directories
   - Exclude node_modules and vendor folders

4. **Set File Size Limits**
   - Prevent loading huge files
   - Default: 10MB

5. **Enable Confirmations**
   - Require confirmation for deletions
   - Confirm overwriting existing files

## Troubleshooting

### Configuration Not Loading

Check file locations:
```bash
# Global config
ls -la ~/.naturecode/config.json

# Project config
ls -la .naturecode.json
```

### Permission Denied Errors

Check permission level:
```bash
naturecode config get permissions.level
```

### File Access Blocked

Check if file is allowed:
```bash
naturecode config check --file path/to/file
```

### Reset to Defaults

If configuration is corrupted:
```bash
naturecode config reset --confirm
```

## Advanced Configuration

### Custom Confirmation Rules

```json
{
  "permissions": {
    "requireConfirmation": {
      "delete": true,
      "overwrite": true,
      "largeFiles": true,
      "customThreshold": 5242880
    }
  }
}
```

### Multiple Alias Sets

```json
{
  "commands": {
    "aliases": {
      "gs": "git status",
      "gd": "git diff",
      "gl": "git log",
      "pa": "project analyze",
      "ps": "project structure",
      "ph": "project health",
      "ca": "code analyze",
      "cc": "code complexity",
      "cd": "code dependencies"
    }
  }
}
```

## Configuration Validation

NatureCode validates configuration on load:

- Version field is required
- Permission levels must be valid
- File size limits must be positive
- Arrays must be valid JSON arrays

Invalid configurations will show an error message with details.

## Tips and Tricks

1. **Start with Defaults**
   - Use default configuration initially
   - Customize as needed

2. **Test Configurations**
   - Use `config check` to verify settings
   - Test with non-critical files first

3. **Document Project Config**
   - Add comments in README about config
   - Commit .naturecode.json to repository

4. **Use Global Config for Personal Preferences**
   - Set personal aliases globally
   - Keep project config for team settings

5. **Combine with Git Ignore**
   - Add sensitive configs to .gitignore
   - Share safe configs with team

## See Also

- [README.md](README.md) - Main documentation
- [QUICKSTART.md](QUICKSTART.md) - Getting started guide
- [AGENTS.md](AGENTS.md) - Development guide
