// @ts-nocheck

import type { EngineTool } from "moon-engine";
import { Type } from "typebox";
import type { ToolDefinition } from "../extensions/types.js";
import { wrapToolDefinition } from "./tool-definition-wrapper.js";

const semanticSearchSchema = Type.Object({
	query: Type.String({ description: "Semantic keyword, function name, or logic summary to search for" }),
});

export function createSemanticSearchToolDefinition(cwd: string): ToolDefinition<typeof semanticSearchSchema, any, any> {
	return {
		name: "semantic_search",
		label: "semantic_search",
		description:
			"BM25 semantic codebase search. Returns file:line locations and symbols. Use read tool for full content.",
		promptSnippet: "Search semantic project context (BM25 RAG)",
		parameters: semanticSearchSchema,
		async execute(_id, _params, _signal) {
			return {
				content: [
					{
						type: "text",
						text: "This tool is disabled because semantic search is disabled to prevent system freezes/crashes. Please use other search tools like grep, find, and ls to inspect the codebase.",
					},
				],
			};
		},
		renderCall(args, theme) {
			return {
				render: () => [theme.fg("toolTitle", `Semantik Arama: ${args?.query}`)],
				invalidate: () => {},
			};
		},
	};
}

export function createSemanticSearchTool(cwd: string): EngineTool<typeof semanticSearchSchema> {
	return wrapToolDefinition(createSemanticSearchToolDefinition(cwd));
}
