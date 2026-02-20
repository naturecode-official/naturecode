# NatureCode for Android

## Overview

NatureCode runs on Android through **Termux**, a powerful terminal emulator and Linux environment for Android. This approach provides the best terminal experience and full compatibility with NatureCode's features.

## Installation Guide

### Step 1: Install Termux

1. **Download Termux** from one of these sources:
   - [F-Droid (Recommended)](https://f-droid.org/en/packages/com.termux/)
   - [GitHub Releases](https://github.com/termux/termux-app/releases)

2. **Install Termux** on your Android device
   - Enable "Install from unknown sources" if needed
   - Open and grant necessary permissions

### Step 2: Install NatureCode

Copy and paste this command in Termux:

```bash
# Update packages and install dependencies
pkg update -y && pkg upgrade -y
pkg install -y nodejs git curl wget

# Install NatureCode
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-android.sh | bash

# Or clone and install manually
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode
npm install
npm link
```

### Step 3: Configure NatureCode

```bash
# Start NatureCode
naturecode start

# Or configure AI model
naturecode model
```

## Features on Android

### ✅ **Full Feature Support**

- All AI models (DeepSeek, OpenAI, etc.)
- AGENT.md project management
- File system operations
- Internet access tools
- Terminal command execution

### ✅ **Termux Integration**

- Native Linux environment
- Package management via `pkg`
- Full terminal capabilities
- File system access

### ✅ **Performance**

- Runs natively in Termux
- No virtualization overhead
- Direct Node.js execution
- Optimized for mobile

## Usage Examples

### Basic AI Interaction

```bash
naturecode start
# Then chat naturally with AI
```

### File Operations

```bash
# List files
ls

# Read a file
cat README.md

# Change directory
cd ~/storage/shared/Documents
```

### AI with Tools

```bash
# Ask AI to help with coding
"Create a Python script to calculate Fibonacci numbers"

# Ask AI to search the web
"Search for latest Node.js updates"
```

## Troubleshooting

### Common Issues

#### Issue: "Command not found"

```bash
# Make sure NatureCode is installed
which naturecode

# If not found, reinstall
cd ~/naturecode
npm link
```

#### Issue: "Permission denied"

```bash
# Grant storage permission
termux-setup-storage

# Check permissions
ls -la ~/storage
```

#### Issue: "Network error"

```bash
# Check internet connection
ping -c 3 google.com

# Update packages
pkg update && pkg upgrade
```

### Performance Tips

1. **Use Termux:Widget** for quick access
2. **Enable battery optimization** for Termux
3. **Store projects** in `~/storage/shared/`
4. **Use `naturecode agent`** for project management

## Advanced Configuration

### Custom Termux Setup

```bash
# Install additional tools
pkg install -y python python-numpy clang make

# Set up development environment
mkdir ~/projects
cd ~/projects
```

### Auto-start Script

Create `~/.termux/termux.properties`:

```properties
# Enable extra keys
extra-keys = [['ESC','/','-','HOME','UP','END','PGUP'],['TAB','CTRL','ALT','LEFT','DOWN','RIGHT','PGDN']]
```

### Backup and Restore

```bash
# Backup NatureCode configuration
cp -r ~/.naturecode ~/storage/shared/naturecode-backup/

# Restore configuration
cp -r ~/storage/shared/naturecode-backup/.naturecode ~/
```

## Security Notes

### Safe Practices

1. **Only install from trusted sources**
2. **Review scripts before running**
3. **Use NatureCode's secure storage for API keys**
4. **Regularly update Termux and NatureCode**

### Permission Management

- Termux needs storage permission for file operations
- Internet permission is required for AI features
- No unnecessary permissions requested

## Support

### Documentation

- [NatureCode GitHub](https://github.com/naturecode-official/naturecode)
- [Termux Wiki](https://wiki.termux.com)
- [Android Guide](https://naturecode.ai/docs/android)

### Community

- GitHub Issues: For bugs and feature requests
- Termux Community: For Android/terminal questions

### Updates

```bash
# Update NatureCode
cd ~/naturecode
git pull
npm install

# Update Termux
pkg update && pkg upgrade
```

## Why This Approach?

### Benefits

1. **Native Performance**: Runs directly on Linux environment
2. **Full Compatibility**: All NatureCode features work
3. **Community Support**: Large Termux community
4. **No Compromises**: Same experience as desktop

### Comparison with Native Android App

| Aspect      | Termux + NatureCode     | Native Android App       |
| ----------- | ----------------------- | ------------------------ |
| Performance | Native Linux speed      | Android runtime overhead |
| Features    | 100% compatible         | Limited by Android APIs  |
| Updates     | Instant via git         | App store review process |
| Storage     | Full file system access | Sandboxed storage        |
| Community   | Large Termux community  | Smaller user base        |

## Quick Reference

### Essential Commands

```bash
# Start AI session
naturecode start

# Configure AI model
naturecode model

# Check version
naturecode --version

# Get help
naturecode --help
```

### Termux Essentials

```bash
# Update everything
pkg update && pkg upgrade

# Install Node.js
pkg install nodejs

# Access shared storage
cd ~/storage/shared

# Exit Termux
exit
```

### NatureCode on Android is ready to use!

Start your AI coding journey on mobile with full desktop capabilities.
