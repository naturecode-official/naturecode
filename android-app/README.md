# NatureCode Android App

Android 版本的 NatureCode AI 终端助手。

## 功能特点

- 完整的终端界面，支持 Linux 命令操作
- 内置 Node.js 运行环境
- 支持 NatureCode 所有 AI 功能
- 文件系统访问权限
- 网络连接支持

## 技术架构

1. **Termux 集成**: 使用 Termux API 在 Android 上运行 Linux 环境
2. **Node.js 运行时**: 内置 Node.js 18+ 环境
3. **终端界面**: 使用 Termux 终端模拟器
4. **NatureCode 核心**: 完整的 NatureCode CLI 工具

## 构建说明

### 方法 1: 使用 Android Studio

1. 导入 `android-app` 目录到 Android Studio
2. 安装必要的 SDK 和构建工具
3. 构建 APK

### 方法 2: 使用 Gradle 命令行

```bash
cd android-app
./gradlew assembleDebug
```

## 安装要求

- Android 8.0+ (API 26+)
- 至少 100MB 可用存储空间
- 网络连接（用于 AI 功能）

## 文件结构

```
android-app/
├── app/                    # 主应用模块
│   ├── src/main/
│   │   ├── java/          # Java 源代码
│   │   ├── res/           # 资源文件
│   │   └── assets/        # 静态资源
│   └── build.gradle       # 模块构建配置
├── gradle/                # Gradle 包装器
├── build.gradle           # 项目构建配置
├── gradle.properties      # Gradle 属性
└── settings.gradle        # 项目设置
```

## 依赖项

- Termux API
- Termux 终端模拟器
- Node.js 运行时
- NatureCode CLI 工具

## 权限要求

- 网络访问（AI 功能）
- 存储访问（文件操作）
- 安装未知来源应用（首次安装）
