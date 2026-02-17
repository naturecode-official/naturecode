# NatureCode iOS 开发指南

## 🍎 iOS 开发概述

### 与 Android 开发的主要区别

| 方面         | iOS (Swift/SwiftUI)  | Android (Kotlin/Java)   |
| ------------ | -------------------- | ----------------------- |
| **开发语言** | Swift (现代、安全)   | Kotlin/Java             |
| **UI 框架**  | SwiftUI (声明式)     | Jetpack Compose/XML     |
| **开发工具** | Xcode (仅 macOS)     | Android Studio (跨平台) |
| **应用分发** | App Store (严格审核) | 多种渠道                |
| **设备兼容** | 有限型号，高度统一   | 海量设备，碎片化严重    |
| **系统权限** | 沙盒严格，权限有限   | 权限更灵活              |
| **开发成本** | 需要 Mac 电脑        | 任何电脑都可以          |
| **审核时间** | 1-7 天               | 几小时到几天            |

## 🛠️ 开发环境设置

### 硬件要求

- **必须**: Mac 电脑 (Intel 或 Apple Silicon)
- **推荐配置**:
  - MacBook Pro (M1/M2/M3 芯片)
  - 16GB+ RAM
  - 512GB+ SSD
  - macOS 13.0+

### 软件安装

1. **安装 Xcode**

   ```bash
   # 从 Mac App Store 安装
   open macappstore://itunes.apple.com/app/xcode/id497799835
   ```

2. **安装命令行工具**

   ```bash
   xcode-select --install
   ```

3. **安装 Homebrew (可选)**

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

4. **安装 Swift 工具**
   ```bash
   brew install swift
   ```

### 开发者账号

1. **注册 Apple Developer Program**
   - 费用: $99/年
   - 网址: https://developer.apple.com/programs/

2. **获取证书和描述文件**
   - 开发证书: 用于开发测试
   - 分发证书: 用于 App Store 发布
   - 描述文件: 设备授权文件

## 📱 NatureCode iOS 应用架构

### 技术栈选择

- **SwiftUI**: 现代声明式 UI 框架
- **Combine**: 响应式编程框架
- **Core Data**: 本地数据存储 (可选)
- **URLSession**: 网络请求
- **Keychain Services**: 安全存储

### 架构模式: MVVM

```
View (SwiftUI)
    ↓  @StateObject/@ObservedObject
ViewModel (Combine)
    ↓
Service Layer
    ↓
Model Layer
```

### 核心模块设计

#### 1. 终端模拟器模块

```swift
// 使用 TextEditor 和 TextField 组合
struct TerminalView: View {
    @StateObject var viewModel: TerminalViewModel
    @State private var command: String = ""

    var body: some View {
        VStack {
            // 输出区域
            ScrollView {
                Text(viewModel.output)
                    .font(.system(.body, design: .monospaced))
            }

            // 输入区域
            HStack {
                Text("$")
                TextField("Enter command", text: $command)
                Button("Execute") {
                    viewModel.execute(command)
                }
            }
        }
    }
}
```

#### 2. 命令执行模块

由于 iOS 沙盒限制，无法直接执行 shell 命令。解决方案：

**方案 A: 本地模拟命令**

```swift
class TerminalService {
    func execute(_ command: String) -> String {
        switch command {
        case "ls":
            return listFiles()
        case "pwd":
            return currentDirectory
        case "help":
            return showHelp()
        default:
            return "Command not supported in iOS sandbox"
        }
    }
}
```

**方案 B: 远程 API 调用**

```swift
class RemoteCommandService {
    func execute(_ command: String) async throws -> String {
        let request = createRequest(for: command)
        let (data, _) = try await URLSession.shared.data(for: request)
        return String(data: data, encoding: .utf8) ?? ""
    }
}
```

**方案 C: JavaScriptCore 执行**

```swift
import JavaScriptCore

class JavaScriptExecutor {
    let context = JSContext()

    func execute(_ script: String) -> String {
        let result = context?.evaluateScript(script)
        return result?.toString() ?? ""
    }
}
```

#### 3. NatureCode AI 集成模块

```swift
class AIService {
    func sendMessage(_ message: String) async throws -> String {
        let request = createAIRequest(message)
        let (data, _) = try await URLSession.shared.data(for: request)
        return parseAIResponse(data)
    }

    func analyzeCode(_ code: String) async throws -> CodeAnalysis {
        let prompt = "Analyze this code: \(code)"
        let response = try await sendMessage(prompt)
        return parseAnalysis(response)
    }
}
```

#### 4. 文件系统模块

```swift
class FileService {
    private let fileManager = FileManager.default

    func listFiles(in directory: URL) throws -> [URL] {
        return try fileManager.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: nil
        )
    }

    func readFile(at url: URL) throws -> String {
        return try String(contentsOf: url, encoding: .utf8)
    }

    func writeFile(content: String, to url: URL) throws {
        try content.write(to: url, atomically: true, encoding: .utf8)
    }
}
```

## 🔧 实现细节

### 终端界面实现

#### 输出区域

```swift
struct OutputView: View {
    let lines: [TerminalLine]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading) {
                    ForEach(lines) { line in
                        Text(line.text)
                            .font(.system(.body, design: .monospaced))
                            .foregroundColor(color(for: line.type))
                    }
                }
            }
            .onChange(of: lines.count) { _ in
                proxy.scrollTo(lines.last?.id)
            }
        }
    }
}
```

#### 输入区域

```swift
struct InputView: View {
    @Binding var text: String
    let onSubmit: () -> Void

    var body: some View {
        HStack {
            Text("naturecode:~$")
                .foregroundColor(.green)

            TextField("", text: $text)
                .textFieldStyle(PlainTextFieldStyle())
                .onSubmit(onSubmit)
                .submitLabel(.send)

            Button(action: onSubmit) {
                Image(systemName: "arrow.right.circle.fill")
            }
        }
    }
}
```

### 命令历史管理

```swift
class CommandHistory {
    private var history: [String] = []
    private var currentIndex = 0

    func add(_ command: String) {
        history.append(command)
        currentIndex = history.count
    }

    func previous() -> String? {
        guard currentIndex > 0 else { return nil }
        currentIndex -= 1
        return history[currentIndex]
    }

    func next() -> String? {
        guard currentIndex < history.count - 1 else { return nil }
        currentIndex += 1
        return history[currentIndex]
    }
}
```

### 语法高亮

```swift
struct SyntaxHighlighter {
    func highlight(_ text: String) -> AttributedString {
        var attributed = AttributedString(text)

        // 高亮关键词
        let keywords = ["if", "else", "for", "while", "func", "class"]
        for keyword in keywords {
            if let range = attributed.range(of: keyword) {
                attributed[range].foregroundColor = .purple
                attributed[range].font = .monospaced(.body).bold()
            }
        }

        // 高亮字符串
        let stringPattern = #""[^"]*""#
        // ... 实现字符串高亮

        return attributed
    }
}
```

## 📦 项目结构

### 推荐目录结构

```
NatureCodeTerminal/
├── NatureCodeTerminal.xcodeproj
├── NatureCodeTerminal/
│   ├── App/
│   │   ├── NatureCodeTerminalApp.swift
│   │   └── AppDelegate.swift
│   ├── Views/
│   │   ├── Terminal/
│   │   │   ├── TerminalView.swift
│   │   │   ├── OutputView.swift
│   │   │   └── InputView.swift
│   │   ├── Settings/
│   │   │   ├── SettingsView.swift
│   │   │   └── AIConfigView.swift
│   │   └── Common/
│   │       ├── LoadingView.swift
│   │       └── ErrorView.swift
│   ├── ViewModels/
│   │   ├── TerminalViewModel.swift
│   │   ├── SettingsViewModel.swift
│   │   └── AIViewModel.swift
│   ├── Models/
│   │   ├── Terminal/
│   │   │   ├── Command.swift
│   │   │   └── TerminalSession.swift
│   │   ├── AI/
│   │   │   ├── AIConfig.swift
│   │   │   └── AIMessage.swift
│   │   └── User/
│   │       ├── UserSettings.swift
│   │       └── UserProfile.swift
│   ├── Services/
│   │   ├── Terminal/
│   │   │   ├── TerminalService.swift
│   │   │   └── CommandParser.swift
│   │   ├── AI/
│   │   │   ├── AIService.swift
│   │   │   └── ModelProvider.swift
│   │   ├── Network/
│   │   │   ├── APIClient.swift
│   │   │   └── NetworkMonitor.swift
│   │   ├── Storage/
│   │   │   ├── KeychainService.swift
│   │   │   └── FileService.swift
│   │   └── Analytics/
│   │       ├── AnalyticsService.swift
│   │       └── EventTracker.swift
│   ├── Utilities/
│   │   ├── Extensions/
│   │   │   ├── String+Extensions.swift
│   │   │   ├── Color+Extensions.swift
│   │   │   └── View+Extensions.swift
│   │   ├── Constants.swift
│   │   ├── Logger.swift
│   │   └── Theme.swift
│   └── Resources/
│       ├── Assets.xcassets
│       ├── LaunchScreen.storyboard
│       ├── Info.plist
│       └── Localizable.strings
├── NatureCodeTerminalTests/
│   ├── UnitTests/
│   ├── IntegrationTests/
│   └── Mock/
└── NatureCodeTerminalUITests/
    ├── TerminalUITests.swift
    └── SettingsUITests.swift
```

## 🚀 构建和部署

### 开发构建

```bash
# 清理项目
xcodebuild clean -project NatureCodeTerminal.xcodeproj -scheme NatureCodeTerminal

# 构建项目
xcodebuild build -project NatureCodeTerminal.xcodeproj -scheme NatureCodeTerminal -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# 运行测试
xcodebuild test -project NatureCodeTerminal.xcodeproj -scheme NatureCodeTerminal -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

### 发布构建

```bash
# 创建归档
xcodebuild archive -project NatureCodeTerminal.xcodeproj -scheme NatureCodeTerminal -archivePath build/NatureCodeTerminal.xcarchive

# 导出 IPA
xcodebuild -exportArchive -archivePath build/NatureCodeTerminal.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build
```

### 自动化脚本

使用 `build-ios.sh` 脚本自动化构建过程。

## 🔒 安全考虑

### iOS 沙盒限制

1. **文件系统访问**: 只能访问应用沙盒内文件
2. **网络权限**: 需要声明网络使用目的
3. **系统命令**: 无法执行任意 shell 命令
4. **设备信息**: 访问受限，需要用户授权

### 安全最佳实践

1. **钥匙串存储**: 安全存储 API 密钥和敏感数据
2. **证书固定**: 防止中间人攻击
3. **输入验证**: 防止命令注入
4. **网络加密**: 强制使用 HTTPS
5. **权限最小化**: 只请求必要权限

### 数据保护

```swift
class KeychainService {
    func saveAPIKey(_ key: String) throws {
        let query: [String: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: "api_key",
            kSecValueData: key.data(using: .utf8)!
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
}
```

## 📊 性能优化

### 内存优化

1. **图片优化**: 使用适当尺寸的图片资源
2. **懒加载**: 延迟加载非必要资源
3. **缓存策略**: 智能缓存网络请求
4. **内存警告**: 响应内存警告事件

### 响应优化

1. **主线程优化**: 避免阻塞 UI 更新
2. **异步处理**: 使用 async/await 处理耗时操作
3. **Combine 流**: 使用 Publisher 处理数据流
4. **预加载**: 提前加载必要数据

### 构建优化

1. **增量编译**: 启用增量编译加快构建速度
2. **模块化**: 将代码拆分为多个模块
3. **资源优化**: 压缩图片和资源文件
4. **代码剥离**: 发布版本移除调试符号

## 🧪 测试策略

### 单元测试

```swift
import XCTest
@testable import NatureCodeTerminal

class TerminalServiceTests: XCTestCase {
    func testCommandExecution() {
        let service = TerminalService()
        let result = service.execute("help")
        XCTAssertFalse(result.isEmpty)
    }
}
```

### UI 测试

```swift
import XCTest

class TerminalUITests: XCTestCase {
    func testTerminalInput() {
        let app = XCUIApplication()
        app.launch()

        let inputField = app.textFields["command_input"]
        inputField.tap()
        inputField.typeText("help\n")

        XCTAssert(app.staticTexts["Terminal Help"].exists)
    }
}
```

### 集成测试

```swift
class AIServiceIntegrationTests: XCTestCase {
    func testAIConfiguration() async throws {
        let service = AIService()
        let config = AIConfiguration(apiKey: "test_key")
        try await service.configure(config)

        let response = try await service.sendMessage("Hello")
        XCTAssertFalse(response.isEmpty)
    }
}
```

## 🚨 常见问题

### 问题 1: 代码签名失败

**症状**: `No matching provisioning profiles found`
**解决方案**:

1. 检查 Xcode 中的开发团队设置
2. 重新下载描述文件
3. 清理 DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`

### 问题 2: 沙盒限制

**症状**: 无法执行系统命令或访问文件
**解决方案**:

1. 使用模拟命令替代真实命令
2. 通过 API 调用远程服务
3. 只访问应用沙盒内文件

### 问题 3: 网络权限

**症状**: 网络请求失败
**解决方案**:

1. 在 Info.plist 中添加网络权限描述
2. 启用 App Transport Security 例外
3. 检查网络连接状态

### 问题 4: 内存泄漏

**症状**: 应用崩溃或性能下降
**解决方案**:

1. 使用 Instruments 检测内存泄漏
2. 检查强引用循环
3. 及时释放不需要的资源

## 📚 学习资源

### 官方文档

- [Swift Documentation](https://docs.swift.org)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Apple Developer Documentation](https://developer.apple.com/documentation)

### 在线课程

- [Stanford CS193p](https://cs193p.sites.stanford.edu)
- [Ray Wenderlich](https://www.raywenderlich.com)
- [Hacking with Swift](https://www.hackingwithswift.com)

### 社区资源

- [Swift Forums](https://forums.swift.org)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/swift)
- [iOS Developer Reddit](https://www.reddit.com/r/iOSProgramming)

### 工具推荐

- [SwiftLint](https://github.com/realm/SwiftLint): 代码风格检查
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat): 代码格式化
- [Fastlane](https://fastlane.tools): 自动化部署
- [CocoaPods](https://cocoapods.org): 依赖管理

## 🎯 开发路线图

### Phase 1: 基础功能 (2-4 周)

1. 终端界面实现
2. 基本命令支持
3. 文件系统访问
4. 用户设置

### Phase 2: AI 集成 (3-5 周)

1. NatureCode API 集成
2. 多模型支持
3. 代码分析功能
4. 项目管理功能

### Phase 3: 高级功能 (4-6 周)

1. 插件系统
2. 团队协作
3. 云同步
4. 高级终端功能

### Phase 4: 优化发布 (2-3 周)

1. 性能优化
2. 测试完善
3. App Store 提交
4. 文档完善

## 🤝 贡献指南

### 代码规范

1. **命名规范**: 使用驼峰命名法
2. **代码格式**: 遵循 Swift API 设计指南
3. **注释要求**: 公共 API 必须有文档注释
4. **测试要求**: 新功能必须包含测试

### 提交流程

1. **创建分支**: `git checkout -b feature/your-feature`
2. **开发功能**: 实现功能并添加测试
3. **代码审查**: 创建 Pull Request 请求审查
4. **合并发布**: 通过审查后合并到主分支

### 问题报告

1. **Bug 报告**: 提供重现步骤和日志
2. **功能请求**: 描述使用场景和预期行为
3. **安全问题**: 通过安全渠道报告

## 📞 支持联系

### 开发支持

- **GitHub Issues**: https://github.com/naturecode-official/naturecode/issues
- **文档网站**: https://naturecode.ai/docs
- **社区论坛**: https://discuss.naturecode.ai

### 商业合作

- **邮箱**: contact@naturecode.ai
- **官网**: https://naturecode.ai
- **Twitter**: @naturecode_ai

---

**最后更新**: 2026年2月17日  
**当前状态**: iOS 开发框架已建立，等待实际开发实施  
**目标版本**: NatureCode iOS v1.5.6
