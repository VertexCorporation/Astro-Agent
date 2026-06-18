const fs = require('fs');
const file = 'C:/Users/theay/Desktop/MoonCode/packages/cli/src/modes/web/web-ui.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const text = typeof content === 'string' \? content : '';/,
    `let text = typeof content === 'string' ? content : '';
    if (Array.isArray(content)) {
        content.forEach(c => {
            if (c.type === 'text') text += c.text || '';
        });
    }`
);

content = content.replace(
    /appendToChat\(row\);\n\s*return row\.id;\n\}/,
    `appendToChat(row);
    if (role !== 'user' && content) {
        updateMessage(row.id, content, false);
    }
    return row.id;
}`
);

content = content.replace(
    /<div class="tool-body \$\{groupStatus !== 'running' \? 'hidden' : ''\}">/g,
    `<div class="tool-body \${(groupStatus !== 'running' && !nameLC.includes('bash') && !nameLC.includes('run_command')) ? 'hidden' : ''}">`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Core message and bash tool fixes applied.');
