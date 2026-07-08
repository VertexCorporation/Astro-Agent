const fs = require('fs');
const p = 'packages/cli/src/modes/studio/studio-ui.html';
let content = fs.readFileSync(p, 'utf8');
const lines = content.split('\n');
let replacedIndex = -1;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('images.length > 0 ?') && !lines[i].includes('//')) {
     lines[i] = "	appendMessage('user', images.length > 0 ? [{type: 'text', text}, ...images] : text);";
     replacedIndex = i;
     break;
  }
}
fs.writeFileSync(p, lines.join('\n'));
console.log("Replaced at index:", replacedIndex);
console.log("Check at index:", fs.readFileSync(p, 'utf8').split('\n')[replacedIndex]);
