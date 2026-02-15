#!/bin/bash
# NatureCode 低资源模式配置脚本

echo "🔧 配置 NatureCode 低资源模式..."

# 创建低资源配置
CONFIG_DIR="$HOME/.naturecode"
CONFIG_FILE="$CONFIG_DIR/config.json"

# 备份现有配置
if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%s)"
  echo "📁 已备份现有配置"
fi

# 创建低资源配置
cat > "$CONFIG_FILE" << 'EOF'
{
  "provider": "none",
  "model": "none",
  "modelType": "none",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": false,
  "lowResourceMode": true
}
EOF

echo "✅ 低资源模式已启用"
echo ""
echo "📋 当前配置:"
cat "$CONFIG_FILE"
echo ""
echo "💡 使用说明:"
echo "1. NatureCode 将使用文档帮助模式（无需AI）"
echo "2. 所有基础功能仍然可用："
echo "   - naturecode help --simple    # 简单帮助"
echo "   - naturecode help --docs      # 完整文档"
echo "   - naturecode config           # 查看配置"
echo "   - naturecode -v               # 版本信息"
echo ""
echo "🔄 恢复AI功能:"
echo "1. 安装轻量模型: ollama pull tinyllama"
echo "2. 重新配置: naturecode model"
echo "3. 或使用在线API: naturecode model (选择DeepSeek)"