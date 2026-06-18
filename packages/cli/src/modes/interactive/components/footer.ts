import type { Component } from "moon-tui";
import { VERSION } from "../../../config.js";
import { getDevLevelState } from "../../../core/dev-level.js";
import type { EngineSession } from "../../../core/engine-session.js";
import type { ReadonlyFooterDataProvider } from "../../../core/footer-data-provider.js";

const ANSI_RE = /\x1b\[[0-9;]*m/g;

function widthOf(value: string): number {
	return value.replace(ANSI_RE, "").replace(/[\uD800-\uDFFF]/g, "  ").length;
}

function pad(count: number): string {
	return count > 0 ? " ".repeat(count) : "";
}

function steel(value: string): string {
	return `\x1b[38;2;95;158;160m${value}\x1b[39m`;
}

function dim(value: string): string {
	return `\x1b[38;2;90;90;90m${value}\x1b[39m`;
}

function muted(value: string): string {
	return `\x1b[38;2;140;140;140m${value}\x1b[39m`;
}

function sage(value: string): string {
	return `\x1b[38;2;110;170;120m${value}\x1b[39m`;
}

function bg1(value: string): string {
	return `\x1b[48;2;24;24;36m${value}\x1b[49m`;
}

function shortenPath(value: string): string {
	if (!value) return ".";
	const parts = value.split(/[/\\]/);
	return parts.length <= 2 ? value : `./${parts.slice(-2).join("/")}`;
}

function fitText(value: string, maxWidth: number): string {
	const plain = value.replace(ANSI_RE, "");
	if (plain.length <= maxWidth) return value;
	if (maxWidth <= 1) return "";
	return `${plain.slice(0, maxWidth - 1)}~`;
}

function renderLine(left: string, right: string, width: number, painter: (value: string) => string): string {
	const safeWidth = Math.max(1, width);
	const fittedRight = fitText(right, Math.max(0, safeWidth - 8));
	const rightWidth = widthOf(fittedRight);
	const fittedLeft = fitText(left, Math.max(0, safeWidth - rightWidth - 1));
	const gap = Math.max(1, safeWidth - widthOf(fittedLeft) - rightWidth - 1);
	return painter(`${fittedLeft}${pad(gap)}${fittedRight} `);
}

export class FooterComponent implements Component {
	private getExecutingToolNames?: () => string[];
	private costTotal = 0;
	private lastEntryCount = -1;

	constructor(
		private session: EngineSession,
		private _footerData: ReadonlyFooterDataProvider,
		getExecutingToolNames?: () => string[],
	) {
		this.getExecutingToolNames = getExecutingToolNames;
	}

	setSession(session: EngineSession): void {
		this.session = session;
		this.invalidate();
	}

	setAutoCompactEnabled(_enabled: boolean): void {}

	invalidate(): void {
		this.lastEntryCount = -1;
	}

	dispose(): void {}

	render(width: number): string[] {
		const state = this.session.state;
		const entries = this.session.sessionManager?.getEntries() ?? [];

		if (entries.length !== this.lastEntryCount) {
			this.lastEntryCount = entries.length;
			this.costTotal = 0;
			for (const entry of entries) {
				if (entry.type === "message" && entry.message.role === "assistant") {
					const totalCost = entry.message.usage?.cost?.total;
					if (typeof totalCost === "number" && Number.isFinite(totalCost)) {
						this.costTotal += totalCost;
					}
				}
			}
		}

		const provider = state.model?.provider ?? "";
		let model = state.model?.id ?? "no-model";
		if (provider && model.toLowerCase().startsWith(`${provider.toLowerCase()}-`)) {
			model = model.slice(provider.length + 1);
		} else if (provider && model.toLowerCase().startsWith(`${provider.toLowerCase()}/`)) {
			model = model.slice(provider.length + 1);
		}

		const ctxUsage = this.session.getContextUsage?.();
		const ctxPct = ctxUsage?.percent != null ? `${ctxUsage.percent.toFixed(0)}%` : "0%";
		const thinkLevel = state.thinkingLevel ?? "off";
		const cwd = this.session.sessionManager?.getCwd() ?? ".";
		const compacting = Boolean((this.session as any).isCompacting);
		const streaming = this.session.isStreaming;
		const phase = compacting ? steel("compact") : streaming ? steel("run") : dim("idle");
		const browserClients = this.session.getBrowserBridgeStatus?.()?.clients ?? 0;
		const activeTools = this.getExecutingToolNames?.() ?? [];
		const toolNames = (this.session as any).getActiveToolNames?.() ?? [];
		const toolCount = activeTools.length || toolNames.length;

		const showPath = width >= 92;
		const showCost = width >= 92;

		// Single unified status bar
		const modelLabel = muted(fitText(`\u{1F9E0} ${model}`, Math.max(8, Math.floor(width * 0.2))));
		const browserStatus = browserClients > 0 ? sage(`\u{1F310}${browserClients}`) : "";
		const toolLabel = toolCount > 0 ? muted(`\u{1F6E0}\uFE0F${toolCount}`) : "";
		const costLabel = showCost ? muted(`\u{1F4B0}$${this.costTotal.toFixed(3)}`) : "";
		const leftParts = [showPath ? muted(` \u{1F4C1} ${shortenPath(cwd)}`) : "", modelLabel].filter(Boolean);
		const rightParts = [
			dim(`\u{1F4AD}${thinkLevel}`),
			sage(`\u{1F4E6}${ctxPct}`),
			phase,
			browserStatus,
			toolLabel,
			costLabel,
		].filter(Boolean);
		const left = leftParts.join(dim(" | "));
		const right = rightParts.join(dim(" | "));
		const row = renderLine(` ${left}`, right, width, bg1);

		return [row];
	}
}
