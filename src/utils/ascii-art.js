// NatureCode ASCII Art
import fs from "fs";
import path from "path";

export function getAsciiArt() {
  return [
    "  ____  ____ _/ /___  __________  _________  ____/ /__",
    " / __ \\/ __ `/ __/ / / / ___/ _ \\/ ___/ __ \\/ __  / _ \\",
    "/ / / / /_/ / /_/ /_/ / /  /  __/ /__/ /_/ / /_/ /  __/",
    "\\_\\_\\_\\__,_/\\__/\\__,_/_/   \\___/\\___/\\____/\\__,_/\\___/",
  ].join("\n");
}

export function getWelcomeArt() {
  const asciiArt = getAsciiArt();

  // 动态获取版本号
  let version = "2.0.1";
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      version = packageJson.version || version;
    }
  } catch (error) {
    // 使用默认值
  }

  return `${asciiArt}

    NatureCode v${version} - Intelligent AI Assistant with AGENT.md System
********************************************************************************`;
}

export function getCommandPrompt() {
  return `Available commands:
/model     - Configure AI model and API settings
/start     - Start interactive AI session  
/config    - Show current configuration
/delmodel  - Delete model configuration
/help      - Show this help message
/exit      - Exit NatureCode`;
}

export function clearScreen() {
  // Clear screen and move cursor to top
  process.stdout.write("\x1Bc");
}
