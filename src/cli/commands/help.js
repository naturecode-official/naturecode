import { Command } from "commander";
import { readFile } from "fs/promises";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createHelpCommand () {
  const helpCommand = new HelpCommand();
  return helpCommand.getCommand();
}

export class HelpCommand {
  constructor () {
    this.command = new Command("help")
      .description("Get direct AI assistance for NatureCode")
      .argument("[question]", "Your question about NatureCode")
      .option("-s, --simple", "Use simple help without AI")
      .option("-d, --docs", "Show full documentation")
      .option("-i, --install-ollama", "Install Ollama automatically")
      .action(this.handleCommand.bind(this));
  }

  getCommand () {
    return this.command;
  }

  async handleCommand (question, options) {
    try {
      if (options.docs) {
        await this.showFullDocs();
        return;
      }

      if (options.installOllama) {
        await this.installOllama();
        return;
      }

      if (options.simple) {
        await this.showSimpleHelp();
        return;
      }

      // Direct AI assistance - no intermediate steps
      if (!question) {
        // Start direct AI chat immediately
        await this.startDirectAIChat();
        return;
      }

      // Get immediate AI help for the question
      await this.getDirectAIHelp(question);
    } catch (error) {
      console.error("Error getting help:", error.message);
      console.log("\nFalling back to simple help...");
      await this.showSimpleHelp();
    }
  }

  async showSimpleHelp () {
    const helpText = `
NatureCode v1.4.5.2 - Cross-platform Terminal AI Assistant

Available Commands:
  start              Start interactive AI session
  model              Configure AI model and API
  help [question]    Get direct AI assistance

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

Plugins:
  plugin list        List installed plugins
  plugin info <id>   Show plugin information
  plugin install <source> Install plugin

Sessions:
  session list       List all sessions
  session create <name> Create new session
  session switch <id> Switch to session

Team Collaboration:
  team create <name> Create new team
  team join <code>   Join existing team
  team list          List all teams

Integration:
  integration status Show integration status
  integration analyze Analyze project for tools

Performance:
  performance start  Start performance monitoring
  performance status Show current metrics
  performance report Generate performance report

Options:
  --help             Show help
  --version          Show version
  --simple           Use simple help without AI
  --docs             Show full documentation
  --install-ollama   Install Ollama automatically

Examples:
  naturecode help                    # Start direct AI chat
  naturecode help "configure model"  # Get AI help for specific question
  naturecode help --simple           # Simple help without AI
  naturecode help --docs             # Full documentation
  naturecode help --install-ollama   # Install Ollama automatically

For direct AI assistance, just run: naturecode help
For specific questions: naturecode help "your question"
`;

    console.log(helpText);
  }

  async showFullDocs () {
    try {
      const docsPath = join(__dirname, "../../../docs.md");
      if (existsSync(docsPath)) {
        const docsContent = await readFile(docsPath, "utf-8");
        console.log(docsContent);
      } else {
        console.log("Documentation file not found. Generating summary...");
        await this.showSimpleHelp();
      }
    } catch (error) {
      console.error("Error reading documentation:", error.message);
      await this.showSimpleHelp();
    }
  }

  async startDirectAIChat () {
    console.clear();
    console.log("NatureCode AI Assistant v1.4.5.2\n");
    console.log("=".repeat(70));
    console.log("Direct AI Assistance Mode");
    console.log("=".repeat(70));
    console.log("I'm ready to help you with NatureCode!");
    console.log("Ask me anything about commands, configuration, or usage.");
    console.log("\nType 'exit' to end the conversation.");
    console.log("=".repeat(70) + "\n");

    // Check and setup Ollama if needed
    const setupSuccess = await this.setupOllamaForDirectChat();
    if (!setupSuccess) {
      return;
    }

    // Get documentation context
    const docsContext = await this.getDocsContext();

    // Start direct chat
    await this.startDirectChatLoop(docsContext);
  }

  async setupOllamaForDirectChat () {
    try {
      // Check if Ollama is installed
      const ollamaInstalled = await this.checkOllamaInstalled();
      if (!ollamaInstalled) {
        console.log("Setting up Ollama for AI assistance...");
        const installSuccess = await this.autoInstallOllama();
        if (!installSuccess) {
          console.log("\nCould not set up Ollama. Using simple help instead.");
          await this.showSimpleHelp();
          return false;
        }
      }

      // Check if DeepSeek model is available
      const deepseekAvailable = await this.checkDeepSeekModel();
      if (!deepseekAvailable) {
        console.log("Downloading AI model...");
        const pullSuccess = await this.autoPullDeepSeekModel();
        if (!pullSuccess) {
          console.log(
            "\nCould not download AI model. Using simple help instead.",
          );
          await this.showSimpleHelp();
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Setup error:", error.message);
      return false;
    }
  }

  async getDirectAIHelp (question) {
    console.log("NatureCode AI Assistant v1.4.5.2\n");

    try {
      // Setup Ollama if needed
      const setupSuccess = await this.setupOllamaForDirectChat();
      if (!setupSuccess) {
        return;
      }

      // Get documentation context
      const docsContext = await this.getDocsContext();

      // Prepare prompt
      const prompt = this.createDirectHelpPrompt(question, docsContext);

      // Get AI response
      console.log("Thinking...");
      const answer = await this.callOllama(prompt);

      console.log("\n" + "=".repeat(70));
      console.log("AI Assistance:");
      console.log("=".repeat(70));
      console.log(answer);
      console.log("=".repeat(70));
      console.log("\nNeed more help? Run: naturecode help");
    } catch (error) {
      console.error("\nError:", error.message);
      console.log("\nShowing simple help instead...");
      await this.showSimpleHelp();
    }
  }

  async startDirectChatLoop (docsContext) {
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "> ",
    });

    let conversationHistory = [];

    rl.prompt();

    rl.on("line", async (line) => {
      const userInput = line.trim();

      if (!userInput) {
        rl.prompt();
        return;
      }

      if (userInput.toLowerCase() === "exit") {
        console.log("\nGoodbye!");
        rl.close();
        return;
      }

      if (userInput.toLowerCase() === "clear") {
        console.clear();
        console.log("NatureCode AI Assistant v1.4.5.2\n");
        rl.prompt();
        return;
      }

      // Show thinking indicator
      process.stdout.write("Thinking... ");

      try {
        // Prepare prompt with conversation history
        const prompt = this.createDirectChatPrompt(
          userInput,
          docsContext,
          conversationHistory,
        );

        // Get AI response
        const response = await this.callOllama(prompt);

        // Clear thinking indicator
        process.stdout.write("\r" + " ".repeat(50) + "\r");

        // Add to conversation history
        conversationHistory.push({ role: "user", content: userInput });
        conversationHistory.push({ role: "assistant", content: response });

        // Show response
        console.log("\n" + response + "\n");
      } catch (error) {
        process.stdout.write("\r" + " ".repeat(50) + "\r");
        console.log("\nError: " + error.message);
        console.log("Please try again.\n");
      }

      rl.prompt();
    });

    rl.on("close", () => {
      console.log("\nAI assistance session ended.");
      process.exit(0);
    });
  }

  createDirectHelpPrompt (question, docsContext) {
    return `You are NatureCode AI Assistant, an expert guide for NatureCode v1.4.5.2.

You are providing direct AI assistance to a user who needs help with NatureCode.
Provide clear, practical, and actionable help.

Documentation context:
${docsContext}

User's question: ${question}

Provide a direct answer with:
1. Clear explanation
2. Step-by-step instructions if needed
3. Exact commands they can copy/paste
4. Format code examples with \`\`\`bash ... \`\`\`
5. Keep it concise but complete

Answer directly without introductions:`;
  }

  createDirectChatPrompt (question, docsContext, history) {
    // Limit history to last 3 exchanges
    const recentHistory = history.slice(-3);

    let historyText = "";
    for (const exchange of recentHistory) {
      if (exchange.role === "user") {
        historyText += `User: ${exchange.content}\n`;
      } else {
        historyText += `Assistant: ${exchange.content}\n`;
      }
    }

    return `You are NatureCode AI Assistant, an expert guide for NatureCode v1.4.5.2.

You are in a direct chat session helping a user with NatureCode.

Documentation context:
${docsContext}

Previous conversation:
${historyText}

Current question:
User: ${question}

Provide direct, practical help. Include commands they can run.
Answer concisely but completely.

Answer:`;
  }

  async getDocsContext () {
    try {
      const docsPath = join(__dirname, "../../../docs.md");
      if (existsSync(docsPath)) {
        const docsContent = await readFile(docsPath, "utf-8");

        // Extract relevant sections based on content length
        if (docsContent.length > 8000) {
          // For large docs, get introduction and table of contents
          const introMatch = docsContent.match(/(^.*?##.*?\n)/s);
          const tocMatch = docsContent.match(/(## Table of Contents.*?\n## )/s);

          let context = "";
          if (introMatch) context += introMatch[1];
          if (tocMatch) context += tocMatch[1];

          // Also get the last 2000 characters which might have recent updates
          context +=
            "\n\nRecent updates and details:\n" + docsContent.substring(-2000);

          return context.substring(0, 6000); // Limit to 6000 chars
        } else {
          // For smaller docs, return everything
          return docsContent;
        }
      } else {
        // Create minimal docs context if file doesn't exist
        return this.createMinimalDocsContext();
      }
    } catch (error) {
      console.error("Error reading documentation:", error.message);
      return this.createMinimalDocsContext();
    }
  }

  createMinimalDocsContext () {
    return `NatureCode v1.4.5.2 - Cross-platform Terminal AI Assistant

## Overview
NatureCode is an AI-powered terminal assistant that helps developers with coding tasks, file operations, and project management.

## Core Commands
- start: Start interactive AI session
- model: Configure AI model and API settings
- help: Get direct AI assistance
- config: Show current configuration
- delmodel: Delete model configuration

## AI Providers
1. DeepSeek: Cloud-based AI (requires API key)
2. OpenAI: Industry-leading models (requires API key)
3. Ollama: Local AI models (free, runs on your machine)

## File Operations
- Read, write, create, delete files
- List directory contents
- Search files by pattern

## Code Analysis
- Code quality analysis
- AI-powered code review
- Code metrics

## Project Management
- Project structure analysis
- Dependency analysis
- Task management

## Getting Started
1. Configure AI model: naturecode model
2. Start session: naturecode start
3. Get help: naturecode help "your question"

## Ollama Integration
NatureCode can use Ollama for local AI processing. When you run 'help' command, it will automatically install Ollama and download AI models if needed.`;
  }

  async checkOllamaInstalled () {
    return new Promise((resolve) => {
      const process = spawn("which", ["ollama"], { stdio: "ignore" });
      process.on("close", (code) => {
        resolve(code === 0);
      });
    });
  }

  async checkDeepSeekModel () {
    return new Promise((resolve) => {
      const process = spawn("ollama", ["list"], { stdio: "pipe" });
      let output = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          // Check for various DeepSeek models
          const hasDeepSeek =
            output.includes("deepseek-coder") ||
            output.includes("deepseek-chat") ||
            output.includes("deepseek-r1") ||
            output.includes("deepseek-v2") ||
            output.includes("deepseek-v2.5");
          resolve(hasDeepSeek);
        } else {
          resolve(false);
        }
      });

      process.on("error", () => {
        resolve(false);
      });
    });
  }

  async callOllama (prompt) {
    return new Promise((resolve, reject) => {
      // Try deepseek-coder first, fall back to deepseek-chat
      const model = "deepseek-coder";
      const process = spawn("ollama", ["run", model], {
        stdio: "pipe",
        timeout: 30000, // 30 second timeout
      });

      let output = "";
      let errorOutput = "";
      let timeoutId = null;

      // Set timeout
      timeoutId = setTimeout(() => {
        if (process && !process.killed) {
          process.kill("SIGTERM");
        }
        reject(new Error("Ollama request timeout (30 seconds)"));
      }, 30000);

      process.stdin.write(prompt);
      process.stdin.end();

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (timeoutId) clearTimeout(timeoutId);

        if (code === 0 && output.trim()) {
          resolve(output.trim());
        } else {
          // Log error for debugging
          if (errorOutput) {
            console.error("Ollama stderr:", errorOutput);
          }
          // Try with deepseek-chat if deepseek-coder fails
          this.fallbackToDeepSeekChat(prompt).then(resolve).catch(reject);
        }
      });

      process.on("error", (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`Ollama error: ${error.message}`));
      });
    });
  }

  async fallbackToDeepSeekChat (prompt) {
    return new Promise((resolve, reject) => {
      const process = spawn("ollama", ["run", "deepseek-chat"], {
        stdio: "pipe",
        timeout: 30000,
      });

      let output = "";
      let errorOutput = "";
      let timeoutId = null;

      // Set timeout
      timeoutId = setTimeout(() => {
        if (process && !process.killed) {
          process.kill("SIGTERM");
        }
        reject(new Error("Ollama request timeout (30 seconds)"));
      }, 30000);

      process.stdin.write(prompt);
      process.stdin.end();

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (timeoutId) clearTimeout(timeoutId);

        if (code === 0 && output.trim()) {
          resolve(output.trim());
        } else {
          // Log error for debugging
          if (errorOutput) {
            console.error("Ollama fallback stderr:", errorOutput);
          }
          reject(
            new Error("Failed to get response from Ollama with any model"),
          );
        }
      });

      process.on("error", (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`Ollama error: ${error.message}`));
      });
    });
  }

  async autoInstallOllama () {
    console.log("Setting up AI assistant...");

    const platform = process.platform;

    if (platform === "win32") {
      console.log("For Windows:");
      console.log("1. Download Ollama from https://ollama.ai/download");
      console.log("2. Install and run: ollama pull deepseek-coder");
      return false;
    }

    // macOS and Linux
    console.log("Installing Ollama...");

    const { exec } = await import("child_process");

    return new Promise((resolve) => {
      // Install Ollama
      exec(
        "curl -fsSL https://ollama.ai/install.sh | sh",
        (installError, _installStdout, _installStderr) => {
          if (installError) {
            console.log("Installation may need manual steps.");
            console.log("Please install from: https://ollama.ai");
            resolve(false);
            return;
          }

          console.log("Ollama installed. Downloading AI model...");

          // Try to download a model
          this.autoPullDeepSeekModel().then((success) => {
            if (success) {
              console.log("\nAI assistant setup complete!");
              console.log("You can now use: naturecode help");
              resolve(true);
            } else {
              resolve(false);
            }
          });
        },
      );
    });
  }

  async autoPullDeepSeekModel () {
    console.log("Downloading AI model...");

    const { exec } = await import("child_process");

    // Try different models in order of preference
    const modelsToTry = [
      "deepseek-coder:latest",
      "deepseek-coder:6.7b",
      "deepseek-chat:latest",
      "deepseek-chat:6.7b",
      "deepseek-r1:latest",
      "llama3.2:latest",
      "llama3.1:latest",
      "llama3:latest",
      "mistral:latest",
      "codellama:latest",
    ];

    return new Promise((resolve) => {
      const tryModel = (index) => {
        if (index >= modelsToTry.length) {
          console.log("\nCould not download any AI model.");
          console.log("Please install a model manually:");
          console.log("  ollama pull deepseek-coder");
          resolve(false);
          return;
        }

        const model = modelsToTry[index];
        console.log(`\nTrying ${model}...`);

        exec(`ollama pull ${model}`, (error, _stdout, _stderr) => {
          if (error) {
            console.log(`Failed to pull ${model}`);
            // Try next model
            tryModel(index + 1);
          } else {
            console.log(`Successfully downloaded ${model}!`);
            resolve(true);
          }
        });
      };

      // Start with first model
      tryModel(0);
    });
  }

  async installOllama () {
    console.log("Setting up AI assistant...");

    const platform = process.platform;

    if (platform === "win32") {
      console.log("For Windows:");
      console.log("1. Download Ollama from https://ollama.ai/download");
      console.log("2. Install and run: ollama pull deepseek-coder");
      return;
    }

    // macOS and Linux
    console.log("Installing Ollama...");

    const { exec } = await import("child_process");

    // Install Ollama
    exec(
      "curl -fsSL https://ollama.ai/install.sh | sh",
      (installError, _installStdout, _installStderr) => {
        if (installError) {
          console.log("Installation may need manual steps.");
          console.log("Please install from: https://ollama.ai");
          return;
        }

        console.log("Ollama installed. Downloading AI model...");

        // Try to download a model
        this.autoPullDeepSeekModel().then((success) => {
          if (success) {
            console.log("\nAI assistant setup complete!");
            console.log("You can now use: naturecode help");
          }
        });
      },
    );
  }
}

// Export for testing
export default HelpCommand;
