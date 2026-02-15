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
git commit -m "NatureCode v1.4.5.4 - Cross-platform AI assistant"

# Add remote
git remote add origin https://github.com/naturecode-official/naturecode.git
git branch -M main
git push -u origin main
```

3. **Verify installation:**
```bash
# After users install, they can verify with:
naturecode --version
# Should show: 1.4.5.4

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
