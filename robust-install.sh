#!/bin/bash

# NatureCode 稳定安装脚本
# 包含多种下载方法和错误处理

set -e

echo "NatureCode 稳定安装脚本"
echo "========================"

# 函数：尝试不同的下载方法
download_installer() {
    local url="https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh"
    
    echo "尝试下载安装脚本..."
    
    # 方法1：使用 curl（标准）
    if command -v curl &> /dev/null; then
        echo "尝试方法1: curl (标准)..."
        if curl -fsSL "$url" -o /tmp/naturecode-install.sh 2>/dev/null; then
            echo "✅ 使用 curl 下载成功"
            chmod +x /tmp/naturecode-install.sh
            return 0
        fi
        
        echo "尝试方法2: curl (禁用SSL验证)..."
        if curl -kfsSL "$url" -o /tmp/naturecode-install.sh 2>/dev/null; then
            echo "✅ 使用 curl -k 下载成功"
            chmod +x /tmp/naturecode-install.sh
            return 0
        fi
    fi
    
    # 方法2：使用 wget
    if command -v wget &> /dev/null; then
        echo "尝试方法3: wget..."
        if wget -q "$url" -O /tmp/naturecode-install.sh 2>/dev/null; then
            echo "✅ 使用 wget 下载成功"
            chmod +x /tmp/naturecode-install.sh
            return 0
        fi
    fi
    
    # 方法3：使用 Python
    if command -v python3 &> /dev/null; then
        echo "尝试方法4: Python..."
        python3 -c "
import urllib.request
try:
    urllib.request.urlretrieve('$url', '/tmp/naturecode-install.sh')
    print('✅ 使用 Python 下载成功')
    import os
    os.chmod('/tmp/naturecode-install.sh', 0o755)
    exit(0)
except:
    exit(1)
" && return 0
    fi
    
    echo "❌ 所有下载方法都失败了"
    return 1
}

# 主安装流程
main() {
    # 尝试下载
    if ! download_installer; then
        echo ""
        echo "无法下载安装脚本。请尝试："
        echo "1. 检查网络连接"
        echo "2. 手动下载: https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh"
        echo "3. 使用本地安装: cd /Users/jay5/Desktop/naturecode && ./local-install.sh"
        exit 1
    fi
    
    echo ""
    echo "开始安装 NatureCode..."
    bash /tmp/naturecode-install.sh
    
    # 清理
    rm -f /tmp/naturecode-install.sh
}

# 运行主函数
main "$@"