import { useState } from 'react';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import { ActivityBar } from './ActivityBar';
import { ChatArea } from './chat/ChatArea';
import { ConversationList } from './panels/ConversationList';
import { FileExplorer } from './panels/FileExplorer';
import { TodoPanel } from './panels/TodoPanel';
import { AgentsPanel } from './panels/AgentsPanel';
import { FilePreview } from './FilePreview';
import { ModelModal } from './modals/ModelModal';
import { AuthModal } from './modals/AuthModal';
import { SettingsModal } from './modals/SettingsModal';
import { McpModal } from './modals/McpModal';
import { ReasoningModal } from './modals/ReasoningModal';
import { MemoryModal } from './modals/MemoryModal';
import { SkillsModal } from './modals/SkillsModal';
import { useApp } from '../context/AppContext';
import { useKeyboard } from '../hooks/useKeyboard';

export function Layout() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar, ideOpen, error } = useApp();

  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [mcpModalOpen, setMcpModalOpen] = useState(false);
  const [reasoningModalOpen, setReasoningModalOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);

  useKeyboard([
    { key: 'b', ctrl: true, handler: toggleSidebar },
    { key: 'n', ctrl: true, handler: () => {} },
    { key: 'k', ctrl: true, handler: () => setModelModalOpen(true) },
  ]);

  const renderSidebarPanel = () => {
    switch (activeTab) {
      case 'chat': return <ConversationList />;
      case 'files': return <FileExplorer />;
      case 'todo': return <TodoPanel />;
      case 'agents': return <AgentsPanel />;
      case 'mcp': return <div className="flex items-center justify-center h-full text-fg-subtle text-sm"><button onClick={() => setMcpModalOpen(true)} className="btn btn-secondary">Open MCP Manager</button></div>;
      default: return <FileExplorer />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />

      {error && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-danger/10 border-b border-danger/20 text-xs text-fg-danger shrink-0">
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenMemory={() => setMemoryModalOpen(true)}
          onOpenSkills={() => setSkillsModalOpen(true)}
        />

        {sidebarOpen && activeTab !== 'chat' && (
          <div className="w-60 bg-sidebar-bg border-r border-border-default flex flex-col overflow-hidden shrink-0">
            <div className="flex-1 overflow-y-auto">{renderSidebarPanel()}</div>
          </div>
        )}

        {sidebarOpen && activeTab === 'chat' && (
          <div className="w-60 bg-sidebar-bg border-r border-border-default flex flex-col overflow-hidden shrink-0">
            <ConversationList />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden bg-chat-bg min-w-0">
          <ChatArea
            onOpenModelSelect={() => setModelModalOpen(true)}
            onOpenReasoning={() => setReasoningModalOpen(true)}
          />
        </div>

        {ideOpen && (
          <div className="w-80 bg-sidebar-bg border-l border-border-default flex flex-col overflow-hidden shrink-0">
            <FilePreview />
          </div>
        )}
      </div>

      <StatusBar />

      {/* Modals */}
      <ModelModal open={modelModalOpen} onClose={() => setModelModalOpen(false)} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
      <McpModal open={mcpModalOpen} onClose={() => setMcpModalOpen(false)} />
      <ReasoningModal open={reasoningModalOpen} onClose={() => setReasoningModalOpen(false)} />
      <MemoryModal open={memoryModalOpen} onClose={() => setMemoryModalOpen(false)} />
      <SkillsModal open={skillsModalOpen} onClose={() => setSkillsModalOpen(false)} />
    </div>
  );
}
