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
    echo "║                       Version: 1.4.8                             ║"
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

# 从 GitHub 获取最新版本号
get_latest_version() {
    local version
    # 尝试从 package.json 获取版本号
    version=$(curl -s https://raw.githubusercontent.com/naturecode-official/naturecode/main/package.json 2>/dev/null | \
        grep '"version"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$version" ]; then
        # 如果无法获取，使用默认版本
        echo "1.4.8"
    else
        echo "$version"
    fi
}

# 版本比较函数：如果 version1 < version2 返回 true (0)
version_compare() {
    local v1=$1
    local v2=$2
    
    # 将版本号转换为可比较的数字
    local v1_num=$(echo "$v1" | tr '.' ' ')
    local v2_num=$(echo "$v2" | tr '.' ' ')
    
    # 比较每个部分
    local v1_part1=$(echo "$v1_num" | awk '{print $1}')
    local v1_part2=$(echo "$v1_num" | awk '{print $2}')
    local v1_part3=$(echo "$v1_num" | awk '{print $3}')
    local v1_part4=$(echo "$v1_num" | awk '{print $4}')
    
    local v2_part1=$(echo "$v2_num" | awk '{print $1}')
    local v2_part2=$(echo "$v2_num" | awk '{print $2}')
    local v2_part3=$(echo "$v2_num" | awk '{print $3}')
    local v2_part4=$(echo "$v2_num" | awk '{print $4}')
    
    # 逐级比较
    if [ "$v1_part1" -lt "$v2_part1" ]; then return 0; fi
    if [ "$v1_part1" -gt "$v2_part1" ]; then return 1; fi
    
    if [ "$v1_part2" -lt "$v2_part2" ]; then return 0; fi
    if [ "$v1_part2" -gt "$v2_part2" ]; then return 1; fi
    
    if [ "$v1_part3" -lt "$v2_part3" ]; then return 0; fi
    if [ "$v1_part3" -gt "$v2_part3" ]; then return 1; fi
    
    if [ "$v1_part4" -lt "$v2_part4" ]; then return 0; fi
    if [ "$v1_part4" -gt "$v2_part4" ]; then return 1; fi
    
    # 版本相同
    return 1
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
    # 从 GitHub 获取最新版本号
    local TARGET_VERSION=$(get_latest_version)
    local CURRENT_VERSION=$(get_installed_version)
    
    log_step "Installation Details"
    echo -e "  Target version: v$TARGET_VERSION"
    echo -e "  Current version: $CURRENT_VERSION"
    echo -e "  GitHub source: naturecode-official/naturecode"
    echo ""
    
    if [ "$CURRENT_VERSION" = "not_installed" ]; then
        log_info "Installing NatureCode v$TARGET_VERSION..."
    elif [ "$CURRENT_VERSION" = "$TARGET_VERSION" ]; then
        log_success "NatureCode v$TARGET_VERSION is already installed"
        echo ""
        log_info "Checking for updates..."
        # 版本相同，不需要重新安装
        return 0
    elif [ "$CURRENT_VERSION" = "unknown" ]; then
        log_warning "Unable to determine current version"
        echo ""
        log_info "Reinstalling to ensure clean installation..."
        npm uninstall -g naturecode 2>/dev/null || true
    else
        # 版本比较：如果当前版本比目标版本旧，则更新
        if version_compare "$CURRENT_VERSION" "$TARGET_VERSION"; then
            log_info "Found NatureCode v$CURRENT_VERSION"
            echo ""
            log_info "Updating to v$TARGET_VERSION..."
            log_info "Removing old version..."
            npm uninstall -g naturecode 2>/dev/null || true
        else
            log_success "NatureCode v$CURRENT_VERSION is up to date (newer than v$TARGET_VERSION)"
            echo ""
            log_info "No update needed."
            return 0
        fi
    fi
    
    log_step "Downloading NatureCode..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf '$TEMP_DIR'" EXIT
    
    cd "$TEMP_DIR"
    
    # Download from GitHub with retry
    log_info "Downloading from GitHub..."
    MAX_RETRIES=3
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -fsSL https://github.com/naturecode-official/naturecode/archive/refs/heads/main.tar.gz -o naturecode.tar.gz; then
            log_success "Download successful"
            break
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warning "Download failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 2
        else
            log_error "Failed to download from GitHub after $MAX_RETRIES attempts"
            log_info "Alternative: Install from local source if available"
            exit 1
        fi
    done
    
    tar -xzf naturecode.tar.gz --strip-components=1
    rm -f naturecode.tar.gz
    
    log_info "Installing dependencies..."
    if npm install; then
        log_success "Dependencies installed"
    else
        log_error "Failed to install dependencies"
        echo "Debug info:"
        echo "  Current directory: $(pwd)"
        echo "  Node.js version: $(node --version)"
        echo "  npm version: $(npm --version)"
        exit 1
    fi
    
    log_info "Installing globally..."
    
    # 创建永久安装目录
    PERMANENT_DIR="$HOME/.naturecode-install"
    log_info "Copying to permanent directory: $PERMANENT_DIR"
    
    # 清理旧目录并复制
    rm -rf "$PERMANENT_DIR"
    mkdir -p "$PERMANENT_DIR"
    cp -r . "$PERMANENT_DIR/"
    
    # 从永久目录安装
    cd "$PERMANENT_DIR"
    echo "Installing from permanent directory: $(pwd)"
    
    if npm install -g .; then
        log_success "NatureCode installed globally"
        echo "Global installation location:"
        npm root -g
        echo ""
        echo "Symbolic link created to permanent directory"
    else
        log_error "Failed to install globally"
        echo "Troubleshooting tips:"
        echo "  1. Try: sudo npm install -g ."
        echo "  2. Check npm permissions: npm config get prefix"
        echo "  3. Or use: npm install -g . --unsafe-perm"
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
        echo "     ${CYAN}naturecode help${NC}              # Show help information"
        echo "     ${CYAN}naturecode start${NC}             # Start AI session (requires AI configuration)"
    else
        echo "     naturecode help              # Show help information"
        echo "     naturecode start             # Start AI session (requires AI configuration)"
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
    
    # Setup AI assistant automatically
    echo ""
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        printf "%b" "${CYAN}[INFO]${NC} Setting up AI assistant...\n"
    else
        echo "[INFO] Setting up AI assistant..."
    fi
    
    # Create minimal configuration for AI assistance
    setup_ai_assistant() {
        local install_dir="$1"
        local config_dir="$HOME/.naturecode"
        
        # Ensure config directory exists
        mkdir -p "$config_dir"
        
        # Create minimal config if it doesn't exist
        if [ ! -f "$config_dir/config.json" ]; then
            cat > "$config_dir/config.json" << 'EOF'
{
  "provider": "ollama",
  "model": "deepseek-coder",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": true
}
EOF
            if [ "$COLORS_SUPPORTED" = "true" ]; then
                printf "%b" "${GREEN}[SUCCESS]${NC} Created AI assistant configuration\n"
            else
                echo "[SUCCESS] Created AI assistant configuration"
            fi
        fi
        
        # Download latest docs.md for AI context
        if [ -d "$install_dir" ]; then
            cd "$install_dir"
            if command -v curl >/dev/null 2>&1; then
                curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/docs.md -o docs.md 2>/dev/null || true
                if [ -f "docs.md" ]; then
                    if [ "$COLORS_SUPPORTED" = "true" ]; then
                        printf "%b" "${GREEN}[SUCCESS]${NC} Downloaded latest documentation\n"
                    else
                        echo "[SUCCESS] Downloaded latest documentation"
                    fi
                fi
            fi
        fi
        
        # Install Ollama automatically
        echo ""
        if [ "$COLORS_SUPPORTED" = "true" ]; then
            printf "%b" "${CYAN}[INFO]${NC} Installing Ollama for AI assistance...\n"
        else
            echo "[INFO] Installing Ollama for AI assistance..."
        fi
        
        install_ollama_and_model() {
            # Check if Ollama is already installed
            if command -v ollama >/dev/null 2>&1; then
                if [ "$COLORS_SUPPORTED" = "true" ]; then
                    printf "%b" "${GREEN}[SUCCESS]${NC} Ollama is already installed\n"
                else
                    echo "[SUCCESS] Ollama is already installed"
                fi
            else
                # Install Ollama
                if [ "$COLORS_SUPPORTED" = "true" ]; then
                    printf "%b" "${CYAN}[INFO]${NC} Downloading and installing Ollama...\n"
                else
                    echo "[INFO] Downloading and installing Ollama..."
                fi
                
                if curl -fsSL https://ollama.ai/install.sh | sh 2>/dev/null; then
                    if [ "$COLORS_SUPPORTED" = "true" ]; then
                        printf "%b" "${GREEN}[SUCCESS]${NC} Ollama installed successfully\n"
                    else
                        echo "[SUCCESS] Ollama installed successfully"
                    fi
                else
                    if [ "$COLORS_SUPPORTED" = "true" ]; then
                        printf "%b" "${YELLOW}[WARNING]${NC} Ollama installation may need manual steps\n"
                        printf "%b" "Please install from: ${CYAN}https://ollama.ai${NC}\n"
                    else
                        echo "[WARNING] Ollama installation may need manual steps"
                        echo "Please install from: https://ollama.ai"
                    fi
                    return 1
                fi
            fi
            
            # Download DeepSeek model
            if [ "$COLORS_SUPPORTED" = "true" ]; then
                printf "%b" "${CYAN}[INFO]${NC} Downloading AI model (deepseek-coder)...\n"
                printf "%b" "This may take a few minutes depending on your internet speed...\n"
            else
                echo "[INFO] Downloading AI model (deepseek-coder)..."
                echo "This may take a few minutes depending on your internet speed..."
            fi
            
            # Start model download in background
            (ollama pull deepseek-coder >/dev/null 2>&1 && \
             if [ "$COLORS_SUPPORTED" = "true" ]; then \
                 printf "%b" "${GREEN}[SUCCESS]${NC} AI model downloaded successfully\n"; \
             else \
                 echo "[SUCCESS] AI model downloaded successfully"; \
             fi) &
            
            local download_pid=$!
            
            # Show progress indicator
            local dots=""
            for i in {1..10}; do
                if kill -0 $download_pid 2>/dev/null; then
                    dots="$dots."
                    if [ "$COLORS_SUPPORTED" = "true" ]; then
                        printf "%b" "\r${CYAN}[INFO]${NC} Downloading$dots"
                    else
                        printf "\r[INFO] Downloading$dots"
                    fi
                    sleep 3
                else
                    break
                fi
            done
            
            echo ""
            if [ "$COLORS_SUPPORTED" = "true" ]; then
                printf "%b" "${GREEN}[SUCCESS]${NC} AI assistant setup complete!\n"
                printf "%b" "You can now use: ${CYAN}naturecode start${NC} (for AI assistance)\n"
            else
                echo "[SUCCESS] AI assistant setup complete!"
                echo "You can now use: naturecode start (for AI assistance)"
            fi
            
            return 0
        }
        
        # Run Ollama installation
        install_ollama_and_model || {
            if [ "$COLORS_SUPPORTED" = "true" ]; then
                printf "%b" "${YELLOW}[NOTE]${NC} Configure AI model first:\n"
                printf "%b" "        ${CYAN}naturecode model${NC}\n"
            else
                echo "[NOTE] Configure AI model first:"
                echo "        naturecode model"
            fi
        }
    }
    
    # Run AI assistant setup
    if [ -n "$PERMANENT_DIR" ]; then
        setup_ai_assistant "$PERMANENT_DIR"
    fi
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