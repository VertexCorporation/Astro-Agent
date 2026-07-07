/**
 * ToolBatchComponent - Groups consecutive tool calls into a single collapsible block.
 * Instead of showing each tool call separately (visual clutter), they're batched
 * into a compact summary line that can be expanded.
 */

import { Container } from "astro-tui";
import { theme } from "../theme/theme.js";
import type { ToolExecutionComponent } from "./tool-execution.js";

const ANSI_RE = /\x1b\[[0-9;]*m/g;

function _widthOf(value: string): number {
	return value.replace(ANSI_RE, "").length;
}

export class ToolBatchComponent extends Container {
	private toolComponents: ToolExecutionComponent[] = [];
	private collapsed = true;

	/** Add a tool execution to this batch */
	addTool(component: ToolExecutionComponent): void {
		this.toolComponents.push(component);
		this.invalidateCache();
	}

	/** Get the number of tools in this batch */
	get count(): number {
		return this.toolComponents.length;
	}

	/** Get tool components */
	getTools(): ToolExecutionComponent[] {
		return this.toolComponents;
	}

	/** Check if a specific tool call ID exists in this batch */
	hasToolCallId(id: string): boolean {
		return this.toolComponents.some((t) => (t as any).toolCallId === id);
	}

	/** Get a tool component by call ID */
	getToolByCallId(id: string): ToolExecutionComponent | undefined {
		return this.toolComponents.find((t) => (t as any).toolCallId === id);
	}

	/** Toggle collapsed state */
	toggle(): void {
		this.collapsed = !this.collapsed;
		this.invalidateCache();
	}

	/** Set collapsed state */
	setCollapsed(collapsed: boolean): void {
		this.collapsed = collapsed;
		this.invalidateCache();
	}

	isCollapsed(): boolean {
		return this.collapsed;
	}

	private invalidateCache(): void {
		this.cachedWidth = undefined;
		this.cachedLines = undefined;
	}

	override invalidate(): void {
		super.invalidate();
		this.invalidateCache();
	}

	override render(width: number): string[] {
		if (this.toolComponents.length === 0) return [];

		// Single tool = render normally, no batch wrapper
		if (this.toolComponents.length === 1) {
			return this.toolComponents[0].render(width);
		}

		this.invalidateCache();

		// Build summary line
		const toolNames = this.toolComponents.map((t) => t.getToolName());
		const uniqueNames = [...new Set(toolNames)];
		const nameCounts = uniqueNames.map((name) => {
			const count = toolNames.filter((n) => n === name).length;
			return count > 1 ? `${name}×${count}` : name;
		});

		// Check statuses
		const allDone = this.toolComponents.every((t) => !(t as any).isPartial);
		const hasError = this.toolComponents.some((t) => (t as any).result?.isError);
		const running = this.toolComponents.some((t) => (t as any).isPartial && (t as any).executionStarted);

		let statusIcon: string;
		let statusColor: string;
		if (hasError) {
			statusIcon = "❌";
			statusColor = "error";
		} else if (allDone) {
			statusIcon = "✅";
			statusColor = "success";
		} else if (running) {
			statusIcon = "⏳";
			statusColor = "accent";
		} else {
			statusIcon = "⏳";
			statusColor = "dim";
		}

		const arrow = this.collapsed ? "▸" : "▾";
		const summary = nameCounts.join(", ");
		const countLabel = `${this.toolComponents.length} tool`;

		const headerLine = theme.fg(
			statusColor as any,
			`${arrow} ${statusIcon} ${countLabel}: ${theme.fg("dim", summary)}`,
		);

		if (this.collapsed) {
			return [headerLine];
		}

		// Expanded: show header + all tool components
		const lines: string[] = [headerLine];
		for (const tool of this.toolComponents) {
			const toolLines = tool.render(width);
			lines.push(...toolLines);
		}
		return lines;
	}
}
