import { Command } from "commander";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createHelpCommand() {
  const helpCommand = new HelpCommand();
  return helpCommand.getCommand();
}

export class HelpCommand {
  constructor() {
    this.command = new Command("help")
      .description("Show help information for NatureCode (Professional Mode)")
      .option("-s, --simple", "Use simple help")
      .option("-d, --docs", "Show full documentation")
      .action(this.handleCommand.bind(this));
  }

  getCommand() {
    return this.command;
  }

  async handleCommand(options) {
    try {
      if (options.docs) {
        await this.showFullDocs();
        return;
      }

      if (options.simple) {
        await this.showSimpleHelp();
        return;
      }

      await this.showInteractiveHelp();
    } catch (error) {
      console.error(`Error showing help: ${error.message}`);
      await this.showSimpleHelp();
    }
  }

  async showSimpleHelp() {
    const helpText = `
NatureCode - Cross-platform Terminal AI Assistant (Professional Mode)

Available Commands:
  start              Start interactive AI session
  model              Configure AI model and API
  help               Show help information

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



Configuration:
  config show        Show configuration
  config get <key>   Get config value
  config set <key> <value> Set config value

AI Providers:
  Configure with: naturecode model
  - DeepSeek (recommended): Free API, 128K context
  - OpenAI: GPT models, requires API key
  - Ollama: Local models, no API key needed

Plugin System:
  plugin list        List available plugins
  plugin install <id> Install plugin
  plugin remove <id> Remove plugin
  plugin enable <id> Enable plugin
  plugin disable <id> Disable plugin

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

  async showInteractiveHelp() {
    // For now, just show simple help
    await this.showSimpleHelp();
  }
}
