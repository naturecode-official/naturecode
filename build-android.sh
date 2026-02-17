#!/bin/bash

# NatureCode Android APK 构建脚本
# 版本: 1.0.0

set -e

echo "========================================"
echo "NatureCode Android APK 构建工具"
echo "版本: 1.5.6"
echo "========================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在 NatureCode 项目根目录运行此脚本"
    exit 1
fi

# 检查必要的工具
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "错误: 未找到 $1，请先安装 $1"
        exit 1
    fi
}

echo "检查构建工具..."
check_tool "java"
check_tool "zip"
check_tool "unzip"

# 检查 Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "警告: ANDROID_HOME 环境变量未设置"
    echo "尝试查找 Android SDK..."
    
    # 常见的 Android SDK 位置
    possible_locations=(
        "$HOME/Android/Sdk"
        "$HOME/Library/Android/sdk"
        "/usr/local/android-sdk"
        "/opt/android-sdk"
    )
    
    for location in "${possible_locations[@]}"; do
        if [ -d "$location" ]; then
            export ANDROID_HOME="$location"
            echo "找到 Android SDK: $ANDROID_HOME"
            break
        fi
    done
    
    if [ -z "$ANDROID_HOME" ]; then
        echo "错误: 未找到 Android SDK"
        echo "请安装 Android Studio 或设置 ANDROID_HOME 环境变量"
        exit 1
    fi
fi

echo "Android SDK: $ANDROID_HOME"

# 创建输出目录
OUTPUT_DIR="dist/android"
mkdir -p "$OUTPUT_DIR"

echo "清理旧构建文件..."
cd android-app
./gradlew clean

echo "构建调试版 APK..."
./gradlew assembleDebug

echo "构建发布版 APK..."
./gradlew assembleRelease

echo "复制 APK 文件到输出目录..."
cp app/build/outputs/apk/debug/app-debug.apk "../$OUTPUT_DIR/naturecode-android-debug.apk"
cp app/build/outputs/apk/release/app-release.apk "../$OUTPUT_DIR/naturecode-android-release.apk"

echo "创建安装说明..."
cat > "../$OUTPUT_DIR/INSTALL.md" << 'EOF'
# NatureCode Android 安装指南

## 系统要求
- Android 8.0+ (API 26+)
- 至少 100MB 可用存储空间
- 网络连接（用于 AI 功能）

## 安装方法

### 方法 1: 调试版 (测试用)
1. 在 Android 设备上启用"开发者选项"
2. 启用"USB 调试"和"安装未知来源应用"
3. 将 `naturecode-android-debug.apk` 传输到设备
4. 使用文件管理器打开 APK 文件进行安装

### 方法 2: 发布版 (正式用)
1. 将 `naturecode-android-release.apk` 传输到设备
2. 允许安装未知来源应用
3. 使用文件管理器打开 APK 文件进行安装

## 权限说明
应用需要以下权限：
- 网络访问 (AI 功能)
- 存储访问 (文件操作)
- 安装未知来源应用 (首次安装)

## 使用说明
1. 启动应用后，您将看到终端界面
2. 输入 `naturecode start` 启动 AI 助手
3. 输入 `help` 查看可用命令
4. 支持基本的 Linux 命令：ls, cd, pwd, clear 等

## 故障排除

### 问题 1: 安装失败
- 确保已启用"安装未知来源应用"
- 检查设备存储空间是否充足
- 尝试重新下载 APK 文件

### 问题 2: 应用崩溃
- 确保设备满足系统要求
- 尝试清除应用数据并重新启动
- 检查网络连接

### 问题 3: 命令无法执行
- 某些 Linux 命令在 Android 上可能不可用
- 使用内置的 `help` 命令查看可用命令
- AI 功能需要网络连接

## 支持
如有问题，请访问：
- GitHub: https://github.com/naturecode-official/naturecode
- 文档: https://naturecode.ai/docs
EOF

echo "创建版本信息..."
cat > "../$OUTPUT_DIR/VERSION.md" << EOF
# NatureCode Android 版本信息

## 应用信息
- 应用名称: NatureCode Terminal
- 包名: com.naturecode.terminal
- 版本: 1.5.6
- 版本代码: 1
- 构建时间: $(date)

## 功能特性
1. 完整的终端界面
2. NatureCode AI 助手集成
3. 基本的 Linux 命令支持
4. 文件系统访问
5. 网络连接支持

## 构建信息
- 构建工具: Gradle 8.0
- 目标 SDK: 34
- 最低 SDK: 26
- 构建类型: Debug & Release

## 文件列表
- naturecode-android-debug.apk (调试版)
- naturecode-android-release.apk (发布版)
- INSTALL.md (安装指南)
- VERSION.md (版本信息)
EOF

echo "计算文件哈希..."
cd "../$OUTPUT_DIR"
md5sum *.apk > MD5SUMS
sha256sum *.apk > SHA256SUMS

echo "创建压缩包..."
zip -r "naturecode-android-v1.5.6.zip" ./*

cd ../..

echo "========================================"
echo "构建完成！"
echo "输出目录: $OUTPUT_DIR"
echo "生成的文件:"
ls -la "$OUTPUT_DIR/"
echo "========================================"

echo "APK 文件已准备好："
echo "1. 调试版: $OUTPUT_DIR/naturecode-android-debug.apk"
echo "2. 发布版: $OUTPUT_DIR/naturecode-android-release.apk"
echo "3. 压缩包: $OUTPUT_DIR/naturecode-android-v1.5.6.zip"
echo ""
echo "请查看 $OUTPUT_DIR/INSTALL.md 获取安装说明"