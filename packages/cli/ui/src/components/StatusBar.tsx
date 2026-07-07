import { IconGitBranch, IconCheck, IconCpu, IconBrain } from '@tabler/icons-react';
import { useApp } from '../context/AppContext';

export function StatusBar() {
  const { status, subAgents } = useApp();

  return (
    <div className="flex items-center h-7 px-3 bg-statusbar-bg border-t border-border-default text-xs text-statusbar-fg shrink-0 select-none">
      <div className="flex items-center gap-3 flex-1">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm hover:bg-statusbar-hover cursor-pointer transition-colors">
          <IconGitBranch size={14} stroke={1.5} />
          main
        </span>
        {status?.cwd && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 text-fg-subtle max-w-[240px] truncate">
            <span className="w-1 h-1 rounded-full bg-fg-muted" />
            {status.cwd}
          </span>
        )}
        {subAgents.filter(a => a.status === 'running').length > 0 && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-info/10 text-fg-info">
            <IconCpu size={14} stroke={1.5} />
            {subAgents.filter(a => a.status === 'running').length} sub-agent(s)
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {status?.model && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm hover:bg-statusbar-hover cursor-pointer transition-colors">
            <IconBrain size={14} stroke={1.5} />
            <span className="max-w-[140px] truncate">{status.model}</span>
          </span>
        )}
        {status?.usage && (
          <span className="px-2 py-0.5 text-fg-subtle">
            {(status.usage.in + status.usage.out).toLocaleString()} tokens
          </span>
        )}
        {status?.isGenerating ? (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-warning/10 text-fg-warning">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Thinking
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2 py-0.5">
            <IconCheck size={14} stroke={1.5} className="text-fg-success" />
            Ready
          </span>
        )}
      </div>
    </div>
  );
}
