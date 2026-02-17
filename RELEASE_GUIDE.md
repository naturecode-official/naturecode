# NatureCode 发布指南

## 问题分析

用户报告链接 `https://github.com/naturecode-official/naturecode/releases/latest/download/naturecode-android-release.apk` 返回 404。

### 原因

1. **GitHub Releases 中还没有创建任何发布**
2. `latest/download` 链接需要实际存在的发布文件
3. 需要先创建 Release 并上传文件，链接才能工作

## 解决方案

### 短期方案 (已实施)

✅ **更新 README.md**：

- 将 `latest/download` 链接改为指向 GitHub Releases 页面
- 提供清晰的下载指引
- 显示直接链接格式（供未来使用）

### 长期方案 (需要执行)

需要创建实际的 GitHub Release 并上传文件。

## 发布创建流程

### 步骤 1: 准备发布文件

#### Android APK 文件

```bash
# 方法 A: 使用构建脚本
./build-android.sh

# 方法 B: 手动构建
# 1. 安装 Android Studio 和 SDK
# 2. 打开 android-app/ 项目
# 3. 构建 APK 文件
# 4. 文件位置: android-app/app/build/outputs/apk/
```

#### 桌面版可执行文件

```bash
# 使用现有构建脚本
npm run build
# 文件位置: dist/
```

### 步骤 2: 创建 GitHub Release

#### 使用自动化脚本 (推荐)

```bash
# 1. 登录 GitHub CLI
gh auth login

# 2. 运行发布脚本
./create-release.sh

# 脚本将:
# - 检查构建文件
# - 创建发布说明
# - 创建 Git 标签
# - 创建 GitHub Release
# - 上传文件
```

#### 手动创建

1. **访问 GitHub**: https://github.com/naturecode-official/naturecode/releases
2. **点击 "Draft a new release"**
3. **填写信息**:
   - Tag version: `v1.5.6`
   - Release title: `NatureCode 1.5.6`
   - Description: 从 `RELEASE_NOTES.md` 复制
4. **上传文件**:
   - `dist/android/naturecode-android-release.apk`
   - `dist/android/naturecode-android-debug.apk`
   - `dist/naturecode-win.exe`
   - `dist/naturecode-macos`
   - `dist/naturecode-linux`
5. **点击 "Publish release"**

### 步骤 3: 更新下载链接

```bash
# 使用更新脚本
./update-download-links.sh v1.5.6

# 脚本将:
# - 更新 README.md 中的直接链接
# - 更新版本信息
# - 创建测试脚本
```

### 步骤 4: 测试链接

```bash
# 运行测试脚本
./test-download-links.sh

# 手动测试
curl -I https://github.com/naturecode-official/naturecode/releases/download/v1.5.6/naturecode-android-release.apk
```

## 文件要求

### 必须文件

1. **Android**:
   - `naturecode-android-release.apk` (稳定版)
   - `naturecode-android-debug.apk` (调试版)

2. **桌面版**:
   - `naturecode-win.exe` (Windows)
   - `naturecode-macos` (macOS)
   - `naturecode-linux` (Linux)

### 可选文件

1. **校验和文件**:
   - `MD5SUMS`
   - `SHA256SUMS`
2. **源代码包**:
   - `source-code.zip`
3. **文档**:
   - `CHANGELOG.md`
   - `INSTALL.md`

## 发布检查清单

### 发布前

- [ ] 所有功能测试通过
- [ ] 构建文件已生成
- [ ] 版本号已更新
- [ ] 发布说明已编写
- [ ] 代码已提交到 main 分支

### 发布中

- [ ] Git 标签已创建
- [ ] GitHub Release 已创建
- [ ] 所有文件已上传
- [ ] 发布说明完整
- [ ] Release 已发布（非草稿）

### 发布后

- [ ] 下载链接已更新
- [ ] 链接测试通过
- [ ] 文档已更新
- [ ] 用户已通知

## 故障排除

### 常见问题

#### 问题 1: 构建失败

**症状**: `npm run build` 或 `./build-android.sh` 失败
**解决方案**:

1. 检查 Node.js 版本: `node --version`
2. 检查 Android SDK 安装
3. 查看错误日志
4. 清理缓存重试

#### 问题 2: GitHub CLI 登录失败

**症状**: `gh auth login` 失败
**解决方案**:

1. 使用 token 登录: `gh auth login --with-token`
2. 生成 GitHub token: Settings → Developer settings → Personal access tokens
3. 设置环境变量: `export GH_TOKEN=your_token`

#### 问题 3: 文件上传失败

**症状**: 上传到 GitHub Release 失败
**解决方案**:

1. 检查文件大小限制（单个文件 ≤ 2GB）
2. 检查网络连接
3. 分批次上传
4. 使用浏览器手动上传

#### 问题 4: 链接仍然 404

**症状**: 创建 Release 后链接仍然不可用
**解决方案**:

1. 检查 Release 是否已发布（不是草稿）
2. 检查文件名是否正确
3. 等待 CDN 缓存更新（最多 5 分钟）
4. 清除浏览器缓存

## 自动化脚本说明

### create-release.sh

```bash
# 完整发布流程
./create-release.sh

# 功能:
# 1. 检查构建文件
# 2. 创建发布说明
# 3. 收集发布文件
# 4. 创建 Git 标签
# 5. 创建 GitHub Release
# 6. 上传文件
```

### update-download-links.sh

```bash
# 更新特定版本的链接
./update-download-links.sh v1.5.6

# 功能:
# 1. 更新 README.md 链接
# 2. 更新版本信息
# 3. 创建版本下载指南
# 4. 创建测试脚本
```

### test-download-links.sh

```bash
# 测试下载链接
./test-download-links.sh

# 功能:
# 1. 测试所有直接下载链接
# 2. 显示可用性状态
# 3. 提供故障排除建议
```

## 版本管理

### 版本号规范

- **主版本号**: 重大更新，不兼容变更
- **次版本号**: 新功能，向后兼容
- **修订号**: Bug 修复，小改进

### 发布周期

1. **开发阶段**: 功能开发，测试
2. **测试阶段**: Beta 测试，问题修复
3. **发布阶段**: 创建 Release，更新文档
4. **维护阶段**: Bug 修复，小更新

### 分支策略

- `main`: 稳定版本，用于发布
- `develop`: 开发分支，新功能
- `feature/*`: 功能分支
- `release/*`: 发布准备分支
- `hotfix/*`: 紧急修复分支

## 安全考虑

### 文件安全

1. **代码签名**: Android APK 应签名
2. **校验和**: 提供 MD5/SHA256 校验和
3. **病毒扫描**: 上传前扫描文件
4. **来源验证**: 只从官方渠道分发

### 发布安全

1. **双因素认证**: GitHub 账户启用 2FA
2. **访问控制**: 限制发布权限
3. **审计日志**: 记录所有发布操作
4. **回滚计划**: 准备问题回滚方案

## 用户沟通

### 发布通知

1. **GitHub Releases**: 主要发布渠道
2. **文档更新**: 更新 README 和指南
3. **社区公告**: 社交媒体，论坛
4. **邮件通知**: 注册用户邮件列表

### 用户支持

1. **问题收集**: GitHub Issues
2. **常见问题**: 更新 FAQ
3. **故障排除**: 提供详细指南
4. **反馈渠道**: 用户反馈收集

## 后续步骤

### 立即行动

1. [ ] 构建实际的 APK 和可执行文件
2. [ ] 创建 GitHub Release v1.5.6
3. [ ] 测试所有下载链接
4. [ ] 更新用户文档

### 长期改进

1. [ ] 设置 CI/CD 自动化构建
2. [ ] 实现自动版本更新
3. [ ] 建立测试发布流程
4. [ ] 创建发布仪表板

## 联系支持

### 技术问题

- GitHub Issues: https://github.com/naturecode-official/naturecode/issues
- 文档: https://github.com/naturecode-official/naturecode#readme

### 发布问题

- 查看此指南
- 检查脚本错误信息
- 搜索常见问题

### 紧急问题

- 直接联系项目维护者
- 提供详细错误信息
- 包括步骤和截图

---

**最后更新**: 2026年2月17日  
**当前状态**: 发布脚本已创建，等待实际文件构建和发布创建  
**目标**: 修复 404 链接问题，建立可持续的发布流程
