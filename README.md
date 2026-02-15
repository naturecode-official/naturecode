# NatureCode

A cross-platform terminal AI assistant that supports multiple AI providers.

## Features

- Cross-platform terminal interface
- Multiple AI provider support (DeepSeek and OpenAI)
- Interactive configuration wizard
- Real-time chat sessions with streaming responses
- Configurable model settings
- Easy installation and setup
- Code syntax highlighting in responses
- **File system access** - AI can read, write, and manage files
- **Feedback collection** - Help improve NatureCode with built-in feedback tools
- **Enhanced error handling** - User-friendly error messages with suggestions
- **Session tracking** - Monitor your usage and performance
- **Git integration** - Execute git operations, analyze changes, generate commit messages
- **Code analysis** - Static code analysis, quality suggestions, refactoring recommendations
- **Dependency analysis** - Check project dependencies, security vulnerabilities, unused packages
- **Project metrics** - Code complexity, maintainability scores, language distribution
- **Plugin system** - Extensible architecture with plugin support
- **Session management** - Save, restore, and manage multiple chat sessions
- **Configuration management** - Global and project-level configuration with access control
- **Command aliases** - Custom shortcuts for frequently used commands

## Installation

### Prerequisites

- Node.js 16+ or Python 3.8+
- API key from your preferred AI provider

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd naturecode

# Install dependencies
npm install

# Configure your API settings
naturecode model

# Start chatting
naturecode start
```

## Usage

### Configure AI Settings

```bash
naturecode model
```

This interactive wizard will guide you through:

1. Selecting an AI provider (DeepSeek or OpenAI)
2. Entering your API key
3. Choosing a model (19 OpenAI models or 2 DeepSeek models)
4. Selecting model type based on capabilities (text, vision, audio, realtime)
5. Setting temperature and other parameters

### Start Interactive Session

```bash
naturecode start
```

Start a chat session with your configured AI model. If no configuration exists, you'll be prompted to run `naturecode model` first.

### File System Commands

NatureCode can interact with your file system. In the interactive session, you can use:

**Direct commands:**

- `ls`, `dir`, `list` - List files in current directory
- `pwd`, `where` - Show current directory
- `cd <directory>` - Change directory

**Natural language commands:**

- "Show me the files in this directory"
- "Read the content of package.json"
- "Create a new file called script.js"
- "Edit config.js to add a new setting"
- "Delete the temporary file"

**Security features:**

- Sandboxed access (current directory only)
- Automatic backups before file modifications
- Operation logging for audit trails
- File size limits (10MB max)

### Command Options

```bash
naturecode start --model deepseek-chat --temperature 0.8
naturecode --help
naturecode --version
naturecode feedback  # Provide feedback to improve NatureCode
naturecode config    # Show current configuration
naturecode git       # Git integration commands
```

### Provide Feedback

```bash
naturecode feedback
```

Help us improve NatureCode by providing feedback on your experience. Your feedback is stored locally and can be exported to share with the development team.

### Git Integration

NatureCode v1.4.0 includes comprehensive Git integration with the following commands:

```bash
# Show repository status
naturecode git status

# Show changes
naturecode git diff
naturecode git diff --staged

# Show commit history
naturecode git log
naturecode git log --limit 20

# Analyze repository changes
naturecode git analyze

# Get suggestions for next actions
naturecode git suggest

# Branch management
naturecode git branch
naturecode git branch --action create --name feature/new-feature

# Commit changes
naturecode git commit --message "Add new feature"

# Remote repository info
naturecode git remote

# JSON output format
naturecode git status --json
```

**Available Git commands:**

- `status` - Show repository status and changes
- `diff` - Show changes between commits, commit and working tree, etc
- `log` - Show commit logs
- `commit` - Record changes to the repository
- `push` - Update remote refs along with associated objects
- `pull` - Fetch from and integrate with another repository or a local branch
- `branch` - List, create, or delete branches
- `checkout` - Switch branches or restore working tree files
- `merge` - Join two or more development histories together
- `add` - Add file contents to the index
- `remote` - Manage set of tracked repositories
- `analyze` - Analyze repository changes and provide insights
- `suggest` - Get suggestions for next git actions

## Supported AI Providers

### DeepSeek

- **Models**: `deepseek-chat`, `deepseek-reasoner`
- **Features**: Cost-effective, strong reasoning capabilities
- **Best for**: General coding assistance, problem solving

### OpenAI

- **Models**: 19 different models including:
  - GPT-4 series: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-4-32k`
  - GPT-3.5 series: `gpt-3.5-turbo`, `gpt-3.5-turbo-16k`, `gpt-3.5-turbo-instruct`
  - Specialized models: `gpt-4o-realtime-preview`, `gpt-4o-audio-preview`, `gpt-4o-vision-preview`
- **Features**: Industry-leading models, multimodal capabilities
- **Best for**: Advanced tasks, vision/audio processing, real-time conversations

## Configuration

### Basic Configuration

Configuration is stored in `~/.naturecode/config.json` and includes:

- API keys (encrypted)
- Default provider and model
- Model type based on capabilities
- Temperature and token limits
- Stream preferences

### Advanced Configuration Management (v1.4.0+)

NatureCode v1.4.0 includes a comprehensive configuration management system:

```bash
# Show complete configuration
naturecode config show

# Get specific configuration value
naturecode config get provider.default

# Set configuration value
naturecode config set permission.level restricted

# Manage command aliases
naturecode config alias list
naturecode config alias add "ll" "ls -la"

# Manage file access permissions
naturecode config whitelist add .js .ts .json
naturecode config blacklist add .env .secret

# Check file access permissions
naturecode config check /path/to/file.js

# Set permission level
naturecode config permission readonly
naturecode config permission restricted
naturecode config permission full
```

#### Configuration Features

1. **Multi-level Configuration**
   - Global configuration: `~/.naturecode/config.json`
   - Project configuration: `.naturecode.json` (overrides global)
   - Configuration merging with proper precedence

2. **File Access Control**
   - File extension whitelist/blacklist
   - Directory whitelist/blacklist
   - File size limits (default: 10MB)
   - Real-time access validation

3. **Permission Levels**
   - `readonly`: Read-only access (no modifications)
   - `restricted`: Read/write access (no deletion, requires confirmation)
   - `full`: Full access (read, write, delete)

4. **Command Aliases**
   - Custom command shortcuts
   - Project and global scope support
   - Alias resolution system

For detailed configuration examples, see [CONFIG_GUIDE.md](CONFIG_GUIDE.md).

### Plugin System (v1.4.0+)

NatureCode v1.4.0 includes a comprehensive plugin system that allows extending functionality:

```bash
# List installed plugins
naturecode plugin list

# Show plugin information
naturecode plugin info <plugin-id>

# Install a plugin
naturecode plugin install <source>

# Create a new plugin
naturecode plugin create <name>

# Manage plugin permissions
naturecode plugin permissions
```

**Plugin Features:**

- Plugin types: command, AI provider, file handler, integration, UI/theme
- Secure sandboxed execution with permission control
- Plugin discovery and automatic loading
- Example plugin included for development reference

### Session Management (v1.4.0+)

NatureCode v1.4.0 includes advanced session management for multi-project workflows:

```bash
# List all sessions
naturecode session list

# Create a new session
naturecode session create "Project Session"

# Switch to a session
naturecode session switch <session-id>

# Show session information
naturecode session info <session-id>

# Archive/restore sessions
naturecode session archive <session-id>
naturecode session restore <session-id>

# Search sessions
naturecode session search "keyword"

# Export/import sessions
naturecode session export <session-id> --format json
naturecode session import <file-path>
```

**Session Features:**

- Session persistence and automatic saving
- Project context memory (files, dependencies, configuration)
- File operation tracking and history
- Session templates for quick setup
- Cross-session file operation state preservation

## Development

See [AGENTS.md](AGENTS.md) for detailed development guidelines.

## License

MIT
