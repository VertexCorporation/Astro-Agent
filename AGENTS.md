# MoonCode Architecture Guide

## Project Structure

```
mooncode/
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
│       │   │   ├── web/                 # Web UI mode
│       │   │   │   ├── web-mode.ts      # Web UI HTTP server (port 3135)
│       │   │   │   └── web-ui.html      # ★ MAIN Web UI HTML (chat interface)
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
| 3135 | Web UI | `web-mode.ts` - Main chat interface (HTML served from `web-ui.html`) |
| 3133-3142 | Bridge scan range | Browser extension scans these ports for bridge |

## Web UI System (MAIN)

The main user-facing web interface is served by `web-mode.ts` on **port 3135**.

**Key files:**
- `src/modes/web/web-mode.ts` - HTTP server, API routes, session management
- `src/modes/web/web-ui.html` - Single-file HTML/CSS/JS UI (chat interface)
- `src/core/web-ui-server.ts` - Separate API server for auth, MCP, brain panels

**How it works:**
1. `web-mode.ts` starts on port 3135 (was random, now fixed)
2. It also starts `web-ui-server.ts` on port 3131 for auth/MCP APIs
3. The browser loads `web-ui.html` from the web-mode server
4. `web-ui.html` makes API calls to the same origin (port 3135)
5. `web-mode.ts` handles MCP routes by forwarding to `web-ui-server.ts`'s shared listeners

## MCP (Model Context Protocol)

**UI:** Access via sidebar → "MCP Manager" button → modal dialog

**API endpoints:**
- `GET /api/mcp-panel` - Returns server list, connected clients, tool count
- `POST /api/mcp-panel/action` - Actions: connect, disconnect, remove, add_custom, connect_builtin

**Architecture:**
- State provider registered by `interactive-mode.ts` via `setMcpPanelStateProvider()`
- Action listeners registered by engine via `webUiMcpActionListeners` Set
- Both `web-ui-server.ts` (port 3131) and `web-mode.ts` (port 3135) handle these routes
- UI state is shared via module-level exports from `web-ui-server.ts`

**Custom MCP:** Add via "Custom MCP Server" section - name, command/port, arguments

## Browser Bridge

- WebSocket server on port 3133 (with fallback range 3133-3142)
- Browser extension connects to bridge for browser automation
- Extension scans 3133-3142 range + custom ports from storage

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Version shows old value | Update `web-ui.html` line 967 + run build |
| MCP API returns "Not Found" | Ensure `web-mode.ts` has MCP routes (added in handleRequest) |
| Port conflict | Web UI fixed at 3135, bridge auto-scans range |
| Browser can't connect | Run `mooncode`, check bridge port, restart extension |
| High token usage | Append `/compact` to session prompt |

## Build & Run

```bash
cd packages/cli
npm run build          # Compile TypeScript
npm install -g .       # Update global CLI
mooncode               # Start (opens web UI at http://127.0.0.1:3135)
```
