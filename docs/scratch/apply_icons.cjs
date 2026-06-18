const fs = require('fs');
const path = require('path');

const uiPath = path.join(__dirname, '..', 'packages', 'cli', 'src', 'modes', 'web', 'web-ui.html');
let content = fs.readFileSync(uiPath, 'utf8');

// Replacements for inline styles to semantic classes
const replacements = [
	{ from: /<span class="material-symbols-rounded" style="color:var\(--accent\);font-size:16px;">add<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-primary" style="font-size:16px;">add</span>' },
	{ from: /<span class="material-symbols-rounded" style="color:var\(--accent2\);font-size:16px;">folder_open<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-success" style="font-size:16px;">folder_open</span>' },
	{ from: /<span class="material-symbols-rounded" style="font-size:12px;">folder<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-muted" style="font-size:12px;">folder</span>' },
	{ from: /<span class="material-symbols-rounded" style="color:var\(--accent\);font-size:14px;">check_circle<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-success" style="font-size:14px;">check_circle</span>' },
	{ from: /<span class="material-symbols-rounded" style="color:var\(--accent\); font-size:16px;">check_circle<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-success" style="font-size:16px;">check_circle</span>' },
	{ from: /<span class="material-symbols-rounded">chat_bubble<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-primary">chat_bubble</span>' },
	{ from: /<span class="material-symbols-rounded" style="font-size:16px;">delete<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-danger" style="font-size:16px;">delete</span>' },
	{ from: /<span class="material-symbols-rounded" style="font-size:16px;">edit<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-warning" style="font-size:16px;">edit</span>' },
	{ from: /<span class="material-symbols-rounded" style="font-size:18px;">delete<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-danger" style="font-size:18px;">delete</span>' },
	{ from: /<span class="material-symbols-rounded" style="font-size:16px; color:var\(--accent\);">magic_button<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-primary" style="font-size:16px;">magic_button</span>' },
	{ from: /<span class="material-symbols-rounded" style="color:var\(--accent2\); font-size:16px;">build<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-warning" style="font-size:16px;">build</span>' },
	{ from: /<span class="material-symbols-rounded" style="color:#ff6464; font-size:16px;">error<\/span>/g,
	  to: '<span class="material-symbols-rounded icon-danger" style="font-size:16px;">error</span>' }
];

for (const r of replacements) {
	content = content.replace(r.from, r.to);
}

// Global replace any remaining `color:var(--accent)` inside material-symbols spans
content = content.replace(/<span class="material-symbols-rounded([^"]*)"([^>]*)style="([^"]*)color:\s*var\(--accent\);?([^"]*)"/g, 
  '<span class="material-symbols-rounded icon-primary$1"$2style="$3$4"');
  
content = content.replace(/<span class="material-symbols-rounded([^"]*)"([^>]*)style="([^"]*)color:\s*var\(--accent2\);?([^"]*)"/g, 
  '<span class="material-symbols-rounded icon-success$1"$2style="$3$4"');

content = content.replace(/<span class="material-symbols-rounded([^"]*)"([^>]*)style="([^"]*)color:\s*#ff6464;?([^"]*)"/g, 
  '<span class="material-symbols-rounded icon-danger$1"$2style="$3$4"');

fs.writeFileSync(uiPath, content);
console.log('web-ui.html icons updated successfully.');
