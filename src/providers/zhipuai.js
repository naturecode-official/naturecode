import { AIProvider } from "./base.js";

export class ZhipuAIProvider extends AIProvider {
  constructor() {
    super();
    this.name = "zhipuai";
    this.displayName = "Zhipu AI (智谱AI)";
    this.supportsStreaming = true;
    this.baseUrl = "https://open.bigmodel.cn/api/paas/v4";
  }

  validateConfig(config) {
    // 验证智谱AI配置
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("Zhipu AI API key is required");
    }

    if (!config.model || typeof config.model !== "string") {
      throw new Error("Zhipu AI model name is required");
    }

    console.log(`ℹ️  Using Zhipu AI model: ${config.model}`);
    console.log("ℹ️  Check https://open.bigmodel.cn for available models");

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
          `Zhipu AI API error (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();
      return this._extractResponse(data, config);
    } catch (error) {
      throw new Error(`Zhipu AI service error: ${error.message}`);
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
          `Zhipu AI API error (${response.status}): ${errorText}`,
        );
      }

      return this._handleStreamResponse(response, config);
    } catch (error) {
      throw new Error(`Zhipu AI service error: ${error.message}`);
    }
  }

  _getApiUrl(config) {
    // 智谱AI使用固定的base URL
    const endpoint =
      config.modelType === "chat" ? "/chat/completions" : "/completions";
    return `${this.baseUrl}${endpoint}`;
  }

  _getHeaders(config) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };

    // 智谱AI可能需要特定的头部
    if (config.apiVersion) {
      headers["api-version"] = config.apiVersion;
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
    }

    return body;
  }

  _extractResponse(data, config) {
    // 智谱AI响应格式
    if (data.choices && data.choices[0]) {
      if (data.choices[0].message) {
        return data.choices[0].message.content;
      } else if (data.choices[0].text) {
        return data.choices[0].text;
      }
    } else if (data.data && data.data.choices && data.data.choices[0]) {
      // 另一种可能的响应格式
      const choice = data.data.choices[0];
      if (choice.message) {
        return choice.message.content;
      } else if (choice.text) {
        return choice.text;
      }
    } else if (data.text) {
      return data.text;
    } else if (data.content) {
      return data.content;
    }

    // 如果无法识别格式，返回原始响应
    console.warn("Could not extract response from Zhipu AI format");
    console.warn(
      "Response structure:",
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
    // 智谱AI常用模型
    return [
      "glm-4-flash",
      "glm-4-plus",
      "glm-4-air",
      "glm-4-long",
      "glm-4v",
      "glm-3-turbo",
      "characterglm",
      "cogview-3",
    ];
  }

  static getStaticModelDescriptions() {
    return {
      "glm-4-flash": "快速响应版本，适合实时对话",
      "glm-4-plus": "增强版本，更强的理解和生成能力",
      "glm-4-air": "轻量版本，平衡性能和速度",
      "glm-4-long": "长文本版本，支持128K上下文",
      "glm-4v": "多模态版本，支持图像理解",
      "glm-3-turbo": "GLM-3系列，经济实惠",
      characterglm: "角色扮演专用模型",
      "cogview-3": "文生图模型",
    };
  }

  static getStaticModelCapabilities(model) {
    // 根据模型类型返回能力
    const capabilities = ["text", "chat"];

    if (model.includes("glm-4v") || model.includes("cogview")) {
      capabilities.push("vision");
    }

    if (model.includes("characterglm")) {
      capabilities.push("roleplay");
    }

    if (model.includes("glm-4-long")) {
      capabilities.push("long-context");
    }

    return capabilities;
  }
}
