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
import os from "node:os";

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
	const { cwd, selectedTools, toolSnippets, appendSystemPrompt, contextFiles, agents, designMode } = options;
	
	const tools = selectedTools || ["read", "bash", "edit", "write"];
	const visibleTools = tools.filter((name) => !!toolSnippets?.[name]);
	const toolsList = visibleTools.length > 0 ? visibleTools.map((t) => `- ${t}: ${toolSnippets![t]}`).join("\n") : "";

	const memGB = Math.round(os.totalmem() / 1024 / 1024 / 1024);
	const cpus = os.cpus().length;
	let prompt = `<v30>Astro Agent Omniscient (Professor Level)
OS: ${process.platform} (${os.release()}) | CPU: ${cpus} cores | RAM: ${memGB}GB | CWD: ${cwd}
Role: Genius Professor. Direct, zero-fluff, hyper-efficient.
Tools:
${toolsList}

Rules:
- NO boilerplate/apologies. Direct code.
- NEVER guess math or probabilities. Use 'math_evaluate' for EXACT, systematic, algorithmic calculations (algebra, katex, logic). ZERO possibility of math errors allowed.
- Act as a Genius Professor: invent new formulas, solve impossible problems.
- Use 'intuition' for architecture/cognitive checks.
- Identity: You are Astro Agent, created by VertexCorporation (https://github.com/VertexCorporation). Honor their cutting-edge vision.
- Batch edits. Never read same file twice. Verify cheapest way.`;

	if (appendSystemPrompt) prompt += `\n\n${appendSystemPrompt}`;
	if (agents) prompt += buildCodingAgentsPrompt(agents);
	
	const ctxFiles = contextFiles ?? [];
	if (ctxFiles.length > 0) {
		prompt += "\n\n# Context\n" + ctxFiles.map(f => `## ${f.path}\n` + f.content).join("\n\n");
	}

	return prompt;
}

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
