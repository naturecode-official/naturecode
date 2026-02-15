#!/bin/bash

# Finalize NatureCode installation scripts with naturecode-official username

set -e

echo "Finalizing NatureCode installation scripts with username: naturecode-official"
echo ""

# Update all files with naturecode-official
echo "Updating files..."
echo ""

# Update install-simple.sh
sed -i '' 's/testuser/naturecode-official/g' install-simple.sh
echo "✓ Updated install-simple.sh"

# Update install-curl.sh
sed -i '' 's/yourusername/naturecode-official/g' install-curl.sh
sed -i '' 's/yourusername/naturecode-official/g' install-curl.sh  # Run twice to catch all
echo "✓ Updated install-curl.sh"

# Update install-universal.sh (already has placeholder)
echo "✓ install-universal.sh uses dynamic username"

# Update CURL_INSTALL.md
sed -i '' 's/yourusername/naturecode-official/g' CURL_INSTALL.md
echo "✓ Updated CURL_INSTALL.md"

# Update INSTALL_GUIDE.md
sed -i '' 's/YOUR_GITHUB_USERNAME/naturecode-official/g' INSTALL_GUIDE.md
sed -i '' 's/yourusername/naturecode-official/g' INSTALL_GUIDE.md
echo "✓ Updated INSTALL_GUIDE.md"

# Update test-install-command.sh
cat > test-install-command.sh << 'EOF'
#!/bin/bash
echo "NatureCode Installation Command"
echo "================================"
echo ""
echo "One-line installation:"
echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash"
echo ""
echo "Universal installer (asks for username):"
echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-universal.sh | bash"
echo ""
echo "Manual installation:"
echo "git clone https://github.com/naturecode-official/naturecode.git"
echo "cd naturecode"
echo "npm install"
echo "npm install -g ."
echo ""
echo "After installation:"
echo "naturecode --version    # Should show 1.4.5.2"
echo "naturecode help         # Start AI chat"
EOF

chmod +x test-install-command.sh
echo "✓ Updated test-install-command.sh"

# Update GITHUB_SETUP.md
cat > GITHUB_SETUP.md << 'EOF'
# GitHub Setup for naturecode-official

## Repository Created Successfully!

Your NatureCode installation is ready for GitHub.

## Installation Commands to Share:

### One-line Install (Recommended):
```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

### Universal Installer:
```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-universal.sh | bash
```

### Manual Install:
```bash
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode
npm install
npm install -g .
```

## Upload to GitHub:

1. **Create repository on GitHub:**
   - Go to: https://github.com/new
   - Owner: naturecode-official
   - Repository name: naturecode
   - Description: Cross-platform terminal AI assistant
   - Public repository
   - Click "Create repository"

2. **Push your code:**
```bash
# Initialize git (if not already)
git init
git add .
git commit -m "NatureCode v1.4.5.2 - Cross-platform AI assistant"

# Add remote
git remote add origin https://github.com/naturecode-official/naturecode.git
git branch -M main
git push -u origin main
```

3. **Verify installation:**
```bash
# After users install, they can verify with:
naturecode --version
# Should show: 1.4.5.2

naturecode help
# Should start AI chat
```

## Files to Upload:
- All files in current directory
- Make sure install-*.sh are executable

## Quick Test:
Before sharing, test the installation locally:
```bash
./install-simple.sh
```

## Support:
- GitHub: https://github.com/naturecode-official/naturecode
- Issues: https://github.com/naturecode-official/naturecode/issues
EOF

echo "✓ Updated GITHUB_SETUP.md"

echo ""
echo "========================================="
echo "Final Installation Commands:"
echo "========================================="
echo ""
echo "1. ONE-LINE INSTALL (recommended):"
echo "   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash"
echo ""
echo "2. UNIVERSAL INSTALLER:"
echo "   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-universal.sh | bash"
echo ""
echo "3. MANUAL INSTALL:"
echo "   git clone https://github.com/naturecode-official/naturecode.git"
echo "   cd naturecode"
echo "   npm install"
echo "   npm install -g ."
echo ""
echo "========================================="
echo "Next Steps:"
echo "1. Run: ./test-install-command.sh to see commands"
echo "2. Check GITHUB_SETUP.md for GitHub instructions"
echo "3. Upload to GitHub: https://github.com/naturecode-official"
echo "4. Share the installation command!"
echo "========================================="