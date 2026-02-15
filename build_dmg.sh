#!/bin/bash

# NatureCode DMG 构建脚本
# 创建 macOS 安装包

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "需要 $1 但未安装"
        return 1
    fi
    return 0
}

# 显示横幅
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                NatureCode DMG 构建工具                   ║"
    echo "║                 版本 1.0.0 - macOS                      ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "此脚本只能在 macOS 上运行"
        exit 1
    fi
    
    # 检查必要工具
    REQUIRED_TOOLS=("hdiutil" "create-dmg" "node" "npm")
    for tool in "${REQUIRED_TOOLS[@]}"; do
        if ! check_command "$tool"; then
            if [[ "$tool" == "create-dmg" ]]; then
                log_info "安装 create-dmg..."
                brew install create-dmg || {
                    log_error "无法安装 create-dmg，请手动安装: brew install create-dmg"
                    exit 1
                }
            else
                exit 1
            fi
        fi
    done
    
    # 检查 Node.js 版本
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE="16.0.0"
    if [[ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]]; then
        log_error "需要 Node.js $REQUIRED_NODE 或更高版本"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# 清理构建目录
clean_build_dir() {
    log_info "清理构建目录..."
    
    BUILD_DIR="build"
    DMG_DIR="dmg"
    
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
    fi
    
    if [[ -d "$DMG_DIR" ]]; then
        rm -rf "$DMG_DIR"
    fi
    
    mkdir -p "$BUILD_DIR"
    mkdir -p "$DMG_DIR"
    
    log_success "构建目录已清理"
}

# 构建应用程序
build_application() {
    log_info "构建 NatureCode 应用程序..."
    
    BUILD_DIR="build"
    APP_NAME="NatureCode"
    APP_DIR="$BUILD_DIR/$APP_NAME.app"
    
    # 创建应用程序目录结构
    mkdir -p "$APP_DIR/Contents/MacOS"
    mkdir -p "$APP_DIR/Contents/Resources"
    
    # 创建 Info.plist
    cat > "$APP_DIR/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>NatureCode</string>
    <key>CFBundleDisplayName</key>
    <string>NatureCode</string>
    <key>CFBundleIdentifier</key>
    <string>com.naturecode.app</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleExecutable</key>
    <string>naturecode</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2024 NatureCode. All rights reserved.</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
EOF
    
    # 创建启动脚本
    cat > "$APP_DIR/Contents/MacOS/naturecode" << 'EOF'
#!/bin/bash

# NatureCode macOS 启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
RESOURCES_DIR="$APP_DIR/Contents/Resources"

# 设置环境变量
export NATURECODE_APP_DIR="$RESOURCES_DIR"
export PATH="$RESOURCES_DIR/bin:$PATH"

# 检查是否第一次运行
FIRST_RUN_FILE="$HOME/.naturecode/first_run"
if [[ ! -f "$FIRST_RUN_FILE" ]]; then
    echo "欢迎使用 NatureCode!"
    echo "正在准备第一次运行..."
    
    # 创建必要的目录
    mkdir -p "$HOME/.naturecode"
    
    # 标记已运行
    touch "$FIRST_RUN_FILE"
fi

# 运行 NatureCode
exec "$RESOURCES_DIR/bin/naturecode" "$@"
EOF
    
    chmod +x "$APP_DIR/Contents/MacOS/naturecode"
    
    log_success "应用程序结构创建完成"
}

# 复制程序文件
copy_program_files() {
    log_info "复制程序文件..."
    
    BUILD_DIR="build"
    APP_NAME="NatureCode"
    APP_DIR="$BUILD_DIR/$APP_NAME.app"
    RESOURCES_DIR="$APP_DIR/Contents/Resources"
    
    # 创建资源目录结构
    mkdir -p "$RESOURCES_DIR/bin"
    mkdir -p "$RESOURCES_DIR/lib"
    mkdir -p "$RESOURCES_DIR/share"
    
    # 安装依赖到资源目录
    log_info "安装依赖..."
    cp package.json "$RESOURCES_DIR/"
    cd "$RESOURCES_DIR"
    npm install --production --no-audit --no-fund --no-package-lock
    cd - > /dev/null
    
    # 复制源代码
    log_info "复制源代码..."
    cp -r src/ "$RESOURCES_DIR/src/"
    
    # 创建可执行文件
    log_info "创建可执行文件..."
    cat > "$RESOURCES_DIR/bin/naturecode" << 'EOF'
#!/bin/bash

# NatureCode 可执行文件
RESOURCES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_PATH="$RESOURCES_DIR/node_modules"
export NODE_PATH

exec node "$RESOURCES_DIR/src/cli/index.js" "$@"
EOF
    
    chmod +x "$RESOURCES_DIR/bin/naturecode"
    
    # 复制文档文件
    log_info "复制文档..."
    cp README.md "$RESOURCES_DIR/"
    cp INSTALL.md "$RESOURCES_DIR/" 2>/dev/null || true
    cp AGENTS.md "$RESOURCES_DIR/"
    cp .env.example "$RESOURCES_DIR/"
    
    log_success "程序文件复制完成"
}

# 创建安装器包
create_installer_pkg() {
    log_info "创建安装器包..."
    
    BUILD_DIR="build"
    APP_NAME="NatureCode"
    APP_DIR="$BUILD_DIR/$APP_NAME.app"
    PKG_DIR="$BUILD_DIR/pkg"
    
    mkdir -p "$PKG_DIR"
    
    # 创建分发脚本
    cat > "$PKG_DIR/distribution.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="1">
    <title>NatureCode</title>
    <background file="background.png" alignment="bottomleft" scaling="none"/>
    <welcome file="welcome.html"/>
    <license file="license.txt"/>
    <choices-outline>
        <line choice="default">
            <line choice="naturecode"/>
        </line>
    </choices-outline>
    <choice id="default"/>
    <choice id="naturecode" title="NatureCode" description="安装 NatureCode 终端AI助手">
        <pkg-ref id="com.naturecode.app"/>
    </choice>
    <pkg-ref id="com.naturecode.app" version="1.0.0" onConclusion="none">NatureCode.pkg</pkg-ref>
</installer-gui-script>
EOF
    
    # 创建欢迎页面
    cat > "$PKG_DIR/welcome.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>欢迎安装 NatureCode</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; }
        h1 { color: #333; }
        p { color: #666; line-height: 1.6; }
        .feature { margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>欢迎安装 NatureCode</h1>
    <p>跨平台终端AI助手</p>
    
    <div class="feature">
        <strong>🚀 主要特性：</strong>
        <ul>
            <li>支持多种AI提供商（DeepSeek、OpenAI等）</li>
            <li>交互式终端界面</li>
            <li>流式响应和代码高亮</li>
            <li>易于配置和使用</li>
        </ul>
    </div>
    
    <p>安装完成后，你可以在终端中使用 <code>naturecode</code> 命令。</p>
</body>
</html>
EOF
    
    # 创建许可证文件
    cat > "$PKG_DIR/license.txt" << EOF
NatureCode 终端AI助手
版本 1.0.0

MIT 许可证

版权所有 (c) 2024 NatureCode

特此免费授予任何获得本软件副本和相关文档文件（以下简称"软件"）的人士不受限制地处理本软件的权限，包括但不限于使用、复制、修改、合并、发布、分发、再许可和/或销售本软件的副本，并允许接受本软件的人士这样做，但须符合以下条件：

上述版权声明和本许可声明应包含在本软件的所有副本或重要部分中。

本软件按"原样"提供，不附带任何明示或暗示的保证，包括但不限于对适销性、特定用途适用性和非侵权性的保证。在任何情况下，作者或版权持有人均不对因本软件或本软件的使用或其他交易而产生、引起或与之相关的任何索赔、损害或其他责任负责，无论是在合同诉讼、侵权诉讼还是其他诉讼中。
EOF
    
    log_success "安装器包创建完成"
}

# 创建 DMG 文件
create_dmg() {
    log_info "创建 DMG 文件..."
    
    BUILD_DIR="build"
    DMG_DIR="dmg"
    APP_NAME="NatureCode"
    APP_DIR="$BUILD_DIR/$APP_NAME.app"
    DMG_NAME="NatureCode-1.0.0-macos.dmg"
    
    # 使用 create-dmg 创建 DMG
    create-dmg \
        --volname "NatureCode" \
        --volicon ".dmg_icon.icns" 2>/dev/null || true \
        --background ".dmg_background.png" 2>/dev/null || true \
        --window-pos 200 120 \
        --window-size 800 400 \
        --icon-size 100 \
        --icon "$APP_NAME.app" 200 190 \
        --hide-extension "$APP_NAME.app" \
        --app-drop-link 600 185 \
        --no-internet-enable \
        "$DMG_DIR/$DMG_NAME" \
        "$APP_DIR"
    
    if [[ $? -eq 0 ]]; then
        log_success "DMG 文件创建成功: $DMG_DIR/$DMG_NAME"
        
        # 显示 DMG 信息
        DMG_SIZE=$(du -h "$DMG_DIR/$DMG_NAME" | cut -f1)
        log_info "DMG 文件大小: $DMG_SIZE"
    else
        log_error "创建 DMG 文件失败"
        log_info "尝试使用 hdiutil 创建 DMG..."
        
        # 备选方案：使用 hdiutil
        hdiutil create \
            -volname "NatureCode" \
            -srcfolder "$APP_DIR" \
            -ov \
            -format UDZO \
            "$DMG_DIR/NatureCode-1.0.0-macos-alternative.dmg"
        
        if [[ $? -eq 0 ]]; then
            log_success "备选 DMG 文件创建成功"
        else
            log_error "所有 DMG 创建方法都失败了"
            exit 1
        fi
    fi
}

# 创建简易安装脚本
create_simple_installer() {
    log_info "创建简易安装脚本..."
    
    DMG_DIR="dmg"
    
    # 创建安装脚本
    cat > "$DMG_DIR/install.command" << 'EOF'
#!/bin/bash

# NatureCode 简易安装脚本

echo "NatureCode 安装程序"
echo "=================="
echo ""

# 检查是否从 DMG 运行
if [[ "$(dirname "$0")" == "/Volumes/NatureCode" ]]; then
    echo "检测到从 DMG 运行"
    DMG_MOUNT="/Volumes/NatureCode"
else
    echo "请将 NatureCode.app 拖拽到 Applications 文件夹"
    echo "或在终端中运行: sudo cp -R NatureCode.app /Applications/"
    open .
    exit 0
fi

# 安装到应用程序目录
read -p "安装 NatureCode 到 /Applications? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在安装..."
    sudo cp -R "$DMG_MOUNT/NatureCode.app" /Applications/
    
    if [[ $? -eq 0 ]]; then
        echo "✅ 安装成功！"
        echo ""
        echo "使用方法:"
        echo "1. 打开终端"
        echo "2. 输入: naturecode model"
        echo "3. 按照向导配置 API 密钥"
        echo "4. 输入: naturecode start 开始使用"
    else
        echo "❌ 安装失败"
        exit 1
    fi
else
    echo "安装取消"
fi

# 保持窗口打开
read -p "按 Enter 键退出..." -n 1 -r
EOF
    
    chmod +x "$DMG_DIR/install.command"
    
    log_success "简易安装脚本创建完成"
}

# 主函数
main() {
    show_banner
    
    # 检查参数
    if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
        echo "使用方法: $0 [选项]"
        echo "选项:"
        echo "  -h, --help     显示帮助信息"
        echo "  -c, --clean    清理构建目录"
        echo "  无参数         构建 DMG 文件"
        exit 0
    fi
    
    if [[ "$1" == "--clean" ]] || [[ "$1" == "-c" ]]; then
        log_info "清理构建目录..."
        rm -rf build dmg 2>/dev/null || true
        log_success "清理完成"
        exit 0
    fi
    
    # 执行构建步骤
    check_requirements
    clean_build_dir
    build_application
    copy_program_files
    create_installer_pkg
    create_dmg
    create_simple_installer
    
    echo -e "\n${GREEN}🎉 DMG 构建完成！${NC}"
    echo -e "${YELLOW}生成的 DMG 文件在: dmg/ 目录${NC}"
    echo -e "\n${BLUE}下一步:${NC}"
    echo "  1. 打开 dmg/NatureCode-1.0.0-macos.dmg"
    echo "  2. 将 NatureCode.app 拖拽到 Applications 文件夹"
    echo "  3. 或在终端中运行安装脚本"
}

# 运行主函数
main "$@"