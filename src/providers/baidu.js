import { AIProvider } from "./base.js";

export class BaiduProvider extends AIProvider {
  constructor() {
    super();
    this.name = "baidu";
    this.displayName = "Baidu ERNIE";
    this.supportsStreaming = true;
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  validateConfig(config) {
    // 验证百度文心一言配置
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("Baidu ERNIE API key is required");
    }

    if (!config.secretKey || typeof config.secretKey !== "string") {
      throw new Error("Baidu ERNIE secret key is required");
    }

    // 只检查模型名是否存在，不验证是否在预定义列表中
    if (!config.model || typeof config.model !== "string") {
      throw new Error("Baidu ERNIE model name is required");
    }

    console.log(`ℹ️  Using model: ${config.model}`);
    console.log("ℹ️  Check ai.baidu.com for available ERNIE models");

    // 百度文心一言使用固定的base URL
    if (config.baseUrl && config.baseUrl !== "https://aip.baidubce.com") {
      console.warn(
        "Baidu ERNIE uses fixed base URL: https://aip.baidubce.com. Custom base URL will be ignored.",
      );
    }

    return true;
  }

  async _getAccessToken(config) {
    // 检查token是否有效（有效期30天，但百度建议每次调用都获取）
    const now = Date.now();
    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }

    // 获取新的access_token
    const tokenUrl = "https://aip.baidubce.com/oauth/2.0/token";
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.apiKey,
      client_secret: config.secretKey,
    });

    try {
      const response = await fetch(`${tokenUrl}?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Baidu ERNIE token error (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Baidu ERNIE token error: ${data.error_description}`);
      }

      this.accessToken = data.access_token;
      // 设置token过期时间（提前5分钟过期）
      this.tokenExpiry = now + (data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      throw new Error(
        `Failed to get Baidu ERNIE access token: ${error.message}`,
      );
    }
  }

  _getApiUrl(config) {
    // 百度文心一言API URL格式
    // https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/{model}
    return `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${config.model}`;
  }

  _getHeaders(config) {
    // 百度文心一言使用标准的Content-Type头
    return {
      "Content-Type": "application/json",
    };
  }

  _getRequestBody(prompt, options, config) {
    // 百度文心一言API请求体格式
    const body = {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
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

    if (options.penaltyScore !== undefined) {
      body.penalty_score = options.penaltyScore;
    }

    // 百度文心一言特定参数
    if (options.system !== undefined) {
      body.system = options.system;
    }

    if (options.disableSearch !== undefined) {
      body.disable_search = options.disableSearch;
    }

    if (options.enableCitation !== undefined) {
      body.enable_citation = options.enableCitation;
    }

    return body;
  }

  async generate(prompt, options = {}) {
    const config = this.config;
    this.validateConfig(config);

    // 获取access_token
    const accessToken = await this._getAccessToken(config);
    const url = `${this._getApiUrl(config)}?access_token=${accessToken}`;
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
          `Baidu ERNIE API error (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();

      if (data.error_code) {
        throw new Error(
          `Baidu ERNIE API error (${data.error_code}): ${data.error_msg}`,
        );
      }

      return data.result || "";
    } catch (error) {
      throw new Error(`Baidu ERNIE generation failed: ${error.message}`);
    }
  }

  async *streamGenerate(prompt, options = {}) {
    const config = this.config;
    this.validateConfig(config);

    // 获取access_token
    const accessToken = await this._getAccessToken(config);
    const url = `${this._getApiUrl(config)}?access_token=${accessToken}`;
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
          `Baidu ERNIE API error (${response.status}): ${errorText}`,
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
              if (parsed.error_code) {
                throw new Error(
                  `Baidu ERNIE streaming error (${parsed.error_code}): ${parsed.error_msg}`,
                );
              }

              const content = parsed.result;
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
      throw new Error(`Baidu ERNIE streaming failed: ${error.message}`);
    }
  }

  static getStaticAvailableModels() {
    // 不再返回静态模型列表，用户可输入任意模型名
    // 提示用户查看百度文心一言官方文档获取可用模型
    return [];
  }

  static getStaticModelDescriptions() {
    // 不再返回静态模型描述
    return {};
  }

  static getStaticModelCapabilities(model) {
    // 基于模型类型返回能力
    const capabilities = ["text", "chat"];

    // 百度文心一言模型能力检测
    if (model.includes("vision") || model.includes("vl")) {
      capabilities.push("vision");
    }

    if (model.includes("code")) {
      capabilities.push("code");
    }

    // 百度文心一言特定模型系列
    if (model.includes("ernie-speed") || model.includes("ernie-lite")) {
      // 轻量版模型，适合快速响应
      capabilities.push("fast");
    }

    if (model.includes("ernie-turbo")) {
      // Turbo版模型，平衡性能和速度
      capabilities.push("balanced");
    }

    if (model.includes("ernie-4.0") || model.includes("ernie-3.5")) {
      // 旗舰版模型，支持复杂任务
      capabilities.push("advanced");
    }

    return capabilities;
  }
}
