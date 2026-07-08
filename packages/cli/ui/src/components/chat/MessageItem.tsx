import { useState } from 'react';
import { IconUser, IconRobot, IconCopy, IconPin, IconPinFilled, IconTrash, IconPencil, IconChevronDown, IconChevronUp, IconCheck, IconX, IconLoader2 } from '@tabler/icons-react';
import type { Message, ToolCall } from '../../types';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';

interface Props {
  message: Message;
}

function ToolCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = tool.status === 'running';
  const isDone = tool.status === 'done';
  const isError = tool.status === 'error';

  const icon = isRunning ? <IconLoader2 size={14} className="animate-spin" /> :
    isDone ? <IconCheck size={14} className="text-fg-success" /> :
    <IconX size={14} className="text-fg-danger" />;

  const borderColor = isDone ? 'border-fg-success/30' :
    isRunning ? 'border-fg-info/30' :
    'border-fg-danger/30';

  return (
    <div className={`border ${borderColor} rounded-lg overflow-hidden`}>
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-base-3/50 transition-colors select-none"
      >
        <span className="shrink-0">{icon}</span>
        <span className="text-xs font-medium flex-1 truncate">{tool.tool}</span>
        {tool.duration !== undefined && (
          <span className="text-2xs text-fg-subtle shrink-0">{(tool.duration / 1000).toFixed(1)}s</span>
        )}
        <span className="shrink-0 text-fg-subtle">
          {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </span>
      </div>
      {expanded && (
        <div className="border-t border-border-default">
          {tool.input && (
            <div className="px-3 py-2 border-b border-border-default">
              <div className="text-2xs font-semibold text-fg-subtle uppercase mb-1">Input</div>
              <pre className="text-xs text-fg-muted whitespace-pre-wrap font-mono leading-relaxed max-h-32 overflow-y-auto">{tool.input}</pre>
            </div>
          )}
          {tool.output && (
            <div className="px-3 py-2">
              <div className="text-2xs font-semibold text-fg-subtle uppercase mb-1">Output</div>
              <pre className={`text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto ${isRunning ? 'text-fg-info' : isError ? 'text-fg-danger' : 'text-fg-muted'}`}>{tool.output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MessageItem({ message }: Props) {
  const { deleteMessage, togglePin } = useApp();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const displayText = typeof message.content === 'string' ? message.content : (message.text || '');
  const [editText, setEditText] = useState(displayText);
  const [expanded, setExpanded] = useState(true);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = async () => {
    if (editText !== displayText) {
      // editMessage would be called via the hook
    }
    setEditing(false);
  };

  const msgTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn('group flex gap-3 px-6 py-4 transition-colors', isUser ? 'bg-chat-user-bg' : 'hover:bg-base-1/30')}>
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5',
        isUser ? 'bg-accent-subtle text-fg-accent' : 'bg-base-3 text-fg-info'
      )}>
        {isUser ? <IconUser size={18} stroke={1.5} /> : <IconRobot size={18} stroke={1.5} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-fg-muted">{isUser ? 'You' : 'Astro Agent'}</span>
          <span className="text-xs text-fg-subtle">{msgTime}</span>
          {message.model && <span className="badge badge-info text-2xs">{message.model}</span>}
          {message.pinned && <IconPinFilled size={12} className="text-fg-accent" />}
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea value={editText} onChange={e => setEditText(e.target.value)}
              className="input text-sm min-h-[80px]" autoFocus />
            <div className="flex gap-2">
              <button onClick={handleEdit} className="btn btn-primary btn-sm">Save</button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <div className={cn('text-sm leading-relaxed prose', !expanded && displayText.length > 500 && 'max-h-32 overflow-hidden')}>
            {expanded || displayText.length <= 500 ? displayText : displayText.slice(0, 500) + '…'}
          </div>
        )}
        {!isUser && displayText.length > 500 && (
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 mt-1 text-xs text-fg-accent hover:text-accent-hover transition-colors">
            {expanded ? <><IconChevronUp size={14} /> Show less</> : <><IconChevronDown size={14} /> Show more ({displayText.length} chars)</>}
          </button>
        )}
        {!isUser && message.tools && message.tools.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {message.tools.map((tool: ToolCall) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-fg-muted hover:text-fg-default hover:bg-base-3 transition-colors">
            <IconCopy size={14} stroke={1.5} /> {copied ? 'Copied' : 'Copy'}
          </button>
          {isUser && (
            <button onClick={() => { setEditing(true); setEditText(displayText); }} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-fg-muted hover:text-fg-default hover:bg-base-3 transition-colors">
              <IconPencil size={14} stroke={1.5} /> Edit
            </button>
          )}
          <button onClick={() => togglePin(message.id, !message.pinned)} className={cn('flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
            message.pinned ? 'text-fg-accent bg-accent-subtle' : 'text-fg-muted hover:text-fg-default hover:bg-base-3')}>
            {message.pinned ? <IconPinFilled size={14} /> : <IconPin size={14} stroke={1.5} />}
          </button>
          <button onClick={() => deleteMessage(message.id)} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-fg-muted hover:text-fg-danger hover:bg-base-3 transition-colors">
            <IconTrash size={14} stroke={1.5} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
