# NatureCode - Cross-platform Terminal AI Assistant

## Features

- 🤖 Multi-model AI support (DeepSeek, OpenAI, Ollama)
- 🚀 One-line installation system
- 📦 Cross-platform (macOS, Linux, Windows)
- 🔧 Professional mode for developers
- 🛡️ Secure configuration storage
- 🔌 Plugin system
- 👥 Team collaboration features

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

```bash
# Configure AI model
naturecode model

# Start interactive session
naturecode start

# Get help
naturecode --help

# Check version
naturecode --version
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

- GitHub Issues: https://github.com/naturecode-official/naturecode/issues
- Current Version: 1.4.8
