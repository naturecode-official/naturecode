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
    // 只检查模型名是否存在，不验证是否在预定义列表中
    if (!config.model || typeof config.model !== "string") {
      throw new Error("Ollama model name is required");
    }

    console.log(`ℹ️  Using model: ${config.model}`);
    console.log("ℹ️  Run 'ollama list' to see available models");

    return true;
  }

  getAvailableModels() {
    return OllamaProvider.getStaticAvailableModels();
  }

  static getStaticAvailableModels() {
    return [
      // Meta 系列
      "llama3.2",
      "llama3.2:latest",
      "llama3.1",
      "llama3.1:latest",

      // Mistral 系列
      "mistral",
      "mistral:latest",
      "mixtral",
      "mixtral:latest",

      // 代码生成系列
      "codellama",
      "codellama:latest",

      // DeepSeek 系列
      "deepseek-coder",
      "deepseek-coder:latest",
      "deepseek-chat",
      "deepseek-chat:latest",
      "deepseek-math",
      "deepseek-math:latest",
      "deepseek-reasoner",
      "deepseek-reasoner:latest",
      "deepseek-v2",
      "deepseek-v2:latest",
      "deepseek-v2-lite",
      "deepseek-v2-lite:latest",

      // 其他模型
      "phi",
      "phi:latest",
      "qwen",
      "qwen:latest",

      // GPT 开源系列 (从 OpenAI 迁移)
      "gpt-oss-120b",
      "gpt-oss-20b",

      // Google Gemma 系列
      "gemma-2b",
      "gemma-2b-it",
      "gemma-7b",
      "gemma-7b-it",
      "gemma-2-9b",
      "gemma-2-9b-it",
      "gemma-2-27b",
      "gemma-2-27b-it",
    ];
  }

  static getStaticModelDescriptions() {
    return {
      // Meta 系列
      "llama3.2": "Meta Llama 3.2 - General purpose model",
      "llama3.2:latest": "Meta Llama 3.2 (latest)",
      "llama3.1": "Meta Llama 3.1 - General purpose model",
      "llama3.1:latest": "Meta Llama 3.1 (latest)",

      // Mistral 系列
      mistral: "Mistral 7B - Efficient French model",
      "mistral:latest": "Mistral 7B (latest)",
      mixtral: "Mixtral 8x7B - Mixture of experts",
      "mixtral:latest": "Mixtral 8x7B (latest)",

      // 代码生成系列
      codellama: "Code Llama - Specialized for code generation",
      "codellama:latest": "Code Llama (latest)",

      // DeepSeek 系列
      "deepseek-coder": "DeepSeek Coder - Code generation model",
      "deepseek-coder:latest": "DeepSeek Coder (latest)",
      "deepseek-chat": "DeepSeek Chat - General chat model",
      "deepseek-chat:latest": "DeepSeek Chat (latest)",
      "deepseek-math": "DeepSeek Math - Mathematical reasoning model",
      "deepseek-math:latest": "DeepSeek Math (latest)",
      "deepseek-reasoner": "DeepSeek Reasoner - Complex reasoning model",
      "deepseek-reasoner:latest": "DeepSeek Reasoner (latest)",
      "deepseek-v2": "DeepSeek V2 - Latest generation model",
      "deepseek-v2:latest": "DeepSeek V2 (latest)",
      "deepseek-v2-lite": "DeepSeek V2 Lite - Lightweight version",
      "deepseek-v2-lite:latest": "DeepSeek V2 Lite (latest)",

      // 其他模型
      phi: "Microsoft Phi - Small but capable model",
      "phi:latest": "Microsoft Phi (latest)",
      qwen: "Qwen - Alibaba's general model",
      "qwen:latest": "Qwen (latest)",

      // GPT 开源系列 (从 OpenAI 迁移)
      "gpt-oss-120b": "GPT OSS 120B - Open-source large model, 128K context",
      "gpt-oss-20b": "GPT OSS 20B - Open-source lightweight model, 64K context",

      // Google Gemma 系列
      "gemma-2b": "Google Gemma 2B - Small but capable model",
      "gemma-2b-it": "Google Gemma 2B Instruct - Instruction-tuned version",
      "gemma-7b": "Google Gemma 7B - Balanced performance model",
      "gemma-7b-it": "Google Gemma 7B Instruct - Instruction-tuned version",
      "gemma-2-9b": "Google Gemma 2 9B - Enhanced 9B parameter model",
      "gemma-2-9b-it": "Google Gemma 2 9B Instruct - Instruction-tuned version",
      "gemma-2-27b": "Google Gemma 2 27B - Large 27B parameter model",
      "gemma-2-27b-it":
        "Google Gemma 2 27B Instruct - Instruction-tuned version",
    };
  }

  getModelDescription(model) {
    const descriptions = OllamaProvider.getStaticModelDescriptions();
    return descriptions[model] || "Ollama language model";
  }

  static getStaticModelCapabilities(model) {
    // Determine capabilities based on model name
    const capabilities = ["text", "chat"];

    // 代码生成能力
    if (
      model.includes("coder") ||
      model.includes("code") ||
      model.includes("phi") ||
      model.includes("gemma") || // Gemma 模型通常有代码能力
      model.includes("deepseek-coder") // DeepSeek Coder 专门用于代码
    ) {
      capabilities.push("code");
    }

    // 视觉能力
    if (model.includes("vision") || model.includes("llava")) {
      capabilities.push("vision");
    }

    // 开源模型特定能力
    if (model.includes("gpt-oss")) {
      capabilities.push("open-source");
      capabilities.push("customizable");
      if (model.includes("120b")) {
        capabilities.push("large-model");
        capabilities.push("128k-context");
      } else if (model.includes("20b")) {
        capabilities.push("lightweight");
        capabilities.push("64k-context");
      }
    }

    // DeepSeek 模型特定能力
    if (model.includes("deepseek")) {
      capabilities.push("deepseek");
      capabilities.push("chinese-optimized");

      if (model.includes("coder")) {
        capabilities.push("code-specialized");
        capabilities.push("programming");
      } else if (model.includes("chat")) {
        capabilities.push("general-purpose");
        capabilities.push("conversation");
      } else if (model.includes("math")) {
        capabilities.push("mathematical");
        capabilities.push("reasoning");
      } else if (model.includes("reasoner")) {
        capabilities.push("complex-reasoning");
        capabilities.push("problem-solving");
      } else if (model.includes("v2")) {
        capabilities.push("latest-generation");
        if (model.includes("lite")) {
          capabilities.push("lightweight");
          capabilities.push("efficient");
        } else {
          capabilities.push("full-capability");
          capabilities.push("advanced");
        }
      }
    }

    // Gemma 模型特定能力
    if (model.includes("gemma")) {
      capabilities.push("google");
      capabilities.push("open-source");
      if (model.includes("it")) {
        capabilities.push("instruction-tuned");
      }
      if (model.includes("2b")) {
        capabilities.push("small-model");
      } else if (model.includes("7b")) {
        capabilities.push("medium-model");
      } else if (model.includes("9b")) {
        capabilities.push("large-model");
      } else if (model.includes("27b")) {
        capabilities.push("xlarge-model");
      }
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
