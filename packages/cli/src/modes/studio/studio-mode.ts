import { exec } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import os from "node:os";
import { promisify } from "node:util";
import fs, { promises as fsPromises } from "fs";
import { completeSimple } from "moon-core";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import { getEngineDir, getPackageDir } from "../../config.js";
import { getBrowserBridgeStatus } from "../../core/browser-bridge-server.js";
import type { EngineSessionRuntime } from "../../core/engine-session-runtime.js";
import { buildSessionInfo, listSessionsFromDir, SessionManager } from "../../core/session-manager.js";
import { BUILTIN_SLASH_COMMANDS } from "../../core/slash-commands.js";
import { getTodoSnapshot } from "../../core/tools/todo.js";
import { getMcpPanelState, setMcpPanelStateProvider, webUiMcpActionListeners } from "../../core/web-ui-server.js";
import type { InteractiveModeOptions } from "../interactive/interactive-mode.js";

const execAsync = promisify(exec);

export class StudioMode {
	private runtime: EngineSessionRuntime;
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: reserved for future use
	private _options: InteractiveModeOptions;
	private clients: ServerResponse[] = [];
	private mobileClients: Set<ServerResponse> = new Set();
	private server: ReturnType<typeof createServer> | null = null;
	private port: number = 0;
	private pinnedMessageIds: Set<string> = new Set();
	private logBuffer: string[] = [];
	private pendingSelectResolver: ((value: string | undefined) => void) | null = null;

	private getWebProjects(): string[] {
		const filePath = join(getEngineDir(), "web-projects.json");
		if (fs.existsSync(filePath)) {
			try {
				return JSON.parse(fs.readFileSync(filePath, "utf-8"));
			} catch (_e) {
				return [];
			}
		}
		return [];
	}

	private addWebProject(cwd: string) {
		const projects = new Set(this.getWebProjects());
		projects.add(cwd);
		fs.writeFileSync(join(getEngineDir(), "web-projects.json"), JSON.stringify(Array.from(projects)));
	}

	private removeWebProject(cwd: string) {
		const projects = new Set(this.getWebProjects());
		projects.delete(cwd);
		fs.writeFileSync(join(getEngineDir(), "web-projects.json"), JSON.stringify(Array.from(projects)));
	}

	constructor(runtime: EngineSessionRuntime, options: InteractiveModeOptions) {
		this.runtime = runtime;
		this._options = options;
	}

	private activeUnsubscribe: (() => void) | null = null;

	async init() {
		this.hookConsole();
		this.bindSession(this.runtime.session);

		this.runtime.setRebindSession(async (session) => {
			this.bindSession(session);
		});

		this.registerMcpPanel();
		this.runtime.session.extensionRunner.setUIContext({
			select: async (_title: string, _options: string[]) => {
				return new Promise<string | undefined>((resolve) => {
					this.pendingSelectResolver = resolve;
				});
			},
			confirm: async () => false,
			input: async () => undefined,
			notify: () => {},
			onTerminalInput: () => () => {},
			setStatus: () => {},
			setWorkingMessage: () => {},
			setWorkingVisible: () => {},
			setWorkingIndicator: () => {},
			setHiddenThinkingLabel: () => {},
			setWidget: () => {},
			setFooter: () => {},
			setHeader: () => {},
			setTitle: () => {},
			custom: async () => undefined as never,
			pasteToEditor: () => {},
			setEditorText: () => {},
			getEditorText: () => "",
			editor: async () => undefined,
			addAutocompleteProvider: () => {},
			setEditorComponent: () => {},
			getEditorComponent: () => undefined,
			get theme() {
				return undefined;
			},
			getAllThemes: () => [],
			getTheme: () => undefined,
			setTheme: () => ({ success: false, error: "Not supported" }),
			getToolsExpanded: () => false,
			setToolsExpanded: () => {},
		} as any);
	}

	private bindSession(session: any) {
		if (this.activeUnsubscribe) {
			this.activeUnsubscribe();
		}
		this.activeUnsubscribe = session.subscribe((event: any) => {
			this.broadcastEvent(event);
			this.broadcastEvent(this.getStateUpdateEvent());
		});
	}

	private getGodotMcpConfig() {
		return {
			command: "npx",
			args: ["-y", "@tugcantopaloglu/godot-mcp"],
			autoStart: false,
		};
	}

	private getBlenderMcpConfig(port?: string) {
		// blender-mcp connects to Blender addon via BLENDER_PORT env var (default: 9876)
		// The --port arg here is blender-mcp's own MCP server port (not the Blender addon port)
		const blenderAddonPort = port && port.trim() !== "" ? port.trim() : "9876";
		return {
			command: "uvx",
			args: ["--python", "3.12", "blender-mcp"],
			env: {
				DISABLE_TELEMETRY: "true",
				UV_PYTHON: "3.12",
				BLENDER_PORT: blenderAddonPort,
			},
			autoStart: false,
		};
	}

	private getScratchMcpConfig() {
		const candidateRoots = [
			process.env.MOON_SCRATCH_MCP_ROOT,
			path.join(process.cwd(), "scmcp"),
			path.join(os.homedir(), "scmcp"),
			path.join(getPackageDir(), "..", "..", "scmcp"),
		].filter((root): root is string => typeof root === "string" && root.length > 0);
		const scratchRoot = candidateRoots.find((root) => fs.existsSync(path.join(root, "server", "scratch-mcp.js")));
		if (!scratchRoot) return undefined;
		return {
			command: "node",
			args: [path.join(scratchRoot, "server", "scratch-mcp.js")],
			cwd: scratchRoot,
			env: { DISABLE_TELEMETRY: "true" },
			autoStart: false,
		};
	}

	private async activateMcpServer(
		name: string,
		config: { command: string; args?: string[]; cwd?: string; env?: Record<string, string> },
	) {
		this.runtime.services.settingsManager.setMcpServer(name, config);
		await this.runtime.services.settingsManager.flush();
		return await this.runtime.session.connectConfiguredMcpServers();
	}

	private buildMcpPanelState(): any {
		const configured = this.runtime.services.settingsManager.getMcpServers();
		const clients = this.runtime.session.mcpManager ? [...this.runtime.session.mcpManager.getClients().keys()] : [];
		const servers = Object.entries(configured).map(([name, config]: [string, any]) => ({
			name,
			command: config.command,
			args: config.args || [],
			cwd: config.cwd,
			connected: clients.includes(name),
		}));
		return {
			servers,
			clients,
			tools: this.runtime.session.getActiveToolNames(),
			market: ["https://mcp.so/?tab=latest", "https://mcpmarket.com/search"],
		};
	}

	private mcpPanelListenerRegistered = false;
	private registerMcpPanel(): void {
		setMcpPanelStateProvider(() => this.buildMcpPanelState());
		if (this.mcpPanelListenerRegistered || webUiMcpActionListeners.size > 0) return;
		this.mcpPanelListenerRegistered = true;
		webUiMcpActionListeners.add(async (action: any) => {
			const name = String(action?.name || "").trim();
			if (action?.action === "connect_builtin") {
				if (name === "blender") {
					const cfg = this.getBlenderMcpConfig(action?.port);
					await this.activateMcpServer("blender", cfg);
					return;
				}
				if (name === "scratch") {
					const config = this.getScratchMcpConfig();
					if (!config) {
						throw new Error(
							"Scratch MCP not configured. Set MOON_SCRATCH_MCP_ROOT or place a scmcp folder next to the repo.",
						);
					}
					config.autoStart = true;
					await this.activateMcpServer("scratch", config);
					return;
				}
				if (name === "godot") {
					const cfg = this.getGodotMcpConfig();
					cfg.autoStart = true;
					await this.activateMcpServer("godot", cfg);
					return;
				}
				throw new Error("Unknown built-in MCP provider.");
			}
			if (action?.action === "connect") {
				if (!name) throw new Error("Server name is required.");
				await this.runtime.session.connectConfiguredMcpServers();
				return;
			}
			if (action?.action === "restart") {
				if (!this.runtime.session.mcpManager) throw new Error("MCP manager is not available.");
				await this.runtime.session.mcpManager.restart();
				return;
			}
			if (action?.action === "remove") {
				if (!name) throw new Error("Server name is required.");
				this.runtime.services.settingsManager.removeMcpServer(name);
				await this.runtime.services.settingsManager.flush();
				if (this.runtime.session.mcpManager) await this.runtime.session.mcpManager.restart();
				return;
			}
			if (action?.action === "add_custom") {
				const config = action.config || {};
				const command = action.command || config.command;
				const args = action.args || config.args;
				const env = action.env || config.env;
				const cwd = action.cwd || config.cwd;
				if (!name || !command) throw new Error("Name and command are required.");
				await this.activateMcpServer(name, { command, args, cwd, env });
				return;
			}
			if (action?.action === "disconnect") {
				throw new Error("Disconnect not supported via UI yet.");
			}
		});
	}

	private hookConsole() {
		const originalWrite = process.stdout.write;
		process.stdout.write = (chunk: any, encoding?: any, callback?: any): boolean => {
			const str = chunk.toString();
			this.logBuffer.push(str);
			if (this.logBuffer.length > 200) this.logBuffer.shift();
			this.broadcastEvent({ type: "terminal_log", data: str });
			return originalWrite.call(process.stdout, chunk, encoding, callback);
		};
		const originalErrWrite = process.stderr.write;
		process.stderr.write = (chunk: any, encoding?: any, callback?: any): boolean => {
			const str = chunk.toString();
			this.logBuffer.push(str);
			if (this.logBuffer.length > 200) this.logBuffer.shift();
			this.broadcastEvent({ type: "terminal_log", data: str });
			return originalErrWrite.call(process.stderr, chunk, encoding, callback);
		};
	}

	private getStateUpdateEvent() {
		try {
			const stats = this.runtime.session.getSessionStats();
			const clients = this.runtime.session.mcpManager
				? [...this.runtime.session.mcpManager.getClients().keys()]
				: [];
			const isBlenderConnected = clients.includes("blender");
			const configured = this.runtime.services.settingsManager.getMcpServers();
			const blenderConfig = configured.blender;
			let blenderPort = "1050";
			if (blenderConfig?.args) {
				const portIdx = blenderConfig.args.indexOf("--port");
				if (portIdx !== -1 && portIdx + 1 < blenderConfig.args.length) {
					blenderPort = blenderConfig.args[portIdx + 1];
				}
			}

			return {
				type: "state_update",
				state: {
					model: this.runtime.session.model?.id || "Unknown Model",
					cwd: this.runtime.cwd,
					tokens: {
						in: stats.tokens.input,
						out: stats.tokens.output,
					},
					blenderMcp: isBlenderConnected ? { connected: true, port: blenderPort } : null,
					mobileConnected: this.mobileClients.size > 0,
					mobileCount: this.mobileClients.size,
				},
			};
		} catch (_e) {
			return {
				type: "state_update",
				state: {
					model: this.runtime.session.model?.id || "Unknown Model",
					cwd: this.runtime.cwd,
					tokens: { in: 0, out: 0 },
					mobileConnected: this.mobileClients.size > 0,
					mobileCount: this.mobileClients.size,
				},
			};
		}
	}

	private getLocalIp(): string {
		try {
			const interfaces = os.networkInterfaces();
			for (const name of Object.keys(interfaces)) {
				for (const iface of interfaces[name] || []) {
					if (iface.family === "IPv4" && !iface.internal) {
						return iface.address;
					}
				}
			}
		} catch (_) {}
		return "127.0.0.1";
	}

	private broadcastMobileStatus() {
		this.broadcastEvent({
			type: "mobile_status",
			mobileConnected: this.mobileClients.size > 0,
			mobileCount: this.mobileClients.size,
		});
	}

	private broadcastEvent(event: any) {
		try {
			const removeCircular = (obj: any, seen = new WeakSet()): any => {
				if (typeof obj !== "object" || obj === null) return obj;
				if (seen.has(obj)) return "[Circular]";
				seen.add(obj);
				if (Array.isArray(obj)) {
					const newArr = obj.map((item) => removeCircular(item, seen));
					seen.delete(obj);
					return newArr;
				}
				const newObj: any = {};
				for (const [key, value] of Object.entries(obj)) {
					newObj[key] = removeCircular(value, seen);
				}
				seen.delete(obj);
				return newObj;
			};

			const safeEvent = removeCircular(event);
			const dataStr = JSON.stringify(safeEvent);
			const data = `data: ${dataStr}\n\n`;
			for (const client of this.clients) {
				try {
					client.write(data);
				} catch (_e) {}
			}
		} catch (e) {
			console.error("Broadcast stringify error:", e);
		}
	}

	private webUiServerInstance: any = null;

	async run() {
		try {
			const serverModule = await import("../../core/web-ui-server.js");
			const { getProviders } = await import("moon-core");
			serverModule.setAuthPanelStateProvider(() => {
				const authStorage = this.runtime.session.modelRegistry.authStorage;
				const providerMap = new Map();

				for (const p of getProviders()) {
					providerMap.set(p, {
						id: p,
						name: this.runtime.session.modelRegistry.getProviderDisplayName(p) || p,
						supportsOAuth: false,
						supportsApiKey: true,
						auth: authStorage.getAuthStatus(p),
					});
				}

				for (const p of authStorage.getOAuthProviders()) {
					if (providerMap.has(p.id)) {
						providerMap.get(p.id).supportsOAuth = true;
						providerMap.get(p.id).name = p.name;
					} else {
						providerMap.set(p.id, {
							id: p.id,
							name: p.name,
							supportsOAuth: true,
							supportsApiKey: true,
							auth: authStorage.getAuthStatus(p.id),
						});
					}
				}

				return {
					providers: Array.from(providerMap.values()),
					accounts: authStorage.listManagedAccounts(),
					models: { available: 0, total: 0 },
				};
			});
			serverModule.webUiAuthActionListeners.add(async (action: any) => {
				const authStorage = this.runtime.session.modelRegistry.authStorage;
				if (action.action === "set_active") {
					authStorage.setActiveManagedAccount(action.accountId);
				} else if (action.action === "remove_account") {
					authStorage.removeManagedAccount(action.accountId);
				} else if (action.action === "save_api_key") {
					authStorage.set(action.providerId, { type: "api_key", key: action.apiKey });
				} else if (action.action === "oauth_login") {
					let currentAuthUrl = "";
					await authStorage.login(action.providerId, {
						onAuth: (info: any) => {
							currentAuthUrl = info.url;
							serverModule.setAuthPanelOAuthEvent({
								providerId: action.providerId,
								url: currentAuthUrl,
								instructions: info.instructions || "Please open the login URL in your browser.",
							});
						},
						onPrompt: async (prompt: any) => {
							serverModule.setAuthPanelOAuthEvent({
								providerId: action.providerId,
								status: "pending",
								instructions: prompt.message,
								url: currentAuthUrl,
							});
							return "";
						},
						onProgress: (msg: string) =>
							serverModule.setAuthPanelOAuthEvent({
								providerId: action.providerId,
								status: "pending",
								instructions: msg,
								url: currentAuthUrl,
							}),
						onInfo: (lines: string[]) =>
							serverModule.setAuthPanelOAuthEvent({
								providerId: action.providerId,
								status: "pending",
								instructions: lines.join("\n"),
								url: currentAuthUrl,
							}),
						onManualCodeInput: () => new Promise<string>(() => {}),
					});
					serverModule.setAuthPanelOAuthEvent({
						providerId: action.providerId,
						status: "success",
						instructions: "Login successful!",
						url: "",
					});
				}
			});
			this.webUiServerInstance = serverModule.startWebUiServer({ port: 3131 });
			console.log(`  Auth server  → ${this.webUiServerInstance.url}`);
		} catch (e) {
			console.error("Failed to start Web UI Auth Server:", e);
		}

		this.server = createServer((req, res) => this.handleRequest(req, res));

		return new Promise<void>((resolve, _reject) => {
			const tryListen = (port: number) => {
				this.server!.once("error", (err: NodeJS.ErrnoException) => {
					if (err.code === "EADDRINUSE") {
						tryListen(port + 1);
					} else {
						console.error("Web UI server error:", err.message);
						resolve();
					}
				});
				this.server!.listen(port, () => {
					const address = this.server!.address() as any;
					this.port = address.port;
					const url = `http://127.0.0.1:${this.port}`;
					console.log(`  Web UI → ${url}`);
					const startCmd =
						process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
					exec(`${startCmd} ${url}`, () => {});
					resolve();
				});
			};
			tryListen(3135);
		});
	}

	private async handleRequest(req: IncomingMessage, res: ServerResponse) {
		const method = req.method;
		const url = new URL(req.url || "/", `http://127.0.0.1:${this.port}`);

		const origin = req.headers.origin || "";
		const host = req.headers.host || "";
		const isPrivate = (h: string) => {
			if (h.startsWith("file://")) return true;
			let hostname = h;
			if (h.includes("://")) {
				try {
					hostname = new URL(h).hostname;
				} catch {
					hostname = h;
				}
			} else {
				hostname = h.split(":")[0];
			}
			return (
				hostname === "localhost" ||
				hostname.startsWith("127.") ||
				hostname.startsWith("192.168.") ||
				hostname.startsWith("10.") ||
				/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
			);
		};
		if ((origin && !isPrivate(origin)) || (host && !isPrivate(host))) {
			res.statusCode = 403;
			res.end("Forbidden");
			return;
		}

		res.setHeader("Access-Control-Allow-Origin", origin || "*");

		if (method === "GET" && url.pathname === "/") {
			res.setHeader("Content-Type", "text/html; charset=utf-8");
			res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
			res.setHeader("Pragma", "no-cache");
			res.setHeader("Expires", "0");
			res.end(this.getHtmlTemplate());
			return;
		}

		if (method === "GET" && url.pathname === "/api/custom-emojis") {
			const emojiDir = process.env.ASTRO_EMOJI_DIR ?? "";
			try {
				if (fs.existsSync(emojiDir)) {
					const files = fs.readdirSync(emojiDir).filter((f) => /\.(png|gif|jpg|jpeg|webp)$/i.test(f));
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify(files));
				} else {
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify([]));
				}
			} catch (_e) {
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify([]));
			}
			return;
		}

		if (method === "GET" && url.pathname.startsWith("/custom-emojis/")) {
			const queryName = decodeURIComponent(url.pathname.slice("/custom-emojis/".length));
			if (queryName.includes("..") || queryName.includes("/")) {
				res.statusCode = 400;
				res.end("Bad Request");
				return;
			}
			const emojiDir = process.env.ASTRO_EMOJI_DIR ?? "";
			let targetFile = "";
			if (fs.existsSync(emojiDir)) {
				const files = fs.readdirSync(emojiDir).filter((f) => /\.(png|gif|jpg|jpeg|webp)$/i.test(f));
				if (files.length > 0) {
					const candidate = files.find((f) => f.toLowerCase().includes(queryName.toLowerCase()));
					targetFile = candidate ? candidate : files[Math.floor(Math.random() * files.length)];
				}
			}
			const candidatePath = targetFile ? path.join(emojiDir, targetFile) : "";
			if (candidatePath && fs.existsSync(candidatePath)) {
				const ext = path.extname(candidatePath).toLowerCase();
				const mime: Record<string, string> = {
					".png": "image/png",
					".jpg": "image/jpeg",
					".jpeg": "image/jpeg",
					".gif": "image/gif",
					".webp": "image/webp",
				};
				res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
				res.setHeader("Cache-Control", "public, max-age=3600");
				res.end(fs.readFileSync(candidatePath));
			} else {
				res.statusCode = 404;
				res.end("Not Found");
			}
			return;
		}

		// Serve static assets from the project's assets/ directory
		if (method === "GET" && url.pathname.startsWith("/assets/")) {
			const fileName = url.pathname.slice("/assets/".length);
			// Prevent path traversal
			if (fileName.includes("..") || fileName.includes("/")) {
				res.statusCode = 400;
				res.end("Bad Request");
				return;
			}
			const _filename2 = fileURLToPath(import.meta.url);
			const _dirname2 = dirname(_filename2);
			// Try the package assets dir, then walk up to project root assets/
			const candidates = [
				path.join(_dirname2, "../../../../assets", fileName),
				path.join(_dirname2, "../../../../../assets", fileName),
				path.join(process.cwd(), "assets", fileName),
			];
			let served = false;
			for (const candidate of candidates) {
				if (fs.existsSync(candidate)) {
					const ext = path.extname(fileName).toLowerCase();
					const mime: Record<string, string> = {
						".png": "image/png",
						".jpg": "image/jpeg",
						".jpeg": "image/jpeg",
						".svg": "image/svg+xml",
						".gif": "image/gif",
						".webp": "image/webp",
					};
					res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
					res.setHeader("Cache-Control", "public, max-age=3600");
					res.end(fs.readFileSync(candidate));
					served = true;
					break;
				}
			}
			if (!served) {
				res.statusCode = 404;
				res.end("Not Found");
			}
			return;
		}

		if (method === "GET" && (url.pathname === "/api/stream" || url.pathname === "/events")) {
			res.setHeader("Content-Type", "text/event-stream");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");
			const isMobile = url.searchParams.get("mobile") === "1";
			this.clients.push(res);
			if (isMobile) {
				this.mobileClients.add(res);
				this.broadcastMobileStatus();
			}
			try {
				const stats = this.runtime.session.getSessionStats();
				const initialState = {
					type: "state_update",
					state: {
						model: this.runtime.session.model?.id || "Unknown Model",
						cwd: this.runtime.cwd,
						tokens: {
							in: stats.tokens.input,
							out: stats.tokens.output,
						},
					},
				};
				res.write(`data: ${JSON.stringify(initialState)}\n\n`);
				for (const log of this.logBuffer) {
					res.write(`data: ${JSON.stringify({ type: "terminal_log", data: log })}\n\n`);
				}
			} catch (_e) {}

			req.on("close", () => {
				this.clients = this.clients.filter((client) => client !== res);
				if (isMobile) {
					this.mobileClients.delete(res);
					this.broadcastMobileStatus();
				}
			});
			return;
		}

		if (method === "GET" && url.pathname === "/api/commands") {
			res.setHeader("Content-Type", "application/json");

			const templates = this.runtime.session.promptTemplates || [];
			const _skills: any[] = [];
			const extensions = this.runtime.session.extensionRunner?.getRegisteredCommands() || [];

			const cmds = BUILTIN_SLASH_COMMANDS.map((c) => ({
				cmd: `/${c.name}`,
				desc: c.description,
			}));

			for (const t of templates) cmds.push({ cmd: `/${t.name}`, desc: t.description || "Template command" });

			for (const e of extensions) cmds.push({ cmd: `/${e.name}`, desc: e.description || "Eklenti komutu" });

			// Deduplicate by cmd
			const uniqueCmds = Array.from(new Map(cmds.map((item) => [item.cmd, item])).values());

			res.end(JSON.stringify(uniqueCmds));
			return;
		}

		if (method === "GET" && url.pathname === "/api/status") {
			res.setHeader("Content-Type", "application/json");
			const stats = this.runtime.session.getSessionStats();
			res.end(
				JSON.stringify({
					cwd: this.runtime.cwd,
					model: this.runtime.session.model?.id || "Unknown Model",
					usage: stats.tokens,
					isGenerating: this.runtime.session.isStreaming,
					authUrl: this.webUiServerInstance ? this.webUiServerInstance.url : "http://127.0.0.1:3131",
					tools: this.runtime.session.getActiveToolNames(),
				}),
			);
			return;
		}

		if (method === "GET" && url.pathname === "/api/history") {
			res.setHeader("Content-Type", "application/json");
			const messages = this.runtime.session.engine.state.messages || [];

			const mapped = messages.map((m: any, index: number) => {
				if (!m.id) {
					m.id = `msg-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
				}
				return {
					id: m.id,
					role: m.role,
					content: m.content, // Pass raw content array or string directly to frontend
					text: m.summary
						? m.summary
						: typeof m.content === "string"
							? m.content
							: m.content?.map
								? m.content.map((c: any) => c.text || "").join("")
								: "",
					summary: m.summary,
					tools: (m.toolInvocations || []).map((t: any) => ({
						id: t.toolCallId,
						name: t.toolName,
						status: t.state === "result" ? "success" : t.state === "error" ? "error" : "running",
						input: typeof t.args === "string" ? t.args : JSON.stringify(t.args || {}),
						output: typeof t.result === "string" ? t.result : JSON.stringify(t.result || ""),
					})),
					status: "complete",
					pinned: this.pinnedMessageIds.has(m.id),
					model: m.model,
					provider: m.provider,
				};
			});
			res.end(JSON.stringify(mapped));
			return;
		}

		if (method === "POST" && url.pathname === "/api/prompt") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { prompt, images, customization } = JSON.parse(body);
					let effectivePrompt = prompt;
					if (customization) {
						const parts = [];
						if (customization.aiName)
							parts.push(
								`[System: You are "${customization.aiName}". Always refer to yourself as "${customization.aiName}".]`,
							);
						if (customization.extraInstructions) parts.push(`[Instructions: ${customization.extraInstructions}]`);
						if (customization.systemAdditions) parts.push(`[System Additions: ${customization.systemAdditions}]`);
						if (parts.length > 0) effectivePrompt = `${parts.join(" ")}\n\n${prompt}`;
					}
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true }));

					// COMMAND INTERCEPTION FOR WEB MODE
					let handled = false;
					const cmd = prompt.trim().toLowerCase();
					if (cmd === "/clear") {
						this.runtime.session.engine.reset();
						this.broadcastEvent({ type: "clear_chat" });
						handled = true;
					} else if (cmd === "/compact") {
						this.runtime.session.compact();
						handled = true;
					} else if (cmd === "/test") {
						this.runtime.session.prompt("Run the test suite and fix the errors.");
						handled = true;
					} else if (cmd === "/build") {
						this.runtime.session.prompt("Build the project.");
						handled = true;
					} else if (cmd === "/lint") {
						this.runtime.session.prompt("Run linter and fix the issues.");
						handled = true;
					} else if (cmd === "/ship" || cmd === "/publish") {
						this.runtime.session.prompt("Ship the current changes to GitHub (branch, commit, push, PR).");
						handled = true;
					} else if (cmd === "/refresh") {
						this.runtime.session.prompt("Refresh the application on the connected device/browser.");
						handled = true;
					}

					if (!handled) {
						// --- FUSION MODE HANDLING ---
						const fusionState = this.runtime.session.settingsManager.getFusionMode();
						if (fusionState.enabled && fusionState.thinkModel && fusionState.codeModel) {
							try {
								this.broadcastEvent({
									type: "terminal_log",
									data: `\n🔥 Fusion Mode: Thinking (${fusionState.thinkModel.id})...\n`,
								});
								const thinkModelObj = this.runtime.session.modelRegistry.find(
									fusionState.thinkModel.provider,
									fusionState.thinkModel.id,
								);
								if (!thinkModelObj) throw new Error(`Model not found: ${fusionState.thinkModel.id}`);
								const thinkResponse = await completeSimple(
									thinkModelObj,
									{
										systemPrompt:
											"You are a highly intelligent planning and analysis assistant. Never write code. Only plan, extract architecture, and describe step by step what needs to be done inside `<think>.</think>` blocks for the coder to implement.",
										messages: [
											...(this.runtime.session.engine.state.messages || []).map((m: any) => ({
												role: m.role,
												content: m.content,
											})),
											{
												role: "user",
												content: [{ type: "text", text: effectivePrompt }],
												timestamp: Date.now(),
											},
										] as any[],
									},
									{
										apiKey: (
											this.runtime.session.modelRegistry.authStorage.get(
												fusionState.thinkModel.provider,
											) as any
										)?.apiKey,
										maxTokens: 8000,
									},
								);

								if (thinkResponse.stopReason !== "error" && thinkResponse.stopReason !== "aborted") {
									const thinkText =
										(thinkResponse.content.find((c: any) => c.type === "text") as any)?.text || "";
									if (thinkText) {
										effectivePrompt = `<think>\n${thinkText}\n</think>\n\n${effectivePrompt}`;
										this.broadcastEvent({
											type: "terminal_log",
											data: `🔥 Fusion Mode: Thought completed. Coding (${fusionState.codeModel.id})...\n`,
										});
									}
								}
							} catch (e: any) {
								console.error("Fusion Think error in Web Mode:", e);
								this.broadcastEvent({
									type: "terminal_log",
									data: `⚠️ Fusion Think Error: ${e.message || e}\n`,
								});
							}
						}

						this.runtime.session
							.prompt(effectivePrompt, { images, streamingBehavior: "followUp" })
							.catch((err: any) => {
								console.error("Prompt error:", err);
								this.broadcastEvent({
									type: "message_start",
									message: {
										id: `error-${Date.now()}`,
										role: "assistant",
										content: `<span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle;">error</span> Error: ${err.message || err}`,
									},
								});
								this.broadcastEvent({ type: "engine_end" });
							});
					}
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/history/delete") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { id } = JSON.parse(body);
					const messages = this.runtime.session.engine.state.messages || [];
					const index = messages.findIndex((m: any) => m.id === id);
					if (index !== -1) {
						const msg = messages[index];
						if (msg.role === "user" && index + 1 < messages.length && messages[index + 1].role === "assistant") {
							messages.splice(index, 2);
						} else {
							messages.splice(index, 1);
						}
						this.pinnedMessageIds.delete(id);
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({ success: true }));
					} else {
						res.statusCode = 404;
						res.end(JSON.stringify({ error: "Message not found" }));
					}
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/history/edit") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { id, text } = JSON.parse(body);
					const messages = this.runtime.session.engine.state.messages || [];
					const msg: any = messages.find((m: any) => m.id === id);
					if (msg) {
						if (typeof msg.content === "string") {
							msg.content = text;
						} else if (Array.isArray(msg.content)) {
							const textBlock = msg.content.find((c: any) => c.type === "text");
							if (textBlock) {
								textBlock.text = text;
							} else {
								msg.content = [{ type: "text", text }];
							}
						} else {
							msg.content = text;
						}
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({ success: true }));
					} else {
						res.statusCode = 404;
						res.end(JSON.stringify({ error: "Message not found" }));
					}
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/history/pin") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { id, pinned } = JSON.parse(body);
					if (pinned) {
						this.pinnedMessageIds.add(id);
					} else {
						this.pinnedMessageIds.delete(id);
					}
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "GET" && url.pathname === "/api/conversations") {
			try {
				const sessionDir = this.runtime.session.sessionManager.getSessionDir();
				const sessions = await listSessionsFromDir(sessionDir);
				// Sort by modified desc
				sessions.sort((a, b) => b.modified.getTime() - a.modified.getTime());

				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ sessions, activeId: this.runtime.session.sessionManager.getSessionId() }));
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}

		if (method === "POST" && url.pathname === "/api/conversations/new") {
			try {
				const sm = this.runtime.session.sessionManager;
				sm.newSession();
				const sf = sm.getSessionFile()!;
				const header = sm.getHeader();
				if (header) {
					await fsPromises.writeFile(sf, `${JSON.stringify(header)}\\n`);
				}
				await this.runtime.switchSession(sf);
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ success: true, id: sm.getSessionId() }));
				this.broadcastEvent({ type: "clear_chat" });
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}

		if (method === "POST" && url.pathname === "/api/conversations/switch") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { id } = JSON.parse(body);
					const sessionDir = this.runtime.session.sessionManager.getSessionDir();
					const sessions = await listSessionsFromDir(sessionDir);
					const target = sessions.find((s) => s.id === id);
					if (target?.path) {
						await this.runtime.switchSession(target.path);
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({ success: true }));
						this.broadcastEvent({ type: "clear_chat" }); // triggers client reload
					} else {
						res.statusCode = 404;
						res.end(JSON.stringify({ error: "Session not found" }));
					}
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/conversations/rename") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { id, name } = JSON.parse(body);
					const sessionDir = this.runtime.session.sessionManager.getSessionDir();
					const sessions = await listSessionsFromDir(sessionDir);
					const target = sessions.find((s) => s.id === id);
					if (target?.path) {
						if (id === this.runtime.session.sessionManager.getSessionId()) {
							this.runtime.session.sessionManager.appendSessionInfo(name);
						} else {
							// Write a session_info entry to that file
							const infoEntry = {
								type: "session_info",
								id: `info-${Date.now()}`,
								parentId: null,
								timestamp: new Date().toISOString(),
								name: name,
							};
							await fsPromises.appendFile(target.path, `\n${JSON.stringify(infoEntry)}\n`);
						}
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({ success: true }));
					} else {
						res.statusCode = 404;
						res.end(JSON.stringify({ error: "Session not found" }));
					}
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/conversations/delete") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { id } = JSON.parse(body);
					const sessionDir = this.runtime.session.sessionManager.getSessionDir();
					const sessions = await listSessionsFromDir(sessionDir);
					const target = sessions.find((s) => s.id === id);
					if (target?.path) {
						await fsPromises.unlink(target.path);

						// If deleting active session, switch to newest remaining or create new
						if (this.runtime.session.sessionManager.getSessionId() === id) {
							const remaining = sessions
								.filter((s) => s.id !== id)
								.sort((a, b) => b.modified.getTime() - a.modified.getTime());
							if (remaining.length > 0) {
								await this.runtime.switchSession(remaining[0].path);
							} else {
								const sm = this.runtime.session.sessionManager;
								sm.newSession();
								const sf = sm.getSessionFile()!;
								const header = sm.getHeader();
								if (header) {
									await fsPromises.writeFile(sf, `${JSON.stringify(header)}\n`);
								}
								await this.runtime.switchSession(sf);
							}
							this.broadcastEvent({ type: "clear_chat" });
						}

						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({ success: true }));
					} else {
						res.statusCode = 404;
						res.end(JSON.stringify({ error: "Session not found" }));
					}
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "GET" && url.pathname === "/api/sessions") {
			res.setHeader("Content-Type", "application/json");
			try {
				const sessionsDir = join(getEngineDir(), "sessions");
				const projects: Record<string, any> = {};

				// Ensure current cwd is always considered an explicitly added project
				this.addWebProject(this.runtime.cwd);
				const webProjects = this.getWebProjects();

				for (const projectCwd of webProjects) {
					const projectName = path.basename(projectCwd) || projectCwd;
					projects[projectCwd] = {
						cwd: projectCwd,
						name: projectName,
						sessions: [],
					};

					// Find sessions for this cwd
					const safePath = `--${projectCwd.replace(/^[/\\]/, "").replace(/[/\\:]/g, "-")}--`;
					const fullDir = join(sessionsDir, safePath);

					if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
						const files = fs.readdirSync(fullDir).filter((f) => f.endsWith(".jsonl"));
						for (const file of files) {
							const filePath = join(fullDir, file);
							const info = await buildSessionInfo(filePath);
							if (info) {
								projects[projectCwd].sessions.push({
									id: info.id,
									path: info.path,
									name: info.name || info.firstMessage || "Untitled Chat",
									created: info.created,
									modified: info.modified,
									messageCount: info.messageCount,
								});
							}
						}
					}
					// Sort sessions by modified desc
					projects[projectCwd].sessions.sort(
						(a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
					);
				}

				res.end(JSON.stringify(Object.values(projects)));
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}

		if (method === "POST" && url.pathname === "/api/session/switch") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { path: filePath } = JSON.parse(body);
					if (fs.existsSync(filePath)) {
						await this.runtime.switchSession(filePath);
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({ success: true }));
					} else {
						res.statusCode = 404;
						res.end(JSON.stringify({ error: "Session file not found" }));
					}
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/session/create") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { cwd } = JSON.parse(body);
					this.addWebProject(cwd);
					const sessionDir = this.runtime.session.sessionManager.getSessionDir();
					const sm = SessionManager.create(cwd, sessionDir);
					sm.newSession();
					await this.runtime.switchSession(sm.getSessionFile()!);
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true, path: sm.getSessionFile() }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/project/select-directory") {
			try {
				let selectedPath = "";
				if (process.platform === "win32") {
					// Modern Folder Picker hack via OpenFileDialog (File name "Select Folder")
					const psCommand = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.ValidateNames = $false; $f.CheckFileExists = $false; $f.CheckPathExists = $true; $f.FileName = 'Folder Selection.'; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output ([System.IO.Path]::GetDirectoryName($f.FileName)) }"`;
					const { stdout } = await execAsync(psCommand);
					selectedPath = stdout.trim();
				}
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ success: true, path: selectedPath || null }));
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}

		if (method === "POST" && url.pathname === "/api/project/open-explorer") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { cwd } = JSON.parse(body);
					const startCmd =
						process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open";
					exec(`${startCmd} "${cwd}"`);
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/project/delete") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { cwd } = JSON.parse(body);
					this.removeWebProject(cwd);
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/reset") {
			this.runtime.session.engine.reset();
			this.broadcastEvent({ type: "clear_chat" });
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ success: true }));
			return;
		}

		if (method === "POST" && url.pathname === "/api/interrupt") {
			this.runtime.session.abort();
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ success: true }));
			return;
		}

		if (method === "GET" && url.pathname === "/api/models") {
			res.setHeader("Content-Type", "application/json");
			try {
				// Refresh local models (LM Studio, Ollama) in case they started after MoonCode
				const { refreshLocalModels } = await import("moon-core");
				await refreshLocalModels();

				const registry = this.runtime.session.modelRegistry;
				const allModels = registry.getAll();
				const availableModels = registry.getAvailable();
				const availableSet = new Set(availableModels.map((m) => `${m.provider}:${m.id}`));
				const modelsWithAuth = allModels.map((m) => ({
					...m,
					authenticated: availableSet.has(`${m.provider}:${m.id}`),
				}));
				res.end(JSON.stringify(modelsWithAuth));
			} catch (_e) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: "Failed" }));
			}

			return;
		}

		if (method === "POST" && url.pathname === "/api/logout") {
			res.setHeader("Content-Type", "application/json");
			try {
				let body = "";
				req.on("data", (chunk) => {
					body += chunk;
				});
				req.on("end", async () => {
					try {
						const { provider } = JSON.parse(body || "{}");
						const registry = this.runtime.session.modelRegistry;
						if (provider) {
							registry.authStorage.remove(provider);
						} else {
							const oauthProviders = registry.authStorage.getOAuthProviders();
							for (const p of oauthProviders) {
								registry.authStorage.remove(p.id);
							}
						}
						res.end(JSON.stringify({ success: true }));
					} catch (_e) {
						res.statusCode = 500;
						res.end(JSON.stringify({ error: "Failed" }));
					}
				});
			} catch (_e) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: "Failed" }));
			}
			return;
		}

		if (method === "POST" && url.pathname === "/api/set-model") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { provider, model: modelId } = JSON.parse(body);
					const modelObj = this.runtime.session.modelRegistry.find(provider, modelId);
					if (!modelObj) {
						res.statusCode = 404;
						res.end(JSON.stringify({ error: "Model not found" }));
						return;
					}
					await this.runtime.session.setModel(modelObj);
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/set-fusion") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { enabled, thinkModel, codeModel } = JSON.parse(body);
					const sm = this.runtime.session.settingsManager;
					if (enabled && thinkModel && codeModel) {
						sm.setFusionThinkModel(thinkModel.provider, thinkModel.id);
						sm.setFusionCodeModel(codeModel.provider, codeModel.id);
						sm.setFusionModeEnabled(true);
						const modelObj = this.runtime.session.modelRegistry.find(codeModel.provider, codeModel.id);
						if (modelObj) {
							await this.runtime.session.setModel(modelObj);
						}
					} else {
						sm.setFusionModeEnabled(false);
					}
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/set-thinking") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				const { level } = JSON.parse(body);
				this.runtime.session.settingsManager.setDefaultThinkingLevel(level as any);
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ success: true }));
			});
			return;
		}

		if (method === "GET" && url.pathname === "/api/auth/status") {
			res.setHeader("Content-Type", "application/json");
			const authStorage = this.runtime.session.modelRegistry.authStorage;
			const accounts = authStorage.listManagedAccounts();
			const activeAccount = accounts.find((a) => a.active);
			res.end(
				JSON.stringify({
					isLoggedIn: !!activeAccount,
					account: activeAccount
						? {
								name: activeAccount.label || activeAccount.provider,
								email: activeAccount.quotaLabel || `${activeAccount.provider} account`,
								initial: (activeAccount.label || activeAccount.provider).charAt(0).toUpperCase(),
							}
						: null,
				}),
			);
			return;
		}

		if (method === "GET" && url.pathname === "/api/settings") {
			res.setHeader("Content-Type", "application/json");

			const sm = this.runtime.session.settingsManager;
			res.end(
				JSON.stringify({
					theme: sm.getTheme(),
					compactionProfile: sm.getCompactionProfile(),
					enableToolBasedCompaction: sm.getCompactionEnabled(),
					reserveTokens: sm.getCompactionReserveTokens(),
					keepRecentTokens: sm.getCompactionKeepRecentTokens(),
					thinkingLevel: sm.getDefaultThinkingLevel(),
					permissionLevel: sm.getPermissionLevel(),
				}),
			);

			return;
		}

		if (method === "POST" && url.pathname === "/api/settings") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const updates = JSON.parse(body);
					const sm = this.runtime.session.settingsManager;
					for (const [k, v] of Object.entries(updates)) {
						if (k === "theme") sm.setTheme(v as string);
						if (k === "enableToolBasedCompaction") sm.setCompactionEnabled(v as boolean);
						if (k === "compactionProfile") sm.setCompactionProfile(v as any);
						if (k === "reserveTokens") sm.setCompactionReserveTokens(v ? Number(v) : undefined);
						if (k === "keepRecentTokens") sm.setCompactionKeepRecentTokens(v ? Number(v) : undefined);
						if (k === "permissionLevel" && ["ask", "safe", "full"].includes(v as string))
							sm.setPermissionLevel(v as any);
					}
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true }));
				} catch (_e) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: "Invalid settings" }));
				}
			});
			return;
		}

		if (method === "GET" && url.pathname === "/api/browser/status") {
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify(getBrowserBridgeStatus()));
			return;
		}

		if (method === "GET" && url.pathname === "/api/mcp-panel") {
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify(getMcpPanelState()));
			return;
		}

		if (method === "POST" && url.pathname === "/api/mcp-panel/action") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					if (webUiMcpActionListeners.size === 0) {
						// No listeners registered — interactive mode might not be active
						res.statusCode = 400;
						res.end(
							JSON.stringify({
								ok: false,
								error: "MCP action listeners not registered. Ensure interactive mode (terminal) is running alongside the Web UI.",
							}),
						);
						return;
					}
					const data = JSON.parse(body || "{}");
					for (const listener of webUiMcpActionListeners) {
						await listener(data);
					}
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ ok: true, message: "MCP action complete." }));
				} catch (e: any) {
					res.statusCode = 400;
					res.end(JSON.stringify({ ok: false, error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/session/fork") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { id } = JSON.parse(body);
					const result = await this.runtime.fork(id, { position: "at" });
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: !result.cancelled }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/session/answer") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const { answer } = JSON.parse(body);
					if (this.pendingSelectResolver) {
						this.pendingSelectResolver(answer);
						this.pendingSelectResolver = null;
					}
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "GET" && url.pathname === "/api/memory/experiences") {
			try {
				const memory = (this.runtime.session as any).learningMemory;
				if (memory?.getExperiences) {
					const experiences = memory.getExperiences();
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true, experiences }));
				} else {
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true, experiences: [] }));
				}
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}

		if (method === "GET" && url.pathname === "/api/session/export") {
			try {
				const format = url.searchParams.get("format") || "jsonl";
				const tempDir = join(getEngineDir(), "temp-exports");
				if (!fs.existsSync(tempDir)) {
					fs.mkdirSync(tempDir, { recursive: true });
				}
				const filename = `session-${Date.now()}.${format}`;
				const tempPath = join(tempDir, filename);

				if (format === "html") {
					await this.runtime.session.exportToHtml(tempPath);
					res.setHeader("Content-Type", "text/html");
				} else {
					this.runtime.session.exportToJsonl(tempPath);
					res.setHeader("Content-Type", "application/jsonl");
				}

				res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
				const content = fs.readFileSync(tempPath);
				fs.unlinkSync(tempPath);
				res.end(content);
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}

		if (method === "POST" && url.pathname === "/api/session/import") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const tempDir = join(getEngineDir(), "temp-imports");
					if (!fs.existsSync(tempDir)) {
						fs.mkdirSync(tempDir, { recursive: true });
					}
					const tempPath = join(tempDir, `import-${Date.now()}.jsonl`);
					fs.writeFileSync(tempPath, body, "utf-8");

					const result = await this.runtime.importFromJsonl(tempPath);
					fs.unlinkSync(tempPath);

					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: !result.cancelled }));
				} catch (e: any) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: e.message }));
				}
			});
			return;
		}

		if (method === "POST" && url.pathname === "/api/session/share") {
			try {
				const tempDir = join(getEngineDir(), "temp-exports");
				if (!fs.existsSync(tempDir)) {
					fs.mkdirSync(tempDir, { recursive: true });
				}
				const tempPath = join(tempDir, `share-${Date.now()}.html`);
				await this.runtime.session.exportToHtml(tempPath);
				const htmlContent = fs.readFileSync(tempPath, "utf-8");
				fs.unlinkSync(tempPath);

				const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
					"User-Agent": "MoonCode",
				};
				if (token) {
					headers.Authorization = `token ${token}`;
				}

				const response = await fetch("https://api.github.com/gists", {
					method: "POST",
					headers,
					body: JSON.stringify({
						description: "MoonCode Session Export",
						public: false,
						files: {
							"session.html": {
								content: htmlContent,
							},
						},
					}),
				});

				const result = (await response.json()) as any;
				if (response.ok && result.html_url) {
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ success: true, url: result.html_url }));
				} else {
					res.statusCode = response.status;
					res.end(JSON.stringify({ error: result.message || "Failed to create Gist" }));
				}
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}
		if (method === "GET" && url.pathname === "/api/fs/tree") {
			try {
				const dir = url.searchParams.get("dir") || this.runtime.cwd;
				const stats = fs.statSync(dir);
				if (!stats.isDirectory()) {
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ name: path.basename(dir), path: dir, type: "file" }));
					return;
				}

				let childrenPaths: string[] = [];
				try {
					childrenPaths = fs.readdirSync(dir);
				} catch (_e) {
					// Ignore unreadable directories
				}

				const children = childrenPaths
					.filter((f) => !["node_modules", ".git", "dist", ".mooncode"].includes(f))
					.map((f) => {
						const childPath = path.join(dir, f);
						try {
							const cStats = fs.statSync(childPath);
							return { name: f, path: childPath, type: cStats.isDirectory() ? "directory" : "file" };
						} catch (_e) {
							return null;
						}
					})
					.filter(Boolean);

				children.sort((a: any, b: any) => {
					if (a.type === b.type) return a.name.localeCompare(b.name);
					return a.type === "directory" ? -1 : 1;
				});

				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ name: path.basename(dir), path: dir, type: "directory", children }));
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}

		if (method === "GET" && url.pathname === "/api/fs/read") {
			try {
				const filePath = url.searchParams.get("path");
				const raw = url.searchParams.get("raw") === "true";
				if (!filePath) throw new Error("Path required");

				if (raw) {
					const ext = path.extname(filePath).toLowerCase();
					let mime = "application/octet-stream";
					if (ext === ".png") mime = "image/png";
					else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
					else if (ext === ".svg") mime = "image/svg+xml";
					else if (ext === ".gif") mime = "image/gif";
					else if (ext === ".webp") mime = "image/webp";

					const buffer = fs.readFileSync(filePath);
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ content: `data:${mime};base64,${buffer.toString("base64")}` }));
				} else {
					const content = fs.readFileSync(filePath, "utf-8");
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify({ content }));
				}
			} catch (e: any) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: e.message }));
			}
			return;
		}

		if (method === "GET" && url.pathname === "/api/todo") {
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify(getTodoSnapshot()));
			return;
		}

		if (method === "GET" && url.pathname === "/mobile") {
			const html = this.getHtmlTemplate()
				.replace('<html lang="en"', '<html lang="en" data-mobile="1"')
				.replace("<title>Astro 5 🚀 – AI Coding Assistant</title>", "<title>Astro 5 🚀 – Mobile</title>");
			res.setHeader("Content-Type", "text/html; charset=utf-8");
			res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
			res.end(html);
			return;
		}

		if (method === "GET" && url.pathname === "/api/mobile/qr") {
			const localIp = this.getLocalIp();
			const mobileUrl = `http://${localIp}:${this.port}/mobile`;
			res.setHeader("Content-Type", "application/json");
			res.end(
				JSON.stringify({
					url: mobileUrl,
					ip: localIp,
					port: this.port,
					connected: this.mobileClients.size > 0,
					mobileCount: this.mobileClients.size,
				}),
			);
			return;
		}

		if (method === "GET" && url.pathname === "/api/mobile/status") {
			res.setHeader("Content-Type", "application/json");
			res.end(
				JSON.stringify({
					connected: this.mobileClients.size > 0,
					mobileCount: this.mobileClients.size,
				}),
			);
			return;
		}

		res.statusCode = 404;
		res.end("Not Found");
	}

	private getHtmlTemplate() {
		const _filename = fileURLToPath(import.meta.url);
		const _dirname = dirname(_filename);
		return fs.readFileSync(path.join(_dirname, "studio-ui.html"), "utf8");
	}
}
