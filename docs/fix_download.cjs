const fs = require('fs');
const file = 'C:/Users/theay/Desktop/MoonCode/packages/cli/src/modes/web/web-ui.html';
let content = fs.readFileSync(file, 'utf8');

// Replace the download and archive onclick handlers in showSessionMenu
content = content.replace(
    /dlBtn\.onclick = \(\) => \{ menu\.remove\(\); window\.open\('\/api\/session\/export\?format=jsonl&id=' \+ id, '_blank'\); \};/g,
    `dlBtn.onclick = async () => { 
        menu.remove(); 
        if (id !== activeId) { await switchConversation(id); await new Promise(r => setTimeout(r, 500)); }
        window.open('/api/session/export?format=jsonl', '_blank'); 
    };`
);

content = content.replace(
    /archiveBtn\.onclick = \(\) => \{[\s\S]*?setTimeout\(\(\) => deleteConversation\(id\), 1000\);\s*\};/g,
    `archiveBtn.onclick = async () => { 
        menu.remove(); 
        if (id !== activeId) { await switchConversation(id); await new Promise(r => setTimeout(r, 500)); }
        window.open('/api/session/export?format=jsonl', '_blank');
        setTimeout(() => deleteConversation(id), 1000);
    };`
);

content = content.replace(
    /shareBtn\.onclick = async \(\) => \{[\s\S]*?openModal\('shareModal'\);\n\s*\} catch\(e\) \{ toast\('Share failed', 'error'\); \}\n\s*\};/g,
    `shareBtn.onclick = async () => { 
        menu.remove(); 
        toast('Sharing session...', 'info');
        try {
            if (id !== activeId) { await switchConversation(id); await new Promise(r => setTimeout(r, 500)); }
            const res = await fetch('/api/session/share', { method: 'POST' });
            if (!res.ok) throw new Error();
            const data = await res.json();
            document.getElementById('share-url-input').value = data.url;
            document.getElementById('share-open-link').href = data.url;
            openModal('shareModal');
        } catch(e) { toast('Share failed', 'error'); }
    };`
);

fs.writeFileSync(file, content, 'utf8');
console.log('web-ui.html download/share logic patched to switch first.');
