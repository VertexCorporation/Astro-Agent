const fs = require('fs');
const file = 'C:/Users/theay/Desktop/MoonCode/packages/cli/src/modes/web/web-mode.ts';
let content = fs.readFileSync(file, 'utf8');

// Patch /api/session/export to accept id
const exportRegex = /if \(format === "html"\) \{\s*await this\.runtime\.session\.exportToHtml\(tempPath\);\s*res\.setHeader\("Content-Type", "text\/html"\);\s*\} else \{\s*this\.runtime\.session\.exportToJsonl\(tempPath\);\s*res\.setHeader\("Content-Type", "application\/jsonl"\);\s*\}/;

const patchedExport = `const id = url.searchParams.get("id");
                let targetSession = this.runtime.session;
                
                // Switch temporarily if id provided
                let originalPath = null;
                if (id) {
                    const sessionDir = this.runtime.session.sessionManager.getSessionDir();
                    const sessions = await listSessionsFromDir(sessionDir);
                    const target = sessions.find((s) => s.id === id);
                    if (target) {
                        const { SessionManager } = await import("../../core/session-manager.js");
                        const tempSm = SessionManager.build(target.cwd || this.runtime.cwd, sessionDir);
                        await tempSm.loadSession(target.path);
                        const { EngineSession } = await import("../../core/engine-session.js");
                        targetSession = new EngineSession(tempSm, this.runtime.session.modelRegistry, this.runtime.session.settingsManager);
                    }
                }

                if (format === "html") {
                    await targetSession.exportToHtml(tempPath);
                    res.setHeader("Content-Type", "text/html");
                } else {
                    targetSession.exportToJsonl(tempPath);
                    res.setHeader("Content-Type", "application/jsonl");
                }`;

content = content.replace(exportRegex, patchedExport);

// Patch /api/session/share to accept id
const shareRegex = /const sessionFile = this\.runtime\.session\.sessionManager\.getSessionFile\(\);/;
const patchedShare = `const id = url.searchParams.get("id");
                let sessionFile = this.runtime.session.sessionManager.getSessionFile();
                if (id) {
                    const sessionDir = this.runtime.session.sessionManager.getSessionDir();
                    const sessions = await listSessionsFromDir(sessionDir);
                    const target = sessions.find((s) => s.id === id);
                    if (target) sessionFile = target.path;
                }`;
content = content.replace(shareRegex, patchedShare);

fs.writeFileSync(file, content, 'utf8');
console.log('web-mode.ts export & share updated to support IDs.');
