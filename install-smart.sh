#!/bin/bash

# NatureCode Professional Installer
# One-line install: curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | bash
# Professional mode only - for developers and advanced users

set -e

# Color definitions - use tput only, no color if not supported
COLORS_SUPPORTED=false
RED=""
GREEN=""
YELLOW=""
BLUE=""
MAGENTA=""
CYAN=""
NC=""
BOLD=""

# Enable colors only if terminal supports them and tput is available
if [ -t 1 ] && command -v tput >/dev/null 2>&1; then
    # Check if terminal truly supports colors
    if tput colors >/dev/null 2>&1 && [ "$(tput colors)" -ge 8 ]; then
        COLORS_SUPPORTED=true
        RED=$(tput setaf 1)
        GREEN=$(tput setaf 2)
        YELLOW=$(tput setaf 3)
        BLUE=$(tput setaf 4)
        MAGENTA=$(tput setaf 5)
        CYAN=$(tput setaf 6)
        NC=$(tput sgr0)
        BOLD=$(tput bold)
    fi
fi

# Log functions for professional mode
log_step() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${MAGENTA}[STEP]${NC} $1\n"
    else
        echo "[STEP] $1"
    fi
}

log_info() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${CYAN}[INFO]${NC} $1\n"
    else
        echo "[INFO] $1"
    fi
}

log_success() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${GREEN}[SUCCESS]${NC} $1\n"
    else
        echo "[SUCCESS] $1"
    fi
}

log_warning() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${YELLOW}[WARNING]${NC} $1\n"
    else
        echo "[WARNING] $1"
    fi
}

log_error() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${RED}[ERROR]${NC} $1\n"
    else
        echo "[ERROR] $1"
    fi
}

# Show banner
show_banner() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${BLUE}${BOLD}"
    fi
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                NatureCode Professional Installer                 ║"
    echo "║           Cross-platform AI Assistant for Developers             ║"
    echo "║                       Version: 1.4.5.3                           ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b\n" "${NC}"
    fi
}

# Show installation mode (professional only)
show_installation_mode() {
    echo ""
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${CYAN}NatureCode Professional Mode${NC}\n"
    else
        echo "NatureCode Professional Mode"
    fi
    echo ""
    
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${YELLOW}Professional Features:${NC}\n"
    else
        echo "Professional Features:"
    fi
    echo "  • Detailed installation process"
    echo "  • System information display"
    echo "  • Interactive prompts"
    echo "  • Better error diagnostics"
    echo "  • Advanced configuration options"
    echo ""
    
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${GREEN}Using Professional Mode${NC}\n"
    else
        echo "Using Professional Mode"
    fi
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

# Install NatureCode (professional mode)
install_pro() {
    local TARGET_VERSION="1.4.5.3"
    local CURRENT_VERSION=$(get_installed_version)
    
    log_step "Installation Details"
    echo -e "  Target version: v$TARGET_VERSION"
    echo -e "  Current version: $CURRENT_VERSION"
    echo -e "  GitHub source: naturecode-official/naturecode"
    echo ""
    
    if [ "$CURRENT_VERSION" = "1.4.5.3" ]; then
        log_success "NatureCode v1.4.5.3 is already installed"
        echo ""
        echo "Options:"
        echo "  1) Reinstall NatureCode"
        echo "  2) Show help information"
        echo "  3) Exit"
        echo ""
        if [ "$COLORS_SUPPORTED" = "true" ]; then
            printf "%b" "${YELLOW}Enter choice [1-3]: ${NC}\n"
        else
            echo "Enter choice [1-3]: "
        fi
        read -r choice
        
        case $choice in
            1)
                log_info "Reinstalling..."
                npm uninstall -g naturecode 2>/dev/null || true
                ;;
            2)
                show_post_install
                exit 0
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
    elif [ "$CURRENT_VERSION" != "not_installed" ]; then
        log_info "Found NatureCode v$CURRENT_VERSION"
        echo ""
        if [ "$COLORS_SUPPORTED" = "true" ]; then
            printf "%b" "${YELLOW}Update to v$TARGET_VERSION? [Y/n]: ${NC}\n"
        else
            echo "Update to v$TARGET_VERSION? [Y/n]: "
        fi
        read -r response
        if [[ "$response" =~ ^([nN][oO]|[nN])$ ]]; then
            log_info "Update cancelled"
            exit 0
        fi
        
        log_info "Removing old version..."
        npm uninstall -g naturecode 2>/dev/null || true
    fi
    
    log_step "Downloading NatureCode..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf '$TEMP_DIR'" EXIT
    
    cd "$TEMP_DIR"
    
    # Download from GitHub
    log_info "Downloading from GitHub..."
    curl -fsSL https://github.com/naturecode-official/naturecode/archive/refs/heads/main.tar.gz -o naturecode.tar.gz || {
        log_error "Failed to download from GitHub"
        exit 1
    }
    tar -xzf naturecode.tar.gz --strip-components=1
    rm -f naturecode.tar.gz
    
    log_info "Installing dependencies..."
    if npm install --silent; then
        log_success "Dependencies installed"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    log_info "Installing globally..."
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

# Show post-install instructions
show_post_install() {
    log_step "Post-installation Instructions"
    
    echo ""
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${GREEN}${BOLD}NatureCode has been successfully installed!${NC}\n"
    else
        echo "NatureCode has been successfully installed!"
    fi
    echo ""
    echo "To get started:"
    echo "  1. Configure your AI model:"
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo "     ${CYAN}naturecode model${NC}"
    else
        echo "     naturecode model"
    fi
    echo ""
    echo "  2. Start an interactive session:"
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo "     ${CYAN}naturecode start${NC}"
    else
        echo "     naturecode start"
    fi
    echo ""
    echo "  3. Get help:"
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo "     ${CYAN}naturecode help${NC}              # Direct AI chat"
        echo "     ${CYAN}naturecode help \"your question\"${NC}  # Get specific help"
    else
        echo "     naturecode help              # Direct AI chat"
        echo "     naturecode help \"your question\"  # Get specific help"
    fi
    echo ""
    echo "  4. Check available commands:"
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo "     ${CYAN}naturecode --help${NC}"
    else
        echo "     naturecode --help"
    fi
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
    
    # Show installation mode (professional only)
    show_installation_mode
    
    # Show system info
    show_system_info
    
    # Check prerequisites
    check_prerequisites
    
    # Install using professional mode
    install_pro
    
    # Show post-install instructions
    show_post_install
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
main