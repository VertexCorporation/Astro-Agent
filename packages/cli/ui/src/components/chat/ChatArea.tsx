import { useRef, useEffect } from 'react';
import { IconCode, IconTestPipe, IconHammer, IconMinimize } from '@tabler/icons-react';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { useApp } from '../../context/AppContext';
import { Logo } from '../Logo';
import { CortexIcon } from '../CortexIcon';

interface Props {
  onOpenModelSelect: () => void;
  onOpenReasoning: () => void;
}

export function ChatArea({ onOpenModelSelect, onOpenReasoning }: Props) {
  const { messages, streamingContent, sendMessage, status, loading } = useApp();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, streamingContent]);

  const quickActions = [
    { label: 'Code Review', icon: IconCode, cmd: 'Review the codebase and suggest improvements' },
    { label: 'Build', icon: IconHammer, cmd: '/build' },
    { label: 'Test', icon: IconTestPipe, cmd: '/test' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border-default bg-base-1/50 text-xs text-fg-muted shrink-0">
        <button onClick={() => sendMessage('/compact')} className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-base-3 hover:text-fg-default transition-colors" title="Compress conversation context">
          <IconMinimize size={14} stroke={1.5} /> Compact
        </button>
        <span className="w-px h-4 bg-border-default" />
        {status?.model ? (
          <button onClick={onOpenModelSelect} className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-base-3 hover:text-fg-default transition-colors">
            <CortexIcon size={14} className="text-fg-accent" /> {status.model}
          </button>
        ) : (
          <button onClick={onOpenModelSelect} className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-base-3 hover:text-fg-default transition-colors">
            <CortexIcon size={14} /> Select model
          </button>
        )}
        <span className="w-px h-4 bg-border-default" />
        <button onClick={onOpenReasoning} className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-base-3 hover:text-fg-default transition-colors">
          {status?.usage && Number.isFinite(status.usage.in + status.usage.out)
            ? `${(status.usage.in + status.usage.out).toLocaleString()}t`
            : '...'}
        </button>
        <div className="flex-1" />
        {loading && <span className="flex items-center gap-1 px-2 py-1 text-fg-info"><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</span>}
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex flex-col items-center justify-center h-full text-fg-muted gap-4 px-6">
            <Logo size={64} className="logo-glow opacity-20" />
            <div className="text-xl font-semibold text-fg-default">Ne yapalım?</div>
            <div className="text-sm text-fg-subtle text-center max-w-md leading-relaxed">
              AI-powered coding agent. Ask me anything about your code, or use slash commands.
            </div>
            <div className="flex gap-2 mt-2">
              {quickActions.map(({ label, icon: Icon, cmd }) => (
                <button key={label} onClick={() => sendMessage(cmd)}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-base-2 text-fg-muted hover:text-fg-default hover:bg-base-3 border border-border-default transition-colors">
                  <Icon size={16} stroke={1.5} /> {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              {['/clear', '/compact', '/lint', '/refresh'].map(cmd => (
                <button key={cmd} onClick={() => sendMessage(cmd)}
                  className="px-3 py-1 text-2xs rounded-md bg-base-2 text-fg-subtle hover:text-fg-default hover:bg-base-3 border border-border-default transition-colors font-mono">
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            {streamingContent && (
              <div className="flex gap-3 px-6 py-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-base-3 text-fg-info shrink-0">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div className="flex-1 text-sm leading-relaxed text-fg-default whitespace-pre-wrap">
                  {streamingContent}
                  <span className="streaming-cursor" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <MessageInput onOpenModelSelect={onOpenModelSelect} onOpenReasoning={onOpenReasoning} />
    </div>
  );
}
