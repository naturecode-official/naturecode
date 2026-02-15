#!/bin/bash

# Local test installer for NatureCode
# Use this to test installation before uploading to GitHub

set -e

echo "NatureCode Local Test Installer"
echo "================================"
echo ""
echo "This is a local test version. For production, upload to GitHub first."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the NatureCode project directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed"
    echo "npm comes with Node.js. Please reinstall Node.js."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 16 ]; then
    echo "Error: Node.js version $NODE_VERSION is too old. Minimum required: v16+"
    echo "Please upgrade Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✓ Prerequisites satisfied"
echo ""

# Check current installation
if command -v naturecode &> /dev/null; then
    CURRENT_VERSION=$(naturecode --version 2>/dev/null | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
    echo "Found existing NatureCode installation: v$CURRENT_VERSION"
    echo ""
    
    read -p "Update to v1.4.7? [Y/n]: " response
    if [[ "$response" =~ ^([nN][oO]|[nN])$ ]]; then
        echo "Installation cancelled"
        exit 0
    fi
    
    echo "Removing old version..."
    npm uninstall -g naturecode 2>/dev/null || true
fi

# 获取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.4.7")

echo "Installing NatureCode v$CURRENT_VERSION..."
echo ""

# Install locally
echo "Installing dependencies..."
npm install

echo "Installing globally..."
npm install -g .

# Verify installation
if command -v naturecode &> /dev/null; then
    INSTALLED_VERSION=$(naturecode --version 2>/dev/null | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
    echo ""
    echo "✓ Successfully installed NatureCode v$INSTALLED_VERSION"
    echo ""
    echo "Quick start:"
    echo "  naturecode model     # Configure AI model"
    echo "  naturecode start     # Start interactive session"
    echo "  naturecode help      # Get AI assistance"
    echo ""
    echo "For help: naturecode --help"
else
    echo ""
    echo "✗ Installation failed"
    exit 1
fi

echo ""
echo "========================================"
echo "Next steps for GitHub deployment:"
echo "========================================"
echo "1. Create GitHub repository:"
echo "   https://github.com/new"
echo "   • Owner: naturecode-official"
echo "   • Repository name: naturecode"
echo "   • Public repository"
echo ""
echo "2. Upload your code:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'NatureCode v1.4.7'"
echo "   git remote add origin https://github.com/naturecode-official/naturecode.git"
echo "   git push -u origin main"
echo ""
echo "3. Share installation command:"
echo "   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
echo ""
echo "4. Test the GitHub installation"
echo "========================================"