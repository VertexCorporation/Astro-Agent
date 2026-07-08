import { IconFiles, IconSearch, IconMessages, IconChecklist, IconPlugConnected, IconSettings, IconBrain, IconStars } from '@tabler/icons-react';
import { cn } from '../lib/utils';

interface ActivityBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  onOpenSkills: () => void;
}

const tabs = [
  { id: 'files', icon: IconFiles, label: 'Explorer' },
  { id: 'search', icon: IconSearch, label: 'Search' },
  { id: 'chat', icon: IconMessages, label: 'Chat' },
  { id: 'todo', icon: IconChecklist, label: 'Todo' },
  { id: 'mcp', icon: IconPlugConnected, label: 'MCP' },
];

export function ActivityBar({ activeTab, onTabChange, onOpenSettings, onOpenMemory, onOpenSkills }: ActivityBarProps) {
  return (
    <div className="flex flex-col items-center w-12 bg-activity-bg border-r border-border-default py-2 shrink-0 select-none">
      <div className="flex-1 flex flex-col items-center gap-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            title={label}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150',
              activeTab === id
                ? 'text-activity-active bg-sidebar-active'
                : 'text-activity-fg hover:text-activity-active hover:bg-sidebar-hover'
            )}
          >
            <Icon size={22} stroke={1.5} />
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1 mt-2 pt-2 border-t border-border-default">
        <button onClick={onOpenSkills} title="Skills" className="flex items-center justify-center w-10 h-10 rounded-lg text-activity-fg hover:text-activity-active hover:bg-sidebar-hover transition-all duration-150">
          <IconStars size={22} stroke={1.5} />
        </button>
        <button onClick={onOpenMemory} title="Semantic Brain / Memory" className="flex items-center justify-center w-10 h-10 rounded-lg text-activity-fg hover:text-activity-active hover:bg-sidebar-hover transition-all duration-150">
          <IconBrain size={22} stroke={1.5} />
        </button>
        <button onClick={onOpenSettings} title="Settings" className="flex items-center justify-center w-10 h-10 rounded-lg text-activity-fg hover:text-activity-active hover:bg-sidebar-hover transition-all duration-150">
          <IconSettings size={22} stroke={1.5} />
        </button>
      </div>
    </div>
  );
}
