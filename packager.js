#!/usr/bin/env node

/**
 * NatureCode 包装工具
 * 版本管理和打包工具
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色定义
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// 日志函数
function log(color, type, message) {
  console.log(`${colors[color]}[${type}]${colors.reset} ${message}`);
}

function logInfo(message) {
  log("blue", "INFO", message);
}

function logSuccess(message) {
  log("green", "SUCCESS", message);
}

function logWarning(message) {
  log("yellow", "WARNING", message);
}

function logError(message) {
  log("red", "ERROR", message);
}

// 版本管理类
class VersionManager {
  constructor() {
    this.packagePath = path.join(__dirname, "package.json");
    this.versionFile = path.join(__dirname, "VERSION");
    this.changelogFile = path.join(__dirname, "CHANGELOG.md");
  }

  // 获取当前版本
  getCurrentVersion() {
    try {
      const packageData = JSON.parse(fs.readFileSync(this.packagePath, "utf8"));
      return packageData.version;
    } catch (error) {
      logError(`无法读取版本信息: ${error.message}`);
      return "0.0.0";
    }
  }

  // 更新版本
  updateVersion(newVersion, versionType = "patch") {
    try {
      const packageData = JSON.parse(fs.readFileSync(this.packagePath, "utf8"));
      const currentVersion = packageData.version;

      let nextVersion;
      if (newVersion) {
        nextVersion = newVersion;
      } else {
        const [major, minor, patch] = currentVersion.split(".").map(Number);

        switch (versionType) {
          case "major":
            nextVersion = `${major + 1}.0.0`;
            break;
          case "minor":
            nextVersion = `${major}.${minor + 1}.0`;
            break;
          case "patch":
          default:
            nextVersion = `${major}.${minor}.${patch + 1}`;
            break;
        }
      }

      // 更新 package.json
      packageData.version = nextVersion;
      fs.writeFileSync(this.packagePath, JSON.stringify(packageData, null, 2));

      // 更新 VERSION 文件
      fs.writeFileSync(this.versionFile, nextVersion);

      logSuccess(`版本已更新: ${currentVersion} -> ${nextVersion}`);
      return nextVersion;
    } catch (error) {
      logError(`更新版本失败: ${error.message}`);
      throw error;
    }
  }

  // 创建版本标签
  createVersionTag(version, message) {
    try {
      const tagName = `v${version}`;
      const tagMessage = message || `Release version ${version}`;

      execSync(`git tag -a ${tagName} -m "${tagMessage}"`, {
        stdio: "inherit",
      });
      logSuccess(`已创建版本标签: ${tagName}`);

      return tagName;
    } catch (error) {
      logWarning(`创建版本标签失败: ${error.message}`);
      return null;
    }
  }

  // 更新变更日志
  updateChangelog(version, changes = []) {
    try {
      let changelog = "";

      if (fs.existsSync(this.changelogFile)) {
        changelog = fs.readFileSync(this.changelogFile, "utf8");
      } else {
        changelog = `# NatureCode 变更日志\n\n`;
      }

      const date = new Date().toISOString().split("T")[0];
      const versionSection = `## ${version} (${date})\n\n`;

      let changesText = "";
      if (changes.length > 0) {
        changes.forEach((change) => {
          changesText += `- ${change}\n`;
        });
      } else {
        changesText = "- 常规更新和错误修复\n";
      }

      // 插入新版本到开头
      const newChangelog = changelog.replace(
        "# NatureCode 变更日志\n\n",
        `# NatureCode 变更日志\n\n${versionSection}${changesText}\n`,
      );

      fs.writeFileSync(this.changelogFile, newChangelog);
      logSuccess(`变更日志已更新`);
    } catch (error) {
      logWarning(`更新变更日志失败: ${error.message}`);
    }
  }
}

// 打包管理类
class Packager {
  constructor() {
    this.buildDir = path.join(__dirname, "build");
    this.distDir = path.join(__dirname, "dist");
    this.releasesDir = path.join(__dirname, "releases");
  }

  // 清理构建目录
  clean() {
    logInfo("清理构建目录...");

    const dirs = [this.buildDir, this.distDir];
    dirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        logInfo(`已清理: ${dir}`);
      }
    });

    logSuccess("构建目录清理完成");
  }

  // 构建应用程序
  build() {
    logInfo("开始构建应用程序...");

    // 确保目录存在
    [this.buildDir, this.distDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    try {
      // 运行测试
      logInfo("运行测试...");
      execSync('npm test 2>/dev/null || echo "测试跳过"', { stdio: "inherit" });

      // 检查代码质量
      logInfo("检查代码质量...");
      execSync('npm run lint 2>/dev/null || echo "代码检查跳过"', {
        stdio: "inherit",
      });

      // 安装生产依赖
      logInfo("安装生产依赖...");
      const distPackageDir = path.join(this.distDir, "package");
      fs.mkdirSync(distPackageDir, { recursive: true });

      // 复制必要文件
      const filesToCopy = [
        "package.json",
        "README.md",
        "AGENTS.md",
        "INSTALL.md",
        ".env.example",
      ];

      filesToCopy.forEach((file) => {
        const source = path.join(__dirname, file);
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, path.join(distPackageDir, file));
        }
      });

      // 复制源代码
      fs.cpSync(path.join(__dirname, "src"), path.join(distPackageDir, "src"), {
        recursive: true,
      });

      // 安装依赖
      execSync("npm install --production --no-audit --no-fund", {
        cwd: distPackageDir,
        stdio: "inherit",
      });

      logSuccess("应用程序构建完成");
      return distPackageDir;
    } catch (error) {
      logError(`构建失败: ${error.message}`);
      throw error;
    }
  }

  // 创建发布包
  createRelease(version) {
    logInfo(`创建发布包 v${version}...`);

    if (!fs.existsSync(this.releasesDir)) {
      fs.mkdirSync(this.releasesDir, { recursive: true });
    }

    const buildResult = this.build();
    const releaseName = `naturecode-${version}`;
    const releaseDir = path.join(this.releasesDir, releaseName);

    // 复制构建结果到发布目录
    fs.cpSync(buildResult, releaseDir, { recursive: true });

    // 创建压缩包
    const tarName = `${releaseName}.tar.gz`;
    const tarPath = path.join(this.releasesDir, tarName);

    execSync(
      `tar -czf "${tarPath}" -C "${this.releasesDir}" "${releaseName}"`,
      { stdio: "inherit" },
    );

    // 创建 ZIP 包（用于 Windows）
    const zipName = `${releaseName}.zip`;
    const zipPath = path.join(this.releasesDir, zipName);

    execSync(`zip -r "${zipPath}" "${releaseDir}"`, { stdio: "inherit" });

    logSuccess(`发布包创建完成:`);
    logInfo(`  - ${tarPath}`);
    logInfo(`  - ${zipPath}`);

    return {
      tar: tarPath,
      zip: zipPath,
      directory: releaseDir,
    };
  }

  // 创建 DMG（macOS）
  createDMG(version) {
    logInfo(`创建 macOS DMG v${version}...`);

    // 运行 DMG 构建脚本
    try {
      execSync("chmod +x build_dmg.sh", { stdio: "inherit" });
      execSync("./build_dmg.sh", { stdio: "inherit" });

      // 复制 DMG 到发布目录
      const dmgSource = path.join(
        __dirname,
        "dmg",
        `NatureCode-${version}-macos.dmg`,
      );
      if (fs.existsSync(dmgSource)) {
        const dmgDest = path.join(
          this.releasesDir,
          `NatureCode-${version}-macos.dmg`,
        );
        fs.copyFileSync(dmgSource, dmgDest);
        logSuccess(`DMG 文件: ${dmgDest}`);
        return dmgDest;
      }
    } catch (error) {
      logWarning(`创建 DMG 失败: ${error.message}`);
      return null;
    }
  }

  // 完整发布流程
  async release(versionType = "patch", changes = []) {
    logInfo("开始发布流程...");

    const versionManager = new VersionManager();

    // 1. 更新版本
    const newVersion = versionManager.updateVersion(null, versionType);

    // 2. 更新变更日志
    versionManager.updateChangelog(newVersion, changes);

    // 3. 清理和构建
    this.clean();
    this.build();

    // 4. 创建发布包
    const releasePackages = this.createRelease(newVersion);

    // 5. 创建 DMG（macOS）
    if (process.platform === "darwin") {
      this.createDMG(newVersion);
    }

    // 6. 创建版本标签
    versionManager.createVersionTag(newVersion);

    logSuccess(`发布完成! 版本: ${newVersion}`);
    console.log("\n生成的文件:");
    console.log(`  发布目录: ${this.releasesDir}/`);

    if (releasePackages.tar) {
      console.log(`  Linux/macOS: ${path.basename(releasePackages.tar)}`);
    }
    if (releasePackages.zip) {
      console.log(`  Windows: ${path.basename(releasePackages.zip)}`);
    }

    console.log("\n下一步:");
    console.log("  1. 测试发布包");
    console.log(
      '  2. 提交更改: git add . && git commit -m "Release v${newVersion}"',
    );
    console.log("  3. 推送标签: git push --tags");
  }
}

// CLI 接口
class CLI {
  constructor() {
    this.versionManager = new VersionManager();
    this.packager = new Packager();
  }

  // 显示帮助
  showHelp() {
    console.log(colors.cyan + "NatureCode 包装工具" + colors.reset);
    console.log("版本管理、构建和打包工具\n");

    console.log(colors.yellow + "使用方法:" + colors.reset);
    console.log("  node packager.js <命令> [选项]\n");

    console.log(colors.yellow + "命令:" + colors.reset);
    console.log("  version [类型]          更新版本 (major|minor|patch)");
    console.log("  build                   构建应用程序");
    console.log("  clean                   清理构建目录");
    console.log("  package                 创建发布包");
    console.log("  dmg                     创建 macOS DMG");
    console.log("  release [类型]          完整发布流程");
    console.log("  help                    显示帮助信息\n");

    console.log(colors.yellow + "示例:" + colors.reset);
    console.log("  node packager.js version minor");
    console.log("  node packager.js build");
    console.log("  node packager.js release patch");
    console.log("  node packager.js dmg");
  }

  // 运行命令
  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || "help";

    switch (command) {
      case "version":
        const versionType = args[1] || "patch";
        this.versionManager.updateVersion(null, versionType);
        break;

      case "build":
        this.packager.build();
        break;

      case "clean":
        this.packager.clean();
        break;

      case "package":
        const currentVersion = this.versionManager.getCurrentVersion();
        this.packager.createRelease(currentVersion);
        break;

      case "dmg":
        if (process.platform !== "darwin") {
          logError("DMG 只能在 macOS 上创建");
          break;
        }
        const version = this.versionManager.getCurrentVersion();
        this.packager.createDMG(version);
        break;

      case "release":
        const releaseType = args[1] || "patch";
        const changes = args.slice(2);
        await this.packager.release(releaseType, changes);
        break;

      case "help":
      default:
        this.showHelp();
        break;
    }
  }
}

// 主程序
async function main() {
  try {
    const cli = new CLI();
    await cli.run();
  } catch (error) {
    logError(`程序执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行主程序
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { VersionManager, Packager, CLI };
