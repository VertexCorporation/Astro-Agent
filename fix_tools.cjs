const fs = require('fs');
const file = 'packages/cli/src/modes/studio/studio-ui.html';
let content = fs.readFileSync(file, 'utf8');

const oldArgs = "${fmtArgs ? `<div class=\"tool-section\"><div class=\"tool-section-label\" style=\"font-size:0.6rem;\">Girdi</div><pre style=\"max-height:120px;color:${iconColor}aa;\">${escapeHtml(fmtArgs)}</pre></div>` : ''}";
const newArgs = "${fmtArgs ? `<div class=\"tool-section\"><div class=\"tool-section-label\" style=\"font-size:0.6rem; margin-bottom: 4px;\">Girdi</div><div class=\"markdown-body\" style=\"font-size:0.8rem; border-radius: 6px; padding-top: 0px;\">${marked.parse('```json\\n' + fmtArgs + '\\n```')}</div></div>` : ''}";

const oldRes = "${fmtResult ? `<div class=\"tool-section result\"><div class=\"tool-section-label\" style=\"font-size:0.6rem;\">Çıktı</div><pre style=\"max-height:120px;${resultColor ? 'color:' + resultColor + ' !important;' : ''}\">${escapeHtml(fmtResult)}</pre></div>` : ''}";
const newRes = "${fmtResult ? `<div class=\"tool-section result\"><div class=\"tool-section-label\" style=\"font-size:0.6rem; margin-bottom: 4px;\">Çıktı</div><div class=\"markdown-body\" style=\"font-size:0.8rem; border-radius: 6px; padding-top: 0px;\">${marked.parse('```text\\n' + fmtResult + '\\n```')}</div></div>` : ''}";

content = content.replace(oldArgs, newArgs).replace(oldRes, newRes);

fs.writeFileSync(file, content);
console.log('Done');
