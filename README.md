# NatureCode - Cross-platform Terminal AI Assistant

## Features

- 🤖 **Multi-model AI Support**: DeepSeek, OpenAI, Ollama with comprehensive model coverage
- 🚀 **One-line Installation**: Simple curl-based installation system
- 📦 **Cross-platform**: Native support for macOS, Linux, and Windows
- 🔧 **Professional Mode**: Advanced diagnostics and developer tools
- 🛡️ **Secure Configuration**: Encrypted storage for API keys and settings
- 🔌 **Plugin System**: Extensible architecture for custom functionality
- 👥 **Team Collaboration**: Shared projects, member management, and role-based access
- 🌐 **Custom API Endpoints**: Configure custom base_url for all AI providers
- 📚 **Comprehensive Model Support**: 12+ DeepSeek models, 8 Google Gemma models, open-source models migrated to Ollama

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

# Get comprehensive help
naturecode --help

# Check current version
naturecode --version
```

### Advanced Usage

```bash
# Configure custom API endpoints
naturecode model --provider openai --base-url "https://your-custom-endpoint.com"

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

## Documentation

- [AGENTS.md](AGENTS.md) - Development guide for AI assistants
- [WINDOWS_INSTALL.md](WINDOWS_INSTALL.md) - Windows installation guide
- [README_INSTALL.md](README_INSTALL.md) - Detailed installation instructions
- [whatisthis.md](whatisthis.md) - Comprehensive project documentation and guidelines

### Key Features in v1.4.9

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
- **Current Version**: 1.4.9
- **Installation Verification**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run
  ```

### Language Policy

- **User Interface**: Chinese (Simplified/Traditional) for conversations
- **Code & Documentation**: English-first for international accessibility
- **Error Messages**: User-friendly Chinese prompts with English technical details
- **GitHub Commits**: English only for global collaboration
