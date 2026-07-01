import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { simulateGroverSearch } from "./quantum.js";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure memory dir exists
const memDir = path.join(__dirname, "../../../../.mooncode/memory");
if (!fs.existsSync(memDir)) {
	fs.mkdirSync(memDir, { recursive: true });
}

const dbPath = path.join(memDir, "memory.db");
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("cache_size = -640000"); // 640MB cache

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Entities (
    entity_id TEXT PRIMARY KEY,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Relations (
    source_id TEXT,
    relation_type TEXT,
    target_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_id) REFERENCES Entities(entity_id),
    FOREIGN KEY(target_id) REFERENCES Entities(entity_id),
    UNIQUE(source_id, relation_type, target_id)
  );

  CREATE INDEX IF NOT EXISTS idx_relations_source ON Relations(source_id);
  CREATE INDEX IF NOT EXISTS idx_relations_target ON Relations(target_id);

  CREATE TABLE IF NOT EXISTS Events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Pre-compiled statements for O(1) performance
const insertEntityStmt = db.prepare("INSERT OR IGNORE INTO Entities (entity_id, type) VALUES (?, ?)");
const insertRelationStmt = db.prepare(
	"INSERT OR IGNORE INTO Relations (source_id, relation_type, target_id) VALUES (?, ?, ?)",
);
const insertEventStmt = db.prepare("INSERT INTO Events (event_type, details) VALUES (?, ?)");
const fetchRelationsStmt = db.prepare("SELECT source_id, relation_type, target_id FROM Relations");

/**
 * Saves a new fact (source - relation - target) to the R-Graph.
 */
export function saveFact(source: string, relation: string, target: string): void {
	if (typeof source !== "string" || typeof relation !== "string" || typeof target !== "string") return;
	if (!source || !relation || !target) return;

	try {
		const s = source.trim().toLowerCase();
		const r = relation.trim().toLowerCase();
		const t = target.trim().toLowerCase();

		db.transaction(() => {
			insertEntityStmt.run(s, "concept");
			insertEntityStmt.run(t, "concept");
			const result = insertRelationStmt.run(s, r, t);

			if (result.changes > 0) {
				insertEventStmt.run("fact_learned", `${s} ${r} ${t}`);
			}
		})();
	} catch (e) {
		console.error("[Memory] Error saving fact:", e);
	}
}

/**
 * Fetches relevant memory facts based on user input, using Grover's quantum search simulation.
 */
export function fetchMemory(text: string): string[] {
	if (!text || typeof text !== "string") return [];

	try {
		const rows = fetchRelationsStmt.all();
		if (rows.length === 0) return [];

		// Run Quantum Grover Search simulation to rank facts
		const rankedStates = simulateGroverSearch(rows, text);

		// Get top 6 relevant facts
		const facts = rankedStates.slice(0, 6).map((s) => `${s.source_id} ${s.relation_type} ${s.target_id}`);

		return facts;
	} catch (e) {
		console.error("[Memory] Fetch error:", e);
		return [];
	}
}

export function clearMemory(): void {
	db.exec("DELETE FROM Events; DELETE FROM Relations; DELETE FROM Entities;");
}
