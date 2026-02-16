import { OpenAIProvider } from "./openai.js";

export class FourSAPIProvider extends OpenAIProvider {
  constructor () {
    super();
    this.name = "4sapi";
    this.displayName = "4SAPI";
    this.supportsStreaming = true;
  }

  validateConfig (config) {
    // 验证4SAPI配置
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("4SAPI API key is required");
    }

    if (!config.model || typeof config.model !== "string") {
      throw new Error("4SAPI model name is required");
    }

    // 4SAPI使用固定的base URL
    if (config.baseUrl && config.baseUrl !== "https://4sapi.com/v1") {
      console.warn(
        "4SAPI uses fixed base URL: https://4sapi.com/v1. Custom base URL will be ignored.",
      );
    }
  }

  _getApiUrl (_config) {
    // 4SAPI使用固定的base URL
    return "https://4sapi.com/v1/chat/completions";
  }

  _getHeaders (config) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };

    // 添加可选的organization头
    if (config.organization) {
      headers["OpenAI-Organization"] = config.organization;
    }

    return headers;
  }

  _getRequestBody (prompt, options, config) {
    const body = {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: config.model,
      stream: options.stream || false,
    };

    // 添加可选参数
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    } else if (config.temperature !== undefined) {
      body.temperature = config.temperature;
    }

    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    } else if (config.maxTokens !== undefined) {
      body.max_tokens = config.maxTokens;
    }

    if (options.topP !== undefined) {
      body.top_p = options.topP;
    }

    if (options.frequencyPenalty !== undefined) {
      body.frequency_penalty = options.frequencyPenalty;
    }

    if (options.presencePenalty !== undefined) {
      body.presence_penalty = options.presencePenalty;
    }

    return body;
  }

  static getStaticAvailableModels () {
    // 4SAPI支持的模型（基于OpenAI兼容模型）
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-4-32k",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-3.5-turbo-instruct",
      "dall-e-3",
      "dall-e-2",
      "tts-1",
      "tts-1-hd",
      "whisper-1",
      "text-embedding-ada-002",
      "text-embedding-3-small",
      "text-embedding-3-large",
    ];
  }

  static getStaticModelDescriptions () {
    return {
      "gpt-4o": "最新多模态模型，支持文本和图像",
      "gpt-4o-mini": "轻量版GPT-4o，性价比高",
      "gpt-4-turbo": "增强版GPT-4，支持128K上下文",
      "gpt-4": "标准GPT-4模型",
      "gpt-4-32k": "32K上下文的GPT-4模型",
      "gpt-3.5-turbo": "GPT-3.5 Turbo，性价比高",
      "gpt-3.5-turbo-16k": "16K上下文的GPT-3.5 Turbo",
      "gpt-3.5-turbo-instruct": "指令优化的GPT-3.5 Turbo",
      "dall-e-3": "最新图像生成模型",
      "dall-e-2": "标准图像生成模型",
      "tts-1": "文本转语音模型",
      "tts-1-hd": "高清文本转语音模型",
      "whisper-1": "语音转文本模型",
      "text-embedding-ada-002": "文本嵌入模型",
      "text-embedding-3-small": "小型文本嵌入模型",
      "text-embedding-3-large": "大型文本嵌入模型",
    };
  }

  static getStaticModelCapabilities (model) {
    // 基于模型类型返回能力
    const capabilities = ["text", "chat"];

    if (model.includes("gpt-4o") || model.includes("gpt-4-turbo")) {
      capabilities.push("vision");
    }

    if (model.includes("dall-e")) {
      capabilities.push("image-generation");
    }

    if (model.includes("tts")) {
      capabilities.push("text-to-speech");
    }

    if (model.includes("whisper")) {
      capabilities.push("speech-to-text");
    }

    if (model.includes("embedding")) {
      capabilities.push("embeddings");
    }

    return capabilities;
  }
}
