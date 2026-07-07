import { useState } from 'react';
import { IconX, IconLogout, IconUser, IconKey } from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', color: '#10a37f' },
  { id: 'anthropic', name: 'Anthropic', color: '#d4a574' },
  { id: 'google', name: 'Google', color: '#4285f4' },
  { id: 'groq', name: 'Groq', color: '#f55036' },
  { id: 'openrouter', name: 'OpenRouter', color: '#84309c' },
  { id: 'deepseek', name: 'DeepSeek', color: '#4f6bf5' },
];

export function AuthModal({ open, onClose }: Props) {
  const { auth, logout, refresh } = useApp();
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});

  const handleLogin = (provider: string) => {
    window.open(`http://127.0.0.1:3131/login?provider=${provider}`, 'auth', 'width=600,height=700');
    const check = setInterval(async () => {
      try {
        const data = await api.getAuthStatus();
        if (data?.isLoggedIn) { clearInterval(check); refresh(); }
      } catch {}
    }, 2000);
  };

  const handleSaveApiKey = async (providerId: string) => {
    const key = apiKeyInputs[providerId];
    if (!key) return;
    try {
      // API key saving would go through the web-ui-server auth endpoint
      await fetch(`http://127.0.0.1:3131/api/auth/save-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, apiKey: key }),
      });
      setApiKeyInputs(prev => ({ ...prev, [providerId]: '' }));
      refresh();
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title"><IconUser size={18} /> Authentication</span>
          <button className="modal-close" onClick={onClose}><IconX size={18} /></button>
        </div>
        <div className="modal-body">
          {auth?.isLoggedIn && auth.account && (
            <div className="mb-6 p-4 rounded-lg bg-accent-subtle border border-border-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                  {auth.account.initial}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{auth.account.name}</div>
                  <div className="text-xs text-fg-muted">{auth.account.email}</div>
                </div>
                <button onClick={() => logout()} className="btn btn-danger btn-sm">
                  <IconLogout size={14} /> Logout
                </button>
              </div>
            </div>
          )}
          <div className="text-sm font-medium mb-3">API Providers</div>
          <div className="space-y-3">
            {PROVIDERS.map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-border-default bg-base-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: p.color }}>
                      {p.id[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <button onClick={() => handleLogin(p.id)} className="btn btn-secondary btn-sm">
                    <IconKey size={13} /> OAuth
                  </button>
                </div>
                <div className="flex gap-2">
                  <input value={apiKeyInputs[p.id] || ''} onChange={e => setApiKeyInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Or paste API key..."
                    className="input text-xs flex-1" type="password"
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveApiKey(p.id); }} />
                  <button onClick={() => handleSaveApiKey(p.id)} disabled={!apiKeyInputs[p.id]}
                    className="btn btn-primary btn-sm disabled:opacity-40">Save</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
