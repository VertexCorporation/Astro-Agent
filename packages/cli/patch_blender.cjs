const fs = require('fs');
let c = fs.readFileSync('src/modes/studio/studio-ui.html', 'utf8');

c = c.replace(
`			<!-- Browser Bridge Status -->
			<div class="bridge-pill" id="bridge-pill" onclick="openModal('bridgeModal')" title="Browser Bridge">
				<span class="bridge-dot"></span>
				<span id="bridge-label">Web</span>
			</div>
			<!-- Session Actions -->`,
`			<!-- Browser Bridge Status -->
			<div class="bridge-pill" id="bridge-pill" onclick="openModal('bridgeModal')" title="Browser Bridge">
				<span class="bridge-dot"></span>
				<span id="bridge-label">Web</span>
			</div>
			<!-- Blender MCP Status -->
			<div class="mcp-blender-pill" id="mcp-blender-pill" onclick="openModal('mcpModal')" title="Blender MCP" style="display:none; cursor:pointer; align-items:center; gap:6px; background:rgba(74,222,128,0.1); padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:600; color:var(--fg); transition:transform 0.1s; border:1px solid rgba(74,222,128,0.2);">
				<span class="material-symbols-rounded" style="font-size:14px; color:#4ade80;">view_in_ar</span>
				<span style="color:#4ade80; font-weight:700;">Blender</span>
				<span id="mcp-blender-port" style="opacity:0.8; font-size:0.7rem;"></span>
			</div>
			<!-- Session Actions -->`
);

c = c.replace(
`			if (data.state?.tokens) {
				const tIn = data.state.tokens.in || 0;
				const tOut = data.state.tokens.out || 0;
				document.getElementById('token-usage').textContent = \`Sistem Aktif\`;
				document.getElementById('token-pill').title = \`Input: \${tIn.toLocaleString()} | Output: \${tOut.toLocaleString()}\`;
				currentMsgTokens = tOut;
			}
		}`,
`			if (data.state?.tokens) {
				const tIn = data.state.tokens.in || 0;
				const tOut = data.state.tokens.out || 0;
				document.getElementById('token-usage').textContent = \`Sistem Aktif\`;
				document.getElementById('token-pill').title = \`Input: \${tIn.toLocaleString()} | Output: \${tOut.toLocaleString()}\`;
				currentMsgTokens = tOut;
			}
			const blenderPill = document.getElementById('mcp-blender-pill');
			const blenderPortLabel = document.getElementById('mcp-blender-port');
			if (data.state?.blenderMcp && data.state.blenderMcp.connected) {
				if (blenderPill) blenderPill.style.display = 'flex';
				if (blenderPortLabel) blenderPortLabel.textContent = \`(\${data.state.blenderMcp.port})\`;
			} else {
				if (blenderPill) blenderPill.style.display = 'none';
			}
		}`
);

fs.writeFileSync('src/modes/studio/studio-ui.html', c);
console.log('Patched html');
