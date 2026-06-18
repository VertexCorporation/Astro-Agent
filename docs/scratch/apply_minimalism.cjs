const fs = require('fs');
const path = require('path');

const uiPath = path.join(__dirname, '..', 'packages', 'cli', 'src', 'modes', 'web', 'web-ui.html');
let content = fs.readFileSync(uiPath, 'utf8');

// 1. Remove all neomorphism tokens
content = content.replace(/\/\* Neumorphic specific properties \*\/[\s\S]*?--nm-radius: 12px;\n\t\t\}/g, '}');
// and for other themes
content = content.replace(/\t\t\t--nm-flat:[^\n]*\n\t\t\t--nm-pressed:[^\n]*\n\t\t\t--nm-convex:[^\n]*\n\t\t\t--nm-concave:[^\n]*\n\t\t\t--nm-glow:[^\n]*\n\t\t\t--nm-radius:[^\n]*\n\t\t\}/g, '}');

// Add minimalist standard tokens to each theme right before the closing brace
// For mooncode
content = content.replace(/--shadow:\s*0 8px 32px rgba\(0,0,0,0\.5\);\n\t\t\}/g, 
`--shadow:      0 8px 32px rgba(0,0,0,0.5);\n\t\t\t--shadow-sm:   0 2px 8px rgba(0,0,0,0.2);\n\t\t\t--shadow-md:   0 4px 16px rgba(0,0,0,0.3);\n\t\t\t--radius-sm:   8px;\n\t\t\t--radius-md:   12px;\n\t\t\t--radius-lg:   16px;\n\t\t}`);
// For nord
content = content.replace(/--shadow:\s*0 8px 32px rgba\(0,0,0,0\.5\);\n\t\t\t\n\t\t\t--nm-flat:[^\}]*\}/g, 
`--shadow:      0 8px 32px rgba(0,0,0,0.5);\n\t\t\t--shadow-sm:   0 2px 8px rgba(0,0,0,0.2);\n\t\t\t--shadow-md:   0 4px 16px rgba(0,0,0,0.3);\n\t\t\t--radius-sm:   8px;\n\t\t\t--radius-md:   12px;\n\t\t\t--radius-lg:   16px;\n\t\t}`);
// For forest
content = content.replace(/--shadow:\s*0 8px 32px rgba\(0,0,0,0\.5\);\n\t\t\t\n\t\t\t--nm-flat:[^\}]*\}/g, 
`--shadow:      0 8px 32px rgba(0,0,0,0.5);\n\t\t\t--shadow-sm:   0 2px 8px rgba(0,0,0,0.2);\n\t\t\t--shadow-md:   0 4px 16px rgba(0,0,0,0.3);\n\t\t\t--radius-sm:   8px;\n\t\t\t--radius-md:   12px;\n\t\t\t--radius-lg:   16px;\n\t\t}`);
// For rosepine
content = content.replace(/--shadow:\s*0 8px 32px rgba\(0,0,0,0\.5\);\n\t\t\t\n\t\t\t--nm-flat:[^\}]*\}/g, 
`--shadow:      0 8px 32px rgba(0,0,0,0.5);\n\t\t\t--shadow-sm:   0 2px 8px rgba(0,0,0,0.2);\n\t\t\t--shadow-md:   0 4px 16px rgba(0,0,0,0.3);\n\t\t\t--radius-sm:   8px;\n\t\t\t--radius-md:   12px;\n\t\t\t--radius-lg:   16px;\n\t\t}`);
// For sepia
content = content.replace(/--shadow:\s*0 8px 32px rgba\(0,0,0,0\.5\);\n\t\t\t\n\t\t\t--nm-flat:[^\}]*\}/g, 
`--shadow:      0 8px 32px rgba(0,0,0,0.5);\n\t\t\t--shadow-sm:   0 2px 8px rgba(0,0,0,0.2);\n\t\t\t--shadow-md:   0 4px 16px rgba(0,0,0,0.3);\n\t\t\t--radius-sm:   8px;\n\t\t\t--radius-md:   12px;\n\t\t\t--radius-lg:   16px;\n\t\t}`);
// For light
content = content.replace(/--shadow:\s*0 4px 20px rgba\(0,0,0,0\.05\);\n\t\t\t\n\t\t\t--nm-flat:[^\}]*\}/g, 
`--shadow:      0 4px 20px rgba(0,0,0,0.05);\n\t\t\t--shadow-sm:   0 2px 8px rgba(0,0,0,0.05);\n\t\t\t--shadow-md:   0 4px 16px rgba(0,0,0,0.08);\n\t\t\t--radius-sm:   8px;\n\t\t\t--radius-md:   12px;\n\t\t\t--radius-lg:   16px;\n\t\t}`);

// Also fix the first replacement for mooncode just in case it didn't catch properly:
content = content.replace(/--shadow:\s*0 8px 32px rgba\(0,0,0,0\.5\);\n\n\t\t\t\/\* Neumorphic specific properties \*\/[^\}]*\}/,
`--shadow:      0 8px 32px rgba(0,0,0,0.5);\n\t\t\t--shadow-sm:   0 2px 8px rgba(0,0,0,0.2);\n\t\t\t--shadow-md:   0 4px 16px rgba(0,0,0,0.3);\n\t\t\t--radius-sm:   8px;\n\t\t\t--radius-md:   12px;\n\t\t\t--radius-lg:   16px;\n\t\t}`);

// Update borders and shadows globally
const replacements = [
	{ from: /box-shadow: var\(--nm-flat\);/g, to: 'box-shadow: var(--shadow-sm);' },
	{ from: /box-shadow: var\(--nm-pressed\);/g, to: 'background: rgba(0,0,0,0.05); box-shadow: none;' },
	{ from: /box-shadow: var\(--nm-glow\), var\(--nm-flat\);/g, to: 'box-shadow: 0 0 0 1px var(--accent), var(--shadow-md);' },
	{ from: /border-radius: var\(--nm-radius\);/g, to: 'border-radius: var(--radius-md);' },
	{ from: /border-radius: 16px;/g, to: 'border-radius: var(--radius-lg);' },
	{ from: /border-radius: 12px;/g, to: 'border-radius: var(--radius-md);' },
	{ from: /border-radius: 8px;/g, to: 'border-radius: var(--radius-sm);' },
	
	// Layout updates
	{ from: /padding: 16px;/g, to: 'padding: 24px;' },
	{ from: /\.chat-inner { max-width: 100%; margin: 0; padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }/g, 
	  to: '.chat-inner { max-width: 100%; margin: 0; padding: 0 24px; display: flex; flex-direction: column; gap: 24px; }' },
	{ from: /\.msg-row { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid var\(--border\); padding-bottom: 12px; }/g,
	  to: '.msg-row { display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 24px; }' },
	
	// Colored Icons CSS Additions
	{ from: /		\.material-symbols-rounded \{/g, 
	  to: `		/* ICON COLORS */
		.icon-primary { color: var(--accent); }
		.icon-success { color: var(--accent2); }
		.icon-danger { color: #ff6464; }
		.icon-warning { color: #f6c177; }
		.icon-muted { color: var(--muted); }
		
		.material-symbols-rounded {` }
];

for (const r of replacements) {
	content = content.replace(r.from, r.to);
}

// Ensure the code block actions don't get messy
content = content.replace(/\.code-block \{\n\t\t\tmargin: 0\.8em 0;\n\t\t\tborder-radius: 4px;/g, 
`.code-block {\n\t\t\tmargin: 1.2em 0;\n\t\t\tborder-radius: var(--radius-sm);`);

content = content.replace(/\.tool-card \{\n\t\t\tbackground: var\(--surface\);\n\t\t\tborder: 1px solid var\(--border\);\n\t\t\tborder-radius: var\(--radius-md\);\n\t\t\tbox-shadow: var\(--shadow-sm\);\n\t\t\toverflow: hidden;\n\t\t\tfont-size: 0\.8rem;\n\t\t\tmargin: 12px 0;\n\t\t\ttransition: all 0\.25s ease;\n\t\t\}/g,
`.tool-card {\n\t\t\tbackground: var(--surface2);\n\t\t\tborder: 1px solid var(--border);\n\t\t\tborder-radius: var(--radius-md);\n\t\t\tbox-shadow: none;\n\t\t\toverflow: hidden;\n\t\t\tfont-size: 0.85rem;\n\t\t\tmargin: 16px 0;\n\t\t\ttransition: all 0.25s ease;\n\t\t}`);

// Input box tweaks
content = content.replace(/\.input-box \{ background: var\(--bg\); border: 1px solid var\(--border\); border-radius: var\(--radius-lg\); background: rgba\(0,0,0,0\.05\); box-shadow: none; margin: 16px; position: relative; padding: 4px; transition: all 0\.25s ease; \}/g,
`.input-box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); margin: 24px; position: relative; padding: 8px; transition: all 0.25s ease; }`);

content = content.replace(/\.input-box:focus-within \{ border-color: rgba\(108,143,255,0\.25\); background: rgba\(0,0,0,0\.05\); box-shadow: none;, 0 0 15px rgba\(108,143,255,0\.08\); \}/g,
`.input-box:focus-within { border-color: var(--accent); box-shadow: var(--shadow-md), 0 0 0 1px var(--accent); }`);

content = content.replace(/#send-btn:hover \{ transform: translateY\(-1px\); box-shadow: 0 0 0 1px var\(--accent\), var\(--shadow-md\); \}\n\t\t#send-btn:active \{ transform: translateY\(0\); background: rgba\(0,0,0,0\.05\); box-shadow: none; \}/g,
`#send-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }\n\t\t#send-btn:active { transform: translateY(0); filter: brightness(0.9); }`);

content = content.replace(/#stop-btn:active \{ transform: translateY\(0\); background: rgba\(0,0,0,0\.05\); box-shadow: none; \}/g,
`#stop-btn:active { transform: translateY(0); filter: brightness(0.9); }`);

fs.writeFileSync(uiPath, content);
console.log('web-ui.html updated successfully.');
