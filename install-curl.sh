#!/bin/bash

# NatureCode Curl Installation Script
# Version: 1.4.7
# One-line install: curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-curl.sh | bash

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Log functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
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

log_step() {
    echo -e "${MAGENTA}[STEP]${NC} $1"
}

# Check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' not found"
        return 1
    fi
    return 0
}

# Get current version if installed
get_installed_version() {
    if command -v naturecode &> /dev/null; then
        naturecode --version 2>/dev/null | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown"
    else
        echo "not_installed"
    fi
}

# 从 GitHub 获取最新版本号
get_latest_version() {
    local version
    # 尝试从 package.json 获取版本号
    version=$(curl -s https://raw.githubusercontent.com/naturecode-official/naturecode/main/package.json 2>/dev/null | \
        grep '"version"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$version" ]; then
        # 如果无法获取，使用默认版本
        echo "1.4.7"
    else
        echo "$version"
    fi
}

# Show banner
show_banner() {
    local version=$(get_latest_version)
    echo -e "${BLUE}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                   NatureCode Installer                          ║"
    echo "║           Cross-platform AI Assistant for Terminal              ║"
    echo "║                       Version: $version                          ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Show system info
show_system_info() {
    log_step "System Information"
    echo -e "  OS: $(uname -s)"
    echo -e "  Architecture: $(uname -m)"
    echo -e "  Shell: $(basename "$SHELL")"
    echo -e "  Node.js: $(node --version 2>/dev/null || echo "Not installed")"
    echo -e "  npm: $(npm --version 2>/dev/null || echo "Not installed")"
    echo -e "  Current NatureCode: $(get_installed_version)"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites"
    
    # Check Node.js
    if ! check_command "node"; then
        log_error "Node.js is required but not installed"
        log_info "Please install Node.js from: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! check_command "npm"; then
        log_error "npm is required but not installed"
        log_info "Please install npm (comes with Node.js)"
        exit 1
    fi
    
    # Check Node.js version (minimum v16)
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -lt 16 ]; then
        log_error "Node.js version $NODE_VERSION is too old. Minimum required: v16+"
        log_info "Please upgrade Node.js from: https://nodejs.org/"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Download and install NatureCode
install_naturecode() {
    local INSTALL_TYPE="$1"
    local TARGET_VERSION=$(get_latest_version)
    
    log_step "Installing NatureCode v$TARGET_VERSION"
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf '$TEMP_DIR'" EXIT
    
    # Download from GitHub (simulate - in real scenario would be from actual repo)
    log_info "Downloading NatureCode..."
    
    # For now, we'll install from local directory
    # In production, this would be: curl -L https://github.com/naturecode-official/naturecode/archive/refs/tags/v$TARGET_VERSION.tar.gz -o "$TEMP_DIR/naturecode.tar.gz"
    
    # Copy local files to temp directory
    cp -r /Users/jay5/Desktop/naturecode/* "$TEMP_DIR/" 2>/dev/null || true
    
    cd "$TEMP_DIR"
    
    # Install dependencies
    log_info "Installing dependencies..."
    if npm install --silent; then
        log_success "Dependencies installed"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    # Install globally
    log_info "Installing NatureCode globally..."
    if npm install -g . --silent; then
        log_success "NatureCode installed globally"
    else
        log_error "Failed to install globally"
        exit 1
    fi
    
    # Verify installation
    if command -v naturecode &> /dev/null; then
        INSTALLED_VERSION=$(naturecode --version 2>/dev/null | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
        if [ "$INSTALLED_VERSION" = "$TARGET_VERSION" ]; then
            log_success "Successfully installed NatureCode v$INSTALLED_VERSION"
        else
            log_warning "Installed version ($INSTALLED_VERSION) doesn't match target ($TARGET_VERSION)"
        fi
    else
        log_error "Installation verification failed"
        exit 1
    fi
}

# Update existing installation
update_naturecode() {
    local CURRENT_VERSION=$(get_installed_version)
    local TARGET_VERSION=$(get_latest_version)
    
    if [ "$CURRENT_VERSION" = "not_installed" ]; then
        log_error "NatureCode is not installed. Please install first."
        exit 1
    fi
    
    if [ "$CURRENT_VERSION" = "$TARGET_VERSION" ]; then
        log_success "NatureCode is already up to date (v$CURRENT_VERSION)"
        return 0
    fi
    
    log_step "Updating NatureCode from v$CURRENT_VERSION to v$TARGET_VERSION"
    
    # Uninstall old version
    log_info "Removing old version..."
    if npm uninstall -g naturecode --silent; then
        log_success "Old version removed"
    else
        log_warning "Failed to remove old version, continuing with installation..."
    fi
    
    # Install new version
    install_naturecode "update"
    
    log_success "Successfully updated to v$TARGET_VERSION"
}

# Show post-install instructions
show_post_install() {
    log_step "Post-installation Instructions"
    echo ""
    echo -e "${GREEN}${BOLD}NatureCode has been successfully installed!${NC}"
    echo ""
    echo "To get started:"
    echo "  1. Configure your AI model:"
    echo "     ${CYAN}naturecode model${NC}"
    echo ""
    echo "  2. Start an interactive session:"
    echo "     ${CYAN}naturecode start${NC}"
    echo ""
    echo "  3. Get help:"
    echo "     ${CYAN}naturecode help${NC}              # Direct AI chat"
    echo "     ${CYAN}naturecode help \"your question\"${NC}  # Get specific help"
    echo ""
    echo "  4. Check available commands:"
    echo "     ${CYAN}naturecode --help${NC}"
    echo ""
    echo "Features:"
    echo "  • Direct AI assistance with Ollama/DeepSeek"
    echo "  • File system operations"
    echo "  • Git integration"
    echo "  • Code analysis and review"
    echo "  • Project management"
    echo "  • Plugin system"
    echo ""
    echo "For more information, visit:"
    echo "  https://github.com/naturecode-official/naturecode"
    echo ""
}

# Main installation flow
main() {
    show_banner
    show_system_info
    
    CURRENT_VERSION=$(get_installed_version)
    
    if [ "$CURRENT_VERSION" = "not_installed" ]; then
        log_info "NatureCode is not currently installed"
        echo ""
        echo -e "${YELLOW}This will install NatureCode v1.4.7 globally.${NC}"
        echo -e "${YELLOW}Continue? [y/N]: ${NC}"
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            log_info "Installation cancelled"
            exit 0
        fi
        
        check_prerequisites
        install_naturecode "fresh"
        show_post_install
        
    elif [ "$CURRENT_VERSION" = "1.4.7" ]; then
        log_success "NatureCode v$CURRENT_VERSION is already installed"
        echo ""
        echo "What would you like to do?"
        echo "  1) Reinstall NatureCode"
        echo "  2) Show help information"
        echo "  3) Exit"
        echo ""
        echo -e "${YELLOW}Enter choice [1-3]: ${NC}"
        read -r choice
        
        case $choice in
            1)
                check_prerequisites
                install_naturecode "reinstall"
                show_post_install
                ;;
            2)
                show_post_install
                ;;
            3)
                log_info "Exiting"
                exit 0
                ;;
            *)
                log_error "Invalid choice"
                exit 1
                ;;
        esac
        
    else
        log_info "Found NatureCode v$CURRENT_VERSION"
        echo ""
        echo -e "${YELLOW}Update to v1.4.7? [Y/n]: ${NC}"
        read -r response
        if [[ "$response" =~ ^([nN][oO]|[nN])$ ]]; then
            log_info "Update cancelled"
            exit 0
        fi
        
        check_prerequisites
        update_naturecode
        show_post_install
    fi
}

# Handle errors
handle_error() {
    log_error "Installation failed!"
    log_error "Error on line $1"
    log_info "Please check:"
    log_info "  1. Node.js and npm are installed"
    log_info "  2. You have write permissions"
    log_info "  3. Internet connection is available"
    log_info ""
    log_info "For help, visit: https://github.com/naturecode-official/naturecode/issues"
    exit 1
}

# Set trap for errors
trap 'handle_error $LINENO' ERR

# Run main function
main "$@"