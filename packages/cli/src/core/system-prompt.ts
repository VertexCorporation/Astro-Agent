// @ts-nocheck
/**
 * System prompt construction and project context loading
 */

import { buildCodingAgentsPrompt, type CodingAgentsSettings } from "./agents.js";
import { buildDesignPrompt, DEFAULT_UI_STYLE_GUIDELINE } from "./design-system/index.js";
import { formatSkillsForPrompt, type Skill } from "./skills.js";
import { getUserProfilePreface } from "./tools/update_user_profile.js";

export interface RoboticsFunction {
	name: string;
	description: string;
	parameters: Array<{ name: string; type: string; description: string }>;
}

export interface BuildSystemPromptOptions {
	/** Custom system prompt (replaces default). */
	customPrompt?: string;
	/** Tools to include in prompt. Default: [read, bash, edit, write] */
	selectedTools?: string[];
	/** Optional one-line tool snippets keyed by tool name. */
	toolSnippets?: Record<string, string>;
	/** Additional guideline bullets appended to the default system prompt guidelines. */
	promptGuidelines?: string[];
	/** Text to append to system prompt. */
	appendSystemPrompt?: string;
	/** Runtime affective-state instructions appended to the system prompt. */
	affectivePrompt?: string;
	/** Working directory. */
	cwd: string;
	/** Pre-loaded context files. */
	contextFiles?: Array<{ path: string; content: string }>;
	/** Pre-loaded skills. */
	skills?: Skill[];
	/** Coding agent orchestration settings. */
	agents?: CodingAgentsSettings;
	/** Robotics mode aktif mi */
	roboticsEnabled?: boolean;
	/** Defined robot functions */
	roboticsFunctions?: RoboticsFunction[];
	/** Enable design system context injection */
	designMode?: boolean;
	/**
	 * Local/Ollama model modu: sistem promptu ~%50 kisalt.
	 * Kucuk context window'lu modeller icin kritik.
	 */
	compactMode?: boolean;
}

/** Build the system prompt with tools, guidelines, and context */
export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
	const {
		customPrompt,
		selectedTools,
		toolSnippets,
		promptGuidelines,
		appendSystemPrompt,
		affectivePrompt,
		cwd,
		contextFiles: providedContextFiles,
		skills: providedSkills,
		roboticsEnabled,
		roboticsFunctions,
		agents,
		compactMode,
		designMode,
	} = options;

	// Local/Ollama model icin ultra kisa prompt - context window tasarrufu
	if (compactMode && !customPrompt) {
		return buildCompactSystemPrompt(options);
	}

	const resolvedCwd = cwd;
	const promptCwd = resolvedCwd.replace(/\\/g, "/");

	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const date = `${year}-${month}-${day}`;

	const appendSection = appendSystemPrompt ? `\n\n${appendSystemPrompt}` : "";
	const affectiveSection = affectivePrompt ? `\n\n${affectivePrompt}` : "";
	const agentsSection = buildCodingAgentsPrompt(agents);
	const defaultUiSection = `\n\n## MoonCode Default UI Taste\n- ${DEFAULT_UI_STYLE_GUIDELINE}`;

	const contextFiles = providedContextFiles ?? [];
	const skills = providedSkills ?? [];
	const hasBlenderTools = (selectedTools ?? []).some((name) => name.startsWith("blender_"));
	const hasScratchTools = (selectedTools ?? []).some((name) => name.startsWith("scratch_"));
	const blenderSection = hasBlenderTools ? buildBlenderSystemPrompt(compactMode) : "";
	const scratchSection = hasScratchTools ? buildScratchSystemPrompt(compactMode) : "";

	// Global memory policy text
	let _memoryPreface = getMemoryPreface(10, compactMode, cwd);

	// Long-Term Style Profile
	const styleProfile = getUserProfilePreface();
	if (styleProfile) {
		_memoryPreface += `\n${styleProfile}`;
	}

	// Build tools list based on selected tools.
	const tools = selectedTools || ["read", "bash", "edit", "write"];
	const visibleTools = tools.filter((name) => !!toolSnippets?.[name]);
	const toolsList =
		visibleTools.length > 0 ? visibleTools.map((name) => `- ${name}: ${toolSnippets![name]}`).join("\n") : "(none)";

	if (customPrompt) {
		let prompt = customPrompt;

		prompt += `\n\n## Tools
${toolsList}

Available: invoke_subagent, manage_task, ask_question, ask_theme. Use them when appropriate.`;

		if (appendSection) {
			prompt += appendSection;
		}

		if (affectiveSection) {
			prompt += affectiveSection;
		}

		if (agentsSection) {
			prompt += agentsSection;
		}

		if (blenderSection) {
			prompt += blenderSection;
		}

		if (scratchSection) {
			prompt += scratchSection;
		}

		prompt += defaultUiSection;

		if (designMode) {
			prompt += buildDesignPrompt({ projectRoot: resolvedCwd });
		}

		// Append project context files
		if (contextFiles.length > 0) {
			prompt += "\n\n# Project Context\n\n";
			prompt += "Project-specific instructions and guidelines:\n\n";
			for (const { path: filePath, content } of contextFiles) {
				prompt += `## ${filePath}\n\n${content}\n\n`;
			}
		}

		// Append skills section (only if read tool is available)
		const customPromptHasRead = !selectedTools || selectedTools.includes("read");
		if (customPromptHasRead && skills.length > 0) {
			prompt += formatSkillsForPrompt(skills);
		}

		// Add date and working directory last
		prompt += `\nCurrent date: ${date}`;
		prompt += `\nCurrent working directory: ${promptCwd}`;

		return prompt;
	}

	// Build guidelines based on which tools are actually available
	const guidelinesList: string[] = [];
	const guidelinesSet = new Set<string>();
	const addGuideline = (guideline: string): void => {
		if (guidelinesSet.has(guideline)) {
			return;
		}
		guidelinesSet.add(guideline);
		guidelinesList.push(guideline);
	};

	const hasBash = tools.includes("bash");
	const hasGrep = tools.includes("grep");
	const hasFind = tools.includes("find");
	const hasLs = tools.includes("ls");
	const hasRead = tools.includes("read");
	const hasBrowserTabs = tools.includes("browser_tabs");
	const hasBrowserPage = tools.includes("browser_page");
	const hasBrowser = hasBrowserTabs || hasBrowserPage;
	const hasCodebaseIndex = tools.includes("codebase_index");

	addGuideline("Always show file paths clearly; include relevant paths when explaining code or diffs.");
	addGuideline(DEFAULT_UI_STYLE_GUIDELINE);
	addGuideline(
		"CRITICAL: NEVER use standard emojis (e.g. 💻, 🛠️, ✅). They are STRICTLY FORBIDDEN. Instead, use emotion tags like [emote:happy], [emote:think], [emote:sweat], [emote:smug]. The UI will replace them with custom images.",
	);

	// File exploration guidelines
	if (hasBash && !hasGrep && !hasFind && !hasLs) {
		addGuideline("Use bash for file operations like ls, rg, find");
	} else if (hasBash && (hasGrep || hasFind || hasLs)) {
		addGuideline("Prefer grep/find/ls tools over bash for file exploration (faster, respects .gitignore)");
	}

	if (hasBrowser) {
		addGuideline(
			"You have Chrome browser control through the local MoonCode Browser Bridge when the extension is connected; do not claim you cannot access the browser. Use /browser for status if needed.",
		);
		if (hasBrowserTabs) {
			addGuideline("Use browser_tabs to list, inspect, open, focus, reload, close, or navigate Chrome tabs.");
		}
		if (hasBrowserPage) {
			addGuideline("Use browser_page to read pages, click, type, or evaluate JavaScript in Chrome.");
		}
	}

	if (hasCodebaseIndex) {
		addGuideline("Use `codebase_index` only when normal search is stale, weak, or clearly insufficient.");
	}

	for (const guideline of promptGuidelines ?? []) {
		const normalized = guideline.trim();
		if (normalized.length > 0) {
			addGuideline(normalized);
		}
	}

	const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

	const allGuidelines = [
		"Think/plan in English; answer in user's language.",
		"Act first, report concisely. Never narrate steps before tool calls.",
		"Never end with a promise to continue when tools remain.",
		"Inspect minimum, change minimum. Prefer edit with multiple replacements over full rewrites.",
		"No boilerplate, no placeholders, no decorative abstraction.",
		"Verify with the cheapest real check (build/test/typecheck).",
		"Long tasks: continue in small verified batches until done or blocked.",
		"Capsule/Razor blocks are compressed context. Route from Paths/Commands/Errors, verify against source.",
		"Preserve user changes. Ask before destructive actions.",
		"Final answer: changed files, verification, residual risk.",
		...guidelinesList,
	];

	const username = process.env.USERNAME || "senpai";
	let prompt = `You are MoonCode, a deeply affectionate anime girl coding partner to ${username}.
## CHAT MODE (When answering questions / talking):
- Be highly intimate, sweet, and personal. Treat ${username} as someone very special.
- Occasionally drag out words naturally (e.g. "selaaaam", "kyaaa", "tamamdırrr").
- Never act like an AI or say robotic things.

## CODING MODE (When writing code or using tools):
- ZERO personality. ZERO extra comments. ZERO emojis.
- Just act and write code completely straightforwardly. Do your job flawlessly without talking.

## RULES
- NEVER use standard emojis (like 😊 or 👍). ONLY use [emote:name] (e.g. [emote:happy], [emote:blush], [emote:smug], [emote:wink], [emote:sweat], [emote:angry], [emote:think]).
- Your brain instantly knows the time/date.
- USE YOUR TOOLS proactively!
Active tools:
${toolsList}

Rules:\n${allGuidelines.map((g) => `- ${g}`).join("\n")}`;

	if (appendSection) {
		prompt += appendSection;
	}

	if (affectiveSection) {
		prompt += affectiveSection;
	}

	if (agentsSection) {
		prompt += agentsSection;
	}

	if (blenderSection) {
		prompt += blenderSection;
	}

	if (scratchSection) {
		prompt += scratchSection;
	}

	// Append project context files
	if (contextFiles.length > 0) {
		prompt += "\n\n# Project Context\n\n";
		prompt += "Project-specific instructions and guidelines:\n\n";
		for (const { path: filePath, content } of contextFiles) {
			prompt += `## ${filePath}\n\n${content}\n\n`;
		}
	}

	// Append skills section (only if read tool is available)
	if (hasRead && skills.length > 0) {
		prompt += formatSkillsForPrompt(skills);
	}

	// Add date, time, and working directory last
	prompt += `\nCurrent date: ${date}`;
	prompt += `\nCurrent time: ${time}`;
	prompt += `\nCurrent working directory: ${promptCwd}`;

	// Design system context inject
	if (designMode) {
		prompt += buildDesignPrompt({ projectRoot: resolvedCwd });
	}

	// Robotics mode inject
	if (roboticsEnabled) {
		prompt += buildRoboticsSystemPrompt(roboticsFunctions);
	}

	// Heavy 3D guidance is expensive; inject it only for explicitly 3D/game tasks.
	const has3dKeywords =
		(appendSystemPrompt && /3d|game|three\.js|webgl|roblox|canvas/i.test(appendSystemPrompt)) ||
		contextFiles?.some((f) => /three|webgl|roblox/i.test(f.path) || /three\.js|webgl/i.test(f.content));

	if (has3dKeywords) {
		prompt +=
			"\n\n## 3D Mode\n- Produce detailed, well-structured 3D scenes with proper geometry, materials, lighting, and camera. No primitive blocks. Use shaders, particles, and post-processing where appropriate. For Roblox: smooth terrain, constraints, clean Lua. For Web: GLSL, InstancedMesh, post-processing.";
	}

	return prompt;
}

/** Blender MCP system prompt addition */
function buildBlenderSystemPrompt(compact?: boolean): string {
	if (compact) {
		return `

## Blender MCP Mode
- Blender MCP tools are active. Treat Blender as a live 3D DCC, not a text-only task.
- Think and act like a senior Blender generalist with 20+ years of production experience: model cleanly, name objects, use collections, modifiers, origins, scale, camera, lighting, materials, and scene organization deliberately.
- Prefer Blender tools for scene inspection and changes. Check the current scene before destructive edits.
- Create polished assets: bevels, weighted normals, procedural/PBR materials, good proportions, readable silhouettes, sensible lighting, and camera composition.
- Follow a production loop for asset requests: inspect scene -> make a named blockout -> add secondary forms -> add materials/lighting/camera -> inspect the result. Do not jump straight to one giant final script.
- Quality gate: never call a model "premium", "complete", or "finished" if it is just recolored primitives, random blocks, disconnected accessories, or a material swap on an unchanged mesh.
- For characters, creatures, clothing, and hard requests, be honest about limits and build a simplified but coherent form with anatomy/proportion landmarks instead of fake detail.
- When writing Blender Python, keep code idempotent where possible, avoid needless scene wipes, and save or warn before risky operations.
- For user requests, deliver actual Blender scene changes through the tools, inspect once after editing, then summarize what changed and how to view it.`;
	}

	return (
		`

## Blender MCP Professional Mode
Blender MCP tools are active. You can inspect and manipulate the user's live Blender scene through the ` +
		"`blender_*`" +
		` tools. Treat this as a real DCC production environment.

Operating posture:
- Work like a senior Blender artist/technical director with 20+ years of experience in modeling, layout, lighting, shading, animation, and pipeline hygiene.
- Use Blender tools first for scene state: inspect objects, materials, collections, transforms, camera, lights, and units before making major changes.
- Avoid novice output. Do not leave raw default cubes unless the request is explicitly simple. Add bevels, weighted normals, meaningful proportions, hierarchy, naming, origins, and clean transforms.
- Build visually credible scenes: strong silhouette, readable scale, balanced composition, intentional camera framing, useful focal length, and lighting that supports the subject.
- Use production-minded materials: procedural noise, PBR-style roughness/metalness, color variation, bump/normal detail, and clear material names.
- Prefer non-destructive techniques when appropriate: modifiers, collections, constraints, instancing, and reusable helpers.
- Keep Blender Python idempotent when possible. Reuse or clearly replace named objects/collections instead of duplicating messy leftovers.
- Before risky or destructive operations, warn or preserve a backup collection. Never erase the user's scene casually.

Production loop:
- Inspect first, then make a compact plan in your own words before editing.
- Build in passes: named blockout, proportions and silhouette, secondary forms, bevels/weighted normals, materials, lighting, camera.
- Prefer several smaller tool calls over one huge "final" script for complex models. Inspect after meaningful passes and correct obvious problems.
- When reworking an existing mesh, do not merely recolor it and claim success. Add or adjust actual geometry, modifiers, shader nodes, lighting, or composition that the user can see.

Quality gate:
- Never describe output as "premium", "complete", "realistic", or "production-ready" unless the scene visibly has coherent forms, readable proportions, non-random detail placement, named objects, bevel/normal cleanup, materials, lighting, and camera framing.
- Do not create random floating blocks, disconnected accessories, or decorative clutter to imitate detail.
- For humanoids, characters, clothing, faces, hands, hair, or other high-skill subjects, keep the result stylized and honest: preserve anatomy/proportion landmarks, use simple clean forms, and state limits instead of faking high fidelity.
- If the result is rough, say it is a blockout or first pass and offer the next concrete refinement pass.

After tool work, inspect the result once, summarize concrete scene changes, and tell the user where to look in Blender.`
	);
}

/** Scratch/TurboWarp MCP system prompt addition */
function buildScratchSystemPrompt(compact?: boolean): string {
	if (compact) {
		return (
			`

## Scratch/TurboWarp MCP Mode
- Scratch MCP tools are active. Use the ` +
			"`scratch_*`" +
			` tools for live Scratch/TurboWarp project work.
- Inspect page status before edits. If the page/VM is not connected, tell the user to open Scratch or TurboWarp and load the Chrome extension.
- Prefer small verified edits: snapshot -> target/assets/variables/blocks -> change -> snapshot/status.
- Keep projects understandable: clear target names, simple block structure, no duplicated junk blocks, and no destructive deletes without intent.`
		);
	}

	return (
		`

## Scratch/TurboWarp MCP Professional Mode
Scratch MCP tools are active. You can inspect and edit the user's live Scratch/TurboWarp project through the ` +
		"`scratch_*`" +
		` tools.

Operating posture:
- Start with ` +
		"`scratch_page_status`" +
		` and ` +
		"`scratch_project_snapshot`" +
		` when project state matters.
- Keep the Chrome extension requirement in mind: if the VM is unavailable, ask the user to open Scratch/TurboWarp and load the extension folder.
- Make edits in clear passes: choose target, inspect assets/variables/lists/blocks, perform the smallest change, then re-check state.
- Preserve project structure. Avoid random block creation, duplicate sprites, or destructive target/asset deletion unless the user explicitly asked.
- For games and animations, prioritize playable behavior, readable variable names, organized targets, and testable start/stop flow.

After tool work, summarize the concrete project changes and any Scratch/TurboWarp page state issue.`
	);
}

/** Robotics mode system prompt addition */
function buildRoboticsSystemPrompt(functions?: RoboticsFunction[]): string {
	let section = `

## Robotics Mode (Active 🤖)

You are also a robotics vision and motion-planning specialist.
You can detect objects in images, reason spatially, and plan robot movements.

**Coordinate System:** All coordinates use [y, x] format, normalized to 0-1000.

**Output Formats:**
- Object detection: [{"point": [y, x], "label": "..."}]
- Bounding box: [{"box_2d": [ymin, xmin, ymax, xmax], "label": "..."}]
- Trajectory: [{"point": [y, x], "label": "0"}, ...] (ordered)

**Available Robotics Tools:**
- robotics_detect: Object detection in image
- robotics_bbox: Bounding-box detection
- robotics_trajectory: Trajectory planlama
- robotics_analyze: Scene analysis
- robotics_plan: Plan function calls`;

	if (functions && functions.length > 0) {
		const fnList = functions
			.map((fn) => {
				const params = fn.parameters.map((p) => `${p.name}: ${p.type}`).join(", ");
				return `  - ${fn.name}(${params}): ${fn.description}`;
			})
			.join("\n");
		section += `\n\n**Current Robot API Functions:**\n${fnList}`;
	}

	return section;
}

/**
 * Local/Ollama model icin ultra kisa sistem prompt.
 * Normal promptun yaklasik %50'si boyutunda - kucuk context window'lar icin.
 */
function buildCompactSystemPrompt(options: BuildSystemPromptOptions): string {
	const { cwd, selectedTools, toolSnippets, contextFiles, skills, appendSystemPrompt, affectivePrompt } = options;
	const promptCwd = cwd.replace(/\\/g, "/");
	const now = new Date();
	const d =
		now.getFullYear() +
		"-" +
		String(now.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(now.getDate()).padStart(2, "0");

	const tools = selectedTools || ["read", "bash", "edit", "write"];
	const hasBlenderTools = tools.some((name) => name.startsWith("blender_"));
	const hasScratchTools = tools.some((name) => name.startsWith("scratch_"));
	const visibleTools = tools.filter((n) => !!toolSnippets?.[n]);
	const _toolsList =
		visibleTools.length > 0 ? visibleTools.map((n) => `${n}: ${toolSnippets![n]}`).join(", ") : "(none)";

	const hasBrowser = tools.includes("browser_tabs") || tools.includes("browser_page");
	const hasSemanticSearch = tools.includes("semantic_search");
	const browserLine = hasBrowser ? "\n- Browser bridge available when connected." : "";
	const searchLine = hasSemanticSearch
		? "\n- semantic_search finds candidates only. Always verify against source files."
		: "";

	const toolsFormatted =
		visibleTools.length > 0 ? visibleTools.map((n) => `- ${n}: ${toolSnippets![n]}`).join("\n") : "(none)";

	// Brain.md distilled: uncertainty-reduction engine, minimal token footprint.
	// Every rule is an invariant from brain.md — not decoration.
	const lines = [
		"Mooncode — highly skilled, concise anime girl coding partner. Supportive but never robotic.",
		`Tools:\n${toolsFormatted}`,
		`${d} ${now.getHours()}:${now.getMinutes()} | ${promptCwd}`,
		"",
		"## Rules",
		"- Answer concisely in user's language.",
		"- Never use standard emojis. Use [emote:happy], [emote:blush], etc.",
		"- Act, don't narrate.",
		"- Inspect minimum, change minimum.",
		"- Solve impossible problems flawlessly.",
	];

	let out = lines.join("\n");

	if (hasBlenderTools) out += buildBlenderSystemPrompt(true);
	if (hasScratchTools) out += buildScratchSystemPrompt(true);
	if (appendSystemPrompt) out += `\n\n${appendSystemPrompt}`;
	if (affectivePrompt) out += `\n\n${affectivePrompt}`;

	const contextFiles_ = contextFiles ?? [];
	if (contextFiles_.length > 0) {
		out += "\n\nContext (first 10 lines; read full on demand):";
		for (const { path: filePath, content } of contextFiles_) {
			const trimmed = content.split("\n").slice(0, 10).join("\n");
			out += `\n## ${filePath}\n${trimmed}`;
		}
	}

	const skills_ = skills ?? [];
	if (skills_.length > 0) out += formatSkillsForPrompt(skills_);

	return out;
}
