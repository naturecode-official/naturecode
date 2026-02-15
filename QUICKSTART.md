# NatureCode Quick Start Guide

## Get Started in 5 Minutes

### Step 1: Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/naturecode.git
cd naturecode

# Install dependencies
npm install

# Make it globally available (optional)
npm link
```

### Step 2: Configuration

```bash
# Run the configuration wizard
naturecode model
```

Follow the interactive prompts:

1. **Select AI Provider**: Choose DeepSeek (recommended for free tier) or OpenAI
2. **Enter API Key**: Get your key from the provider's website
3. **Choose Model**: Select based on your needs (DeepSeek-chat for general use)
4. **Set Preferences**: Adjust temperature (0.7 is good for creative tasks)

### Step 3: Start Chatting

```bash
# Start interactive session
naturecode start
```

## Essential Commands

### In the Interactive Session:

- **Type your question** and press Enter
- **`help`** - Show available commands
- **`clear`** - Clear screen and history
- **`exit`** or **`quit`** - End session

### File System Interaction:

```
"show me files here"          # List directory contents
"read package.json"           # View file content
"create new script.js"        # Create a file
"edit config.js"              # Modify existing file
"go to src directory"         # Change directory
```

## Common Use Cases

### 1. Code Assistance

```
"How do I write a React component?"
"Explain this error: 'Cannot read property of undefined'"
"Optimize this Python function for performance"
```

### 2. File Management

```
"Create a new Express.js server file"
"Add error handling to my existing code"
"Review my project structure and suggest improvements"
```

### 3. Learning & Explanation

```
"Explain closures in JavaScript like I'm 10"
"What's the difference between REST and GraphQL?"
"Show me how to use async/await with examples"
```

## 🛠️ Advanced Features

### Streaming Responses

By default, responses stream in real-time. To disable:

```bash
naturecode start --stream false
```

### Model Selection

Use a specific model:

```bash
naturecode start --model deepseek-reasoner --temperature 0.5
```

### Feedback & Improvement

Share your experience to help improve NatureCode:

```bash
naturecode feedback
```

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**

   ```bash
   naturecode model  # Reconfigure your API key
   ```

2. **Network errors**
   - Check your internet connection
   - Verify the AI service is operational

3. **File access denied**
   - NatureCode only accesses files in current directory and subdirectories
   - Check file permissions

4. **Slow responses**
   - Try a different model (deepseek-chat is usually fast)
   - Reduce temperature for more focused responses

### Getting Help:

- Run `naturecode --help` for command reference
- Check session summary at the end for usage statistics
- Use `naturecode feedback` to report issues

## Session Tips

### For Best Results:

1. **Be specific** - "How do I fix this React hydration error?" vs "Help with React"
2. **Provide context** - Include relevant code or error messages
3. **Use natural language** - "Explain like I'm a beginner" works well
4. **Iterate** - Ask follow-up questions based on responses

### Performance:

- Average response time: 2-5 seconds
- File operations: Automatic backups created
- Memory usage: < 100MB typical

## Version 1.2.5 Highlights

### New in this version:

- **Enhanced error handling** - Better error messages with suggestions
- **Feedback system** - Built-in tools to share your experience
- **Session tracking** - Usage statistics and performance metrics
- **File system improvements** - More reliable file operations

### Available now (v1.4.0):

- Git integration
- Code analysis tools
- Project management features

---

**Need more help?** Run `naturecode feedback` to contact the development team or open an issue on GitHub.
