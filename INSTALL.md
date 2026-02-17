# NatureCode Installation and Usage Guide

## Overview

This document describes how to build, package, and release the NatureCode terminal AI assistant.

## Quick Installation

### 1. Install NatureCode

```bash
# Run the installation script
./install.sh

# Or install globally
sudo ./install.sh
```

### 2. Configure API Settings

```bash
naturecode model
```

Follow the interactive wizard:

1. Select AI provider (DeepSeek or OpenAI)
2. Enter your API key
3. Choose a model (19 OpenAI models or 2 DeepSeek models)
4. Select model type based on capabilities (text, vision, audio, realtime)
5. Set temperature and other parameters

### 3. Start Using

```bash
naturecode start
```

## Features

### Main Commands

- `naturecode model` - Interactive configuration wizard (12+ AI providers)
- `naturecode delmodel` - Delete model configuration by name or all models
- `naturecode start` - Start interactive session
- `naturecode config` - View current configuration
- `naturecode --help` - Show help information
- `naturecode --version` - Show version information

### Interactive Session Features

- **Real-time conversation**: Natural language dialogue with AI
- **Streaming responses**: Real-time display of AI-generated content
- **Code highlighting**: Automatic code block recognition and formatting
- **Session management**:
  - `help` - Show help
  - `clear` - Clear screen and session history
  - `config` - View configuration
  - `exit` - Exit program

### Supported AI Models

#### DeepSeek

- **DeepSeek Chat**: General conversation model (recommended for daily use)
- **DeepSeek Reasoner**: Complex reasoning and problem-solving model

#### OpenAI

- **GPT-4 series**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-4-32k`
- **GPT-3.5 series**: `gpt-3.5-turbo`, `gpt-3.5-turbo-16k`, `gpt-3.5-turbo-instruct`
- **Specialized models**: `gpt-4o-realtime-preview`, `gpt-4o-audio-preview`, `gpt-4o-vision-preview`
- **Vision models**: `gpt-4o-vision-preview`, `gpt-4-vision-preview`
- **Fine-tuned models**: `gpt-4o-2024-08-06`, `gpt-4-turbo-2024-04-09`, `gpt-3.5-turbo-0613`
- **Legacy models**: `gpt-4-0613`, `gpt-4-32k-0613`, `gpt-3.5-turbo-0301`

## Configuration Details

Configuration file location: `~/.naturecode/config.json`

Configuration content:

```json
{
  "provider": "openai",
  "apiKey": "your-api-key-here",
  "model": "gpt-4o",
  "modelType": "text",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": true
}
```

## Getting API Keys

### DeepSeek

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key for use in NatureCode

### OpenAI

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key for use in NatureCode

## Development

### Project Structure

```
naturecode/
├── src/
│   ├── cli/              # CLI interface
│   ├── config/           # Configuration management
│   ├── providers/        # AI provider interfaces
│   ├── sessions/         # Session management
│   └── utils/           # Utility functions
├── package.json         # Project configuration
├── AGENTS.md           # Development guide
└── README.md           # Project documentation
```

### Adding New AI Providers

1. Create new file in `src/providers/`
2. Extend the `AIProvider` base class
3. Implement required methods
4. Register in configuration manager

## Troubleshooting

### Common Issues

1. **Invalid API Key**

   ```
   Invalid API key. Please run "naturecode model" to reconfigure.
   ```

   Solution: Run `naturecode model` to configure the correct API key

2. **Network Connection Issues**

   ```
   Network error. Check your internet connection.
   ```

   Solution: Check network connection and ensure API access

3. **No Configuration Found**

   ```
   No configuration found. Starting configuration wizard...
   ```

   Solution: Follow the wizard to complete configuration

4. **OpenAI Model Not Available**
   ```
   Model not available. Please check your OpenAI subscription.
   ```
   Solution: Ensure you have access to the selected model in your OpenAI account

### Debug Mode

```bash
# View detailed error information
DEBUG=* naturecode start

# Test specific functionality
node test_basic.js
```

## Building and Packaging

### Create macOS DMG Package

```bash
./build_dmg.sh
```

### Package for Distribution

```bash
node packager.js
```

### Update Version

```bash
# Update version in VERSION file
echo "1.1.3" > VERSION

# Update package.json version
npm version 1.1.3
```

## Next Steps

1. **More AI Providers**: Add support for Claude, Anthropic, etc.
2. **Plugin System**: Support custom plugin extensions
3. **File Processing**: Support file upload and analysis
4. **Multi-language Support**: Internationalization
5. **GUI Version**: Optional graphical interface
