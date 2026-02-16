# NatureCode - Cross-platform Terminal AI Assistant

## 📚 Documentation Navigation

- **[📖 Complete Documentation](whatisthis)** - Full project documentation, changelog, and current status
- **[🔧 Development Guide](AGENTS.md)** - Development guidelines, commands, and coding standards
- **[🚀 Quick Start](#quick-install)** - Installation and basic usage (below)

## Features

- **Multi-model AI Support**: DeepSeek, OpenAI, Azure OpenAI, n1n.ai, Anthropic, Google Gemini, Ollama, Zhipu AI, Custom Provider with flexible model input
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

# Analyze and improve code
naturecode code

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
- **Multiple AI Models**: DeepSeek, OpenAI, Azure OpenAI, n1n.ai, Anthropic, Google Gemini, Ollama, Zhipu AI, Custom Provider support
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

### Available Commands

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
naturecode session   # Session management
naturecode review    # Code review
naturecode team      # Team collaboration

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

#### Plugin System

```bash
naturecode plugin list
naturecode plugin install <plugin-url>
```

### Updating

#### Update from Any Version

```bash
# The installer automatically updates existing installations
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

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
