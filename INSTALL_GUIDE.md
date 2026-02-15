# NatureCode Installation Guide

## Quick Installation

### Option 1: One-line Install (Replace naturecode-official)

```bash
# Replace naturecode-official with your actual GitHub username
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

### Option 2: Universal Installer

```bash
# This script will ask for GitHub username
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-universal.sh | bash
```

### Option 3: Manual Installation

```bash
# Clone repository
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode

# Install
npm install
npm install -g .
```

## How to Replace naturecode-official

### Step 1: Find your GitHub username

1. Go to https://github.com
2. Log in to your account
3. Your username is in the top-right corner or URL

### Step 2: Replace in commands

Replace `naturecode-official` with your actual username:

**Example:**

- If your GitHub username is `johnsmith`
- Change: `https://github.com/naturecode-official/naturecode`
- To: `https://github.com/johnsmith/naturecode`

### Step 3: Update installation scripts

Before uploading to GitHub, update these files:

1. **`install-simple.sh`**:

   ```bash
   # Line with GitHub URL - update to your username
   # From: https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh
   # To: https://raw.githubusercontent.com/johnsmith/naturecode/main/install-simple.sh
   ```

2. **`install-curl.sh`**:

   ```bash
   # Update GitHub references
   # From: https://github.com/naturecode-official/naturecode
   # To: https://github.com/johnsmith/naturecode
   ```

3. **`CURL_INSTALL.md`**:
   ```markdown
   # Update all references from 'naturecode-official' to your actual username
   ```

## Complete Installation Process

### For Repository Owners (You)

1. **Upload to GitHub**:

   ```bash
   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit: NatureCode v1.4.5.4"

   # Create GitHub repository first, then:
   git remote add origin https://github.com/naturecode-official/naturecode.git
   git branch -M main
   git push -u origin main
   ```

2. **Update installation scripts**:

   ```bash
   # Use sed to replace all instances
   sed -i '' 's/naturecode-official/naturecode-official/g' install-*.sh
   sed -i '' 's/naturecode-official/naturecode-official/g' CURL_INSTALL.md
   sed -i '' 's/naturecode-official/naturecode-official/g' INSTALL_GUIDE.md
   ```

3. **Push updated files**:
   ```bash
   git add install-*.sh CURL_INSTALL.md INSTALL_GUIDE.md
   git commit -m "Update installation scripts with correct GitHub username"
   git push
   ```

### For Users

Once you've uploaded to GitHub with your username:

1. **Install using your GitHub username**:

   ```bash
   # Replace with your actual username
   GITHUB_USER="your_actual_username"
   curl -fsSL https://raw.githubusercontent.com/$GITHUB_USER/naturecode/main/install-simple.sh | bash
   ```

2. **Or use the universal installer**:
   ```bash
   # This will prompt for username
   curl -fsSL https://raw.githubusercontent.com/$GITHUB_USER/naturecode/main/install-universal.sh | bash
   ```

## Alternative: Local Installation

If you don't want to use GitHub:

### Method 1: Direct from local files

```bash
# Run installation script directly
./install-simple.sh
```

### Method 2: Manual local install

```bash
# Install from current directory
npm install
npm install -g .
```

### Method 3: Create portable installer

```bash
# Create a tarball
tar -czf naturecode-1.4.5.4.tar.gz --exclude="node_modules" --exclude=".git" .

# Distribute and install
tar -xzf naturecode-1.4.5.4.tar.gz
cd naturecode-1.4.5.4
npm install
npm install -g .
```

## Testing Your Installation

After installation, verify:

```bash
# Check version
naturecode --version
# Should show: 1.4.5.4 or your current version

# Test basic commands
naturecode help
naturecode model --help
```

## Troubleshooting

### If installation fails:

1. **Check GitHub URL**:

   ```bash
   # Test if repository exists
   curl -I https://github.com/naturecode-official/naturecode
   ```

2. **Check file exists**:

   ```bash
   # Test if install script is accessible
   curl -I https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh
   ```

3. **Manual download**:
   ```bash
   # Download and run manually
   curl -O https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh
   chmod +x install-simple.sh
   ./install-simple.sh
   ```

## Summary

1. **For you (repository owner)**:
   - Replace `naturecode-official` with your actual GitHub username
   - Upload to GitHub
   - Share the installation command with your username

2. **For users**:
   - Use the installation command with the correct GitHub username
   - Or use the universal installer that prompts for username

3. **Quick reference**:
   ```bash
   # Final installation command (after you update username)
   curl -fsSL https://raw.githubusercontent.com/ACTUAL_USERNAME/naturecode/main/install-simple.sh | bash
   ```

Remember to replace `ACTUAL_USERNAME` with your real GitHub username before sharing the installation command!
