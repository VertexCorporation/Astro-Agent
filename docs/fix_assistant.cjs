const fs = require('fs');
const file = 'C:/Users/theay/Desktop/MoonCode/packages/cli/src/modes/web/web-ui.html';
let content = fs.readFileSync(file, 'utf8');

const target = "appendToChat(row);\n\treturn row.id;\n}";
const replacement = `appendToChat(row);
    if (role !== 'user' && content) {
        updateMessage(row.id, content, false);
    }
    return row.id;
}`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed assistant message appendToChat replacement.');
} else {
    // Try another spacing
    const fallbackTarget = "appendToChat(row);\r\n\treturn row.id;\r\n}";
    if (content.includes(fallbackTarget)) {
        content = content.replace(fallbackTarget, replacement);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed assistant message appendToChat replacement (CRLF).');
    } else {
        console.log('Could not find the target to replace in appendToChat!');
    }
}
