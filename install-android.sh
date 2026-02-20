#!/bin/bash

# NatureCode Android Installation Script
# Version: 2.0.0
# For Termux on Android

set -e

echo "========================================"
echo "NatureCode Android Installation"
echo "Version: 2.0.0"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in Termux
check_termux() {
    if [ ! -d "$PREFIX" ] || [ -z "$(which termux-info 2>/dev/null)" ]; then
        log_error "This script must be run in Termux on Android"
        log_error "Please install Termux first:"
        log_error "  https://f-droid.org/en/packages/com.termux/"
        exit 1
    fi
    log_success "Running in Termux"
}

# Check and install dependencies
install_dependencies() {
    log_info "Updating package lists..."
    pkg update -y
    
    log_info "Upgrading existing packages..."
    pkg upgrade -y
    
    log_info "Installing required packages..."
    pkg install -y nodejs git curl wget
    
    # Verify installations
    if ! command -v node &> /dev/null; then
        log_error "Node.js installation failed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git installation failed"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "cURL installation failed"
        exit 1
    fi
    
    log_success "Dependencies installed successfully"
    
    # Show versions
    log_info "Node.js version: $(node --version)"
    log_info "npm version: $(npm --version)"
    log_info "Git version: $(git --version)"
}

# Clone or update NatureCode repository
setup_naturecode() {
    local install_dir="$HOME/naturecode"
    
    if [ -d "$install_dir" ]; then
        log_info "NatureCode directory exists, updating..."
        cd "$install_dir"
        
        # Check if it's a git repository
        if [ -d ".git" ]; then
            log_info "Pulling latest changes..."
            git pull origin main
        else
            log_warning "Directory exists but is not a git repo"
            log_info "Backing up and recloning..."
            mv "$install_dir" "${install_dir}.backup.$(date +%s)"
            clone_naturecode
        fi
    else
        clone_naturecode
    fi
}

clone_naturecode() {
    local install_dir="$HOME/naturecode"
    
    log_info "Cloning NatureCode repository..."
    git clone https://github.com/naturecode-official/naturecode.git "$install_dir"
    
    if [ $? -ne 0 ]; then
        log_error "Failed to clone repository"
        exit 1
    fi
    
    cd "$install_dir"
    log_success "Repository cloned successfully"
}

# Install NatureCode
install_naturecode() {
    log_info "Installing NatureCode dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        log_error "npm install failed"
        exit 1
    fi
    
    log_success "Dependencies installed"
    
    # Create symlink for global access
    log_info "Creating global symlink..."
    npm link
    
    if [ $? -ne 0 ]; then
        log_warning "npm link failed, trying alternative method..."
        # Alternative: create symlink manually
        ln -sf "$(pwd)/src/cli/index.js" "$PREFIX/bin/naturecode" || true
    fi
    
    log_success "NatureCode installed successfully"
}

# Setup storage permissions
setup_storage() {
    log_info "Setting up storage permissions..."
    
    # Check if termux-setup-storage exists
    if command -v termux-setup-storage &> /dev/null; then
        log_info "Running termux-setup-storage..."
        termux-setup-storage
        
        if [ -d "$HOME/storage" ]; then
            log_success "Storage setup completed"
            log_info "Shared storage available at: ~/storage/shared/"
        else
            log_warning "Storage setup may have issues"
        fi
    else
        log_warning "termux-setup-storage not available"
        log_info "You may need to grant storage permissions manually"
    fi
}

# Create configuration
create_config() {
    local config_dir="$HOME/.naturecode"
    
    log_info "Creating configuration directory..."
    mkdir -p "$config_dir"
    
    # Create basic config if it doesn't exist
    if [ ! -f "$config_dir/config.json" ]; then
        log_info "Creating default configuration..."
        cat > "$config_dir/config.json" << 'EOF'
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "modelType": "chat",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": true
}
EOF
        log_success "Default configuration created"
    else
        log_info "Existing configuration found"
    fi
}

# Create startup script
create_startup_script() {
    local script_path="$HOME/.termux/naturecode-start.sh"
    
    log_info "Creating startup script..."
    mkdir -p "$(dirname "$script_path")"
    
    cat > "$script_path" << 'EOF'
#!/bin/bash
# NatureCode Startup Script for Termux

echo "========================================"
echo "NatureCode AI Assistant"
echo "========================================"
echo ""
echo "Quick Commands:"
echo "  naturecode start    - Start AI session"
echo "  naturecode model    - Configure AI model"
echo "  naturecode --help   - Show all commands"
echo ""
echo "Need help? Visit:"
echo "  https://github.com/naturecode-official/naturecode"
echo ""

# Check if NatureCode is installed
if ! command -v naturecode &> /dev/null; then
    echo "NatureCode not found in PATH"
    echo "Try: cd ~/naturecode && npm link"
    return 1
fi

# Optional: auto-start (comment out if not wanted)
# echo "Starting NatureCode..."
# naturecode start
EOF
    
    chmod +x "$script_path"
    log_success "Startup script created: $script_path"
}

# Show completion message
show_completion() {
    echo ""
    echo "========================================"
    echo "🎉 Installation Complete!"
    echo "========================================"
    echo ""
    echo "NatureCode has been successfully installed on your Android device."
    echo ""
    echo "📱 Quick Start:"
    echo "  1. Run: naturecode start"
    echo "  2. Chat with AI naturally"
    echo "  3. Type 'help' for commands"
    echo ""
    echo "🔧 Configuration:"
    echo "  naturecode model    - Configure AI provider"
    echo "  naturecode --help   - Show all options"
    echo ""
    echo "📁 Project Management:"
    echo "  naturecode start    - Start with AGENT.md system"
    echo "  ls, cd, cat         - File operations"
    echo ""
    echo "🌐 AI Features:"
    echo "  - 12+ AI providers"
    echo "  - Internet access tools"
    echo "  - Terminal command execution"
    echo "  - Multi-language support"
    echo ""
    echo "📚 Documentation:"
    echo "  https://github.com/naturecode-official/naturecode"
    echo "  cat ~/naturecode/README.md"
    echo ""
    echo "⚠️  Important Notes:"
    echo "  - Internet required for AI features"
    echo "  - First run may need API key configuration"
    echo "  - Use 'exit' to end AI session"
    echo ""
    echo "🚀 Start your AI coding journey now!"
    echo "========================================"
}

# Main installation process
main() {
    log_info "Starting NatureCode Android installation..."
    
    # Check environment
    check_termux
    
    # Install dependencies
    install_dependencies
    
    # Setup NatureCode
    setup_naturecode
    
    # Install NatureCode
    install_naturecode
    
    # Setup storage
    setup_storage
    
    # Create config
    create_config
    
    # Create startup script
    create_startup_script
    
    # Show completion
    show_completion
    
    log_success "Installation completed successfully!"
    
    # Optional: start NatureCode
    echo ""
    read -p "Start NatureCode now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting NatureCode..."
        naturecode start
    else
        echo "You can start NatureCode anytime with: naturecode start"
    fi
}

# Run main function
main "$@"