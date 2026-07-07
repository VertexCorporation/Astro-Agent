import { useState, useEffect } from 'react';
import { IconX, IconSettings, IconBrain, IconShieldLock, IconPalette, IconRefresh } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'memory' | 'security' | 'custom';

export function SettingsModal({ open, onClose }: Props) {
  const { settings, refresh } = useApp();
  const [tab, setTab] = useState<SettingsTab>('general');
  const [localSettings, setLocalSettings] = useState({ ...settings });

  useEffect(() => {
    if (settings) setLocalSettings({ ...settings });
  }, [settings]);

  const handleSave = async () => {
    await api.saveSettings(localSettings as any);
    refresh();
    onClose();
  };

  const tabs: { id: SettingsTab; label: string; icon: typeof IconSettings }[] = [
    { id: 'general', label: 'General', icon: IconSettings },
    { id: 'memory', label: 'Memory', icon: IconBrain },
    { id: 'security', label: 'Security', icon: IconShieldLock },
    { id: 'custom', label: 'Customization', icon: IconPalette },
  ];

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title"><IconSettings size={18} /> Settings</span>
          <button className="modal-close" onClick={onClose}><IconX size={18} /></button>
        </div>
        <div className="flex border-b border-border-default">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors',
                tab === t.id ? 'text-fg-accent border-accent' : 'text-fg-muted border-transparent hover:text-fg-default')}>
              <t.icon size={16} stroke={1.5} /> {t.label}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {tab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">AI Name</label>
                <input value={localSettings.aiName || ''} onChange={e => setLocalSettings(prev => ({ ...prev, aiName: e.target.value }))}
                  className="input text-sm" placeholder="Astro" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Extra Instructions</label>
                <textarea value={localSettings.extraInstructions || ''} onChange={e => setLocalSettings(prev => ({ ...prev, extraInstructions: e.target.value }))}
                  className="input text-sm min-h-[100px]" placeholder="Custom instructions for the AI..." />
              </div>
            </div>
          )}
          {tab === 'memory' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Compaction Profile</label>
                <select value={localSettings.compactionProfile} onChange={e => setLocalSettings(prev => ({ ...prev, compactionProfile: e.target.value as any }))}
                  className="input text-sm">
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                  <option value="off">Off</option>
                </select>
                <p className="text-xs text-fg-subtle mt-1">Controls how aggressively token usage is reduced</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Thinking Level</label>
                <select value={localSettings.thinkingLevel} onChange={e => setLocalSettings(prev => ({ ...prev, thinkingLevel: parseInt(e.target.value) }))}
                  className="input text-sm">
                  <option value={0}>Off</option>
                  <option value={1}>Minimal</option>
                  <option value={2}>Low</option>
                  <option value={3}>Medium</option>
                  <option value={4}>High</option>
                  <option value={5}>X-High</option>
                </select>
              </div>
            </div>
          )}
          {tab === 'security' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Permission Level</label>
                <div className="flex gap-2">
                  {(['ask', 'safe', 'full'] as const).map(level => (
                    <button key={level} onClick={() => setLocalSettings(prev => ({ ...prev, permissionLevel: level }))}
                      className={cn('flex-1 p-3 rounded-lg border text-sm text-left transition-colors',
                        localSettings.permissionLevel === level
                          ? 'border-accent bg-accent-subtle text-fg-accent'
                          : 'border-border-default bg-base-2 text-fg-muted hover:bg-base-3')}>
                      <div className="font-medium capitalize mb-1">{level}</div>
                      <div className="text-xs opacity-70">
                        {level === 'ask' ? 'Ask before each action' : level === 'safe' ? 'Safe auto-execution' : 'Full auto-execution'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Theme</label>
                <div className="flex gap-2">
                  {(['dark', 'light'] as const).map(theme => (
                    <button key={theme} onClick={() => setLocalSettings(prev => ({ ...prev, theme }))}
                      className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors',
                        localSettings.theme === theme
                          ? 'border-accent bg-accent-subtle text-fg-accent'
                          : 'border-border-default bg-base-2 text-fg-muted hover:bg-base-3')}>
                      <IconPalette size={16} /> {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary"><IconRefresh size={16} /> Save</button>
        </div>
      </div>
    </div>
  );
}
