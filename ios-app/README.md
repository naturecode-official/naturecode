# NatureCode iOS App

iOS 版本的 NatureCode AI 终端助手。

## 🍎 开发要求

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

### 开发者账号

- **Apple Developer Program**: $99/年
- **测试设备**: 至少一台 iOS 设备 (iPhone/iPad)
- **证书**: 开发证书和分发证书

## 🏗️ 项目结构

```
NatureCodeTerminal/
├── NatureCodeTerminal.xcodeproj      # Xcode 项目文件
├── NatureCodeTerminal/               # 主应用目标
│   ├── App/                          # 应用入口
│   │   ├── NatureCodeTerminalApp.swift
│   │   └── AppDelegate.swift
│   ├── Views/                        # 视图层
│   │   ├── TerminalView.swift
│   │   ├── CommandInputView.swift
│   │   ├── OutputView.swift
│   │   └── SettingsView.swift
│   ├── ViewModels/                   # 视图模型层
│   │   ├── TerminalViewModel.swift
│   │   ├── CommandViewModel.swift
│   │   └── SettingsViewModel.swift
│   ├── Models/                       # 数据模型
│   │   ├── Command.swift
│   │   ├── TerminalSession.swift
│   │   └── UserSettings.swift
│   ├── Services/                     # 服务层
│   │   ├── TerminalService.swift
│   │   ├── NetworkService.swift
│   │   ├── FileService.swift
│   │   └── AIService.swift
│   ├── Utilities/                    # 工具类
│   │   ├── Extensions/
│   │   ├── Constants.swift
│   │   └── Logger.swift
│   └── Resources/                    # 资源文件
│       ├── Assets.xcassets
│       ├── LaunchScreen.storyboard
│       └── Info.plist
├── NatureCodeTerminalTests/          # 单元测试
└── NatureCodeTerminalUITests/        # UI 测试
```

## 🚀 功能特性

### 核心功能

1. **终端模拟器**
   - 类 Linux 终端界面
   - 命令历史记录
   - 语法高亮
   - 自动补全

2. **命令执行**
   - 本地命令执行 (有限)
   - 远程命令执行 (通过 API)
   - 文件操作
   - 网络请求

3. **NatureCode 集成**
   - AI 会话管理
   - 多模型支持
   - 代码分析
   - 项目管理

4. **用户界面**
   - SwiftUI 现代界面
   - 深色/浅色模式
   - 手势支持
   - 键盘快捷键

### 技术限制

由于 iOS 沙盒安全限制：

- ❌ 无法直接执行任意 shell 命令
- ❌ 文件系统访问受限
- ❌ 无法安装系统级软件
- ✅ 可以通过 API 调用远程服务
- ✅ 可以访问应用沙盒内文件
- ✅ 可以使用 WebSocket 实时通信

## 🛠️ 构建和运行

### 开发环境设置

```bash
# 1. 安装 Xcode (从 Mac App Store)
# 2. 打开项目
open NatureCodeTerminal.xcodeproj

# 3. 选择开发团队
# 4. 连接 iOS 设备或使用模拟器
# 5. 点击运行 (⌘R)
```

### 构建配置

1. **开发配置**: 用于调试和测试
2. **发布配置**: 用于 App Store 提交
3. **测试配置**: 用于单元测试和 UI 测试

### 代码签名

1. **自动签名**: Xcode 自动管理证书
2. **手动签名**: 高级用户手动配置
3. **团队配置**: 设置开发团队 ID

## 📱 部署流程

### 测试部署

1. **开发设备**: 直接通过 Xcode 安装
2. **TestFlight**: 内部测试和外部测试
3. **Ad Hoc**: 有限设备分发

### 生产部署

1. **App Store Connect**: 创建应用记录
2. **构建上传**: 使用 Xcode 或 Transporter
3. **审核流程**: 1-7 天审核时间
4. **发布管理**: 手动发布或定时发布

## 🔒 安全考虑

### 数据安全

- **钥匙串存储**: 安全存储 API 密钥
- **沙盒限制**: 应用数据隔离
- **网络加密**: 强制 HTTPS
- **权限最小化**: 只请求必要权限

### 代码安全

- **代码混淆**: 发布版本代码保护
- **证书固定**: 防止中间人攻击
- **输入验证**: 防止命令注入
- **错误处理**: 安全错误信息

## 📊 性能优化

### 内存管理

- **ARC 自动管理**: Swift 自动引用计数
- **图片优化**: 适当尺寸和格式
- **缓存策略**: 智能数据缓存
- **懒加载**: 按需加载资源

### 响应优化

- **主线程优化**: 避免阻塞 UI
- **异步处理**: 使用 async/await
- **Combine 流**: 响应式数据流
- **预加载**: 提前加载必要数据

## 🤝 协作开发

### 版本控制

- **Git**: 使用 Git 进行版本控制
- **分支策略**: Git Flow 或 GitHub Flow
- **代码审查**: Pull Request 流程
- **CI/CD**: GitHub Actions 自动化

### 开发规范

- **SwiftLint**: 代码风格检查
- **SwiftFormat**: 代码自动格式化
- **文档生成**: SwiftDoc 或 Jazzy
- **测试覆盖**: 单元测试和 UI 测试

## 🆘 故障排除

### 常见问题

1. **证书问题**: 重新生成证书和描述文件
2. **设备问题**: 重启设备和电脑
3. **网络问题**: 检查代理和防火墙
4. **存储问题**: 清理 DerivedData

### 调试工具

- **Xcode 调试器**: 断点和变量检查
- **控制台日志**: 查看系统日志
- **网络调试**: Charles 或 Proxyman
- **性能分析**: Instruments 工具

## 📚 学习资源

### 官方文档

- [Swift 文档](https://docs.swift.org)
- [SwiftUI 教程](https://developer.apple.com/tutorials/swiftui)
- [iOS 开发指南](https://developer.apple.com/ios)

### 社区资源

- [Swift Forums](https://forums.swift.org)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/swift)
- [Ray Wenderlich](https://www.raywenderlich.com)

### 工具推荐

- [CocoaPods](https://cocoapods.org) - 依赖管理
- [Swift Package Manager](https://swift.org/package-manager) - 官方包管理
- [Fastlane](https://fastlane.tools) - 自动化部署
