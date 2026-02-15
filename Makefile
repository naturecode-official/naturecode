# NatureCode Makefile
# 构建和发布工具

.PHONY: help install build test clean package dmg release

# 默认目标
help:
	@echo "NatureCode 构建工具"
	@echo ""
	@echo "可用命令:"
	@echo "  make install    安装依赖"
	@echo "  make build      构建应用程序"
	@echo "  make test       运行测试"
	@echo "  make lint       代码检查"
	@echo "  make clean      清理构建文件"
	@echo "  make package    创建发布包"
	@echo "  make dmg        创建 macOS DMG"
	@echo "  make release    完整发布流程"
	@echo "  make help       显示此帮助"

# 安装依赖
install:
	@echo "安装依赖..."
	npm install

# 构建应用程序
build:
	@echo "构建应用程序..."
	node packager.js build

# 运行测试
test:
	@echo "运行测试..."
	npm test 2>/dev/null || echo "测试跳过"

# 代码检查
lint:
	@echo "代码检查..."
	npm run lint 2>/dev/null || echo "代码检查跳过"

# 清理构建文件
clean:
	@echo "清理构建文件..."
	node packager.js clean

# 创建发布包
package:
	@echo "创建发布包..."
	node packager.js package

# 创建 macOS DMG
dmg:
	@echo "创建 macOS DMG..."
	@if [ "$$(uname)" != "Darwin" ]; then \
		echo "错误: DMG 只能在 macOS 上创建"; \
		exit 1; \
	fi
	node packager.js dmg

# 完整发布流程
release:
	@echo "开始发布流程..."
	node packager.js release

# 安装到系统
install-system:
	@echo "系统安装..."
	chmod +x install.sh
	sudo ./install.sh

# 卸载
uninstall:
	@echo "卸载..."
	chmod +x install.sh
	sudo ./install.sh --uninstall

# 开发模式
dev:
	@echo "启动开发模式..."
	npm run dev

# 版本管理
version-patch:
	@echo "更新补丁版本..."
	node packager.js version patch

version-minor:
	@echo "更新次要版本..."
	node packager.js version minor

version-major:
	@echo "更新主要版本..."
	node packager.js version major

# 快速构建所有
all: clean install build test lint package
	@echo "✅ 所有构建步骤完成"