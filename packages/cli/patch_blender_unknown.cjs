const fs = require('fs');
let c = fs.readFileSync('src/modes/studio/studio-ui.html', 'utf8');

c = c.replace(
`					+ mcpState.clients.map(c =>
						'<div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;"><span style="width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;box-shadow:0 0 6px rgba(74,222,128,0.3);"></span>'
						+ escHtml(c.name || c.id || 'Unknown') + ' <span style="color:var(--muted);font-size:0.7rem;">' + (c.version || '') + '</span></div>'
					).join('')`,
`					+ mcpState.clients.map(c => {
						const name = typeof c === 'string' ? c : (c.name || c.id || 'Unknown');
						const version = typeof c === 'string' ? '' : (c.version || '');
						return '<div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;"><span style="width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;box-shadow:0 0 6px rgba(74,222,128,0.3);"></span>'
						+ escHtml(name) + ' <span style="color:var(--muted);font-size:0.7rem;">' + version + '</span></div>';
					}).join('')`
);

fs.writeFileSync('src/modes/studio/studio-ui.html', c);
console.log('Patched html clients map');
