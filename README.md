# NatureCode - Cross-platform Terminal AI Assistant

**Version: 1.5.6**

## → [agentname.md](agentname.md)

## Features

- **Multi-model AI Support**: DeepSeek, OpenAI, Azure OpenAI, n1n.ai, 4SAPI, Qwen (DashScope), Anthropic, Google Gemini, Ollama, Zhipu AI, Tencent Hunyuan, Custom Provider - 12 providers total with flexible model input
- **One-line Installation**: Simple curl-based installation system
- **Cross-platform**: Native support for macOS, Linux, and Windows
- **Professional Mode**: Advanced diagnostics and developer tools
- **Secure Configuration**: Encrypted storage for API keys and settings
- **Plugin System**: Extensible architecture for custom functionality
- **Team Collaboration**: Shared projects, member management, and role-based access
- **Flexible Model Input**: Input any model name manually instead of selecting from pre-defined lists
- **Provider Guidance**: Smart prompts guide users to check official websites for available models

## Quick Install

### macOS/Linux

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

### Windows

#### Option 1: Git Bash (Recommended)

```bash
# Install Git for Windows first, then:
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

#### Option 2: PowerShell

```powershell
# Download and run Windows installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-windows.ps1" -OutFile "install-naturecode.ps1"
.\install-naturecode.ps1
```

#### Option 3: Pre-built executable

1. Download `naturecode-win.exe` from [GitHub Releases](https://github.com/naturecode-official/naturecode/releases)
2. Add to PATH
3. Run `naturecode-win.exe --version`

## Usage

### Basic Commands

```bash
# Configure AI model and API settings
naturecode model

# Start interactive AI session
naturecode start

# Delete model configuration
naturecode delmodel <name>        # Delete specific model
naturecode delmodel all          # Delete all models

# Show current configuration
naturecode config

# Get comprehensive help
naturecode --help

# Check current version
naturecode --version
```

### Advanced Usage

```bash
# Configure AI provider and model (flexible model name input)
naturecode model

# Configure specific provider with custom settings
naturecode model --provider openai

# Manage team collaboration
naturecode team

# Work with Git repositories
naturecode git

# Analyze and improve code (runs comprehensive analysis if no command specified)
naturecode code

# Run specific code analysis commands
naturecode code analyze              # Full code analysis
naturecode code issues --severity high  # Critical issues only
naturecode code deps-security        # Security audit
naturecode code refactor             # Refactoring suggestions

# Project management
naturecode project
```

## Windows Support

NatureCode fully supports Windows 10/11 with:

- Native .exe executable
- PowerShell installer
- Git Bash compatibility
- Proper path handling for Windows file system

See [WINDOWS_INSTALL.md](WINDOWS_INSTALL.md) for detailed Windows installation instructions.

## Detailed Installation Guide

### Quick Install (One Command)

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

### What's Included

NatureCode is a cross-platform terminal AI assistant with:

#### Core Features

- **Direct AI Chat**: `naturecode help` for immediate AI assistance
- **Multiple AI Models**: DeepSeek, OpenAI, Azure OpenAI, n1n.ai, 4SAPI, Qwen (DashScope), Anthropic, Google Gemini, Ollama, Zhipu AI, Custom Provider - 11 providers total
- **File Operations**: Read, edit, create, delete files
- **Git Integration**: Status, commit, push, pull operations
- **Code Analysis**: Code review, metrics, refactoring suggestions
- **Project Management**: Project analysis and dependency management
- **Plugin System**: Extensible with custom plugins
- **Session Management**: Save and restore chat sessions

### Installation Options

#### Option 1: One-line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

#### Option 2: Universal Installer

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-universal.sh | bash
```

#### Option 3: Manual Installation

```bash
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode
npm install
npm install -g .
```

### Prerequisites

- **Node.js** v16 or higher
- **npm** (comes with Node.js)
- **Internet connection** for AI features

### Quick Start

After installation:

1. **Configure AI model**:

   ```bash
   naturecode model
   ```

2. **Start interactive session**:

   ```bash
   naturecode start
   ```

3. **Get help**:
   ```bash
   naturecode help                    # Show help information
   naturecode start                   # Start AI session
   ```

## Code Analysis & Project Management

NatureCode provides two powerful tools for developers: **Code Analysis** (`naturecode code`) and **Project Management** (`naturecode project`). These tools work together to help you understand, improve, and maintain your codebase.

### 🛠️ Code Analysis (`naturecode code`)

**Comprehensive code quality assessment** - automatically analyzes your codebase to identify issues, measure quality, and provide actionable insights.

**When to use it:**

- Before committing code
- When joining a new project
- During code reviews
- For technical debt assessment
- When optimizing performance

**Key features:**

- **Automatic analysis** - Run `naturecode code` for instant insights
- **Code metrics** - Lines, functions, complexity, duplication
- **Issue detection** - Bugs, security vulnerabilities, performance issues
- **Dependency analysis** - Security, updates, conflicts
- **Refactoring suggestions** - Actionable improvement recommendations

### 📊 Project Management (`naturecode project`)

**Complete project health assessment** - analyzes project structure, dependencies, configuration, and overall health.

**When to use it:**

- Starting a new project
- Assessing project health
- Planning refactoring
- Managing dependencies
- Onboarding new team members

**Key features:**

- **Project health score** - Overall project quality assessment
- **Structure analysis** - Directory organization and file patterns
- **Dependency management** - Updates, conflicts, security
- **Template system** - Quick project creation from templates
- **Setup automation** - Automated project configuration

### 🚀 Quick Start Examples

```bash
# Get instant code insights
naturecode code

# Check project health
naturecode project

# Analyze specific directory
naturecode code analyze src/

# Check for security issues
naturecode code deps-security

# Create new project from template
naturecode project create --template nodejs --name my-app

# Get refactoring suggestions
naturecode code refactor
```

## 📋 Detailed Command Reference

### Code Analysis Commands (`naturecode code`)

NatureCode's code analysis tool provides comprehensive insights into your codebase. When run without arguments, it performs automatic analysis of the current directory.

**Basic Usage:**

```bash
# Automatic comprehensive analysis (default behavior)
naturecode code

# Analyze specific directory or file
naturecode code analyze <path>
naturecode code analyze src/
naturecode code analyze package.json

# Get specific analysis types
naturecode code metrics          # Code metrics (lines, complexity, etc.)
naturecode code issues           # Code issues and problems
naturecode code issues --severity high  # Critical issues only
naturecode code deps             # Dependency analysis
naturecode code deps-security    # Security audit for dependencies
naturecode code refactor         # Refactoring suggestions
naturecode code quality          # Code quality assessment
```

**Advanced Options:**

```bash
# Export analysis results
naturecode code analyze --output report.json
naturecode code analyze --format json

# Filter analysis
naturecode code analyze --exclude "**/node_modules/**"
naturecode code analyze --include "**/*.js,**/*.ts"

# Compare with previous analysis
naturecode code analyze --compare previous.json
```

### Project Management Commands (`naturecode project`)

The project management tool helps you understand, create, and maintain projects with comprehensive health assessments.

**Basic Usage:**

```bash
# Automatic project health assessment (default behavior)
naturecode project

# Analyze specific project
naturecode project analyze <path>
naturecode project analyze .

# Create new projects
naturecode project create --template <template> --name <project-name>
naturecode project create --template nodejs --name my-app
naturecode project create --template python --name data-project

# Project setup and configuration
naturecode project setup          # Interactive project setup
naturecode project init           # Initialize project structure
naturecode project config         # Configure project settings
```

**Project Templates:**

```bash
# List available templates
naturecode project templates

# Create from specific template
naturecode project create --template nodejs      # Node.js project
naturecode project create --template python      # Python project
naturecode project create --template react       # React application
naturecode project create --template vue         # Vue.js application
naturecode project create --template static      # Static website
naturecode project create --template api         # API server
```

**Advanced Project Analysis:**

```bash
# Get detailed project report
naturecode project analyze --detailed
naturecode project analyze --output report.html

# Dependency management
naturecode project deps           # Analyze project dependencies
naturecode project deps-update    # Check for dependency updates
naturecode project deps-audit     # Security audit for dependencies

# Project health metrics
naturecode project health         # Overall health score
naturecode project structure      # Directory structure analysis
naturecode project documentation  # Documentation assessment
```

**Project Comparison and Migration:**

```bash
# Compare projects
naturecode project compare <path1> <path2>

# Migration assistance
naturecode project migrate --from <old-version> --to <new-version>

# Best practices check
naturecode project best-practices
```

```bash
naturecode --help

# Main Commands:
naturecode model     # Configure AI model and API
naturecode delmodel  # Delete model configuration
naturecode config    # Show current configuration
naturecode start     # Start interactive AI session
naturecode help      # Get AI assistance
naturecode git       # Git operations
naturecode code      # Code analysis and review
naturecode project   # Project management
naturecode plugin    # Plugin management

# Examples:
naturecode git status
naturecode code analyze src/
naturecode project analyze .
```

### Advanced Features

#### File System Operations

```bash
# In interactive mode, use natural language:
"read package.json"
"create newfile.js"
"edit config.json"
"list files in src/"
```

#### AI-Powered Code Review

```bash
naturecode code review file.js
naturecode review --ai
```

#### Plugin Management Commands

NatureCode provides a powerful plugin system for extending functionality. When you run `naturecode plugin` without arguments, it automatically performs a comprehensive analysis:

```bash
# Automatic comprehensive analysis (new feature)
naturecode plugin

# Output includes:
# - Plugin ecosystem overview (total plugins, commands)
# - Plugin status analysis (loaded/disabled)
# - Plugin type distribution
# - Security analysis (permissions, dangerous permissions)
# - Recommendations for next steps
```

**Detailed plugin management commands:**

```bash
# List installed plugins
naturecode plugin list

# Show plugin information
naturecode plugin info <plugin-name>

# Install a plugin (interactive)
naturecode plugin install

# Uninstall a plugin
naturecode plugin uninstall <plugin-name>

# Enable a plugin
naturecode plugin enable <plugin-name>

# Disable a plugin
naturecode plugin disable <plugin-name>

# Reload a plugin (hot reload)
naturecode plugin reload <plugin-name>

# Search for plugins
naturecode plugin search <keyword>

# Create a new plugin
naturecode plugin create <name>

# Manage plugin permissions
naturecode plugin permissions
```

naturecode plugin list
naturecode plugin install <plugin-url>

````

### Updating

#### Update from Any Version

```bash
# The installer automatically updates existing installations
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
````

#### Manual Update

```bash
npm uninstall -g naturecode
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

### Troubleshooting

#### Common Issues

1. **"Command not found" after installation**

   ```bash
   # Restart your terminal
   # Or reload shell configuration:
   source ~/.bashrc   # or ~/.zshrc, ~/.profile
   ```

2. **Permission errors**

   ```bash
   # Fix npm permissions
   npm config set prefix ~/.npm-global
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Node.js version too old**

   ```bash
   # Update Node.js from: https://nodejs.org/
   ```

4. **Installation fails**
   ```bash
   # Clear npm cache and retry
   npm cache clean --force
   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
   ```

#### Verify Installation

```bash
naturecode --version
# Should show: 1.5.0

naturecode help
# Should start AI chat
```

## Android Support

NatureCode now has Android compatibility with a dedicated terminal application.

### Android App Features

- **Full terminal interface** with Linux-like command operations
- **NatureCode AI integration** - all AI features available
- **File system access** - read, write, and manage files
- **Network connectivity** - for AI model access
- **Basic Linux commands** - ls, cd, pwd, clear, etc.

### Getting the Android App

1. **Pre-built APK**: Download from [GitHub Releases](https://github.com/naturecode-official/naturecode/releases)
2. **Build from source**: See `android-app/` directory and `build-android.sh` script

### Installation Requirements

- Android 8.0+ (API 26+)
- 100MB+ free storage
- Network connection for AI features

### Quick Start on Android

1. Install the APK file
2. Open "NatureCode Terminal" app
3. Type `naturecode start` to begin AI session
4. Type `help` for available commands

For detailed Android installation instructions, see [Android Installation Guide](dist/android/README-ANDROID.md).

## Windows Installation Guide

NatureCode fully supports Windows 10/11 with:

- Native .exe executable
- PowerShell installer
- Git Bash compatibility
- Proper path handling for Windows file system

### System Requirements

- Windows 10 or higher
- Node.js 18 or higher (optional if using pre-built executable)
- Git Bash, WSL or PowerShell (recommended Git Bash)

### Installation Methods

#### Method 1: Using Pre-built Executable (Recommended)

1. Download latest version of `naturecode-win.exe` from [GitHub Releases](https://github.com/naturecode-official/naturecode/releases)
2. Place the executable in any directory (e.g., `C:\Program Files\NatureCode\`)
3. Add the directory to system PATH environment variable
4. Run `naturecode-win.exe --version` in command line to verify installation

#### Method 2: Using Node.js Installation

##### Using Git Bash (Recommended)

1. Install [Git for Windows](https://gitforwindows.org/)
2. Open Git Bash terminal
3. Run installation command:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
   ```

##### Using PowerShell

1. Open PowerShell as Administrator
2. Run the following commands:

   ```powershell
   # Download installation script
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh" -OutFile "install-naturecode.ps1"

   # Run installation
   .\install-naturecode.ps1
   ```

#### Method 3: Building from Source

1. Install Node.js 18+ and Git
2. Clone repository:
   ```bash
   git clone https://github.com/naturecode-official/naturecode.git
   cd naturecode
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Link for development:
   ```bash
   npm link
   ```

### Windows-specific Notes

- Use Git Bash for best compatibility with Unix-like commands
- PowerShell 7+ recommended for better terminal experience
- Add NatureCode to PATH for easy access from any terminal
- Windows Defender may flag the executable - add exception if needed

## Documentation

- [AGENTS.md](AGENTS.md) - Development guide for AI assistants
- [whatisthis.md](whatisthis.md) - Comprehensive project documentation and guidelines

### Key Features in v1.5.1

- **n1n.ai Provider Support**: New OpenAI-compatible API provider with custom endpoint (https://api.n1n.top/v1)
- **Flexible Model Configuration**: Input any model name manually instead of selecting from pre-defined lists
- **Custom Provider**: Connect to any AI API with custom base URL, API key, and configuration
- **Simplified Validation**: Removed model list validation from all providers (OpenAI, n1n.ai, DeepSeek, Anthropic, Google Gemini, Ollama, Zhipu AI, Custom)
- **Smart User Guidance**: Provider-specific prompts guide users to check official websites for available models
- **Enhanced User Experience**: More intuitive configuration wizard with text input fields
- **Backward Compatibility**: Maintains all existing functionality while providing more flexibility

### Previous Version Highlights (v1.5.0)

- **Zhipu AI (智谱AI) Support**: Added Chinese AI models with GLM series support
- **Flexible Model Configuration**: Input any model name manually instead of selecting from pre-defined lists
- **Custom Provider**: Connect to any AI API with custom base URL, API key, and configuration
- **Simplified Validation**: Removed model list validation from all providers
- **Smart User Guidance**: Provider-specific prompts guide users to check official websites
- **Enhanced User Experience**: More intuitive configuration wizard with text input fields
- **Backward Compatibility**: Maintains all existing functionality while providing more flexibility

### Previous Version Highlights (v1.4.9)

- **Custom API Endpoint Configuration**: Set custom `base_url` for all AI providers
- **Open-source Model Migration**: GPT-OSS models moved from OpenAI to Ollama provider
- **Google Gemma Series**: 8 new models added to Ollama provider
- **DeepSeek Offline Support**: Comprehensive support for 6 model series (12 variants)
- **Enhanced Error Handling**: Improved user-friendly error messages and recovery
- **Internationalization**: English-first documentation for global accessibility

## Development

```bash
# Clone repository
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode

# Install dependencies
npm install

# Link for development
npm link

# Run tests
npm test

# Build executables
npm run build
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: https://github.com/naturecode-official/naturecode/issues
- **Current Version**: 1.5.1
- **Installation Verification**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run
  ```

### Language Policy

- **User Interface**: Chinese (Simplified/Traditional) for conversations
- **Code & Documentation**: English-first for international accessibility
- **Error Messages**: User-friendly Chinese prompts with English technical details
- **GitHub Commits**: English only for global collaboration
