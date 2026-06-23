import os from "node:os";
import { buildCodingAgentsPrompt, type CodingAgentsSettings } from "./agents.js";
import { buildDesignPrompt } from "./design-system/index.js";
import { buildSafetyGuidelines } from "./prompt-sections/safety-guidelines.js";
import { buildToneFormatting } from "./prompt-sections/tone-formatting.js";
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
		return buildV48Prompt(options);
	}

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
		prompt += "\n\n<Ctx>";
		for (const { path: filePath, content } of ctxFiles) {
			const trimmed = content.split("\n").slice(0, 10).join("\n");
			prompt += `\n<f p="${filePath}">\n${trimmed}\n</f>`;
		}
		prompt += "\n</Ctx>";
	}

	const skills = providedSkills ?? [];
	const hasRead = !selectedTools || selectedTools.includes("read");
	if (hasRead && skills.length > 0) prompt += formatSkillsForPrompt(skills);

	prompt += `\n${d} | ${cwd.replace(/\\/g, "/")}`;

	if (designMode) prompt += buildDesignPrompt({ projectRoot: cwd });
	if (roboticsEnabled) prompt += buildRoboticsSystemPrompt(roboticsFunctions);

	return prompt;
}

function buildV48Prompt(options: BuildSystemPromptOptions): string {
	const {
		cwd,
		selectedTools,
		toolSnippets,
		appendSystemPrompt,
		contextFiles,
		agents,
		promptGuidelines,
		affectivePrompt,
	} = options;

	const memGB = Math.round(os.totalmem() / 1024 / 1024 / 1024);
	const cpus = os.cpus().length;

	const tools = selectedTools || [
		"read",
		"bash",
		"edit",
		"write",
		"grep",
		"find",
		"ls",
		"digest",
		"todo",
		"git_ship",
		"math_evaluate",
		"invoke_subagent",
		"ask_question",
	];
	const visibleTools = tools.filter((name) => !!toolSnippets?.[name]);
	const toolsList =
		visibleTools.length > 0 ? visibleTools.map((t) => `- ${t}: ${toolSnippets![t]}`).join("\n") : "(none)";

	const guidelines = promptGuidelines?.length ? promptGuidelines.map((g) => `- ${g}`).join("\n") : "";

	const now = new Date();

	let prompt = `<Astro:Genesis v="48">
Sys:${process.platform}|${cpus}C|${memGB}G|${cwd}
Date:${now.toISOString().slice(0, 10)}`;

	prompt += `\n\n<Identity>
You are Astro 5 — the world's most advanced AI coding agent, built by VertexCorporation.
Name: Astro (also responds to MoonCode)
Purpose: Solve any software task autonomously, with professor-level reasoning.
You are NOT Claude, NOT any other AI. You are Astro 5.
You think in first principles, optimize for minimum tokens, maximum correctness.
</Identity>`;

	prompt += `\n\n<Tools>\n${toolsList}\n</Tools>`;

	prompt += `\n\n<CoreRules>
- NO boilerplate, apologies, or fluff. Only direct code & logic.
- Plan with 'task' tool before complex multi-file goals.
- Batch edits. 0 redundant reads. Optimal efficiency.
- Match user language in responses (TR for TR, EN for EN).
- 0 math errors: always use 'math_evaluate'.
- 0 hallucinated APIs: only use tools listed in <Tools>.
- Prefer proven patterns. Think twice before novel approaches.
- When stuck: use 'task' to delegate sub-problems in parallel.
</CoreRules>`;

	prompt += buildToneFormatting();

	prompt += buildSafetyGuidelines();

	if (affectivePrompt) prompt += `\n\n<Affective>\n${affectivePrompt}\n</Affective>`;

	if (appendSystemPrompt) prompt += `\n\n${appendSystemPrompt}`;

	if (agents) prompt += buildCodingAgentsPrompt(agents);

	const ctxFiles = contextFiles ?? [];
	if (ctxFiles.length > 0) {
		prompt += `\n\n<Context>\n${ctxFiles.map((f) => `<f p="${f.path}">\n${f.content}\n</f>`).join("\n")}\n</Context>`;
	}

	if (guidelines) prompt += `\n\n<Guidelines>\n${guidelines}\n</Guidelines>`;

	prompt += `\n\n</Astro:Genesis>`;

	return prompt;
}

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
