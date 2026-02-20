import { OpenAIProvider } from "./openai.js";

export class N1NProvider extends OpenAIProvider {
  constructor() {
    super();
    this.name = "n1n";
    this.displayName = "n1n.ai";
    this.supportsStreaming = true;
    this.baseUrl = "https://api.n1n.top/v1";
  }

  validateConfig(config) {
    // 验证n1n.ai配置
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("n1n.ai API key is required");
    }

    if (!config.model || typeof config.model !== "string") {
      throw new Error("n1n.ai model name is required");
    }

    console.log(`ℹ️  Using n1n.ai model: ${config.model}`);
    console.log(
      "ℹ️  n1n.ai uses OpenAI-compatible API at https://api.n1n.top/v1",
    );

    return true;
  }

  _getApiUrl(config) {
    // n1n.ai使用固定的base URL
    // 只使用聊天端点（language interaction only）
    const endpoint = "/chat/completions";
    return `${this.baseUrl}${endpoint}`;
  }

  static getStaticAvailableModels() {
    // n1n.ai支持的模型（基于OpenAI兼容模型）
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-3.5-turbo-instruct",
      "dall-e-3",
      "whisper-1",
      "tts-1",
      "tts-1-hd",
    ];
  }

  static getStaticModelDescriptions() {
    return {
      "gpt-4o": "最新多模态模型，支持文本和图像",
      "gpt-4o-mini": "轻量版GPT-4o，性价比高",
      "gpt-4-turbo": "增强版GPT-4，支持128K上下文",
      "gpt-4": "标准GPT-4模型",
      "gpt-3.5-turbo": "经济实惠的GPT-3.5 Turbo",
      "gpt-3.5-turbo-16k": "16K上下文的GPT-3.5 Turbo",
      "gpt-3.5-turbo-instruct": "指令优化版GPT-3.5",
      "dall-e-3": "文生图模型",
      "whisper-1": "语音识别模型",
      "tts-1": "文本转语音模型",
      "tts-1-hd": "高清文本转语音模型",
    };
  }

  static getStaticModelCapabilities(model) {
    // 基于模型类型返回能力
    const capabilities = ["text", "chat"];

    if (model.includes("gpt-4o") || model.includes("gpt-4-turbo")) {
      capabilities.push("vision");
    }

    if (model.includes("dall-e")) {
      capabilities.push("image-generation");
    }

    if (model.includes("whisper")) {
      capabilities.push("audio");
    }

    if (model.includes("tts")) {
      capabilities.push("text-to-speech");
    }

    return capabilities;
  }
}
