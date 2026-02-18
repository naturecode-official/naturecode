# NatureCode Curl Installation Guide

## One-line Installation

### For New Installation

```bash
# Install the latest version
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

### For Update/Reinstall

```bash
# Update existing installation
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

## Manual Installation

### Prerequisites

- Node.js 16 or higher
- npm (comes with Node.js)

### Step-by-step Installation

1. **Check current installation** (optional):

   ```bash
   naturecode --version
   # If installed, shows version like: 1.4.5.4
   ```

2. **Remove old version** (if updating):

   ```bash
   npm uninstall -g naturecode
   ```

3. **Install from npm** (when published):

   ```bash
   npm install -g naturecode
   ```

4. **Install from GitHub** (development version):
   ```bash
   npm install -g https://github.com/naturecode-official/naturecode
   ```

## Installation Scripts

### `install-simple.sh` - Simple Installer

- One-line curl installation
- Auto-detects existing versions
- Updates automatically
- Minimal output

### `install-curl.sh` - Advanced Installer

- Interactive installation
- System information display
- Detailed error handling
- Post-install instructions

## Version Management

### Check Current Version

```bash
naturecode --version
# or
npm list -g naturecode
```

### Update to Latest Version

```bash
# Method 1: Using curl
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash

# Method 2: Using npm (when published)
npm update -g naturecode

# Method 3: Reinstall
npm uninstall -g naturecode
npm install -g naturecode
```

### Downgrade to Specific Version

```bash
npm install -g naturecode@1.4.5.1
```

## Troubleshooting

### Common Issues

1. **"Command not found: naturecode"**

   ```bash
   # Check if installed globally
   npm list -g naturecode

   # Check PATH
   echo $PATH

   # Reinstall
   npm install -g naturecode
   ```

2. **Permission denied**

   ```bash
   # Use sudo (not recommended)
   sudo npm install -g naturecode

   # Better: Fix npm permissions
   npm config set prefix ~/.npm-global
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Node.js version too old**

   ```bash
   # Check Node.js version
   node --version

   # Update Node.js from: https://nodejs.org/
   ```

4. **Installation fails**

   ```bash
   # Clear npm cache
   npm cache clean --force

   # Remove node_modules
   rm -rf node_modules package-lock.json

   # Reinstall
   npm install
   ```

### Verify Installation

```bash
# Check if naturecode is available
which naturecode

# Check version
naturecode --version

# Test basic functionality
naturecode help
```

## Post-installation

### First-time Setup

1. Configure AI model:

   ```bash
   naturecode model
   ```

2. Start interactive session:

   ```bash
   naturecode start
   ```

3. Get help:
   ```bash
   naturecode help                    # Show help information
   naturecode start                   # Start AI interactive session
   ```

### Available Commands

```bash
naturecode --help

# Main commands:
naturecode model     # Configure AI model and API settings
naturecode start     # Start interactive AI session
naturecode config    # Show current configuration
naturecode delmodel  # Delete model configuration
```

## Uninstallation

### Remove NatureCode

```bash
npm uninstall -g naturecode
```

### Clean Configuration Files

```bash
# Remove configuration
rm -rf ~/.naturecode

# Remove cache
rm -rf ~/.cache/naturecode
```

## Development Installation

### Install from Local Source

```bash
# Clone repository
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode

# Install dependencies
npm install

# Install globally from local source
npm install -g .

# Or use symlink for development
npm link
```

### Update from Local Source

```bash
# Pull latest changes
git pull origin main

# Reinstall
npm install
npm install -g .
```

## Platform-specific Notes

### macOS

```bash
# If you get permission errors
sudo chown -R $(whoami) ~/.npm
```

### Linux

```bash
# Fix global installation permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Windows

```bash
# Use PowerShell or Command Prompt
# Ensure Node.js is in PATH
```

## Support

- GitHub: https://github.com/naturecode-official/naturecode
- Issues: https://github.com/naturecode-official/naturecode/issues
- Documentation: https://github.com/naturecode-official/naturecode#readme

---

**Note**: Replace `naturecode-official` with the actual GitHub username when the repository is created.
