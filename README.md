# NatureCode - Cross-platform Terminal AI Assistant

**Version: 2.0.1**

## → [AI Provider List](agentname_EN.md) | [中文版](agentname.md)

## Features

- **AI-Centric Design**: Pure AI-focused application - users interact naturally with AI, AI internally calls complex functionality
- **Multi-model AI Support**: DeepSeek, OpenAI, Azure OpenAI, n1n.ai, 4SAPI, Qwen (DashScope), Anthropic, Google Gemini, Ollama, Zhipu AI, Tencent Hunyuan, Custom Provider - 12 providers total
- **Flexible Model Input**: Input any model name manually instead of selecting from pre-defined lists
- **One-line Installation**: Simple curl-based installation system
- **Cross-platform**: Native support for macOS, Linux, Windows, and Android
- **Professional Mode**: Advanced diagnostics and developer tools
- **Secure Configuration**: Encrypted storage for API keys and settings
- **Simplified Interface**: Only 4 core commands for configuration, all advanced features accessible through AI conversation
- **AGENT.md System**: Intelligent project management with automatic requirement tracking, progress monitoring, multi-session context, and **automatic project file creation**
- **Smart Command Handling**: Distinguishes between simple commands (list files, pwd) and complex tasks, preventing infinite loops
- **Automatic Backup Management**: Keeps only 3 most recent backups, prevents file clutter

## 🚀 AGENT.md System - Intelligent Project Management

### 🔧 **Major Fix: Automatic Project File Creation**

**Fixed Issue**: AGENT.md system now **actually creates project files** instead of just recording requirements.

#### What Was Fixed:

1. **File Creation Bug**: Previously only recorded requirements, didn't create actual files
2. **Project Type Detection**: Now intelligently detects game, CLI, web, and generic projects
3. **Automatic Execution**: Triggers file creation when user inputs contain "create" + "project" keywords

#### New Capabilities:

- **🎮 Game Projects**: Automatically creates complete game projects (e.g., Snake game with Python + Pygame)
- **🛠️ CLI Tools**: Generates command-line tools with argument parsing
- **🌐 Web Projects**: Records requirements and guides to proper tools
- **📋 Generic Projects**: Creates project plan documentation

#### Example Usage:

```bash
# User simply says:
"开发一个贪吃蛇的python程序"

# AGENT.md system automatically:
1. Creates "game_project/" directory
2. Generates complete snake game code (main.py)
3. Creates requirements.txt with Pygame dependency
4. Generates README.md with instructions
5. Updates AGENT.md with completion status
6. Marks requirement as "已完成"
```

#### Supported Project Types:

| Project Type | Keywords                    | Generated Files                      |
| ------------ | --------------------------- | ------------------------------------ |
| **Game**     | 游戏, game, 贪吃蛇, snake   | main.py, requirements.txt, README.md |
| **CLI Tool** | 命令行, cli, 工具, tool     | cli_tool.py, README_CLI.md           |
| **Web**      | 网站, web, 前端, backend    | Project requirements recorded        |
| **Generic**  | 项目, project, 系统, system | project_plan.md                      |

#### Technical Improvements:

- ✅ **Async File Operations**: Proper ES module imports
- ✅ **Error Handling**: Comprehensive error handling and recovery
- ✅ **Smart Detection**: Language-agnostic keyword matching
- ✅ **Progress Tracking**: Real-time updates to AGENT.md
- ✅ **Backward Compatibility**: Maintains existing AGENT.md functionality

## 📥 Quick Downloads

### Platform-Specific Downloads

| Platform    | Download Link                                                                    | Installation Method     | Status       |
| ----------- | -------------------------------------------------------------------------------- | ----------------------- | ------------ |
| **Android** | [Termux + Script](https://github.com/naturecode-official/naturecode#android)     | Termux + install script | ✅ Available |
| **Windows** | [🪟 GitHub Releases](https://github.com/naturecode-official/naturecode/releases) | Portable executable     | ✅ Available |
| **macOS**   | [🍎 GitHub Releases](https://github.com/naturecode-official/naturecode/releases) | Native binary           | ✅ Available |
| **Linux**   | [🐧 GitHub Releases](https://github.com/naturecode-official/naturecode/releases) | Native binary           | ✅ Available |
| **iOS**     | [🍎 App Store](https://apps.apple.com) (Coming Soon)                             | App Store install       | 🔄 Planned   |

### Android Installation (via Termux)

NatureCode runs natively on Android through **Termux**, providing full terminal experience:

```bash
# 1. Install Termux from F-Droid or GitHub
# 2. Run this installation script:
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-android.sh | bash

# 3. Start NatureCode:
naturecode start
```

[Detailed Android Guide](android.md)

### Desktop Downloads

1. **Visit [GitHub Releases](https://github.com/naturecode-official/naturecode/releases)**
2. **Find the latest release (v2.0.1 or newer)**
3. **Download for your platform:**
   - Windows: `naturecode-win.exe`
   - macOS: `naturecode-macos`
   - Linux: `naturecode-linux`

## 🚨 Important Update Notice

**Version 2.0.1 introduces intelligent AI assistant with AGENT.md system:**

- **Interactive mode removed**: The `/start` command and interactive command interface have been removed
- **Pure AI-centric design**: All advanced features are now accessed through AI conversation only
- **Simplified commands**: Only 3 core commands remain for configuration management

**If you have a previous version installed, you need to reinstall:**

```bash
# Uninstall old version
npm uninstall -g naturecode

# Install latest version
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | bash
```

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

## 📱 Android Detailed Guide

### Why Termux + NatureCode?

NatureCode on Android runs through **Termux**, which provides:

- **Native Linux environment** - Full terminal experience
- **100% feature compatibility** - All NatureCode features work
- **Better performance** - No Android runtime overhead
- **Community support** - Large Termux user base

### Quick Installation

```bash
# 1. Install Termux from F-Droid or GitHub
# 2. Run installation script:
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-android.sh | bash

# 3. Start using NatureCode:
naturecode start
```

### Full Installation Steps

1. **Install Termux** from [F-Droid](https://f-droid.org/en/packages/com.termux/) or [GitHub](https://github.com/termux/termux-app/releases)
2. **Open Termux** and grant necessary permissions
3. **Run installation script** (as shown above)
4. **Configure AI model**: `naturecode model`
5. **Start AI session**: `naturecode start`

### Android Features

✅ **Full AI Integration**

- All 12+ AI providers supported
- AGENT.md project management
- Internet access tools
- Terminal command execution

✅ **File System Access**

- Read/write to device storage
- Access shared folders
- Full Linux file operations

✅ **Performance Optimized**

- Native Node.js execution
- No virtualization overhead
- Mobile-optimized interface

### Troubleshooting

**Issue**: "Command not found"

```bash
cd ~/naturecode
npm link
```

**Issue**: "Permission denied"

```bash
termux-setup-storage
```

**Issue**: "Network error"

```bash
pkg update && pkg upgrade
ping -c 3 google.com
```

[Complete Android Documentation](android.md)

## Usage

### Core Commands (Only 4 Commands)

```bash
# 1. Configure AI model and API settings
naturecode model

# 2. Start interactive AI session (all advanced features accessible here)
naturecode start

# 3. Show current configuration
naturecode config

# 4. Delete model configuration
naturecode delmodel <name>        # Delete specific model
naturecode delmodel all          # Delete all models
naturecode delmodel all --force  # Force delete all models (no confirmation)

# Additional utility commands
naturecode --help                # Show help information
naturecode --version             # Check current version
```

### Interactive AI Session Features

Once you start an interactive session with `naturecode start`, you can access all advanced features through natural language conversation:

- **Code Analysis**: "Analyze this code", "Find bugs in my project"
- **Project Management**: "Create a new React project", "Check project health"
- **File Operations**: "Read file.txt", "Edit config.js", "List directory contents"
- **Git Integration**: "Commit my changes", "Check git status", "Create a new branch"
- **Code Review**: "Review this function", "Suggest improvements"
- **Performance Monitoring**: "Show performance metrics", "Monitor system resources"

### Model Configuration Examples

```bash
# Configure with specific provider
naturecode model --provider openai

# Delete models with various name formats
naturecode delmodel deepseek              # Delete by provider name
naturecode delmodel deepseek-chat         # Delete by model name
naturecode delmodel deepseek-deepseek-chat # Delete by provider-model combination
naturecode delmodel my-custom-key         # Delete by custom key name

# Force delete without confirmation
naturecode delmodel ollama --force
```

## 🧠 AGENT.md Intelligent Project Management

### What is AGENT.md?

AGENT.md is NatureCode's intelligent project management system that automatically:

- **Tracks user requirements** from conversations
- **Manages TODOs** and progress
- **Preserves context** across sessions
- **Creates development plans** for complex tasks
- **Maintains conversation history**

### How It Works

1. **Automatic Requirement Extraction**: When you talk about what you need, AGENT.md records it
2. **TODO Generation**: Creates actionable tasks from requirements
3. **Progress Tracking**: Shows completion percentage and status
4. **Multi-session Context**: Remembers work across different sessions
5. **Smart Command Handling**: Distinguishes simple commands from complex tasks

### Example Workflow

```bash
# Start a session
naturecode start

# Talk about your project
"I want to create a React app with authentication"

# AGENT.md automatically:
# 1. Records requirement: "create React app with authentication"
# 2. Generates TODOs: "Set up React project", "Add authentication", etc.
# 3. Tracks progress as you work
# 4. Preserves context for next session
```

### Key Features

✅ **Smart Command Detection**

- Simple commands (list files, pwd) execute immediately
- Complex tasks use full AGENT.md planning
- No infinite loops for basic operations

✅ **Automatic Backup Management**

- Creates backups before saving
- Keeps only 3 most recent backups
- Prevents file clutter

✅ **Language Consistency**

- Detects user language (Chinese/English)
- Responds in same language
- Maintains conversation consistency

✅ **Progress Visualization**

- Shows completion percentage
- Lists current TODOs
- Tracks completed items

### Recent Improvements

**Fixed Issues:**

- ✅ **Infinite loop bug**: Simple commands like "list files" no longer cause loops
- ✅ **Too many backup files**: Automatic cleanup keeps only 3 backups
- ✅ **Language switching**: Consistent Chinese/English responses
- ✅ **Startup errors**: Fixed variable declaration issues

**Enhanced Features:**

- 🚀 **Faster execution**: Simple commands bypass complex processing
- 🧹 **Cleaner file system**: Automatic backup management
- 🌐 **Better UX**: Improved error handling and user feedback
- 🔧 **More reliable**: Fixed critical bugs and edge cases

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

- **AI-Centric Design**: Only 4 core commands, all advanced features through AI conversation
- **Multiple AI Models**: DeepSeek, OpenAI, Azure OpenAI, n1n.ai, 4SAPI, Qwen (DashScope), Anthropic, Google Gemini, Ollama, Zhipu AI, Tencent Hunyuan, Custom Provider - 12 providers total
- **File Operations**: Read, edit, create, delete files through natural language
- **Git Integration**: Commit, status, branch operations via AI commands
- **Code Analysis**: Comprehensive code review and metrics through AI
- **Project Management**: Project creation and health assessment via AI
- **Performance Monitoring**: System metrics and optimization suggestions
- **Flexible Model Management**: Delete models by provider, model, or custom names

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

## AI-Centric Advanced Features

NatureCode follows an AI-centric design philosophy: users interact naturally with AI through conversation, and the AI internally calls complex functionality. All advanced features are accessible through the interactive AI session.

### 🚀 Accessing Advanced Features

Start an interactive session and use natural language to access all features:

```bash
# Start interactive AI session
naturecode start

# Then use natural language commands like:
# - "Analyze the code in src/ directory"
# - "Create a new React project called my-app"
# - "Check the health of this project"
# - "Review this function for improvements"
# - "Show me performance metrics"
```

### 🛠️ Code Analysis (Through AI Conversation)

**Comprehensive code quality assessment** - the AI can analyze your codebase to identify issues, measure quality, and provide actionable insights.

**Ask the AI to:**

- "Analyze this code for bugs"
- "Find security vulnerabilities in my project"
- "Calculate code metrics and complexity"
- "Check dependency security"
- "Suggest refactoring improvements"

### 📊 Project Management (Through AI Conversation)

**Complete project health assessment** - the AI can analyze project structure, dependencies, configuration, and overall health.

**Ask the AI to:**

- "Create a new Node.js project"
- "Check the health of this project"
- "Analyze project dependencies"
- "Set up project configuration"
- "Generate project documentation"

### 🔧 Internal AI Functions

The AI has access to powerful internal functions that you can request through conversation:

- **`analyzeCode()`** - Comprehensive code analysis
- **`manageProject()`** - Project management and creation
- **`reviewCode()`** - Code review and suggestions
- **Performance monitoring** - Auto-displays on AI startup
- **File system operations** - Read, write, edit files
- **Git integration** - Commit, status, branch operations

## 📋 Detailed Command Reference

### Complete Command Reference

#### Core Commands Summary

```bash
# Only 4 user-facing commands in AI-centric design:
naturecode model     # Configure AI model and API settings
naturecode start     # Start interactive AI session
naturecode config    # Show current configuration
naturecode delmodel  # Delete model configuration

# Utility commands:
naturecode --help    # Show help information
naturecode --version # Check current version
```

#### Detailed `/delmodel` Usage

The `/delmodel` command supports multiple name formats for flexible model management:

```bash
# Delete all models (requires confirmation)
naturecode delmodel all

# Force delete all models (no confirmation)
naturecode delmodel all --force

# Delete by provider name
naturecode delmodel deepseek
naturecode delmodel openai
naturecode delmodel ollama

# Delete by model name
naturecode delmodel deepseek-chat
naturecode delmodel gpt-4
naturecode delmodel llama3.2

# Delete by provider-model combination
naturecode delmodel deepseek-deepseek-chat
naturecode delmodel openai-gpt-4

# Delete by custom key name or ID
naturecode delmodel my-custom-key
naturecode delmodel key-12345

# Force delete specific model
naturecode delmodel ollama --force
```

#### Interactive Session Examples

Once in interactive mode (`naturecode start`), use natural language:

```
> read README.md
> analyze the code in src/
> create a new React project called my-app
> check project health
> review this function for improvements
> show performance metrics
> commit my changes with message "fix: update config"
> list files in current directory
> edit package.json to add new dependency
```

### Advanced Features (Through AI Conversation)

All advanced features are accessed through natural language interaction with the AI:

#### File System Operations

- Read, write, edit files
- List directory contents
- Search for files
- Manage file permissions

#### Code Analysis & Review

- Comprehensive code quality assessment
- Bug detection and security analysis
- Code metrics and complexity calculation
- Refactoring suggestions
- Dependency security audit

#### Project Management

- Project creation from templates
- Project health assessment
- Dependency management
- Configuration setup
- Documentation generation

#### Git Integration

- Commit changes
- Check status and history
- Create and manage branches
- Merge and rebase operations

#### Performance Monitoring

- System resource monitoring
- Application performance metrics
- Memory and CPU usage analysis
- Performance optimization suggestions

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

## Android Support

NatureCode now has Android compatibility with a dedicated terminal application.

### Android App Features

- **Full terminal interface** with Linux-like command operations
- **NatureCode AI integration** - all AI features available
- **File system access** - read, write, and manage files
- **Network connectivity** - for AI model access
- **Basic Linux commands** - ls, cd, pwd, clear, etc.

### Getting the Android App

#### 📱 APK Download Instructions

**Current Version**: v2.0.1

**Download from GitHub Releases**:

1. Visit **[GitHub Releases Page](https://github.com/naturecode-official/naturecode/releases)**
2. Find the latest release (v2.0.1 or newer)
3. Download the APK files:
   - `naturecode-android-release.apk` - Stable release version
   - `naturecode-android-debug.apk` - Debug version for testing

**Direct Download Links** (Available after release creation):

- Stable: `https://github.com/naturecode-official/naturecode/releases/download/v2.0.1/naturecode-android-release.apk`
- Debug: `https://github.com/naturecode-official/naturecode/releases/download/v2.0.1/naturecode-android-debug.apk`

**Alternative Options**:

1. **Build from source**: See `android-app/` directory and `build-android.sh` script
2. **Manual build**: Follow instructions in `dist/android/README-ANDROID.md`

#### 🔧 Installation Instructions

**For Android Devices**:

1. Download the APK file to your device
2. Enable "Install from unknown sources" in settings
3. Open the downloaded APK file
4. Follow the installation prompts
5. Launch "NatureCode Terminal" from your app drawer

**Verification**:

- **MD5 Checksum**: Verify file integrity after download
- **VirusTotal Scan**: Recommended for security check
- **GitHub Signed**: All releases are signed and verified

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

## iOS Development Status

NatureCode iOS version is currently in development. The project structure and core implementation are ready.

### 🍎 iOS App Features (Planned)

- **SwiftUI Terminal Interface**: Modern iOS-native terminal experience
- **NatureCode AI Integration**: Full AI capabilities through API
- **Sandbox File Access**: Secure file operations within iOS sandbox
- **Network Connectivity**: Support for all AI providers
- **iOS-Specific Commands**: Optimized for iOS environment

### Development Requirements

- **Hardware**: Mac computer with macOS
- **Software**: Xcode 15.0+, iOS SDK 17.0+
- **Developer Account**: Apple Developer Program ($99/year)
- **Testing Device**: iPhone/iPad or iOS Simulator

### Project Structure

The iOS project is located in `ios-app/` directory:

```
ios-app/
├── NatureCodeTerminal/          # Swift source code
├── build-ios.sh                 # Build automation script
├── README.md                    # iOS development guide
└── ExportOptions.plist          # Build configuration
```

### Getting Started with iOS Development

1. **Setup Development Environment**:

   ```bash
   # Run the build script to setup project
   ./ios-app/build-ios.sh
   ```

2. **Open in Xcode**:

   ```bash
   open ios-app/NatureCodeTerminal/NatureCodeTerminal.xcodeproj
   ```

3. **Configure Code Signing**:
   - Select your development team
   - Set Bundle Identifier
   - Configure provisioning profiles

4. **Build and Run**:
   - Select simulator or connect device
   - Click Run (⌘R)

### Current Status

- ✅ **Project Structure**: Complete SwiftUI application structure
- ✅ **Core Components**: Terminal view, command execution, AI integration
- ✅ **Build System**: Automated build scripts and configuration
- 🔄 **Testing**: Unit tests and UI tests framework
- 🔄 **App Store Submission**: Preparation in progress

### Development Timeline

- **Phase 1 (Complete)**: Project setup and core architecture
- **Phase 2 (In Progress)**: Feature implementation and testing
- **Phase 3 (Planned)**: App Store submission and release

### Resources

- [iOS Development Guide](IOS_DEVELOPMENT_GUIDE.md) - Complete development guide
- [Build Instructions](dist/ios/BUILD_INSTRUCTIONS.md) - Detailed build steps
- [Swift Documentation](https://docs.swift.org) - Official Swift docs
- [Apple Developer](https://developer.apple.com) - iOS development resources

### Contributing to iOS Development

If you're an iOS developer interested in contributing:

1. Fork the repository
2. Set up the iOS development environment
3. Check the [iOS Development Guide](IOS_DEVELOPMENT_GUIDE.md)
4. Submit Pull Requests with improvements

**Note**: iOS app requires App Store review and cannot be distributed as direct download like Android APK.

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
