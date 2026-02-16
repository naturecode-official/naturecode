import { AIProvider } from "./base.js";

export class CustomProvider extends AIProvider {
  constructor() {
    super();
    this.name = "custom";
    this.displayName = "Custom Provider";
    this.supportsStreaming = true;
  }

  validateConfig(config) {
    // 验证自定义提供者配置
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("Custom Provider API key is required");
    }

    if (!config.model || typeof config.model !== "string") {
      throw new Error("Custom Provider model name is required");
    }

    if (!config.baseUrl || typeof config.baseUrl !== "string") {
      throw new Error("Custom Provider base URL is required");
    }

    try {
      new URL(config.baseUrl);
    } catch (error) {
      throw new Error("Invalid base URL format for custom provider");
    }

    console.log(`ℹ️  Using custom provider with base URL: ${config.baseUrl}`);
    console.log(`ℹ️  Model: ${config.model}`);

    return true;
  }

  async generate(prompt, options = {}) {
    const config = this.getConfig();
    const url = this._getApiUrl(config);

    const headers = this._getHeaders(config);
    const body = this._getRequestBody(prompt, options, config);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Custom Provider API error (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();
      return this._extractResponse(data, config);
    } catch (error) {
      throw new Error(`Custom Provider service error: ${error.message}`);
    }
  }

  async streamGenerate(prompt, options = {}) {
    const config = this.getConfig();
    const url = this._getApiUrl(config);

    const headers = this._getHeaders(config);
    const body = this._getRequestBody(prompt, options, config);

    // 添加流式支持
    body.stream = true;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Custom Provider API error (${response.status}): ${errorText}`,
        );
      }

      return this._handleStreamResponse(response, config);
    } catch (error) {
      throw new Error(`Custom Provider service error: ${error.message}`);
    }
  }

  _getApiUrl(config) {
    // 使用配置中的baseUrl
    const baseUrl = config.baseUrl;
    const apiVersion = config.apiVersion || "2024-01-01";

    // 根据模型类型确定端点
    const endpoint =
      config.modelType === "chat" ? "/chat/completions" : "/completions";

    return `${baseUrl}${endpoint}`;
  }

  _getHeaders(config) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };

    // 添加API版本
    if (config.apiVersion) {
      headers["api-version"] = config.apiVersion;
    }

    // 添加组织ID（如果提供）
    if (config.organization) {
      headers["OpenAI-Organization"] = config.organization;
    }

    return headers;
  }

  _getRequestBody(prompt, options, config) {
    const body = {
      model: config.model,
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

    // 根据模型类型调整请求格式
    if (config.modelType === "chat") {
      // 聊天格式已经设置
    } else if (config.modelType === "code") {
      body.messages[0].role = "developer";
    } else if (config.modelType === "vision") {
      // 视觉模型可能需要不同的格式
      body.messages[0].content = [
        {
          type: "text",
          text: prompt,
        },
      ];
    }

    return body;
  }

  _extractResponse(data, config) {
    // 尝试从常见的响应格式中提取文本
    if (data.choices && data.choices[0]) {
      if (data.choices[0].message) {
        return data.choices[0].message.content;
      } else if (data.choices[0].text) {
        return data.choices[0].text;
      }
    } else if (data.text) {
      return data.text;
    } else if (data.content) {
      return data.content;
    }

    // 如果无法识别格式，返回原始响应
    console.warn(
      "⚠️  Could not extract response from custom AI provider format",
    );
    console.warn(
      "⚠️  Response structure:",
      JSON.stringify(data, null, 2).substring(0, 500),
    );
    return JSON.stringify(data);
  }

  async _handleStreamResponse(response, config) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.substring(6);
          if (data === "[DONE]") {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = this._extractResponse(parsed, config);
            if (content) {
              process.stdout.write(content);
            }
          } catch (error) {
            // 忽略解析错误，继续处理下一个块
          }
        }
      }
    }
  }

  static getStaticAvailableModels() {
    // 自定义提供者没有预定义模型列表
    return [];
  }

  static getStaticModelDescriptions() {
    // 自定义提供者没有预定义模型描述
    return {};
  }

  static getStaticModelCapabilities(model) {
    // 自定义提供者支持所有功能
    return ["text", "chat", "code", "vision", "reasoner"];
  }
}
