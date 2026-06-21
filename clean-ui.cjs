const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'packages/cli/src/modes/studio/studio-ui.html');
let content = fs.readFileSync(file, 'utf8');

const startMarker = '// ─── THEME WIZARD ─────────────────────────────────────────────────────────';
const endMarker = '// ─── SEMANTIC BRAIN ───────────────────────────────────────────────────────';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Removed Theme Wizard logic successfully!');
} else {
  console.log('Markers not found!');
  console.log('Start found?', startIndex !== -1);
  console.log('End found?', endIndex !== -1);
}
