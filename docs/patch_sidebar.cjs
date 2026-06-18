const fs = require('fs');
const file = 'C:/Users/theay/Desktop/MoonCode/packages/cli/src/modes/web/web-ui.html';
let content = fs.readFileSync(file, 'utf8');

// Inject CSS
const newCss = `
  /* Sidebar UI Updates */
  @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }
  .pulse-dot { position: relative; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink:0; margin-left: 8px; }
  .pulse-dot::after { content:''; position: absolute; left:0; top:0; width:100%; height:100%; border-radius: 50%; border: 1px solid var(--accent); animation: pulseRing 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
  .session-icon { font-size: 15px !important; color: var(--muted); flex-shrink:0; }
  .session-date { font-size: 0.65rem; color: var(--muted); opacity: 0.7; margin-top: 2px; }
  .dropdown-menu { position: absolute; background: #1a1d24; border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.6); z-index: 1000; padding: 4px; display: flex; flex-direction: column; gap: 2px; min-width: 140px; }
  .dropdown-item { background: transparent; border: none; color: var(--fg); padding: 8px 12px; font-size: 0.8rem; text-align: left; cursor: pointer; border-radius: 6px; display:flex; align-items:center; gap:8px; width: 100%; }
  .dropdown-item:hover { background: rgba(255,255,255,0.05); }
  .dropdown-item.danger { color: #ff6464; }
  .dropdown-item.danger:hover { background: rgba(255,100,100,0.1); }
`;
if (!content.includes('.pulse-dot')) {
    content = content.replace('</style>', newCss + '\n</style>');
}

let parts = content.split('function renderConversations(sessions, activeId) {');
if (parts.length === 2) {
    let subParts = parts[1].split('function toggleBulkMode');
    
    const newRenderFunc = `
    const list = document.getElementById('conversation-list');
    if (!list) return;

    let hasActive = sessions.some(s => s.id === activeId);
    if (!hasActive && activeId) {
        sessions.unshift({ id: activeId, name: 'New Chat', firstMessage: '', modified: new Date().toISOString() });
    }

    list.innerHTML = '';
    sessions.forEach(s => {
        const item = document.createElement('div');
        const isActive = s.id === activeId;
        item.className = 'sidebar-item' + (isActive ? ' active' : '');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.padding = '10px 12px';
        item.style.gap = '10px';
        item.style.position = 'relative';

        if (bulkSelectMode) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.marginRight = '6px';
            checkbox.style.cursor = 'pointer';
            checkbox.checked = selectedConversationIds.has(s.id);
            checkbox.onclick = (e) => {
                e.stopPropagation();
                checkbox.checked ? selectedConversationIds.add(s.id) : selectedConversationIds.delete(s.id);
                updateBulkDeleteBar();
            };
            item.appendChild(checkbox);
        }

        // Icon
        const icon = document.createElement('span');
        icon.className = 'material-symbols-rounded session-icon';
        icon.textContent = (isActive && isGenerating) ? 'bolt' : 'chat_bubble';
        if (isActive && isGenerating) icon.style.color = 'var(--accent)';
        item.appendChild(icon);

        const titleInfo = document.createElement('div');
        titleInfo.style.flex = '1';
        titleInfo.style.display = 'flex';
        titleInfo.style.flexDirection = 'column';
        titleInfo.style.overflow = 'hidden';

        const title = s.name || s.firstMessage || 'New Chat';
        const titleEl = document.createElement('div');
        titleEl.style.whiteSpace = 'nowrap';
        titleEl.style.overflow = 'hidden';
        titleEl.style.textOverflow = 'ellipsis';
        titleEl.style.fontSize = '0.85rem';
        titleEl.style.fontWeight = isActive ? '500' : '400';
        titleEl.style.color = isActive ? 'var(--fg)' : 'var(--muted)';
        titleEl.textContent = title;
        titleInfo.appendChild(titleEl);

        const dateEl = document.createElement('div');
        dateEl.className = 'session-date';
        try {
            const d = new Date(s.modified);
            dateEl.textContent = d.toLocaleDateString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
        } catch(e) { dateEl.textContent = 'Just now'; }
        titleInfo.appendChild(dateEl);

        item.appendChild(titleInfo);

        // Loading animation for active generating
        if (isActive && isGenerating) {
            const pulse = document.createElement('div');
            pulse.className = 'pulse-dot';
            item.appendChild(pulse);
        }

        if (!bulkSelectMode) {
            const actionsEl = document.createElement('div');
            actionsEl.style.display = 'none';
            actionsEl.style.gap = '4px';
            actionsEl.className = 'conv-actions';

            const menuBtn = document.createElement('button');
            menuBtn.className = 'tool-btn';
            menuBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;">more_vert</span>';
            menuBtn.onclick = (e) => { 
                e.stopPropagation(); 
                showSessionMenu(e, s.id, title); 
            };

            actionsEl.appendChild(menuBtn);
            item.appendChild(actionsEl);

            item.onmouseover = () => { actionsEl.style.display = 'flex'; };
            item.onmouseout = () => { actionsEl.style.display = 'none'; };
            item.onclick = () => switchConversation(s.id);
        } else {
            item.style.cursor = 'pointer';
            item.onclick = (e) => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                checkbox.checked ? selectedConversationIds.add(s.id) : selectedConversationIds.delete(s.id);
                updateBulkDeleteBar();
            };
        }

        list.appendChild(item);
    });
}

window.showSessionMenu = function(e, id, title) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    
    // Rename
    const renameBtn = document.createElement('button');
    renameBtn.className = 'dropdown-item';
    renameBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;">edit</span> Rename';
    renameBtn.onclick = () => { menu.remove(); renameConversation(id, title); };
    
    // Download
    const dlBtn = document.createElement('button');
    dlBtn.className = 'dropdown-item';
    dlBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;">download</span> Download';
    dlBtn.onclick = () => { menu.remove(); window.open('/api/session/export?format=jsonl&id=' + id, '_blank'); };

    // Share
    const shareBtn = document.createElement('button');
    shareBtn.className = 'dropdown-item';
    shareBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;">share</span> Share (Gist)';
    shareBtn.onclick = async () => { 
        menu.remove(); 
        toast('Sharing session...', 'info');
        try {
            const res = await fetch('/api/session/share?id=' + id, { method: 'POST' });
            if (!res.ok) throw new Error();
            const data = await res.json();
            document.getElementById('share-url-input').value = data.url;
            document.getElementById('share-open-link').href = data.url;
            openModal('shareModal');
        } catch(e) { toast('Share failed', 'error'); }
    };

    // Archive
    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'dropdown-item';
    archiveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:15px;">archive</span> Archive';
    archiveBtn.onclick = () => { 
      
