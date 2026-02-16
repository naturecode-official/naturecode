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
      .description(
        "Get help for NatureCode - use 'naturecode start' for AI assistance",
      )
      .argument(
        "[question]",
        "Get AI help for specific questions (requires AI configuration)",
      )
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

      if (options.simple) {
        await this.showSimpleHelp();
        return;
      }

      if (question) {
        await this.getAIHelp(question);
        return;
      }

      // Default: show simple help
      await this.showSimpleHelp();
    } catch (error) {
      console.error("Error getting help:", error.message);
      await this.showSimpleHelp();
    }
  }

  async getAIHelp(question) {
    try {
      console.log(`\nGetting AI assistance for: "${question}"\n`);

      // Load configuration to create AI provider
      const { configManager } = await import("../../config/manager.js");
      const config = configManager.load();

      if (!config.apiKey || !config.provider) {
        console.log("No AI configuration found. Please configure first:");
        console.log("  naturecode model");
        console.log("\nShowing basic help instead:");
        await this.showSimpleHelp();
        return;
      }

      // Create AI provider based on config
      const { DeepSeekProvider } = await import("../../providers/deepseek.js");
      const { OpenAIProvider } = await import("../../providers/openai.js");
      const { OllamaProvider } = await import("../../providers/ollama.js");
      const { AnthropicProvider } =
        await import("../../providers/anthropic.js");
      const { GeminiProvider } = await import("../../providers/gemini.js");

      let provider;
      switch (config.provider) {
        case "deepseek":
          provider = new DeepSeekProvider(config);
          break;
        case "openai":
          provider = new OpenAIProvider(config);
          break;
        case "ollama":
          provider = new OllamaProvider(config);
          break;
        case "anthropic":
          provider = new AnthropicProvider(config);
          break;
        case "gemini":
          provider = new GeminiProvider(config);
          break;
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }

      // Prepare prompt for AI
      const prompt = `You are NatureCode AI assistant. A user is asking for help with: "${question}"

Please provide helpful, specific guidance about NatureCode features and usage.
Focus on practical steps and examples.

NatureCode is a cross-platform terminal AI assistant with these features:
- Interactive AI sessions (naturecode start)
- Model configuration (naturecode model)
- File system operations
- Git integration
- Code analysis and review
- Project management
- Plugin system
- Session management
- Team collaboration

Provide clear, concise help. If the question is about a specific feature, explain how to use it.`;

      console.log("Thinking...\n");

      // Get AI response
      const response = await provider.generate(prompt);
      console.log(response);
    } catch (error) {
      console.error(`Failed to get AI help: ${error.message}`);
      console.log("\nShowing basic help instead:");
      await this.showSimpleHelp();
    }
  }

  async showSimpleHelp() {
    const helpText = `
NatureCode - Cross-platform Terminal AI Assistant

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
