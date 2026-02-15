#!/bin/bash

# ============================================
# NatureCode GitHub 推送脚本
# 版本: 1.0.0
# 功能: 将 NatureCode v1.4.5.2 推送到 GitHub
# ============================================

set -e

# 颜色定义
if [ -t 1 ] && command -v tput >/dev/null 2>&1 && tput colors >/dev/null 2>&1; then
    COLORS_SUPPORTED=true
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    BLUE=$(tput setaf 4)
    CYAN=$(tput setaf 6)
    NC=$(tput sgr0)
    BOLD=$(tput bold)
else
    COLORS_SUPPORTED=false
    RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; NC=""; BOLD=""
fi

# 日志函数
log_info() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo -e "${CYAN}[INFO]${NC} $1"
    else
        echo "[INFO] $1"
    fi
}

log_success() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo -e "${GREEN}[SUCCESS]${NC} $1"
    else
        echo "[SUCCESS] $1"
    fi
}

log_error() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo -e "${RED}[ERROR]${NC} $1"
    else
        echo "[ERROR] $1"
    fi
}

log_step() {
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo -e "${BLUE}${BOLD}[STEP]${NC} $1"
    else
        echo "[STEP] $1"
    fi
}

# 显示横幅
show_banner() {
    echo ""
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo -e "${BLUE}${BOLD}"
    fi
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                NatureCode GitHub 推送助手                       ║"
    echo "║                    版本: 1.4.5.2                               ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo -e "${NC}"
    fi
    echo ""
}

# 检查 Git 状态
check_git_status() {
    log_step "检查 Git 状态"
    
    # 检查是否在 Git 仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是 Git 仓库"
        return 1
    fi
    
    # 检查远程仓库配置
    if ! git remote -v | grep -q "naturecode-official/naturecode"; then
        log_error "远程仓库未正确配置"
        echo "当前远程仓库:"
        git remote -v
        return 1
    fi
    
    log_info "Git 仓库状态正常"
    return 0
}

# 显示当前状态
show_current_status() {
    log_step "当前项目状态"
    
    # 显示版本
    if [ -f "package.json" ]; then
        VERSION=$(grep '"version"' package.json | head -1 | awk -F: '{print $2}' | sed 's/[", ]//g')
        log_info "项目版本: $VERSION"
    else
        log_info "项目版本: 未知"
    fi
    
    # 显示分支
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "当前分支: $CURRENT_BRANCH"
    
    # 显示未提交的更改
    CHANGES=$(git status --porcelain | wc -l)
    if [ "$CHANGES" -gt 0 ]; then
        log_info "未提交的更改: $CHANGES 个文件"
        git status --short
    else
        log_info "没有未提交的更改"
    fi
    
    # 显示最近的提交
    log_info "最近的提交:"
    git log --oneline -3
    echo ""
}

# 添加和提交更改
commit_changes() {
    log_step "提交更改"
    
    # 检查是否有更改
    if [ -z "$(git status --porcelain)" ]; then
        log_info "没有需要提交的更改"
        return 0
    fi
    
    # 添加所有文件
    log_info "添加文件到暂存区..."
    git add .
    
    # 提交消息
    COMMIT_MSG="NatureCode v1.4.5.2 - Cross-platform AI assistant with smart installer"
    
    # 提交
    if git commit -m "$COMMIT_MSG"; then
        log_success "提交成功: $COMMIT_MSG"
        return 0
    else
        log_error "提交失败"
        return 1
    fi
}

# 推送到 GitHub
push_to_github() {
    log_step "推送到 GitHub"
    
    echo ""
    log_info "仓库: https://github.com/naturecode-official/naturecode"
    log_info "分支: main"
    echo ""
    
    # 询问认证方式
    echo "请选择认证方式:"
    echo "  1) 使用 Personal Access Token (推荐)"
    echo "  2) 使用 SSH 密钥"
    echo "  3) 使用现有凭据"
    echo ""
    read -p "选择 [1-3] (默认: 1): " AUTH_CHOICE
    
    case "${AUTH_CHOICE:-1}" in
        1)
            push_with_token
            ;;
        2)
            push_with_ssh
            ;;
        3)
            push_with_existing_credentials
            ;;
        *)
            log_error "无效选择"
            return 1
            ;;
    esac
}

# 使用 Token 推送
push_with_token() {
    log_info "使用 Personal Access Token 推送"
    echo ""
    
    # 显示 Token 生成指南
    echo "如果需要生成 Token，请访问:"
    echo "  https://github.com/settings/tokens"
    echo ""
    echo "需要的权限:"
    echo "  ✅ repo (Full control of private repositories)"
    echo "  ✅ workflow (Update GitHub Action workflows)"
    echo ""
    
    read -sp "请输入您的 GitHub Token: " GITHUB_TOKEN
    echo ""
    
    if [ -z "$GITHUB_TOKEN" ]; then
        log_error "Token 不能为空"
        return 1
    fi
    
    # 使用 Token 推送
    log_info "正在推送..."
    GIT_URL="https://naturecode-official:${GITHUB_TOKEN}@github.com/naturecode-official/naturecode.git"
    
    if git push "$GIT_URL" main; then
        log_success "推送成功！"
        return 0
    else
        log_error "推送失败"
        return 1
    fi
}

# 使用 SSH 推送
push_with_ssh() {
    log_info "使用 SSH 密钥推送"
    
    # 检查 SSH 密钥
    if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
        log_error "未找到 SSH 密钥"
        echo "请先生成 SSH 密钥:"
        echo "  ssh-keygen -t ed25519 -C \"your_email@example.com\""
        echo "然后将公钥添加到 GitHub:"
        echo "  https://github.com/settings/keys"
        return 1
    fi
    
    # 检查 SSH 连接
    log_info "测试 SSH 连接..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        log_success "SSH 连接正常"
    else
        log_error "SSH 连接失败"
        echo "请确保:"
        echo "  1. SSH 密钥已生成"
        echo "  2. 公钥已添加到 GitHub"
        echo "  3. SSH 代理正在运行: eval \$(ssh-agent -s)"
        echo "  4. 密钥已添加: ssh-add ~/.ssh/id_ed25519"
        return 1
    fi
    
    # 使用 SSH 推送
    log_info "正在推送..."
    if git push origin main; then
        log_success "推送成功！"
        return 0
    else
        log_error "推送失败"
        return 1
    fi
}

# 使用现有凭据推送
push_with_existing_credentials() {
    log_info "使用现有凭据推送"
    
    # 尝试推送
    log_info "正在推送..."
    if git push origin main; then
        log_success "推送成功！"
        return 0
    else
        log_error "推送失败"
        echo "可能的原因:"
        echo "  1. 认证失败"
        echo "  2. 权限不足"
        echo "  3. 网络问题"
        return 1
    fi
}

# 验证推送结果
verify_push() {
    log_step "验证推送结果"
    
    # 获取最新提交哈希
    LOCAL_COMMIT=$(git rev-parse HEAD)
    log_info "本地最新提交: ${LOCAL_COMMIT:0:8}"
    
    # 获取远程最新提交
    git fetch origin > /dev/null 2>&1 || true
    REMOTE_COMMIT=$(git rev-parse origin/main 2>/dev/null || echo "")
    
    if [ -n "$REMOTE_COMMIT" ] && [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        log_success "推送验证成功！本地和远程代码一致"
        return 0
    else
        log_warning "无法验证远程提交，但推送可能已成功"
        return 0
    fi
}

# 显示安装命令
show_installation_command() {
    log_step "安装命令"
    echo ""
    echo "🎉 NatureCode 已成功推送到 GitHub！"
    echo ""
    echo "📥 用户可以使用以下命令安装:"
    echo ""
    if [ "$COLORS_SUPPORTED" = "true" ]; then
        echo -e "${GREEN}curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash${NC}"
    else
        echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
    fi
    echo ""
    echo "🔗 仓库地址:"
    echo "  https://github.com/naturecode-official/naturecode"
    echo ""
    echo "📋 其他安装方式:"
    echo "  # 智能安装（推荐）"
    echo "  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | bash"
    echo ""
    echo "  # 简单安装"
    echo "  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash"
    echo ""
}

# 主函数
main() {
    show_banner
    
    # 检查 Git
    if ! check_git_status; then
        log_error "Git 状态检查失败，无法继续"
        exit 1
    fi
    
    # 显示当前状态
    show_current_status
    
    # 确认继续
    echo ""
    read -p "是否继续推送？(y/n): " CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    # 提交更改
    if ! commit_changes; then
        log_error "提交失败，无法继续"
        exit 1
    fi
    
    # 推送到 GitHub
    if ! push_to_github; then
        log_error "推送失败"
        exit 1
    fi
    
    # 验证推送
    verify_push
    
    # 显示安装命令
    show_installation_command
    
    log_success "NatureCode v1.4.5.2 已成功部署到 GitHub！"
}

# 异常处理
trap 'log_error "脚本执行中断"; exit 1' INT TERM

# 运行主函数
main "$@"