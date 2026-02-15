import { Command } from "commander";
import { readFile } from "fs/promises";
import { spawn } from "child_process";
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
      .description("Get direct AI assistance for NatureCode")
      .argument("[question]", "Your question about NatureCode")
      .option("-s, --simple", "Use simple help without AI")
      .option("-d, --docs", "Show full documentation")
      .option("-i, --install-ollama", "Install Ollama automatically")
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

  async showSimpleHelp() {
    const helpText = `
NatureCode v1.4.6 - Cross-platform Terminal AI Assistant

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

  async showFullDocs() {
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

  async startDirectAIChat() {
    console.clear();
    console.log("NatureCode AI Assistant v1.4.6\n");
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

  async setupOllamaForDirectChat() {
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

  async getDirectAIHelp(question) {
    console.log("NatureCode AI Assistant v1.4.6\n");

    try {
      // Check if Ollama is available first
      const ollamaInstalled = await this.checkOllamaInstalled();
      if (!ollamaInstalled) {
        console.log("🤖 Setting up AI assistant for the first time...");
        console.log("This will install Ollama and download an AI model.");
        console.log(
          "It may take a few minutes depending on your internet speed.\n",
        );

        const setupSuccess = await this.setupOllamaForDirectChat();
        if (!setupSuccess) {
          console.log("\n📚 Showing documentation-based help instead...");
          await this.showDocsBasedHelp(question);
          return;
        }
      }

      // Setup Ollama if needed
      const setupSuccess = await this.setupOllamaForDirectChat();
      if (!setupSuccess) {
        console.log("\n📚 Showing documentation-based help instead...");
        await this.showDocsBasedHelp(question);
        return;
      }

      // Get documentation context
      const docsContext = await this.getDocsContext();

      // Prepare prompt
      const prompt = this.createDirectHelpPrompt(question, docsContext);

      console.log("Thinking...\n");

      try {
        const answer = await this.callOllama(prompt);

        console.log("\n" + "=".repeat(70));
        console.log("AI Assistance:");
        console.log("=".repeat(70));
        console.log(answer);
        console.log("=".repeat(70));
        console.log("\nNeed more help? Run: naturecode help");
      } catch (ollamaError) {
        console.log(
          "\n⚠️  AI assistant is taking longer than expected to respond.",
        );
        console.log("This could be because:");
        console.log("  1. The AI model is still loading (first time use)");
        console.log("  2. Your system needs more resources");
        console.log("  3. Network connectivity issues\n");

        console.log("📚 In the meantime, here's documentation-based help:");
        console.log("=".repeat(70));
        await this.showDocsBasedHelp(question);
      }
    } catch (error) {
      console.error("\nError:", error.message);
      console.log("\n📚 Showing documentation-based help instead...");
      await this.showDocsBasedHelp(question);
    }
  }

  async startDirectChatLoop(docsContext) {
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
        console.log("NatureCode AI Assistant v1.4.6\n");
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

  createDirectHelpPrompt(question, docsContext) {
    return `You are NatureCode AI Assistant, an expert guide for NatureCode v1.4.6.

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

  createDirectChatPrompt(question, docsContext, history) {
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

    return `You are NatureCode AI Assistant, an expert guide for NatureCode v1.4.6.

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

  async getDocsContext() {
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

  createMinimalDocsContext() {
    return `NatureCode v1.4.6 - Cross-platform Terminal AI Assistant

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

  async checkOllamaInstalled() {
    return new Promise((resolve) => {
      const process = spawn("which", ["ollama"], { stdio: "ignore" });
      process.on("close", (code) => {
        resolve(code === 0);
      });
    });
  }

  async checkDeepSeekModel() {
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

  async callOllama(prompt) {
    return new Promise((resolve, reject) => {
      // Try available models in order
      const modelsToTry = ["deepseek-coder:latest"];

      const tryModel = (index) => {
        if (index >= modelsToTry.length) {
          reject(
            new Error(
              "No Ollama models available. Try: ollama pull deepseek-coder",
            ),
          );
          return;
        }

        const model = modelsToTry[index];
        const process = spawn("ollama", ["run", model, "--nowordwrap"], {
          stdio: "pipe",
        });

        let output = "";
        let hasOutput = false;
        let timeoutId = null;

        // 90 second timeout for Ollama (needs time to load models)
        timeoutId = setTimeout(() => {
          console.log(`Model "${model}" timed out after 90 seconds.`);
          process.kill("SIGKILL");
          reject(new Error("Ollama model loading timeout"));
        }, 90000);

        process.stdin.write(prompt);
        process.stdin.end();

        process.stdout.on("data", (data) => {
          hasOutput = true;
          output += data.toString();
        });

        // Completely ignore stderr
        process.stderr.on("data", () => {});

        process.on("close", (code) => {
          if (timeoutId) clearTimeout(timeoutId);

          if (hasOutput && output.trim()) {
            resolve(output.trim());
          } else {
            reject(new Error("Ollama process closed without output"));
          }
        });

        process.on("error", (error) => {
          if (timeoutId) clearTimeout(timeoutId);
          tryModel(index + 1);
        });
      };

      tryModel(0);
    });
  }
  async autoInstallOllama() {
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

  async autoPullDeepSeekModel() {
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

  async installOllama() {
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

  async showDocsBasedHelp(question) {
    try {
      const docsContext = await this.getDocsContext();

      // Simple keyword matching for common questions
      const lowerQuestion = question.toLowerCase();

      console.log("\n" + "=".repeat(70));
      console.log("NatureCode AI Assistant - Documentation Help");
      console.log("=".repeat(70));

      // Handle common questions in English (AI will handle translation)
      if (
        lowerQuestion.includes("who are you") ||
        lowerQuestion.includes("what are you") ||
        lowerQuestion.includes("你是谁")
      ) {
        console.log(`
 🤖 I am NatureCode AI Assistant!

 I am NatureCode v1.4.6's intelligent assistant, specialized in helping developers:
 • Use NatureCode's various features
 • Solve programming problems
 • Manage projects and code
 • Provide AI-driven development advice

 🚀 What I can do:
 1. Answer NatureCode usage questions
 2. Provide code analysis and review
 3. Help configure AI models
 4. Guide Git operations
 5. Assist with project management

 💡 How to interact with me:
 • Direct questions: naturecode help "your question"
 • Start conversation: naturecode help
 • View commands: naturecode --help

 📚 Learn more:
 • Full documentation: naturecode help --docs
 • Simple help: naturecode help --simple
 • Install AI: naturecode help --install-ollama
`);
      } else if (
        lowerQuestion.includes("how to start") ||
        lowerQuestion.includes("getting started") ||
        lowerQuestion.includes("如何开始")
      ) {
        console.log(`
 🚀 How to get started with NatureCode:

 1. Configure AI model:
    naturecode model

 2. Start interactive session:
    naturecode start

 3. Get help:
    naturecode help "your question"

 4. View all commands:
    naturecode --help

 📦 Automatic AI assistant installation:
 When you first run naturecode help, it will automatically install Ollama and DeepSeek models.

 🔧 Manual AI installation:
 - Ollama: curl -fsSL https://ollama.ai/install.sh | sh
 - DeepSeek model: ollama pull deepseek-coder

 💡 Examples:
    naturecode help "how to configure DeepSeek API"
    naturecode help "how to use Git features"
    naturecode help "how to use code analysis"
`);
      } else if (
        lowerQuestion.includes("configure") ||
        lowerQuestion.includes("model") ||
        lowerQuestion.includes("配置")
      ) {
        console.log(`
 🤖 Configure AI Models:

 NatureCode supports three AI providers:

 1. DeepSeek (Recommended)
    - Requires API key: https://platform.deepseek.com/
    - Run: naturecode model
    - Select DeepSeek, enter API key

 2. OpenAI
    - Requires API key: https://platform.openai.com/
    - Run: naturecode model
    - Select OpenAI, enter API key

 3. Ollama (Local, Free)
    - Automatic installation: runs when you first use naturecode help
    - Or manual: curl -fsSL https://ollama.ai/install.sh | sh
    - Model: ollama pull deepseek-coder

 📝 Configuration file location: ~/.naturecode/config.json
`);
      } else if (
        lowerQuestion.includes("git") ||
        lowerQuestion.includes("版本控制")
      ) {
        console.log(`
 🔧 Git Integration Features:

 Available commands:
   naturecode git status      # Show Git status
   naturecode git diff        # Show changes
   naturecode git commit      # Commit changes
   naturecode git push        # Push to remote repository
   naturecode git pull        # Pull from remote

 💡 Examples:
   naturecode git status
   naturecode git commit -m "Fixed bug"
   naturecode git push origin main
`);
      } else if (
        lowerQuestion.includes("code") ||
        lowerQuestion.includes("分析") ||
        lowerQuestion.includes("代码")
      ) {
        console.log(`
 📊 Code Analysis Features:

 Available commands:
   naturecode code analyze    # Analyze code quality
   naturecode code review     # AI code review
   naturecode code metrics    # Show code metrics

 💡 Examples:
   naturecode code analyze src/
   naturecode code review main.js
   naturecode code metrics .
`);
      } else if (
        lowerQuestion.includes("commands") ||
        lowerQuestion.includes("功能") ||
        lowerQuestion.includes("命令")
      ) {
        console.log(`
 📋 NatureCode Main Features:

 🎯 Core Features:
 • AI Assistant: naturecode help
 • Interactive Session: naturecode start
 • Model Configuration: naturecode model

 📁 File Operations:
 • Read file: naturecode read <file>
 • Edit file: naturecode edit <file>
 • Create file: naturecode create <file>
 • Delete file: naturecode delete <file>
 • List directory: naturecode list <dir>

 🔧 Git Operations:
 • Status view: naturecode git status
 • Diff view: naturecode git diff
 • Commit changes: naturecode git commit
 • Push code: naturecode git push
 • Pull updates: naturecode git pull

 📊 Code Analysis:
 • Quality analysis: naturecode code analyze
 • AI review: naturecode code review
 • Metrics: naturecode code metrics

 🏗️ Project Management:
 • Project analysis: naturecode project analyze
 • Create project: naturecode project create
 • Dependency analysis: naturecode project deps

 🔌 Plugin System:
 • Plugin list: naturecode plugin list
 • Plugin info: naturecode plugin info <id>
 • Install plugin: naturecode plugin install <source>

 💡 More help:
 • View all commands: naturecode --help
 • Full documentation: naturecode help --docs
 • AI conversation: naturecode help
`);
      } else if (
        lowerQuestion.includes("hello") ||
        lowerQuestion.includes("hi") ||
        lowerQuestion.includes("你好")
      ) {
        console.log(`
 👋 Hello! I am NatureCode AI Assistant!

 Nice to meet you! I am NatureCode v1.4.6's intelligent assistant.

 🚀 How I can help you:
 • Answer NatureCode usage questions
 • Provide programming help and code analysis
 • Manage files and projects
 • Configure AI models and tools

 💡 Try these commands:
   naturecode start          # Start interactive session
   naturecode help "how to start" # Get getting started guide
   naturecode model          # Configure AI model
   naturecode --help         # View all commands

 📚 Learn more:
 • Full documentation: naturecode help --docs
 • AI help: naturecode help (requires Ollama)
 • Simple help: naturecode help --simple

 🤖 AI Assistant Status:
 System detects Ollama is installed, but AI model may need time to load.
 First use or after long idle time, model loading may take 1-2 minutes.
`);
      } else {
        // General help from docs
        const introMatch = docsContext.match(/(^.*?##.*?\n)/s);
        if (introMatch) {
          console.log(introMatch[1]);
        }

        console.log(`
 🔍 Based on your question "${question}", we suggest:

 1. View full documentation: run naturecode help --docs
 2. Get AI help (requires Ollama installation):
    - Automatic installation: run naturecode help
    - Manual installation: curl -fsSL https://ollama.ai/install.sh | sh
 3. View simple help: naturecode help --simple

 💡 Common questions:
   • Who are you? → naturecode help "who are you"
   • How to start? → naturecode help "how to start"
   • How to configure AI? → naturecode help "configure model"
   • How to use Git? → naturecode help "git features"
   • Code analysis? → naturecode help "code analysis"
   • What commands are available? → naturecode help "commands"
   • Hello → naturecode help "hello"
`);
      }

      console.log("=".repeat(70));
      console.log("\nNeed full AI help? Run: naturecode help");
      console.log(
        "(First run will automatically install Ollama and AI models)",
      );
    } catch (error) {
      console.log("\n显示简单帮助...");
      await this.showSimpleHelp();
    }
  }
}

// Export for testing
export default HelpCommand;
