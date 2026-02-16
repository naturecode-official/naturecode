import { AIProvider } from "./base.js";

export class DashScopeProvider extends AIProvider {
  constructor () {
    super();
    this.name = "dashscope";
    this.displayName = "Qwen (DashScope)";
    this.supportsStreaming = true;
  }

  validateConfig (config) {
    // 验证DashScope配置
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("DashScope API key is required");
    }

    // 只检查模型名是否存在，不验证是否在预定义列表中
    if (!config.model || typeof config.model !== "string") {
      throw new Error("DashScope model name is required");
    }

    console.log(`ℹ️  Using model: ${config.model}`);
    console.log("ℹ️  Check dashscope.console.aliyun.com for available models");

    // DashScope使用固定的base URL
    if (
      config.baseUrl &&
      config.baseUrl !== "https://dashscope.aliyuncs.com/"
    ) {
      console.warn(
        "DashScope uses fixed base URL: https://dashscope.aliyuncs.com/. Custom base URL will be ignored.",
      );
    }

    return true;
  }

  _getApiUrl (_config) {
    // DashScope使用固定的base URL
    return "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
  }

  _getHeaders (config) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };

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
          `DashScope API error (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(
          `DashScope API error: ${data.error.message || JSON.stringify(data.error)}`,
        );
      }

      return data.choices[0]?.message?.content || "";
    } catch (error) {
      throw new Error(`DashScope generation failed: ${error.message}`);
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
          `DashScope API error (${response.status}): ${errorText}`,
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
              const content = parsed.choices[0]?.delta?.content;
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
      throw new Error(`DashScope streaming failed: ${error.message}`);
    }
  }

  static getStaticAvailableModels () {
    // 不再返回静态模型列表，用户可输入任意模型名
    // 提示用户查看DashScope官方文档获取可用模型
    return [];
  }

  static getStaticModelDescriptions () {
    // 不再返回静态模型描述
    return {};
  }

  static getStaticModelCapabilities (model) {
    // 基于模型类型返回能力
    const capabilities = ["text", "chat"];

    if (model.includes("vl")) {
      capabilities.push("vision");
    }

    if (model.includes("audio")) {
      capabilities.push("audio");
    }

    if (model.includes("coder")) {
      capabilities.push("code");
    }

    return capabilities;
  }
}
