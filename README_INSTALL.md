# NatureCode v1.4.5.3 - Installation Guide

## 🚀 Quick Install (One Command)

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

## 📋 What's Included

NatureCode is a cross-platform terminal AI assistant with:

### 🎯 Core Features

- **Direct AI Chat**: `naturecode help` for immediate AI assistance
- **Multiple AI Models**: DeepSeek, Ollama, OpenAI support
- **File Operations**: Read, edit, create, delete files
- **Git Integration**: Status, commit, push, pull operations
- **Code Analysis**: Code review, metrics, refactoring suggestions
- **Project Management**: Project analysis and dependency management
- **Plugin System**: Extensible with custom plugins
- **Session Management**: Save and restore chat sessions

### 🆕 Version 1.4.5.3 Highlights

- **Improved Help Command**: Direct AI chat without intermediate steps
- **Multi-model Support**: Fallback to various AI models
- **Better Error Handling**: Timeouts and recovery mechanisms
- **Ollama Optimization**: Automatic installation and setup
- **Emoji-free Codebase**: Clean, professional interface

## 📥 Installation Options

### Option 1: One-line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

### Option 2: Universal Installer

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-universal.sh | bash
```

### Option 3: Manual Installation

```bash
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode
npm install
npm install -g .
```

### Option 4: From npm (Coming Soon)

```bash
npm install -g naturecode
```

## 🔧 Prerequisites

- **Node.js** v16 or higher
- **npm** (comes with Node.js)
- **Internet connection** for AI features

## 🎮 Quick Start

After installation:

1. **Configure AI model**:

   ```bash
   naturecode model
   ```

2. **Start interactive session**:

   ```bash
   naturecode start
   ```

3. **Get AI help**:
   ```bash
   naturecode help                    # Direct AI chat
   naturecode help "your question"    # Specific help
   ```

## 📚 Available Commands

```bash
naturecode --help

# Main Commands:
naturecode model     # Configure AI model and API
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

## 🛠️ Advanced Features

### File System Operations

```bash
# In interactive mode, use natural language:
"read package.json"
"create newfile.js"
"edit config.json"
"list files in src/"
```

### AI-Powered Code Review

```bash
naturecode code review file.js
naturecode review --ai
```

### Plugin System

```bash
naturecode plugin list
naturecode plugin install <plugin-url>
```

## 🔄 Updating

### Update from Any Version

```bash
# The installer automatically updates existing installations
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

### Manual Update

```bash
npm uninstall -g naturecode
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

## 🐛 Troubleshooting

### Common Issues

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

### Verify Installation

```bash
naturecode --version
# Should show: 1.4.5.3

naturecode help
# Should start AI chat
```

## 📖 Documentation

- **Full Documentation**: See `docs.md`
- **Configuration Guide**: See `CONFIG_GUIDE.md`
- **Plugin Development**: See `PLUGIN_SYSTEM_DESIGN.md`
- **API Reference**: See code comments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🌐 Links

- **GitHub**: https://github.com/naturecode-official/naturecode
- **Issues**: https://github.com/naturecode-official/naturecode/issues
- **Releases**: https://github.com/naturecode-official/naturecode/releases

## 🎯 One More Time - Install Now!

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

After installation, run `naturecode help` to start your AI-powered coding journey! 🚀
