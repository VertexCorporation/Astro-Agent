import { IconMenu2, IconFiles, IconSun, IconMoon } from '@tabler/icons-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

export function Header() {
  const { toggleSidebar, toggleIde, ideOpen, status, settings, setTheme } = useApp();

  const toggleTheme = () => {
    setTheme((settings?.theme ?? 'dark') === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="header-gradient flex items-center h-11 bg-titlebar-bg border-b border-border-default select-none shrink-0">
      <div className="flex items-center gap-1 pl-2">
        <button onClick={toggleSidebar} className="btn-icon btn-ghost" title="Toggle Sidebar (Ctrl+B)">
          <IconMenu2 size={18} stroke={1.5} />
        </button>
        <button onClick={toggleIde} className={cn('btn-icon btn-ghost', ideOpen && 'text-fg-accent bg-accent-subtle')} title="Toggle IDE Panel">
          <IconFiles size={18} stroke={1.5} />
        </button>
      </div>
      <div className="flex items-center gap-2 flex-1 px-3">
        <span className="flex items-center gap-2">
          <Logo size={18} className="logo-glow" />
          <span className="text-sm font-semibold text-titlebar-fg tracking-tight">Astro Agent</span>
        </span>
        {status?.cwd && (
          <span className="text-xs text-fg-subtle ml-2 px-2 py-0.5 rounded-md bg-base-2 border border-border-default max-w-[300px] truncate">
            {status.cwd}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 pr-2">
        <button onClick={toggleTheme} className="btn-icon btn-ghost" title={`Switch to ${(settings?.theme ?? 'dark') === 'dark' ? 'light' : 'dark'} theme`}>
          {(settings?.theme ?? 'dark') === 'dark' ? <IconSun size={16} stroke={1.5} /> : <IconMoon size={16} stroke={1.5} />}
        </button>
      </div>
    </div>
  );
}
