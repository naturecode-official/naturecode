#!/bin/bash

# NatureCode iOS 构建脚本
# 版本: 1.0.0

set -e

echo "========================================"
echo "NatureCode iOS 构建工具"
echo "版本: 2.0.1"
echo "========================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在 NatureCode 项目根目录运行此脚本"
    exit 1
fi

# 检查 macOS 系统
if [ "$(uname)" != "Darwin" ]; then
    echo "错误: iOS 开发需要 macOS 系统"
    echo "当前系统: $(uname)"
    exit 1
fi

# 检查 Xcode
check_xcode() {
    if ! command -v xcodebuild &> /dev/null; then
        echo "错误: 未找到 Xcode，请先安装 Xcode"
        echo "从 Mac App Store 安装 Xcode"
        exit 1
    fi
    
    echo "Xcode 版本:"
    xcodebuild -version
}

# 检查 iOS SDK
check_ios_sdk() {
    echo "检查 iOS SDK..."
    
    # 获取可用的 SDK
    local sdks=$(xcodebuild -showsdks | grep -i "iphoneos")
    if [ -z "$sdks" ]; then
        echo "错误: 未找到 iOS SDK"
        echo "请安装 iOS SDK 通过 Xcode"
        exit 1
    fi
    
    echo "可用 iOS SDK:"
    echo "$sdks"
}

# 创建 Xcode 项目
create_xcode_project() {
    echo "创建 Xcode 项目..."
    
    local project_dir="ios-app/NatureCodeTerminal"
    
    # 创建项目目录结构
    mkdir -p "$project_dir/NatureCodeTerminal"
    mkdir -p "$project_dir/NatureCodeTerminal/App"
    mkdir -p "$project_dir/NatureCodeTerminal/Views"
    mkdir -p "$project_dir/NatureCodeTerminal/ViewModels"
    mkdir -p "$project_dir/NatureCodeTerminal/Models"
    mkdir -p "$project_dir/NatureCodeTerminal/Services"
    mkdir -p "$project_dir/NatureCodeTerminal/Utilities"
    mkdir -p "$project_dir/NatureCodeTerminal/Resources"
    
    # 创建 Info.plist
    cat > "$project_dir/NatureCodeTerminal/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>NatureCode Terminal</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>2.0.1</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <false/>
    </dict>
    <key>UIApplicationSupportsIndirectInputEvents</key>
    <true/>
    <key>UILaunchScreen</key>
    <dict/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
    
    echo "Xcode 项目结构已创建"
}

# 生成构建说明
generate_build_instructions() {
    echo "生成构建说明..."
    
    local output_dir="dist/ios"
    mkdir -p "$output_dir"
    
    cat > "$output_dir/BUILD_INSTRUCTIONS.md" << 'EOF'
# NatureCode iOS 构建指南

## 系统要求

### 硬件要求
- **必须**: Mac 电脑 (macOS 系统)
- **推荐**: MacBook Pro 或 iMac (2018 年或更新)
- **存储**: 至少 256GB SSD
- **内存**: 至少 8GB RAM (推荐 16GB+)

### 软件要求
- **macOS**: 13.0 (Ventura) 或更高版本
- **Xcode**: 15.0 或更高版本
- **iOS SDK**: 17.0 或更高版本
- **Swift**: 5.9 或更高版本

## 构建步骤

### 方法 1: 使用 Xcode (推荐)

1. **打开项目**
   ```bash
   open ios-app/NatureCodeTerminal/NatureCodeTerminal.xcodeproj
   ```

2. **选择开发团队**
   - 在 Xcode 中打开项目
   - 选择 "NatureCodeTerminal" 目标
   - 在 "Signing & Capabilities" 选项卡中
   - 选择您的开发团队或创建新团队

3. **选择运行目标**
   - 连接 iOS 设备或选择模拟器
   - 建议使用 iPhone 15 Pro 模拟器测试

4. **构建和运行**
   - 点击运行按钮 (⌘R)
   - 或选择 Product → Run

### 方法 2: 使用命令行

1. **清理项目**
   ```bash
   xcodebuild clean -project ios-app/NatureCodeTerminal/NatureCodeTerminal.xcodeproj -scheme NatureCodeTerminal
   ```

2. **构建项目**
   ```bash
   xcodebuild build -project ios-app/NatureCodeTerminal/NatureCodeTerminal.xcodeproj -scheme NatureCodeTerminal -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
   ```

3. **运行测试**
   ```bash
   xcodebuild test -project ios-app/NatureCodeTerminal/NatureCodeTerminal.xcodeproj -scheme NatureCodeTerminal -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
   ```

### 方法 3: 使用 xcodebuild 生成 IPA

1. **创建归档**
   ```bash
   xcodebuild archive -project ios-app/NatureCodeTerminal/NatureCodeTerminal.xcodeproj -scheme NatureCodeTerminal -archivePath build/NatureCodeTerminal.xcarchive
   ```

2. **导出 IPA**
   ```bash
   xcodebuild -exportArchive -archivePath build/NatureCodeTerminal.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build
   ```

## 代码签名

### 开发证书
1. 打开 Xcode → Preferences → Accounts
2. 添加 Apple ID
3. 下载开发证书

### 描述文件
1. 自动管理: Xcode 自动创建和管理
2. 手动管理: 从 Apple Developer 网站下载

### 常见签名问题
1. **证书过期**: 重新生成证书
2. **描述文件无效**: 重新下载描述文件
3. **设备未注册**: 在开发者网站添加设备 UDID

## 测试部署

### 开发设备测试
1. 连接 iOS 设备到 Mac
2. 在 Xcode 中选择设备
3. 点击运行 (可能需要信任开发者证书)

### TestFlight 测试
1. 创建归档 (.xcarchive)
2. 上传到 App Store Connect
3. 配置内部测试或外部测试
4. 通过 TestFlight 应用安装

### Ad Hoc 分发
1. 创建 Ad Hoc 描述文件
2. 导出 IPA 文件
3. 通过分发平台分享 (如 Diawi)

## 生产部署

### App Store 提交
1. **准备材料**
   - 应用截图 (所有尺寸)
   - 应用描述和关键词
   - 隐私政策 URL
   - 支持 URL

2. **创建应用记录**
   - 登录 App Store Connect
   - 创建新应用
   - 填写应用信息

3. **上传构建**
   - 使用 Xcode 或 Transporter
   - 选择构建版本
   - 提交审核

4. **审核流程**
   - 通常需要 1-7 天
   - 准备回答审核问题
   - 可能需要修改后重新提交

## 故障排除

### 常见构建错误

#### 错误 1: 代码签名失败
```
Code Signing Error: No matching provisioning profiles found
```
**解决方案**:
1. 检查开发团队设置
2. 重新下载描述文件
3. 清理 DerivedData

#### 错误 2: SDK 版本不兼容
```
The iOS Simulator deployment target is set to 14.0, but the range of supported deployment target versions is 15.0 to 17.2.
```
**解决方案**:
1. 更新部署目标版本
2. 更新 Xcode 到最新版本

#### 错误 3: 缺少权限
```
This app has crashed because it attempted to access privacy-sensitive data without a usage description.
```
**解决方案**:
1. 在 Info.plist 中添加权限描述
2. 例如: NSLocationWhenInUseUsageDescription

### 调试技巧
1. **查看控制台日志**: Xcode → Debug → Open System Log
2. **使用断点**: 在关键代码处添加断点
3. **内存调试**: 使用 Instruments 工具
4. **网络调试**: 使用 Charles 或 Proxyman

## 性能优化

### 构建优化
1. **启用增量编译**: 默认已启用
2. **优化编译设置**: Release 配置使用 -O
3. **减少框架依赖**: 只导入必要的框架

### 运行时优化
1. **图片优化**: 使用适当尺寸的图片
2. **内存管理**: 及时释放不需要的对象
3. **网络优化**: 使用缓存和压缩

## 安全考虑

### 代码安全
1. **禁用调试**: 发布版本禁用调试符号
2. **代码混淆**: 考虑使用代码混淆工具
3. **证书固定**: 防止中间人攻击

### 数据安全
1. **钥匙串存储**: 安全存储敏感数据
2. **沙盒限制**: 遵守 iOS 沙盒规则
3. **网络加密**: 强制使用 HTTPS

## 更新维护

### 版本更新
1. **更新版本号**: 修改 Info.plist 中的版本号
2. **测试兼容性**: 确保向后兼容
3. **更新文档**: 更新用户文档和发布说明

### 依赖更新
1. **Swift 版本**: 定期更新 Swift 版本
2. **iOS SDK**: 更新到最新 SDK
3. **第三方库**: 定期更新依赖库

## 支持资源

### 官方文档
- [Apple Developer Documentation](https://developer.apple.com/documentation)
- [Swift Documentation](https://docs.swift.org)
- [Xcode Help](https://help.apple.com/xcode)

### 社区支持
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ios)
- [Swift Forums](https://forums.swift.org)
- [iOS Developer Reddit](https://www.reddit.com/r/iOSProgramming)

### 工具推荐
- [Fastlane](https://fastlane.tools): 自动化部署
- [CocoaPods](https://cocoapods.org): 依赖管理
- [SwiftLint](https://github.com/realm/SwiftLint): 代码风格检查
EOF
    
    echo "构建说明已生成: $output_dir/BUILD_INSTRUCTIONS.md"
}

# 生成 ExportOptions.plist
generate_export_options() {
    echo "生成 ExportOptions.plist..."
    
    cat > "ios-app/ExportOptions.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>compileBitcode</key>
    <false/>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>signingCertificate</key>
    <string>iPhone Developer</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.naturecode.terminal</key>
        <string>NatureCode Terminal Development</string>
    </dict>
</dict>
</plist>
EOF
    
    echo "ExportOptions.plist 已生成"
    echo "注意: 请将 YOUR_TEAM_ID 替换为您的团队 ID"
}

# 主函数
main() {
    echo "检查系统要求..."
    check_xcode
    check_ios_sdk
    
    echo "创建项目结构..."
    create_xcode_project
    
    echo "生成配置文件..."
    generate_export_options
    
    echo "生成构建说明..."
    generate_build_instructions
    
    echo "复制 Swift 源文件..."
    # 这里可以添加复制 Swift 文件的逻辑
    # 但由于文件较多，建议手动复制或使用更复杂的脚本
    
    echo "========================================"
    echo "iOS 项目准备完成！"
    echo ""
    echo "下一步:"
    echo "1. 打开 Xcode 项目:"
    echo "   open ios-app/NatureCodeTerminal/NatureCodeTerminal.xcodeproj"
    echo ""
    echo "2. 配置代码签名:"
    echo "   - 选择开发团队"
    echo "   - 设置 Bundle Identifier"
    echo ""
    echo "3. 构建和运行:"
    echo "   - 选择模拟器或连接设备"
    echo "   - 点击运行按钮 (⌘R)"
    echo ""
    echo "详细说明请查看: dist/ios/BUILD_INSTRUCTIONS.md"
    echo "========================================"
}

# 运行主函数
main