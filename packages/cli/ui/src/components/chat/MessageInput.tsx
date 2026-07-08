import { useState, useRef, useCallback, useEffect } from 'react';
import { IconSend, IconPlayerStop, IconPaperclip, IconBrain, IconX } from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { toast } from '../../lib/toast';

interface Props {
  onOpenModelSelect: () => void;
  onOpenReasoning: () => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function MessageInput({ onOpenModelSelect, onOpenReasoning }: Props) {
  const { sendMessage, interrupt, loading, status, settings } = useApp();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [thinking, setThinking] = useState(settings?.thinkingLevel ? settings.thinkingLevel > 0 : false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; data: string; type: string }[]>([]);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; }
  }, []);

  useEffect(() => { adjustHeight(); }, [input, adjustHeight]);

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachedFiles.length === 0) || loading) return;
    let finalPrompt = trimmed;
    if (attachedFiles.length > 0) {
      finalPrompt += '\n[Attached files: ' + attachedFiles.map(f => f.name).join(', ') + ']';
    }
    setInput('');
    setAttachedFiles([]);
    setShowCommands(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendMessage(finalPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === '/' && input === '') { e.preventDefault(); setShowCommands(true); }
    if (e.key === 'Escape') { setShowCommands(false); if (input.startsWith('/')) setInput(''); }
  };

  const insertCommand = (cmd: string) => {
    setInput(cmd + ' ');
    textareaRef.current?.focus();
    setShowCommands(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large (max 20 MB): ${file.name}`);
      return;
    }
    try {
      const data = await readFileAsBase64(file);
      const isImage = file.type.startsWith('image/');
      setAttachedFiles(prev => [...prev, { name: file.name, data, type: isImage ? 'image' : 'file' }]);
      toast.success(`Attached: ${file.name}`);
    } catch {
      toast.error(`Failed to read file: ${file.name}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.onabort = () => reject(new Error('File read aborted'));
      const timeout = setTimeout(() => { reader.abort(); reject(new Error('File read timeout')); }, 30000);
      reader.onloadend = () => clearTimeout(timeout);
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const commands = [
    { cmd: '/clear', desc: 'Clear conversation' },
    { cmd: '/compact', desc: 'Compact token usage' },
    { cmd: '/test', desc: 'Run tests' },
    { cmd: '/build', desc: 'Build project' },
    { cmd: '/lint', desc: 'Run linter' },
    { cmd: '/ship', desc: 'Commit and push' },
    { cmd: '/refresh', desc: 'Refresh browser' },
  ];

  return (
    <div className="px-4 py-3 border-t border-border-default bg-chat-bg">
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-md bg-base-3 border border-border-default text-xs">
              {f.type === 'image' ? (
                <img src={f.data} alt={f.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                <span className="text-fg-muted">📄</span>
              )}
              <span className="text-fg-muted max-w-[120px] truncate">{f.name}</span>
              <button onClick={() => removeFile(i)} className="text-fg-subtle hover:text-fg-danger ml-1">
                <IconX size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Slash commands menu */}
      {showCommands && (
        <div className="mb-2 border border-border-default rounded-lg bg-base-2 overflow-hidden shadow-lg">
          {commands.map(c => (
            <div key={c.cmd} onClick={() => insertCommand(c.cmd)}
              className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-base-3 transition-colors">
              <span className="font-mono text-fg-accent text-xs">{c.cmd}</span>
              <span className="text-fg-muted text-xs">{c.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,.txt,.pdf,.csv,.json,.md,.ts,.tsx,.js,.jsx,.py,.css,.html"
        className="hidden" onChange={handleFileSelect} />

      <div className="relative flex items-end gap-2 bg-chat-input-bg rounded-xl border border-border-default focus-within:border-border-accent transition-colors shadow-xs">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); if (e.target.value.startsWith('/')) setShowCommands(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Send a message... (/ for commands, Enter to send)"
          rows={1}
          className="flex-1 bg-transparent text-sm text-fg-default placeholder-fg-subtle outline-none resize-none py-3 px-4 max-h-[200px] leading-relaxed"
        />
        <div className="flex items-center gap-1 pr-2 pb-2 shrink-0">
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-fg-muted hover:text-fg-default hover:bg-base-3 transition-colors"
            title="Attach file">
            <IconPaperclip size={17} stroke={1.5} />
          </button>
          {loading ? (
            <button onClick={interrupt} className="flex items-center justify-center w-8 h-8 rounded-lg bg-fg-danger text-white hover:opacity-90 transition-colors" title="Stop">
              <IconPlayerStop size={17} stroke={1.5} />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim() && attachedFiles.length === 0}
              className={cn('flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                (input.trim() || attachedFiles.length > 0) ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-base-3 text-fg-subtle cursor-not-allowed')}
              title="Send">
              <IconSend size={17} stroke={1.5} />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-1">
          <button onClick={() => setThinking(!thinking)}
            className={cn('flex items-center gap-1 px-2 py-1 text-2xs rounded-md transition-colors',
              thinking ? 'text-fg-accent bg-accent-subtle' : 'text-fg-subtle hover:text-fg-muted hover:bg-base-3')}>
            <IconBrain size={13} stroke={1.5} /> Think
          </button>
          <button onClick={onOpenModelSelect} className="status-pill text-2xs">
            {status?.model ? status.model : 'Model'}
          </button>
          <button onClick={onOpenReasoning} className="status-pill text-2xs">
            {settings?.thinkingLevel ? `Lvl ${settings.thinkingLevel}` : 'Reasoning'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {input.length > 50 && <span className="text-2xs text-fg-subtle">{input.length}</span>}
        </div>
      </div>
    </div>
  );
}
