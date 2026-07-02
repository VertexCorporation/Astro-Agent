# Astro Agent

Enterprise AI coding agent for terminal and web.

```bash
npm install -g astro-agent-cli
astro
```

Opens Web Studio at `http://127.0.0.1:3135`

## Features

- **Autonomous coding**: Reads, searches, edits, runs code — end-to-end task execution
- **Web Studio UI** (port 3135): Chat interface with session management, MCP server integration, todo tracking
- **Multi-model**: Claude, OpenAI, Gemini, Ollama, OpenRouter — switch mid-session
- **MCP support**: Connect any MCP server for extended tool capabilities
- **Browser automation**: Chrome extension + WebSocket bridge for browser control
- **Session management**: Branching, compaction, searchable history
- **Affective engine**: Adaptive temperature based on task complexity
- **Compression engine**: 10x context efficiency via RFF (Recursive Fractal Formatting)
- **Agent workspace**: Parallel sub-agents for explore → build → verify pipelines
- **Memory system**: Cross-session learning from errors and patterns

## Quick Start

```bash
# Install
npm install -g astro-agent-cli

# Set API key (copy .env.example → .env)
copy .env.example .env

# Start
astro
```

## Commands

| Command | Description |
|---------|-------------|
| `astro` | Start interactive/web mode |
| `astro --print "prompt"` | One-shot request (non-interactive) |
| `astro --model claude-sonnet-4-6` | Start with specific model |
| `astro --headless` | Start without TUI (API server only) |

## Architecture

```
astro-agent/
├── packages/cli/         # Main CLI
│   ├── src/core/         # Engine, tools, sessions, MCP
│   ├── src/modes/        # Web UI (studio), terminal (interactive)
│   └── src/cli/          # CLI args, help
├── packages/core/        # Model providers, messages
├── packages/engine/      # Engine loop, tool execution
└── packages/tui/         # Terminal UI components
```

**Ports:**
- `3131` — Auth/MCP/Brain API
- `3133` — Browser Bridge WebSocket
- `3135` — Web Studio UI

## Configuration

Settings stored at `~/.astroagent/engine/settings.json`

Key environment variables:
- `ASTRO_API_KEY` — Default API key
- `ASTRO_MODEL` — Default model ID
- `ASTRO_FULL_PROMPT=true` — Use full (non-compact) system prompt

## Links

- [GitHub](https://github.com/VertexCorporation/Astro-Agent)
- [Issues](https://github.com/VertexCorporation/Astro-Agent/issues)
