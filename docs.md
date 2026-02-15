# NatureCode Documentation

## Overview

NatureCode is a cross-platform terminal AI assistant that provides intelligent development tools, collaboration features, and performance monitoring. Version 1.4.5.5 includes comprehensive AI assistance, automatic Ollama installation, and real-time documentation support.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Features](#core-features)
4. [Command Reference](#command-reference)
5. [Configuration](#configuration)
6. [Plugins System](#plugins-system)
7. [Session Management](#session-management)
8. [Collaboration Tools](#collaboration-tools)
9. [Third-Party Integration](#third-party-integration)
10. [Performance Monitoring](#performance-monitoring)
11. [Troubleshooting](#troubleshooting)
12. [API Reference](#api-reference)

## Installation

### 一键安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

### 安装特性

1. **自动 AI 助手设置**：安装时会自动配置 AI 助手
2. **文档下载**：自动下载最新使用文档
3. **智能检测**：检测系统环境并优化安装

### 手动安装

#### 前提条件

- Node.js 18 或更高版本
- npm 8 或更高版本
- Git（可选，用于 Git 集成功能）

#### 方法 1: 全局安装

```bash
npm install -g naturecode
```

#### 方法 2: 从源码安装

```bash
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode
npm install
npm link
```

## 🚀 AI 助手快速开始

### 智能帮助系统

NatureCode 内置智能 AI 助手，首次使用时会自动安装所需组件：

```bash
# 首次运行会自动安装 Ollama 和 AI 模型
naturecode help "如何开始使用"

# 直接提问获取帮助
naturecode help "怎么配置 DeepSeek API"

# 启动交互式 AI 对话
naturecode help
```

### 自动安装流程

1. **首次运行 `naturecode help` 时**：
   - 自动检测是否安装 Ollama
   - 如未安装，自动下载并安装 Ollama
   - 自动下载 DeepSeek-coder 模型
   - 配置本地 AI 助手

2. **安装内容**：
   - Ollama 本地 AI 运行时
   - DeepSeek-coder 代码专用模型
   - 最新使用文档

3. **手动安装选项**：

   ```bash
   # 手动安装 Ollama
   curl -fsSL https://ollama.ai/install.sh | sh

   # 手动下载模型
   ollama pull deepseek-coder
   ```

## Quick Start

### 1. Configure AI Model

```bash
naturecode model
```

Follow the interactive wizard to configure your AI provider (DeepSeek or OpenAI).

### 2. Start Interactive Session

```bash
naturecode start
```

### 3. Basic Commands

```bash
# Get help
naturecode --help

# Check version
naturecode --version

# List all available commands
naturecode help
```

## Core Features

### File System Access

NatureCode provides secure file system access with sandbox restrictions:

- Read, edit, create, and delete files
- Natural language command recognition
- Operation logging and automatic backups
- Security sandbox (current directory and subdirectories only)

### Git Integration

Full Git operations support:

- `git status`, `diff`, `log`, `commit`, `push`, `pull`
- Branch management and switching
- Change analysis and commit message generation
- Smart Git command suggestions

### Code Analysis

Static code analysis for multiple languages:

- JavaScript, Python, Java, Go, Rust support
- Code quality suggestions and issue detection
- Refactoring suggestions (long functions, magic numbers, duplicate code)
- Dependency analysis with security vulnerability checking

### Project Management

Intelligent project analysis and management:

- Project structure analysis
- Automated project setup
- Template generation (Node.js, React, Python, Express.js)
- Dependency management with upgrade recommendations

## Command Reference

### Main Commands

```bash
naturecode start              # Start interactive session
naturecode model             # Configure AI model and API
naturecode --help           # Show help
naturecode --version        # Show version
```

### File System Commands

```bash
naturecode read <file>      # Read file content
naturecode edit <file>      # Edit file
naturecode create <file>    # Create new file
naturecode delete <file>    # Delete file
naturecode list <dir>       # List directory contents
```

### Git Commands

```bash
naturecode git status       # Show Git status
naturecode git diff         # Show changes
naturecode git commit       # Commit changes
naturecode git push         # Push to remote
naturecode git pull         # Pull from remote
naturecode git branch       # List branches
naturecode git checkout     # Switch branch
```

### Code Analysis Commands

```bash
naturecode code analyze     # Analyze code quality
naturecode code review      # Code review with AI
naturecode code metrics     # Show code metrics
naturecode code security    # Security analysis
```

### Project Commands

```bash
naturecode project analyze  # Analyze project structure
naturecode project create   # Create new project
naturecode project deps     # Analyze dependencies
naturecode project upgrade  # Check for dependency upgrades
```

### Configuration Commands

```bash
naturecode config show      # Show configuration
naturecode config get <key> # Get config value
naturecode config set <key> <value> # Set config value
naturecode config permission # Set permission level
```

### Plugin Commands

```bash
naturecode plugin list      # List installed plugins
naturecode plugin info <id> # Show plugin information
naturecode plugin install <source> # Install plugin
naturecode plugin uninstall <id> # Uninstall plugin
```

### Session Commands

```bash
naturecode session list     # List all sessions
naturecode session create <name> # Create new session
naturecode session switch <id> # Switch to session
naturecode session archive <id> # Archive session
naturecode session export <id> # Export session
```

### Team Collaboration Commands

```bash
naturecode team create <name> # Create new team
naturecode team join <code>   # Join existing team
naturecode team list         # List all teams
naturecode team members      # List team members
naturecode team chat         # Open team chat
```

### Integration Commands

```bash
naturecode integration status # Show integration status
naturecode integration analyze # Analyze project for tools
naturecode integration check # Run quality checks
naturecode integration recommend # Get tool recommendations
```

### Performance Commands

```bash
naturecode performance start # Start performance monitoring
naturecode performance stop  # Stop performance monitoring
naturecode performance status # Show current metrics
naturecode performance report # Generate performance report
naturecode performance alerts # View performance alerts
```

## Configuration

### Configuration Files

NatureCode uses a hierarchical configuration system:

1. **Global Configuration**: `~/.naturecode/config.json`
2. **Project Configuration**: `.naturecode.json` (in project root)

### Configuration Structure

```json
{
  "version": "1.4.3",
  "ai": {
    "provider": "deepseek",
    "apiKey": "your-api-key",
    "model": "deepseek-chat"
  },
  "permissions": {
    "level": "full",
    "allowedExtensions": [
      ".js",
      ".ts",
      ".py",
      ".java",
      ".go",
      ".rs",
      ".md",
      ".json"
    ],
    "deniedExtensions": [".exe", ".dll", ".so"],
    "maxFileSize": 10485760
  },
  "sessions": {
    "autoSave": true,
    "autoSaveInterval": 30000
  },
  "integrations": {
    "enabled": ["npm", "eslint", "prettier", "typescript", "jest"],
    "timeout": 5000
  },
  "performance": {
    "enabled": true,
    "trackMemory": true,
    "trackCPU": true,
    "samplingInterval": 1000
  }
}
```

### Permission Levels

1. **readonly**: Read-only access
2. **restricted**: Read and write, but no delete
3. **full**: Full access (default)

## Plugins System

### Plugin Types

NatureCode supports 5 types of plugins:

1. **Command Plugins**: Add new CLI commands
2. **AI Provider Plugins**: Add new AI providers
3. **File Handler Plugins**: Handle specific file types
4. **Integration Plugins**: Integrate with external tools
5. **UI/Theme Plugins**: Customize interface appearance

### Creating a Plugin

```bash
naturecode plugin create my-plugin
```

### Plugin Structure

```
my-plugin/
├── plugin.json
├── index.js
├── commands/
│   └── hello.js
└── README.md
```

### plugin.json Example

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin",
  "author": "Your Name",
  "license": "MIT",
  "commands": [
    {
      "name": "hello",
      "description": "Say hello",
      "handler": "commands/hello.js"
    }
  ],
  "permissions": ["filesystem.read", "filesystem.write"]
}
```

## Session Management

### Session Types

1. **Active Sessions**: Currently open sessions
2. **Archived Sessions**: Inactive but saved sessions
3. **Session Templates**: Reusable session templates
4. **Backup Sessions**: Automatic backups
5. **Export Sessions**: Exported session files

### Session Features

- **Auto-save**: Every 30 seconds (configurable)
- **Crash recovery**: Automatic session recovery
- **Project context**: Automatic project detection
- **File operation tracking**: History of file operations
- **Cross-session search**: Search across all sessions

### Using Sessions

```bash
# Create a new session
naturecode session create "my-project"

# Switch to an existing session
naturecode session switch session_123

# Archive a completed session
naturecode session archive session_123

# Export session for sharing
naturecode session export session_123 --format json
```

## Collaboration Tools

### Team Management

- Create and join teams
- Role-based access control (Owner, Admin, Member)
- Team project spaces
- Real-time collaboration

### Real-time Features

- WebSocket-based real-time communication
- Collaborative code editing
- Team chat and notifications
- File synchronization

### Code Review Integration

- AI-assisted code review
- Team code standards
- Git PR/MR integration
- Review history and statistics

## Third-Party Integration

### Supported Tools

NatureCode integrates with 14+ development tools:

#### Code Quality Tools

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Jest**: JavaScript testing
- **Vitest**: Vite-native testing

#### Build Tools

- **Webpack**: Module bundler
- **Vite**: Next-gen frontend tooling

#### Package Managers

- **npm**: Node package manager
- **Yarn**: Fast, reliable dependency management
- **pnpm**: Efficient package manager

#### Infrastructure Tools

- **Docker**: Containerization
- **Docker Compose**: Multi-container applications
- **AWS CLI**: AWS management
- **Terraform**: Infrastructure as code

### Integration Features

- Automatic tool detection
- Version validation
- Project analysis and recommendations
- Quality checks and reports

## Performance Monitoring

### System Metrics

- **Memory**: Total, used, free, usage percentage
- **CPU**: Cores, usage percentage, load average
- **Disk**: Total space, used space, free space
- **Network**: Bandwidth usage, connection status

### Operation Tracking

- Track execution time of all operations
- Memory usage tracking
- Performance reports and recommendations
- Alert system for critical conditions

### Using Performance Monitoring

```bash
# Start monitoring
naturecode performance start

# View current status
naturecode performance status

# Generate report
naturecode performance report

# View alerts
naturecode performance alerts
```

## Troubleshooting

### Common Issues

#### 1. API Key Issues

```
Error: Invalid API key. Please reconfigure with naturecode model
```

Solution: Run `naturecode model` to reconfigure your API key.

#### 2. File Permission Issues

```
Error: Permission denied. Check your configuration permissions.
```

Solution: Check your permission level with `naturecode config get permissions.level`

#### 3. Network Issues

```
Error: Network error. Please check your internet connection.
```

Solution: Verify network connectivity and proxy settings.

#### 4. Plugin Loading Issues

```
Error: Failed to load plugin. Manifest validation failed.
```

Solution: Check plugin manifest format and permissions.

### Debug Mode

Enable debug mode for detailed logging:

```bash
export NATURECODE_DEBUG=true
naturecode start
```

### Log Files

- Session logs: `~/.naturecode/logs/sessions/`
- Error logs: `~/.naturecode/logs/errors/`
- Performance logs: `~/.naturecode/logs/performance/`

## API Reference

### Core API

#### FileSystem API

```javascript
import { FileSystem } from "naturecode";

const fs = new FileSystem();
await fs.readFile("path/to/file.txt");
await fs.writeFile("path/to/file.txt", "content");
await fs.listDirectory("path/to/dir");
```

#### AI Provider API

```javascript
import { AIProvider } from "naturecode";

const provider = new AIProvider({
  provider: "deepseek",
  apiKey: "your-api-key",
});

const response = await provider.generate("Hello, how are you?");
```

#### Session API

```javascript
import { SessionManager } from "naturecode";

const sessionManager = new SessionManager();
const session = await sessionManager.createSession("my-session");
await session.trackFileOperation("read", "file.txt");
await session.save();
```

### Plugin API

#### Command Registration

```javascript
export default {
  name: "my-command",
  description: "My custom command",
  execute: async (args, context) => {
    // Command implementation
    return { success: true, message: "Command executed" };
  },
};
```

#### Event System

```javascript
import { EventEmitter } from "naturecode";

const emitter = new EventEmitter();
emitter.on("file.read", (filePath) => {
  console.log(`File read: ${filePath}`);
});
```

## Version History

### v1.4.3 (Current)

- Third-party tool integration system
- Performance monitoring with real-time metrics
- 14+ development tool support
- Enhanced integration testing

### v1.4.2

- Team collaboration tools
- Real-time communication
- Role-based access control
- Project sharing and templates

### v1.4.1

- Code review assistant
- AI-assisted code analysis
- Git PR/MR integration
- Team code standards

### v1.4.0

- Plugin system architecture
- Session management
- Multi-session support
- Template system

### v1.3.2

- Configuration management system
- File access control
- Permission levels
- Command aliases

### v1.3.1

- Code analysis tools
- Dependency analysis
- Project structure analysis
- Refactoring suggestions

### v1.3.0

- Git integration
- Code analysis engine
- Project management
- Automated project setup

### v1.2.5

- Error handling system
- Feedback collection
- File caching mechanism
- Performance optimization

### v1.2.4

- File system access
- Natural language commands
- Security sandbox
- Operation logging

## Contributing

### Development Setup

```bash
git clone https://github.com/yourusername/naturecode.git
cd naturecode
npm install
npm run dev
```

### Running Tests

```bash
npm test
npm test -- --testPathPattern="filename"
npm test -- --coverage
```

### Code Style

- ESLint for code quality
- Prettier for formatting
- 2-space indentation
- Double quotes for strings

### Building

```bash
npm run build
```

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: https://github.com/yourusername/naturecode/issues
- Documentation: https://github.com/yourusername/naturecode/docs
- Email: support@naturecode.ai

---

_Last Updated: 2026-02-14_
_Version: 1.4.3_
