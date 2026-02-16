# NatureCode AI供应商列表

NatureCode支持以下AI供应商，每个供应商都有特定的配置要求和模型支持。

## 1. DeepSeek

- **供应商ID**: `deepseek`
- **API端点**: `https://api.deepseek.com`
- **认证方式**: Bearer Token
- **默认模型**: `deepseek-chat`
- **模型类型**: 文本、聊天
- **官方网站**: https://platform.deepseek.com

## 2. OpenAI

- **供应商ID**: `openai`
- **API端点**: `https://api.openai.com/v1`
- **认证方式**: Bearer Token
- **默认模型**: `gpt-5-mini`
- **模型类型**: 文本、聊天、视觉（部分模型）
- **官方网站**: https://platform.openai.com

## 3. Azure OpenAI

- **供应商ID**: `azure-openai`
- **API端点格式**: `https://{resource-name}.openai.azure.com/`
- **认证方式**: API Key (`api-key`头)
- **默认模型**: `gpt-35-turbo`
- **模型类型**: 文本、聊天、视觉（部分模型）
- **必需配置**:
  - Azure资源名称
  - API版本（默认：2024-08-01-preview）
- **官方网站**: https://azure.microsoft.com/products/ai-services/openai-service

## 4. n1n.ai

- **供应商ID**: `n1n`
- **API端点**: `https://api.n1n.top/v1`
- **认证方式**: Bearer Token
- **默认模型**: `gpt-4o-mini`
- **模型类型**: 文本、聊天、视觉（部分模型）
- **特性**: OpenAI兼容API
- **官方网站**: https://n1n.ai

## 5. 4SAPI

- **供应商ID**: `4sapi`
- **API端点**: `https://4sapi.com/v1`
- **认证方式**: Bearer Token
- **默认模型**: `gpt-4o-mini`
- **模型类型**: 文本、聊天、视觉、图像生成、语音、嵌入
- **特性**: OpenAI兼容API，支持完整模型套件
- **官方网站**: https://4sapi.com

## 6. Qwen (DashScope)

- **供应商ID**: `dashscope`
- **API端点**: `https://dashscope.aliyuncs.com/`
- **认证方式**: Bearer Token
- **默认模型**: `qwen-turbo`
- **模型类型**: 文本、聊天、视觉（部分模型）、音频（部分模型）、代码（部分模型）
- **特性**: 阿里云通义千问模型，OpenAI兼容API
- **官方网站**: https://dashscope.aliyuncs.com

## 8. Anthropic (Claude)

- **供应商ID**: `anthropic`
- **API端点**: `https://api.anthropic.com`
- **认证方式**: Bearer Token
- **默认模型**: `claude-3-5-haiku-20241022`
- **模型类型**: 聊天
- **官方网站**: https://console.anthropic.com

## 7. Google Gemini

- **供应商ID**: `gemini`
- **API端点**: `https://generativelanguage.googleapis.com`
- **认证方式**: API Key
- **默认模型**: `gemini-2.5-flash`
- **模型类型**: 文本、聊天、视觉
- **官方网站**: https://ai.google.dev

## 8. Ollama

- **供应商ID**: `ollama`
- **API端点**: `http://localhost:11434` (本地)
- **认证方式**: 无（本地运行）
- **默认模型**: `llama3.2:latest`
- **模型类型**: 文本、聊天
- **特性**: 本地运行，免费
- **官方网站**: https://ollama.com

## 9. Zhipu AI (智谱AI)

- **供应商ID**: `zhipuai`
- **API端点**: `https://open.bigmodel.cn/api/paas/v4`
- **认证方式**: API Key
- **默认模型**: `glm-4-flash`
- **模型类型**: 文本、聊天
- **官方网站**: https://open.bigmodel.cn

## 10. Custom Provider

- **供应商ID**: `custom`
- **API端点**: 用户自定义
- **认证方式**: 用户自定义
- **默认模型**: `custom-model`
- **模型类型**: 用户自定义
- **必需配置**:
  - 自定义Base URL
  - API版本（可选）
  - 组织ID（可选）
- **特性**: 支持任何OpenAI兼容API

---

## 配置说明

### 通用配置项

1. **API密钥**: 所有供应商都需要API密钥（Ollama除外）
2. **模型名称**: 用户输入或使用默认值
3. **模型类型**: 根据模型能力自动选择
4. **温度**: 控制生成随机性（默认：0.7）
5. **最大令牌数**: 控制响应长度（默认：2000）
6. **流式传输**: 是否启用流式响应（默认：启用）

### 供应商特定配置

- **Azure OpenAI**: 需要资源名称和API版本
- **Custom Provider**: 需要自定义Base URL

### 使用命令

```bash
# 配置AI供应商
naturecode model

# 开始使用
naturecode start

# 查看当前配置
naturecode config

# 删除配置
naturecode delmodel <name>
naturecode delmodel all
```

### 版本信息

- **当前版本**: 1.5.5
- **供应商数量**: 11个
- **平台支持**: macOS, Linux, Windows
- **安装方式**: 一键curl安装

---

_最后更新: 2026年2月16日_
