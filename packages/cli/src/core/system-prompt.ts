// @ts-nocheck
/**
 * Ultra-compact system prompt builder.
 *
 * v25 — redesigned for absolute minimum token footprint.
 * Every character is deliberate. No personality fluff, no redundant boilerplate.
 */

import { buildCodingAgentsPrompt, type CodingAgentsSettings } from "./agents.js";
import { buildDesignPrompt } from "./design-system/index.js";
import { formatSkillsForPrompt, type Skill } from "./skills.js";

export interface RoboticsFunction {
	name: string;
	description: string;
	parameters: Array<{ name: string; type: string; description: string }>;
}

export interface BuildSystemPromptOptions {
	customPrompt?: string;
	selectedTools?: string[];
	toolSnippets?: Record<string, string>;
	promptGuidelines?: string[];
	appendSystemPrompt?: string;
	affectivePrompt?: string;
	cwd: string;
	contextFiles?: Array<{ path: string; content: string }>;
	skills?: Skill[];
	agents?: CodingAgentsSettings;
	roboticsEnabled?: boolean;
	roboticsFunctions?: RoboticsFunction[];
	designMode?: boolean;
	/** v25: always compact by default — personality is wasted tokens */
	compactMode?: boolean;
}

export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
	const {
		customPrompt,
		toolSnippets,
		appendSystemPrompt,
		affectivePrompt,
		cwd,
		selectedTools,
		contextFiles: providedContextFiles,
		skills: providedSkills,
		roboticsEnabled,
		roboticsFunctions,
		agents,
		designMode,
	} = options;

	if (!customPrompt) {
		return buildV25Prompt(options);
	}

	// Custom prompt path — minimal framing
	const tools = selectedTools || ["read", "bash", "edit", "write"];
	const visibleTools = tools.filter((name) => !!toolSnippets?.[name]);
	const toolsList =
		visibleTools.length > 0 ? visibleTools.map((name) => `- ${name}: ${toolSnippets![name]}`).join("\n") : "(none)";

	const now = new Date();
	const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

	let prompt = customPrompt;
	prompt += `\n\nTools:\n${toolsList}\navailable: invoke_subagent, task, ask_question`;
	if (appendSystemPrompt) prompt += `\n\n${appendSystemPrompt}`;
	if (affectivePrompt) prompt += `\n\n${affectivePrompt}`;
	if (agents) prompt += buildCodingAgentsPrompt(agents);

	const ctxFiles = providedContextFiles ?? [];
	if (ctxFiles.length > 0) {
		prompt += "\n\n## Context";
		for (const { path: filePath, content } of ctxFiles) {
			const trimmed = content.split("\n").slice(0, 10).join("\n");
			prompt += `\n### ${filePath}\n${trimmed}`;
		}
	}

	const skills = providedSkills ?? [];
	const hasRead = !selectedTools || selectedTools.includes("read");
	if (hasRead && skills.length > 0) prompt += formatSkillsForPrompt(skills);

	prompt += `\n${d} | ${cwd.replace(/\\/g, "/")}`;

	if (designMode) prompt += buildDesignPrompt({ projectRoot: cwd });
	if (roboticsEnabled) prompt += buildRoboticsSystemPrompt(roboticsFunctions);

	return prompt;
}

/**
 * v25 — Ultra-compact prompt with a distinct professional character.
 *
 * This AI has a SOUL: a world-class systems architect who thinks in first principles,
 * trade-offs, and long-term maintainability. Not a chatbot — a peer who challenges
 * assumptions and demands excellence.
 *
 * Every token is deliberate. Personality is not fluff — it's the framework for
 * how the AI reasons about problems differently from every other model.
 */
function buildV25Prompt(options: BuildSystemPromptOptions): string {
	const {
		cwd,
		selectedTools,
		toolSnippets,
		promptGuidelines,
		appendSystemPrompt,
		affectivePrompt,
		contextFiles,
		skills,
		agents,
		roboticsEnabled,
		roboticsFunctions,
		designMode,
	} = options;
	const promptCwd = cwd.replace(/\\/g, "/");
	const now = new Date();
	const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

	const tools = selectedTools || ["read", "bash", "edit", "write"];
	const hasBrowser = tools.includes("browser_tabs") || tools.includes("browser_page");
	const hasSematicSearch = tools.includes("semantic_search");
	const hasCodebaseIndex = tools.includes("codebase_index");
	const hasBlenderTools = tools.some((name) => name.startsWith("blender_"));
	const hasScratchTools = tools.some((name) => name.startsWith("scratch_"));

	const visibleTools = tools.filter((n) => !!toolSnippets?.[n]);
	const toolsList =
		visibleTools.length > 0 ? visibleTools.map((n) => `- ${n}: ${toolSnippets![n]}`).join("\n") : "(none)";

	// === IDENTITY: The Architect ===
	// Not an assistant. A peer. A systems architect who has shipped to production
	// at scale, who values simplicity over cleverness, and who chooses tools
	// the way a master carpenter chooses chisels — each has a purpose.
	//
	// This character is the "soul" — it's what makes this AI reason differently.
	// Every response is filtered through this lens.

	// === RULES: Organized by impact ===
	const rules: string[] = [
		// Token discipline
		"CHARGE BY THE TOKEN. Every word you output costs real money. Be surgical.",
		"Prefer `digest` over `read`. Prefer `grep`/`find` before `read`. Always set read offset/limit.",
		"Use `todo` to track plans — saves tokens vs keeping plans in conversation.",
		"No boilerplate, no decorative comments, no placeholders, no emojis.",
		// Engineering philosophy
		"Simplicity > cleverness. The best code is the code that doesn't exist.",
		"Challenge assumptions. If a requirement is wrong, say so — with data.",
		"Think in systems, not lines. A change's ripple effect matters more than its diff.",
		"Prefer the boring solution that works over the elegant one that might fail.",
		// Execution
		"Act first, report concisely. Never narrate before acting.",
		"Batch edits. Reuse results. Never read the same file twice.",
		"Verify with the cheapest real check. Long work: small verified batches.",
		"Final output: what changed, how it was verified, residual risk.",
	];

	if (hasBrowser) {
		rules.push("Chrome bridge available. Use browser_tabs/page for web tasks.");
	}
	if (hasSematicSearch) {
		rules.push("semantic_search finds candidates only — verify against source.");
	}
	if (hasCodebaseIndex) {
		rules.push("codebase_index only when grep/find are insufficient.");
	}

	for (const g of promptGuidelines ?? []) {
		const n = g.trim();
		if (n) rules.push(n);
	}

	const ruleText = rules.join("\n- ");

	let prompt = `<v25>
Tools:\n${toolsList}

Rules:
- ${ruleText}

${d} ${t} | ${promptCwd}`;

	if (appendSystemPrompt) prompt += `\n\n${appendSystemPrompt}`;
	if (affectivePrompt) prompt += `\n\n${affectivePrompt}`;
	if (agents) prompt += buildCodingAgentsPrompt(agents);

	const ctxFiles = contextFiles ?? [];
	if (ctxFiles.length > 0) {
		prompt += "\n\n[ctx]";
		for (const { path: filePath, content } of ctxFiles) {
			const trimmed = content.split("\n").slice(0, 10).join("\n");
			prompt += `\n${filePath}:\n${trimmed}`;
		}
	}

	const skills_ = skills ?? [];
	const hasRead = !selectedTools || selectedTools.includes("read");
	if (hasRead && skills_.length > 0) prompt += formatSkillsForPrompt(skills_);

	if (hasBlenderTools) prompt += buildBlenderSystemPrompt();
	if (hasScratchTools) prompt += buildScratchSystemPrompt();
	if (designMode) prompt += buildDesignPrompt({ projectRoot: cwd });
	if (roboticsEnabled) prompt += buildRoboticsSystemPrompt(roboticsFunctions);

	return prompt;
}

/** Blender MCP — compact */
function buildBlenderSystemPrompt(): string {
	return "\n\n## Blender\n- MCP tools active. Inspect scene first, model cleanly, use modifiers/collections.";
}

/** Scratch MCP — compact */
function buildScratchSystemPrompt(): string {
	return "\n\n## Scratch\n- MCP tools active. Inspect page status first. Prefer small verified edits.";
}

/** Robotics mode prompt addition */
function buildRoboticsSystemPrompt(functions?: RoboticsFunction[]): string {
	let prompt = "\n\n## Robotics Mode";
	if (functions && functions.length > 0) {
		prompt += "\nAvailable:";
		for (const fn of functions) {
			const params = fn.parameters.map((p) => `${p.name}:${p.type}`).join(", ");
			prompt += `\n  ${fn.name}(${params}): ${fn.description}`;
		}
	}
	return prompt;
}
