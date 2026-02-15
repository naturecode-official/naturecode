#!/bin/bash

# NatureCode v1.4.0 本地快捷安装脚本
# 从当前文件夹快速安装，适合开发者使用

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示标题
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          NatureCode v1.4.0 本地快捷安装脚本             ║"
echo "║                从当前文件夹快速安装                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# 函数：打印消息
print_info() {
    echo -e "${BLUE}[信息]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 检查命令是否存在
check_command() {
    command -v "$1" >/dev/null 2>&1
}

# 步骤1：检查环境
print_info "步骤1: 检查系统环境..."

# 检查Node.js
if ! check_command node; then
    print_error "Node.js 未安装"
    echo "请先安装 Node.js (版本 16.0.0 或更高)"
    echo "访问: https://nodejs.org/"
    echo "或使用 Homebrew: brew install node"
    exit 1
fi

# 检查npm
if ! check_command npm; then
    print_error "npm 未安装"
    echo "npm 应该随 Node.js 一起安装"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 16 ]; then
    print_error "Node.js 版本过低 (当前: $NODE_VERSION, 需要: 16.0.0+)"
    exit 1
fi

print_success "✓ Node.js 版本: $NODE_VERSION"
print_success "✓ npm 版本: $(npm --version)"

# 步骤2：检查当前目录
print_info "步骤2: 检查安装文件..."

if [ ! -f "package.json" ]; then
    print_error "未找到 package.json 文件"
    echo "请确保在 NatureCode 项目目录中运行此脚本"
    exit 1
fi

# 检查版本
VERSION="1.4.0"
if [ -f "VERSION" ]; then
    VERSION=$(cat VERSION)
elif grep -q '"version"' package.json; then
    VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
fi

print_success "✓ 安装版本: $VERSION"

# 步骤3：安装依赖
print_info "步骤3: 安装依赖包..."

if [ -f "package-lock.json" ]; then
    print_info "使用 package-lock.json 安装依赖..."
    npm ci --silent
else
    print_info "安装依赖..."
    npm install --silent
fi

if [ $? -eq 0 ]; then
    print_success "✓ 依赖安装完成"
else
    print_error "依赖安装失败"
    exit 1
fi

# 步骤4：创建全局链接
print_info "步骤4: 创建全局链接..."

# 检查是否已安装
if check_command naturecode; then
    INSTALLED_VERSION=$(naturecode --version 2>/dev/null || echo "未知")
    print_warning "NatureCode 已安装 (版本: $INSTALLED_VERSION)"
    read -p "是否重新安装？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "安装取消"
        exit 0
    fi
fi

# 创建npm链接
print_info "创建 npm 链接..."
if npm link; then
    print_success "✓ NatureCode 已全局链接"
else
    print_warning "npm 链接失败，尝试手动创建符号链接..."
    
    # 尝试创建符号链接
    SCRIPT_PATH="$(pwd)/src/cli/index.js"
    if [ ! -f "$SCRIPT_PATH" ]; then
        print_error "未找到 CLI 入口文件: $SCRIPT_PATH"
        exit 1
    fi
    
    # 尝试链接到 /usr/local/bin
    if [ -w "/usr/local/bin" ]; then
        ln -sf "$SCRIPT_PATH" /usr/local/bin/naturecode
        chmod +x /usr/local/bin/naturecode
        print_success "✓ 已创建符号链接到 /usr/local/bin/naturecode"
    else
        print_warning "需要 sudo 权限创建系统链接"
        sudo ln -sf "$SCRIPT_PATH" /usr/local/bin/naturecode
        sudo chmod +x /usr/local/bin/naturecode
        print_success "✓ 已使用 sudo 创建符号链接"
    fi
fi

# 步骤5：创建配置文件
print_info "步骤5: 设置配置文件..."

CONFIG_DIR="$HOME/.naturecode"
CONFIG_FILE="$CONFIG_DIR/config.json"

if [ ! -d "$CONFIG_DIR" ]; then
    mkdir -p "$CONFIG_DIR"
    print_success "✓ 创建配置目录: $CONFIG_DIR"
fi

if [ ! -f "$CONFIG_FILE" ]; then
    # 创建默认配置文件
    cat > "$CONFIG_FILE" << EOF
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": true
}
EOF
    print_success "✓ 创建默认配置文件"
    print_warning "⚠ 请编辑 $CONFIG_FILE 添加你的 API 密钥"
else
    print_info "✓ 配置文件已存在: $CONFIG_FILE"
fi

# 复制示例环境文件
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "✓ 创建 .env 文件（请编辑添加 API 密钥）"
fi

# 步骤6：验证安装
print_info "步骤6: 验证安装..."

if check_command naturecode; then
    INSTALLED_VERSION=$(naturecode --version 2>/dev/null || echo "未知")
    print_success "✓ NatureCode 安装成功"
    print_success "✓ 版本: $INSTALLED_VERSION"
    
    # 测试基本功能
    print_info "测试基本功能..."
    if naturecode --help >/dev/null 2>&1; then
        print_success "✓ 基本功能正常"
    else
        print_warning "⚠ 基本功能测试失败，但安装可能仍然成功"
    fi
else
    print_warning "naturecode 命令未在 PATH 中找到"
    print_info "你可以使用以下方式运行:"
    echo "  node $(pwd)/src/cli/index.js"
    echo "  或添加当前目录到 PATH 环境变量"
fi

# 显示完成信息
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}      NatureCode 安装完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "版本: $VERSION"
echo "安装位置: $(pwd)"
echo ""
echo -e "${BLUE}接下来你可以：${NC}"
echo ""
echo "1. 配置 API 密钥："
echo "   运行: naturecode model"
echo "   或编辑: $CONFIG_FILE"
echo ""
echo "2. 启动 NatureCode："
echo "   naturecode start"
echo ""
echo "3. 探索新功能："
echo "   naturecode session create \"我的项目\""
echo "   naturecode plugin list"
echo "   naturecode git status"
echo ""
echo "4. 查看帮助："
echo "   naturecode --help"
echo "   naturecode session --help"
echo "   naturecode plugin --help"
echo ""
echo -e "${YELLOW}快速开始：${NC}"
echo "  1. naturecode model          # 配置API"
echo "  2. naturecode start          # 开始聊天"
echo "  3. naturecode session list   # 查看会话"
echo ""
echo -e "${GREEN}感谢使用 NatureCode！${NC}"
echo ""

# 检查是否需要配置API密钥
if [ -f "$CONFIG_FILE" ] && ! grep -q '"apiKey"' "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${YELLOW}重要：你还没有配置 API 密钥！${NC}"
    echo "运行以下命令进行配置："
    echo "  naturecode model"
    echo "或编辑文件：$CONFIG_FILE"
    echo ""
fi