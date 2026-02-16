import { AIProvider } from "./base.js";

export class TencentProvider extends AIProvider {
  constructor () {
    super();
    this.name = "tencent";
    this.displayName = "Tencent Hunyuan";
    this.supportsStreaming = true;
  }

  validateConfig (config) {
    // 验证腾讯混元配置
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("Tencent Hunyuan API key is required");
    }

    // 只检查模型名是否存在，不验证是否在预定义列表中
    if (!config.model || typeof config.model !== "string") {
      throw new Error("Tencent Hunyuan model name is required");
    }

    console.log(`ℹ️  Using model: ${config.model}`);
    console.log(
      "ℹ️  Check cloud.tencent.com/product/hunyuan for available models",
    );

    // 腾讯混元使用固定的base URL
    if (
      config.baseUrl &&
      config.baseUrl !== "https://hunyuan.tencentcloudapi.com"
    ) {
      console.warn(
        "Tencent Hunyuan uses fixed base URL: https://hunyuan.tencentcloudapi.com. Custom base URL will be ignored.",
      );
    }

    return true;
  }

  _getApiUrl (_config) {
    // 腾讯混元使用固定的base URL
    return "https://hunyuan.tencentcloudapi.com";
  }

  _getHeaders (config) {
    // 腾讯混元使用特殊的认证头
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "X-TC-Action": "ChatCompletions", // 腾讯云API需要指定Action
      "X-TC-Version": "2023-09-01", // 腾讯云API版本
      "X-TC-Region": config.region || "ap-guangzhou", // 默认广州区域
    };

    // 添加时间戳
    const timestamp = Math.floor(Date.now() / 1000);
    headers["X-TC-Timestamp"] = timestamp.toString();

    return headers;
  }

  _getRequestBody (prompt, options, config) {
    // 腾讯混元API请求体格式
    const body = {
      Model: config.model,
      Messages: [
        {
          Role: "user",
          Content: prompt,
        },
      ],
      Stream: options.stream || false,
    };

    // 添加可选参数
    if (options.temperature !== undefined) {
      body.Temperature = options.temperature;
    } else if (config.temperature !== undefined) {
      body.Temperature = config.temperature;
    }

    if (options.maxTokens !== undefined) {
      body.MaxTokens = options.maxTokens;
    } else if (config.maxTokens !== undefined) {
      body.MaxTokens = config.maxTokens;
    }

    if (options.topP !== undefined) {
      body.TopP = options.topP;
    }

    return body;
  }

  async generate (prompt, options = {}) {
    const config = this.config;
    this.validateConfig(config);

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
          `Tencent Hunyuan API error (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();

      if (data.Response.Error) {
        throw new Error(
          `Tencent Hunyuan API error: ${data.Response.Error.Message || JSON.stringify(data.Response.Error)}`,
        );
      }

      return data.Response.Choices[0]?.Message?.Content || "";
    } catch (error) {
      throw new Error(`Tencent Hunyuan generation failed: ${error.message}`);
    }
  }

  async *streamGenerate (prompt, options = {}) {
    const config = this.config;
    this.validateConfig(config);

    const url = this._getApiUrl(config);
    const headers = this._getHeaders(config);
    const body = this._getRequestBody(
      prompt,
      { ...options, stream: true },
      config,
    );

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Tencent Hunyuan API error (${response.status}): ${errorText}`,
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.Response?.Choices[0]?.Delta?.Content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Tencent Hunyuan streaming failed: ${error.message}`);
    }
  }

  static getStaticAvailableModels () {
    // 不再返回静态模型列表，用户可输入任意模型名
    // 提示用户查看腾讯混元官方文档获取可用模型
    return [];
  }

  static getStaticModelDescriptions () {
    // 不再返回静态模型描述
    return {};
  }

  static getStaticModelCapabilities (model) {
    // 基于模型类型返回能力
    const capabilities = ["text", "chat"];

    // 腾讯混元模型能力检测
    if (model.includes("vision") || model.includes("vl")) {
      capabilities.push("vision");
    }

    if (model.includes("code")) {
      capabilities.push("code");
    }

    return capabilities;
  }
}
