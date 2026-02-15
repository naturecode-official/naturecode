import { spawn } from "child_process";
import { AIProvider } from "./base.js";

export class OllamaProvider extends AIProvider {
  constructor(config) {
    super(config);
    // Only validate if model is provided
    if (config.model) {
      this.validateConfig(config);
    }

    // Initialize file system
    this.initializeFileSystem();
  }

  validateConfig(config) {
    // For Ollama, API key is not required
    // But we need to validate the model
    if (config.model && !this.getAvailableModels().includes(config.model)) {
      throw new Error(
        `Ollama model must be one of: ${this.getAvailableModels().join(", ")}`,
      );
    }

    return true;
  }

  getAvailableModels() {
    return OllamaProvider.getStaticAvailableModels();
  }

  static getStaticAvailableModels() {
    return [
      "llama3.2",
      "llama3.2:latest",
      "llama3.1",
      "llama3.1:latest",
      "mistral",
      "mistral:latest",
      "mixtral",
      "mixtral:latest",
      "codellama",
      "codellama:latest",
      "deepseek-coder",
      "deepseek-coder:latest",
      "deepseek-chat",
      "deepseek-chat:latest",
      "phi",
      "phi:latest",
      "qwen",
      "qwen:latest",
    ];
  }

  static getStaticModelDescriptions() {
    return {
      "llama3.2": "Meta Llama 3.2 - General purpose model",
      "llama3.2:latest": "Meta Llama 3.2 (latest)",
      "llama3.1": "Meta Llama 3.1 - General purpose model",
      "llama3.1:latest": "Meta Llama 3.1 (latest)",
      mistral: "Mistral 7B - Efficient French model",
      "mistral:latest": "Mistral 7B (latest)",
      mixtral: "Mixtral 8x7B - Mixture of experts",
      "mixtral:latest": "Mixtral 8x7B (latest)",
      codellama: "Code Llama - Specialized for code generation",
      "codellama:latest": "Code Llama (latest)",
      "deepseek-coder": "DeepSeek Coder - Code generation model",
      "deepseek-coder:latest": "DeepSeek Coder (latest)",
      "deepseek-chat": "DeepSeek Chat - General chat model",
      "deepseek-chat:latest": "DeepSeek Chat (latest)",
      phi: "Microsoft Phi - Small but capable model",
      "phi:latest": "Microsoft Phi (latest)",
      qwen: "Qwen - Alibaba's general model",
      "qwen:latest": "Qwen (latest)",
    };
  }

  getModelDescription(model) {
    const descriptions = OllamaProvider.getStaticModelDescriptions();
    return descriptions[model] || "Ollama language model";
  }

  static getStaticModelCapabilities(model) {
    // Determine capabilities based on model name
    const capabilities = ["text", "chat"];

    if (
      model.includes("coder") ||
      model.includes("code") ||
      model.includes("phi")
    ) {
      capabilities.push("code");
    }

    if (model.includes("vision") || model.includes("llava")) {
      capabilities.push("vision");
    }

    return capabilities;
  }

  async checkOllamaInstalled() {
    return new Promise((resolve) => {
      const process = spawn("which", ["ollama"], { stdio: "ignore" });
      process.on("close", (code) => {
        resolve(code === 0);
      });
    });
  }

  async checkModelAvailable(model) {
    return new Promise((resolve) => {
      const process = spawn("ollama", ["list"], { stdio: "pipe" });
      let output = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          // Check if the model is in the list
          const hasModel = output.includes(model.split(":")[0]);
          resolve(hasModel);
        } else {
          resolve(false);
        }
      });

      process.on("error", () => {
        resolve(false);
      });
    });
  }

  async generate(prompt, options = {}) {
    const mergedOptions = this._mergeOptions(options);
    const model = this.config.model || "llama3.2:latest";

    // Check if Ollama is installed
    const ollamaInstalled = await this.checkOllamaInstalled();
    if (!ollamaInstalled) {
      throw new Error(
        "Ollama is not installed. Please install Ollama first: https://ollama.ai",
      );
    }

    // Check if model is available
    const modelAvailable = await this.checkModelAvailable(model);
    if (!modelAvailable) {
      throw new Error(
        `Model "${model}" is not available. Please pull it first: ollama pull ${model}`,
      );
    }

    return new Promise((resolve, reject) => {
      const process = spawn("ollama", ["run", model, "--nowordwrap"], {
        stdio: "pipe",
      });

      let output = "";
      let errorOutput = "";

      // Prepare the prompt with system message if provided
      let fullPrompt = prompt;
      if (options.systemMessage) {
        fullPrompt = `System: ${options.systemMessage}\n\nUser: ${prompt}`;
      }

      process.stdin.write(fullPrompt);
      process.stdin.end();

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0 && output.trim()) {
          resolve({
            content: output.trim(),
            model: model,
            usage: {
              prompt_tokens: this._estimateTokens(prompt),
              completion_tokens: this._estimateTokens(output),
              total_tokens: this._estimateTokens(prompt + output),
            },
          });
        } else {
          reject(
            new Error(
              `Ollama generation failed: ${errorOutput || "Unknown error"}`,
            ),
          );
        }
      });

      process.on("error", (error) => {
        reject(new Error(`Ollama process error: ${error.message}`));
      });

      // Set timeout if specified
      if (mergedOptions.timeout) {
        setTimeout(() => {
          process.kill();
          reject(new Error("Ollama generation timeout"));
        }, mergedOptions.timeout);
      }
    });
  }

  async streamGenerate(prompt, options = {}) {
    const mergedOptions = this._mergeOptions(options);
    const model = this.config.model || "llama3.2:latest";

    // Check if Ollama is installed
    const ollamaInstalled = await this.checkOllamaInstalled();
    if (!ollamaInstalled) {
      throw new Error(
        "Ollama is not installed. Please install Ollama first: https://ollama.ai",
      );
    }

    // Check if model is available
    const modelAvailable = await this.checkModelAvailable(model);
    if (!modelAvailable) {
      throw new Error(
        `Model "${model}" is not available. Please pull it first: ollama pull ${model}`,
      );
    }

    const process = spawn("ollama", ["run", model, "--nowordwrap"], {
      stdio: "pipe",
    });

    // Prepare the prompt with system message if provided
    let fullPrompt = prompt;
    if (options.systemMessage) {
      fullPrompt = `System: ${options.systemMessage}\n\nUser: ${prompt}`;
    }

    process.stdin.write(fullPrompt);
    process.stdin.end();

    // Return a readable stream
    return {
      stream: process.stdout,
      cancel: () => {
        process.kill();
      },
      model: model,
    };
  }

  _estimateTokens(text) {
    // Simple token estimation: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  _handleError(error) {
    if (error.message.includes("not installed")) {
      throw new Error(
        "Ollama is not installed. Please install from https://ollama.ai",
      );
    } else if (error.message.includes("not available")) {
      const modelMatch = error.message.match(/Model "([^"]+)"/);
      if (modelMatch) {
        throw new Error(
          `Model "${modelMatch[1]}" is not available. Run: ollama pull ${modelMatch[1]}`,
        );
      }
      throw error;
    } else if (error.message.includes("timeout")) {
      throw new Error(
        "Ollama generation timeout. Try again or use a simpler prompt.",
      );
    } else {
      throw new Error(`Ollama error: ${error.message}`);
    }
  }
}

export default OllamaProvider;
