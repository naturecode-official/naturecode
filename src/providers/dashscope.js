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

    if (!config.model || typeof config.model !== "string") {
      throw new Error("DashScope model name is required");
    }

    // DashScope使用固定的base URL
    if (
      config.baseUrl &&
      config.baseUrl !== "https://dashscope.aliyuncs.com/"
    ) {
      console.warn(
        "DashScope uses fixed base URL: https://dashscope.aliyuncs.com/. Custom base URL will be ignored.",
      );
    }
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
    // DashScope支持的模型（通义千问系列）
    return [
      "qwen-max",
      "qwen-max-longcontext",
      "qwen-plus",
      "qwen-turbo",
      "qwen2.5-72b-instruct",
      "qwen2.5-32b-instruct",
      "qwen2.5-14b-instruct",
      "qwen2.5-7b-instruct",
      "qwen2.5-3b-instruct",
      "qwen2.5-1.5b-instruct",
      "qwen2.5-coder-32b-instruct",
      "qwen2.5-coder-14b-instruct",
      "qwen2.5-coder-7b-instruct",
      "qwen2-vl-72b-instruct",
      "qwen2-vl-7b-instruct",
      "qwen2-audio-7b-instruct",
      "qwen2.5-audio-7b-instruct",
    ];
  }

  static getStaticModelDescriptions () {
    return {
      "qwen-max": "通义千问最大模型，最强能力",
      "qwen-max-longcontext": "通义千问最大模型，支持长上下文",
      "qwen-plus": "通义千问增强版，平衡性能与成本",
      "qwen-turbo": "通义千问极速版，响应最快",
      "qwen2.5-72b-instruct": "Qwen2.5 720亿参数指令调优模型",
      "qwen2.5-32b-instruct": "Qwen2.5 320亿参数指令调优模型",
      "qwen2.5-14b-instruct": "Qwen2.5 140亿参数指令调优模型",
      "qwen2.5-7b-instruct": "Qwen2.5 70亿参数指令调优模型",
      "qwen2.5-3b-instruct": "Qwen2.5 30亿参数指令调优模型",
      "qwen2.5-1.5b-instruct": "Qwen2.5 15亿参数指令调优模型",
      "qwen2.5-coder-32b-instruct": "Qwen2.5 320亿参数代码生成模型",
      "qwen2.5-coder-14b-instruct": "Qwen2.5 140亿参数代码生成模型",
      "qwen2.5-coder-7b-instruct": "Qwen2.5 70亿参数代码生成模型",
      "qwen2-vl-72b-instruct": "Qwen2 720亿参数视觉语言模型",
      "qwen2-vl-7b-instruct": "Qwen2 70亿参数视觉语言模型",
      "qwen2-audio-7b-instruct": "Qwen2 70亿参数音频理解模型",
      "qwen2.5-audio-7b-instruct": "Qwen2.5 70亿参数音频理解模型",
    };
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
