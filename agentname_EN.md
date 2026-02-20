# NatureCode AI Provider List

NatureCode supports the following AI providers, each with specific configuration requirements and model support.

## 1. DeepSeek

- **Provider ID**: `deepseek`
- **API Endpoint**: `https://api.deepseek.com`
- **Authentication**: Bearer Token
- **Default Model**: `deepseek-chat`
- **Model Types**: Text, Chat
- **Official Website**: https://platform.deepseek.com

## 2. OpenAI

- **Provider ID**: `openai`
- **API Endpoint**: `https://api.openai.com/v1`
- **Authentication**: Bearer Token
- **Default Model**: `gpt-5-mini`
- **Model Types**: Text, Chat, Vision (some models)
- **Official Website**: https://platform.openai.com

## 3. Azure OpenAI

- **Provider ID**: `azure-openai`
- **API Endpoint Format**: `https://{resource-name}.openai.azure.com/`
- **Authentication**: API Key (`api-key` header)
- **Default Model**: `gpt-35-turbo`
- **Model Types**: Text, Chat, Vision (some models)
- **Required Configuration**:
  - Azure resource name
  - API version (default: 2024-08-01-preview)
- **Official Website**: https://azure.microsoft.com/products/ai-services/openai-service

## 4. n1n.ai

- **Provider ID**: `n1n`
- **API Endpoint**: `https://api.n1n.top/v1`
- **Authentication**: Bearer Token
- **Default Model**: `gpt-4o-mini`
- **Model Types**: Text, Chat, Vision (some models)
- **Features**: OpenAI-compatible API
- **Official Website**: https://n1n.ai

## 5. 4SAPI

- **Provider ID**: `4sapi`
- **API Endpoint**: `https://4sapi.com/v1`
- **Authentication**: Bearer Token
- **Default Model**: `gpt-4o-mini`
- **Model Types**: Text, Chat, Vision (some models)
- **Features**: OpenAI-compatible API
- **Official Website**: https://4sapi.com

## 6. Qwen (DashScope)

- **Provider ID**: `dashscope`
- **API Endpoint**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **Authentication**: Bearer Token
- **Default Model**: `qwen-max`
- **Model Types**: Text, Chat, Vision (some models)
- **Features**: OpenAI-compatible API
- **Official Website**: https://dashscope.aliyun.com

## 7. Anthropic

- **Provider ID**: `anthropic`
- **API Endpoint**: `https://api.anthropic.com`
- **Authentication**: Bearer Token
- **Default Model**: `claude-3-5-sonnet-20241022`
- **Model Types**: Text, Chat
- **Features**: Advanced reasoning, long context
- **Official Website**: https://anthropic.com

## 8. Google Gemini

- **Provider ID**: `gemini`
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta`
- **Authentication**: Bearer Token
- **Default Model**: `gemini-2.0-flash-exp`
- **Model Types**: Text, Chat, Vision, Audio
- **Features**: Multimodal capabilities
- **Official Website**: https://ai.google.dev

## 9. Ollama

- **Provider ID**: `ollama`
- **API Endpoint**: `http://localhost:11434/api`
- **Authentication**: None (local)
- **Default Model**: `llama3.2`
- **Model Types**: Text, Chat
- **Features**: Local AI, privacy-focused
- **Installation**: Requires Ollama installed locally
- **Official Website**: https://ollama.com

## 10. Baidu ERNIE

- **Provider ID**: `baidu`
- **API Endpoint**: `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat`
- **Authentication**: API Key + Secret Key
- **Default Model**: `ERNIE-4.0-8K`
- **Model Types**: Text, Chat
- **Features**: Chinese language optimized
- **Official Website**: https://yiyan.baidu.com

## 11. Zhipu AI

- **Provider ID**: `zhipu`
- **API Endpoint**: `https://open.bigmodel.cn/api/paas/v4`
- **Authentication**: Bearer Token
- **Default Model**: `glm-4-plus`
- **Model Types**: Text, Chat, Vision
- **Features**: Chinese language optimized
- **Official Website**: https://open.bigmodel.cn

## 12. Tencent Hunyuan

- **Provider ID**: `tencent`
- **API Endpoint**: `https://hunyuan.tencent.com/api/v3`
- **Authentication**: Secret ID + Secret Key
- **Default Model**: `hunyuan-standard`
- **Model Types**: Text, Chat, Vision
- **Features**: Chinese language optimized
- **Official Website**: https://cloud.tencent.com/product/hunyuan

## 13. Custom Provider

- **Provider ID**: `custom`
- **API Endpoint**: User-defined
- **Authentication**: User-defined (Bearer Token or API Key)
- **Default Model**: User-defined
- **Model Types**: User-defined
- **Features**: Complete customization for any OpenAI-compatible API

## Configuration Examples

### DeepSeek Configuration

```bash
naturecode model deepseek
# Enter: API Key
```

### OpenAI Configuration

```bash
naturecode model openai
# Enter: API Key
```

### Azure OpenAI Configuration

```bash
naturecode model azure-openai
# Enter: API Key, Resource Name, API Version
```

### Local Ollama Configuration

```bash
naturecode model ollama
# No API key needed for local Ollama
```

## Model Management Commands

```bash
# List configured models
naturecode config

# Configure a new model
naturecode model <provider-id>

# Delete a specific model
naturecode delmodel <provider-id>

# Delete all models
naturecode delmodel all

# Show current configuration
naturecode config
```

## Version Information

- **Current Version**: 2.0.1
- **Provider Count**: 13 providers
- **Platform Support**: macOS, Linux, Windows
- **Installation**: One-line curl installation

## Getting Started

1. **Install NatureCode**:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
   ```

2. **Configure AI Model**:

   ```bash
   naturecode model
   ```

3. **Start Interactive Session**:

   ```bash
   naturecode start
   ```

4. **Get Help**:
   ```bash
   naturecode help
   ```

## Features

- **12+ AI Providers**: Support for major AI platforms
- **Flexible Configuration**: Easy model switching
- **Secure Storage**: Encrypted API key storage
- **Cross-platform**: Works on all major operating systems
- **Natural Interaction**: AI-centric design for developers

For more information, visit:
https://github.com/naturecode-official/naturecode
