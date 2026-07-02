# Astro Agent Architecture Guide

## Project Structure

```
astro-agent/
├── packages/
│   └── cli/                     # Main CLI package
│       ├── src/
│       │   ├── cli/             # CLI entry, args, help, dashboard
│       │   ├── core/            # Core engine, servers, utilities
│       │   │   ├── web-ui-server.ts      # Auth/MCP/Brain API server (port 3131)
│       │   │   ├── browser-bridge-server.ts  # WebSocket bridge (port 3133-3142)
│       │   │   ├── engine-session.ts     # Main engine session logic
│       │   │   ├── compaction/           # Token/context management
│       │   │   ├── design-system/        # UI theme system
│       │   │   └── tools/               # Tool implementations (bash, browser, etc.)
│       │   ├── modes/
│       │   │   ├── studio/              # Web UI mode
│       │   │   │   ├── studio-mode.ts   # Web UI HTTP server (port 3135)
│       │   │   │   └── studio-ui.html   # ★ MAIN Web UI HTML (chat interface)
│       │   │   └── interactive/         # Terminal-based interactive mode
│       │   ├── utils/            # Utilities (version check, changelog, etc.)
│       │   ├── config.ts         # VERSION constant, paths, settings
│       │   └── main.ts           # CLI entry point
│       ├── browser-extension/    # Chrome browser extension
│       │   └── chrome/
│       │       ├── background.js # Port scanning, WebSocket bridge client
│       │       ├── popup.js      # Extension popup UI
│       │       └── manifest.json
│       └── package.json
```


## Port Map

| Port | Service | Description |
|------|---------|-------------|
| 3131 | Auth/MCP API Server | `web-ui-server.ts` - API endpoints for auth, MCP, brain |
| 3133 | Browser Bridge WebSocket | `browser-bridge-server.ts` - Browser control |
| 3135 | Web UI | `studio-mode.ts` - Main chat interface (HTML served from `studio-ui.html`) |
| 3133-3142 | Bridge scan range | Browser extension scans these ports for bridge |

## Web UI System (MAIN)

The main user-facing web interface is served by `studio-mode.ts` on **port 3135**.

**Key files:**
- `src/modes/studio/studio-mode.ts` - HTTP server, API routes, session management
- `src/modes/studio/studio-ui.html` - Single-file HTML/CSS/JS UI (chat interface)
- `src/core/web-ui-server.ts` - Separate API server for auth, MCP, brain panels

**How it works:**
1. `studio-mode.ts` starts on port 3135 (was random, now fixed)
2. It also starts `web-ui-server.ts` on port 3131 for auth/MCP APIs
3. The browser loads `studio-ui.html` from the studio-mode server
4. `studio-ui.html` makes API calls to the same origin (port 3135)
5. `studio-mode.ts` handles MCP routes by forwarding to `web-ui-server.ts`'s shared listeners

## MCP (Model Context Protocol)

**UI:** Access via sidebar → "MCP Manager" button → modal dialog

**API endpoints:**
- `GET /api/mcp-panel` - Returns server list, connected clients, tool count
- `POST /api/mcp-panel/action` - Actions: connect, disconnect, remove, add_custom, connect_builtin

**Architecture:**
- State provider registered by `interactive-mode.ts` via `setMcpPanelStateProvider()`
- Action listeners registered by engine via `webUiMcpActionListeners` Set
- Both `web-ui-server.ts` (port 3131) and `studio-mode.ts` (port 3135) handle these routes
- UI state is shared via module-level exports from `web-ui-server.ts`

**Custom MCP:** Add via "Custom MCP Server" section - name, command/port, arguments

## Browser Bridge

- WebSocket server on port 3133 (with fallback range 3133-3142)
- Browser extension connects to bridge for browser automation
- Extension scans 3133-3142 range + custom ports from storage

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Version shows old value | Update `studio-ui.html` line 967 + run build |
| MCP API returns "Not Found" | Ensure `studio-mode.ts` has MCP routes (added in handleRequest) |
| Port conflict | Web UI fixed at 3135, bridge auto-scans range |
| Browser can't connect | Run `astro`, check bridge port, restart extension |
| High token usage | Append `/compact` to session prompt |

## Roadmap (Priority Order)

1. **Sub-agent parallelization** — Engine agent layer: Worker Threads / child_process for parallel, non-blocking sub-agent execution
2. **`@ts-nocheck` cleanup** — Remove all `@ts-nocheck` directives file-by-file, add proper types
3. **Tests** — Unit/integration tests for critical paths: sendMessage, conversation CRUD, MCP panel, todo
4. **Monolithic HTML split** — Split `studio-ui.html` into separate CSS, JS modules, and HTML templates
5. **Polling → WebSocket/SSE** — Replace HTTP polling (todo, conversations, status) with push-based events
6. **State management** — Replace global `let` variables with a store pattern (zustand or custom Proxy-based)

## Build & Run

```bash
cd packages/cli
npm run build          # Compile TypeScript
npm install -g .       # Update global CLI
astro                  # Start (opens web UI at http://127.0.0.1:3135)
```
