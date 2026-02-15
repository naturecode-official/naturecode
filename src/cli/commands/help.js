import { Command } from "commander";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createHelpCommand() {
  const helpCommand = new HelpCommand();
  return helpCommand.getCommand();
}

export class HelpCommand {
  constructor() {
    this.command = new Command("help")
      .description("Get help for NatureCode commands")
      .argument("[question]", "Your question about NatureCode")
      .option("-s, --simple", "Use simple help without AI")
      .option("-d, --docs", "Show full documentation")
      .action(this.handleCommand.bind(this));
  }

  getCommand() {
    return this.command;
  }

  async handleCommand(question, options) {
    try {
      if (options.docs) {
        await this.showFullDocs();
        return;
      }

      if (options.simple || question) {
        await this.showSimpleHelp();
        return;
      }

      // Default: show simple help
      await this.showSimpleHelp();
    } catch (error) {
      console.error("Error getting help:", error.message);
      await this.showSimpleHelp();
    }
  }

  async showSimpleHelp() {
    const helpText = `
NatureCode - Cross-platform Terminal AI Assistant

Available Commands:
  start              Start interactive AI session
  model              Configure AI model and API
  help [question]    Get help for NatureCode

File System:
  read <file>        Read file content
  edit <file>        Edit file
  create <file>      Create new file
  delete <file>      Delete file
  list <dir>         List directory contents

Git Integration:
  git status         Show Git status
  git diff           Show changes
  git commit         Commit changes
  git push           Push to remote
  git pull           Pull from remote

Code Analysis:
  code analyze       Analyze code quality
  code review        Code review with AI
  code metrics       Show code metrics

Project Management:
  project analyze    Analyze project structure
  project create     Create new project
  project deps       Analyze dependencies

Configuration:
  config show        Show configuration
  config get <key>   Get config value
  config set <key> <value> Set config value

AI Providers:
  Configure with: naturecode model
  - DeepSeek (recommended): Free API, 128K context
  - OpenAI: GPT models, requires API key
  - Ollama: Local models, no API key needed

Session Management:
  session list       List saved sessions
  session load <id>  Load saved session
  session save       Save current session
  session delete <id> Delete saved session

Plugin System:
  plugin list        List available plugins
  plugin install <id> Install plugin
  plugin remove <id> Remove plugin
  plugin enable <id> Enable plugin
  plugin disable <id> Disable plugin

Team Collaboration:
  team share         Share session with team
  team review        Request code review
  team sync          Sync with team repository

Options:
  --version          Show version
  --help             Show help

Examples:
  naturecode start                    # Start interactive session
  naturecode model                    # Configure AI model
  naturecode help --simple            # Simple help
  naturecode help --docs              # Full documentation

For AI assistance, use: naturecode start
For configuration: naturecode model
`;

    console.log(helpText);
  }

  async showFullDocs() {
    try {
      const docsPath = join(__dirname, "../../../docs.md");
      if (existsSync(docsPath)) {
        const docsContent = await readFile(docsPath, "utf-8");
        console.log(docsContent);
      } else {
        console.log("Documentation file not found.");
        await this.showSimpleHelp();
      }
    } catch (error) {
      console.error("Error reading documentation:", error.message);
      await this.showSimpleHelp();
    }
  }

  async loadConfig() {
    try {
      const configPath = join(os.homedir(), ".naturecode", "config.json");
      if (existsSync(configPath)) {
        const configContent = await readFile(configPath, "utf-8");
        return JSON.parse(configContent);
      }
    } catch (error) {
      // Ignore config errors
    }
    return {
      provider: "deepseek",
      model: "deepseek-chat",
      lowResourceMode: false,
    };
  }
}
