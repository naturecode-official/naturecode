#!/bin/bash

# Script to update GitHub username in installation files
# Usage: ./update-github-username.sh YOUR_GITHUB_USERNAME

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NEW_USERNAME="$1"

if [ -z "$NEW_USERNAME" ]; then
    echo -e "${RED}Error: GitHub username is required${NC}"
    echo "Usage: $0 YOUR_GITHUB_USERNAME"
    echo ""
    echo "Example:"
    echo "  $0 johnsmith"
    echo "  $0 alice123"
    exit 1
fi

echo -e "${GREEN}Updating GitHub username to: $NEW_USERNAME${NC}"
echo ""

# List of files to update
FILES=(
    "install-simple.sh"
    "install-curl.sh"
    "install-universal.sh"
    "CURL_INSTALL.md"
    "INSTALL_GUIDE.md"
)

# Backup original files
echo -e "${YELLOW}Creating backups...${NC}"
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$file.backup"
        echo "  Backed up: $file -> $file.backup"
    fi
done
echo ""

# Update files
echo -e "${YELLOW}Updating files...${NC}"
UPDATED_COUNT=0

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Count occurrences before
        OLD_COUNT=$(grep -c "yourusername\|YOUR_GITHUB_USERNAME" "$file" 2>/dev/null || echo 0)
        
        if [ "$OLD_COUNT" -gt 0 ]; then
            # Update the file
            if sed -i '' "s/yourusername/$NEW_USERNAME/g" "$file" 2>/dev/null || \
               sed -i '' "s/YOUR_GITHUB_USERNAME/$NEW_USERNAME/g" "$file" 2>/dev/null; then
                
                # Count occurrences after
                NEW_COUNT=$(grep -c "yourusername\|YOUR_GITHUB_USERNAME" "$file" 2>/dev/null || echo 0)
                CHANGED=$((OLD_COUNT - NEW_COUNT))
                
                echo "  Updated: $file ($CHANGED replacements)"
                UPDATED_COUNT=$((UPDATED_COUNT + 1))
            else
                echo "  Failed: $file"
            fi
        else
            echo "  Skipped: $file (no placeholders found)"
        fi
    else
        echo "  Missing: $file"
    fi
done

echo ""
echo -e "${GREEN}Summary:${NC}"
echo "  Username set to: $NEW_USERNAME"
echo "  Files updated: $UPDATED_COUNT"
echo "  Backups created: ${#FILES[@]}"
echo ""

# Show updated installation commands
echo -e "${YELLOW}Updated installation commands:${NC}"
echo ""
echo "1. One-line install:"
echo "   curl -fsSL https://raw.githubusercontent.com/$NEW_USERNAME/naturecode/main/install-simple.sh | bash"
echo ""
echo "2. Universal installer:"
echo "   curl -fsSL https://raw.githubusercontent.com/$NEW_USERNAME/naturecode/main/install-universal.sh | bash"
echo ""
echo "3. Manual install:"
echo "   git clone https://github.com/$NEW_USERNAME/naturecode.git"
echo "   cd naturecode"
echo "   npm install"
echo "   npm install -g ."
echo ""

# Create test command file
TEST_FILE="test-install-command.sh"
cat > "$TEST_FILE" << EOF
#!/bin/bash
echo "Test installation command for $NEW_USERNAME:"
echo ""
echo "curl -fsSL https://raw.githubusercontent.com/$NEW_USERNAME/naturecode/main/install-simple.sh | bash"
echo ""
echo "Or:"
echo "curl -fsSL https://raw.githubusercontent.com/$NEW_USERNAME/naturecode/main/install-universal.sh | bash"
EOF

chmod +x "$TEST_FILE"
echo -e "${GREEN}Created test file: $TEST_FILE${NC}"
echo "Run: ./$TEST_FILE to see your installation command"
echo ""

# Create GitHub push instructions
cat > "GITHUB_SETUP.md" << EOF
# GitHub Setup Instructions for $NEW_USERNAME

## 1. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: naturecode
3. Description: Cross-platform terminal AI assistant
4. Choose Public or Private
5. Click "Create repository"

## 2. Push Your Code
\`\`\`bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: NatureCode v1.4.5.2"

# Add remote (use your actual username)
git remote add origin https://github.com/$NEW_USERNAME/naturecode.git
git branch -M main
git push -u origin main
\`\`\`

## 3. Share Installation Command
Share this with users:
\`\`\`bash
# One-line install
curl -fsSL https://raw.githubusercontent.com/$NEW_USERNAME/naturecode/main/install-simple.sh | bash

# Or universal installer
curl -fsSL https://raw.githubusercontent.com/$NEW_USERNAME/naturecode/main/install-universal.sh | bash
\`\`\`

## 4. Verify Installation
Users can verify with:
\`\`\`bash
naturecode --version
# Should show: 1.4.5.2
\`\`\`
EOF

echo -e "${GREEN}Created GitHub setup guide: GITHUB_SETUP.md${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the updated files"
echo "2. Check GITHUB_SETUP.md for GitHub instructions"
echo "3. Run ./$TEST_FILE to see your installation command"
echo "4. Upload to GitHub and share the installation command"
echo ""
echo -e "${GREEN}Done!${NC}"