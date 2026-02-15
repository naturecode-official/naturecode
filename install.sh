#!/bin/bash

# NatureCode Professional Installer
# One-line install: curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
# Professional mode only - for developers and advanced users

set -e

echo "Downloading NatureCode Professional Installer..."
echo ""

# Download and run the professional installer
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh -o /tmp/naturecode-install.sh

if [ $? -eq 0 ]; then
    chmod +x /tmp/naturecode-install.sh
    echo "Starting NatureCode installation..."
    echo ""
    /tmp/naturecode-install.sh
    rm -f /tmp/naturecode-install.sh
else
    echo "Failed to download installer. Please check your internet connection."
    echo ""
    echo "Alternative installation methods:"
    echo "1. Manual installation:"
    echo "   git clone https://github.com/naturecode-official/naturecode.git"
    echo "   cd naturecode"
    echo "   npm install"
    echo "   npm install -g ."
    echo ""
    echo "2. Direct download:"
    echo "   Visit: https://github.com/naturecode-official/naturecode"
    exit 1
fi