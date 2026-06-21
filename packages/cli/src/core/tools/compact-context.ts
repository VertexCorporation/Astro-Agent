import type { EngineTool } from "moon-engine";
import { Type } from "typebox";
import type { EngineSession } from "../engine-session.js";
import type { ToolDefinition } from "../extensions/types.js";
import { wrapToolDefinition } from "./tool-definition-wrapper.js";

const compactSchema = Type.Object({
	instructions: Type.Optional(
		Type.String({
			description: "İsteğe bağlı olarak, sıkıştırma sırasında korunması gereken özel talimatlar.",
		}),
	),
});

export function getCompactContextToolDefinition(
	session: EngineSession,
): ToolDefinition<typeof compactSchema, any, any> {
	return {
		name: "compact_context",
		label: "Sıkıştır",
		description:
			"Sıkıştırma aracı. Eğer context çok büyüdüyse eski mesajları tek bir özete sıkıştırarak token kullanımını azaltır. Sadece belirgin bir token baskısı varsa çağırın.",
		promptSnippet: "Compact session context to save tokens",
		parameters: compactSchema,
		async execute(
			_toolCallId: string,
			params: { instructions?: string },
			signal?: AbortSignal,
			_onUpdate?: any,
			_ctx?: any,
		) {
			if (!signal) {
				return {
					content: [{ type: "text", text: "Hata: İptal sinyali (signal) eksik." }],
					details: { error: true },
					isError: true,
				};
			}
			try {
				const result = await session.compact(params.instructions);
				return {
					content: [
						{
							type: "text",
							text: `Sıkıştırma tamamlandı. Orijinal token: ${result.tokensBefore}. Yeni özet eklendi:\n${result.summary}`,
						},
					],
					details: result,
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Sıkıştırma başarısız oldu: ${err.message}` }],
					details: { error: err.message },
					isError: true,
				};
			}
		},
		renderCall(args, theme) {
			return {
				render: () => [theme.fg("toolTitle", "Token Sıkıştırması Çalışıyor 🧹")],
				invalidate: () => {},
			};
		},
	};
}

export function getCompactContextTool(session: EngineSession): EngineTool<typeof compactSchema> {
	return wrapToolDefinition(getCompactContextToolDefinition(session));
}
