// @ts-nocheck
/**
 * todo — In-memory todo list manager.
 *
 * The AI can add, check, uncheck, list, and remove tasks.
 * State persists in-memory for the lifetime of the process.
 * Useful for tracking multi-step plans, code review items, and session goals.
 */
import type { EngineTool } from "moon-engine";
import { type Static, Type } from "typebox";
import type { ToolDefinition } from "../extensions/types.js";
import { getTextOutput, invalidArgText } from "./render-utils.js";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
	createdAt: number;
}

// ── Module-level store (shared across sessions) ──
const todoStore: Map<number, TodoItem> = new Map();
let nextId = 1;

const todoSchema = Type.Object({
	action: Type.Enum(
		{ add: "add", list: "list", check: "check", uncheck: "uncheck", remove: "remove", clear: "clear" },
		{ description: "Operation to perform" },
	),
	text: Type.Optional(Type.String({ description: "Task description (required for add)" })),
	id: Type.Optional(Type.Number({ description: "Task ID (required for check/uncheck/remove)" })),
});

export type TodoToolInput = Static<typeof todoSchema>;

export interface TodoToolDetails {
	count: number;
	done: number;
}

export function createTodoToolDefinition(): ToolDefinition<TodoToolInput, TodoToolDetails> {
	const definition: ToolDefinition<TodoToolInput, TodoToolDetails> = {
		name: "todo",
		description:
			"Manage an in-memory todo list. Add tasks, mark them done, or remove them. Use this to track multi-step plans, review items, and session goals without cluttering conversation history.",
		parameters: todoSchema,
		promptSnippet: "todo: add/list/check/uncheck/remove tasks (in-memory, persists across turns)",
		promptGuidelines: [
			"Use `todo` to track multi-step plans rather than listing steps in conversation — it saves tokens and persists across turns.",
		],
		execute: async (input) => {
			const { action, text, id } = input;

			switch (action) {
				case "add": {
					if (!text || text.trim().length === 0) {
						return invalidArgText("text", "Required for 'add' action");
					}
					const item: TodoItem = {
						id: nextId++,
						text: text.trim(),
						done: false,
						createdAt: Date.now(),
					};
					todoStore.set(item.id, item);
					return {
						content: [{ type: "text", text: `[todo] + ${item.text} (#${item.id})` }],
						details: { count: todoStore.size, done: countDone() },
					};
				}

				case "list": {
					if (todoStore.size === 0) {
						return {
							content: [{ type: "text", text: "[todo] (empty)" }],
							details: { count: 0, done: 0 },
						};
					}
					const items = Array.from(todoStore.values()).sort((a, b) => a.id - b.id);
					const lines = items.map((item) => {
						const check = item.done ? "[x]" : "[ ]";
						return `${check} #${item.id} ${item.text}`;
					});
					const done = items.filter((i) => i.done).length;
					const text = `[todo ${done}/${items.length}]\n${lines.join("\n")}`;
					return {
						content: [{ type: "text", text }],
						details: { count: items.length, done },
					};
				}

				case "check": {
					if (id === undefined || id === null) {
						return invalidArgText("id", "Required for 'check' action");
					}
					const checkItem = todoStore.get(id);
					if (!checkItem) {
						return invalidArgText("id", `Task #${id} not found`);
					}
					checkItem.done = true;
					return {
						content: [{ type: "text", text: `[todo] ✓ #${id} ${checkItem.text}` }],
						details: { count: todoStore.size, done: countDone() },
					};
				}

				case "uncheck": {
					if (id === undefined || id === null) {
						return invalidArgText("id", "Required for 'uncheck' action");
					}
					const uncheckItem = todoStore.get(id);
					if (!uncheckItem) {
						return invalidArgText("id", `Task #${id} not found`);
					}
					uncheckItem.done = false;
					return {
						content: [{ type: "text", text: `[todo] ○ #${id} ${uncheckItem.text}` }],
						details: { count: todoStore.size, done: countDone() },
					};
				}

				case "remove": {
					if (id === undefined || id === null) {
						return invalidArgText("id", "Required for 'remove' action");
					}
					const removed = todoStore.get(id);
					if (!removed) {
						return invalidArgText("id", `Task #${id} not found`);
					}
					todoStore.delete(id);
					return {
						content: [{ type: "text", text: `[todo] - #${id} ${removed.text}` }],
						details: { count: todoStore.size, done: countDone() },
					};
				}

				case "clear": {
					todoStore.clear();
					nextId = 1;
					return {
						content: [{ type: "text", text: "[todo] cleared" }],
						details: { count: 0, done: 0 },
					};
				}

				default:
					return invalidArgText("action", `Unknown action: ${action}`);
			}
		},
		render: (content, details) => {
			const text = getTextOutput(content);
			const count = details?.count ?? 0;
			const done = details?.done ?? 0;
			const header = `📋 Todo ${done}/${count}`;
			return {
				header,
				body: text,
			};
		},
	};

	return definition;
}

function countDone(): number {
	let c = 0;
	for (const item of todoStore.values()) {
		if (item.done) c++;
	}
	return c;
}

/** Get snapshot of current todo state (for UI panels) */
export function getTodoSnapshot(): { items: TodoItem[]; count: number; done: number } {
	const items = Array.from(todoStore.values()).sort((a, b) => a.id - b.id);
	return { items, count: items.length, done: items.filter((i) => i.done).length };
}

export function createTodoTool(): EngineTool<TodoToolInput> {
	const definition = createTodoToolDefinition();
	return {
		name: definition.name,
		execute: (input) => definition.execute(input, {}),
	};
}
