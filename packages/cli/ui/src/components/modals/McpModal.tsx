import { useState } from 'react';
import { IconX, IconPlugConnected, IconPlugConnectedX, IconRefresh, IconPlus, IconTrash, IconTool } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function McpModal({ open, onClose }: Props) {
  const { mcp, refresh } = useApp();
  const [customName, setCustomName] = useState('');
  const [customCommand, setCustomCommand] = useState('');
  const [customArgs, setCustomArgs] = useState('');

  const handleAction = async (action: string, data?: any) => {
    await api.mcpAction(action, data);
    refresh();
  };

  const handleAddCustom = async () => {
    if (!customName.trim() || !customCommand.trim()) return;
    await handleAction('add_custom', {
      name: customName.trim(),
      command: customCommand.trim(),
      args: customArgs.trim() ? customArgs.trim().split(' ') : [],
    });
    setCustomName('');
    setCustomCommand('');
    setCustomArgs('');
  };

  if (!open) return null;

  const servers = mcp?.servers || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title"><IconPlugConnected size={18} /> MCP Manager</span>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="btn btn-ghost btn-icon" title="Refresh"><IconRefresh size={16} /></button>
            <button className="modal-close" onClick={onClose}><IconX size={18} /></button>
          </div>
        </div>
        <div className="px-4 py-2 border-b border-border-default text-xs text-fg-subtle flex gap-4">
          <span>{servers.length} server(s)</span>
          <span>{mcp?.clients || 0} client(s)</span>
          <span>{mcp?.tools || 0} tool(s)</span>
        </div>
        <div className="modal-body">
          {servers.length > 0 ? (
            <div className="space-y-2 mb-4">
              {servers.map(s => (
                <div key={s.name} className="p-3 rounded-lg border border-border-default bg-base-2">
                  <div className="flex items-center gap-2">
                    {s.connected
                      ? <IconPlugConnected size={16} className="text-fg-success shrink-0" />
                      : <IconPlugConnectedX size={16} className="text-fg-danger shrink-0" />
                    }
                    <span className="text-sm font-medium flex-1">{s.name}</span>
                    <span className={cn('badge text-2xs', s.connected ? 'badge-accent' : 'badge-danger')}>
                      {s.connected ? 'Connected' : 'Disconnected'}
                    </span>
                    {s.connected && (
                      <button onClick={() => handleAction('disconnect', { name: s.name })}
                        className="btn btn-ghost btn-icon text-2xs">Disconnect</button>
                    )}
                    <button onClick={() => handleAction('remove', { name: s.name })}
                      className="btn btn-ghost btn-icon text-fg-danger">
                      <IconTrash size={14} />
                    </button>
                  </div>
                  {s.tools > 0 && (
                    <div className="flex items-center gap-1 mt-1 ml-6 text-xs text-fg-subtle">
                      <IconTool size={12} /> {s.tools} tools
                    </div>
                  )}
                  {s.command && (
                    <div className="ml-6 text-2xs text-fg-subtle font-mono mt-0.5">{s.command} {s.args?.join(' ')}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-fg-subtle text-sm mb-4">
              <IconPlugConnected size={32} stroke={1} className="opacity-30 mb-2" />
              <span>No MCP servers configured</span>
            </div>
          )}

          <div className="border-t border-border-default pt-4">
            <span className="text-sm font-medium block mb-3">Add Custom MCP Server</span>
            <div className="space-y-2">
              <input value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder="Server name" className="input text-sm" />
              <input value={customCommand} onChange={e => setCustomCommand(e.target.value)}
                placeholder="Command (e.g., npx, uvx, node)" className="input text-sm" />
              <input value={customArgs} onChange={e => setCustomArgs(e.target.value)}
                placeholder="Arguments (space-separated)" className="input text-sm" />
              <button onClick={handleAddCustom} disabled={!customName.trim() || !customCommand.trim()}
                className="btn btn-primary w-full mt-1 disabled:opacity-40">
                <IconPlus size={16} /> Add & Connect
              </button>
            </div>
          </div>

          <div className="border-t border-border-default pt-4 mt-4">
            <span className="text-sm font-medium block mb-3">Built-in MCP Servers</span>
            <div className="flex gap-2">
              {['blender', 'scratch', 'godot'].map(name => (
                <button key={name} onClick={() => handleAction('connect_builtin', { name })}
                  className="flex-1 p-2 rounded-lg border border-border-default bg-base-2 text-sm text-fg-muted hover:bg-base-3 hover:text-fg-default transition-colors capitalize">
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
