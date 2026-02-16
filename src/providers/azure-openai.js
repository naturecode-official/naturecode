import { OpenAIProvider } from "./openai.js";

export class AzureOpenAIProvider extends OpenAIProvider {
  constructor() {
    super();
    this.name = "azure-openai";
    this.displayName = "Azure OpenAI";
    this.supportsStreaming = true;
  }

  validateConfig(config) {
    // 验证Azure OpenAI配置
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("Azure OpenAI API key is required");
    }

    if (!config.model || typeof config.model !== "string") {
      throw new Error("Azure OpenAI model name is required");
    }

    if (!config.resourceName || typeof config.resourceName !== "string") {
      throw new Error("Azure OpenAI resource name is required");
    }

    if (!config.apiVersion || typeof config.apiVersion !== "string") {
      throw new Error("Azure OpenAI API version is required");
    }

    console.log(`ℹ️  Using Azure OpenAI resource: ${config.resourceName}`);
    console.log(`ℹ️  Model: ${config.model}`);
    console.log(`ℹ️  API Version: ${config.apiVersion}`);

    return true;
  }

  _getApiUrl(config) {
    // Azure OpenAI特殊的URL格式
    const resourceName = config.resourceName;
    const apiVersion = config.apiVersion || "2024-02-01";

    // 确保resource name不包含协议和域名部分
    const cleanResourceName = resourceName
      .replace(/^https?:\/\//, "")
      .replace(/\.openai\.azure\.com\/?$/, "")
      .replace(/\/$/, "");

    // Azure OpenAI URL格式: https://{resource}.openai.azure.com/
    const baseUrl = `https://${cleanResourceName}.openai.azure.com`;

    // Azure OpenAI使用不同的端点格式
    // /openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
    const deploymentName = config.model;
    const endpoint =
      config.modelType === "chat" ? "/chat/completions" : "/completions";

    return `${baseUrl}/openai/deployments/${deploymentName}${endpoint}?api-version=${apiVersion}`;
  }

  _getHeaders(config) {
    const headers = {
      "Content-Type": "application/json",
      "api-key": config.apiKey, // Azure OpenAI使用api-key而不是Bearer token
    };

    return headers;
  }

  _getRequestBody(prompt, options, config) {
    const body = {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: options.temperature || config.temperature || 0.7,
      max_tokens: options.maxTokens || config.maxTokens || 2000,
      stream: options.stream || config.stream || false,
    };

    // Azure OpenAI不需要model参数，因为已经在URL中
    // 但为了兼容性，我们仍然可以包含它
    if (config.model) {
      body.model = config.model;
    }

    return body;
  }

  static getStaticAvailableModels() {
    // Azure OpenAI支持的模型（基于OpenAI模型）
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-4-32k",
      "gpt-35-turbo",
      "gpt-35-turbo-16k",
      "gpt-35-turbo-instruct",
      "text-embedding-ada-002",
      "text-davinci-003",
      "code-davinci-002",
    ];
  }

  static getStaticModelDescriptions() {
    return {
      "gpt-4o": "最新多模态模型，支持文本和图像",
      "gpt-4o-mini": "轻量版GPT-4o，性价比高",
      "gpt-4-turbo": "增强版GPT-4，支持128K上下文",
      "gpt-4": "标准GPT-4模型",
      "gpt-4-32k": "32K上下文的GPT-4模型",
      "gpt-35-turbo": "GPT-3.5 Turbo (Azure命名)",
      "gpt-35-turbo-16k": "16K上下文的GPT-3.5 Turbo",
      "gpt-35-turbo-instruct": "指令优化版GPT-3.5",
      "text-embedding-ada-002": "文本嵌入模型",
      "text-davinci-003": "Davinci文本模型",
      "code-davinci-002": "代码生成模型",
    };
  }

  static getStaticModelCapabilities(model) {
    // 基于模型类型返回能力
    const capabilities = ["text", "chat"];

    if (model.includes("gpt-4o") || model.includes("gpt-4-turbo")) {
      capabilities.push("vision");
    }

    if (model.includes("embedding")) {
      capabilities.push("embeddings");
    }

    if (model.includes("davinci")) {
      capabilities.push("completion");
    }

    if (model.includes("code-")) {
      capabilities.push("code");
    }

    return capabilities;
  }
}
