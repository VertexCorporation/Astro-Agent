import { useState, useEffect } from 'react';
import { IconX, IconStars, IconRefresh } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { toast } from '../../lib/toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface SkillInfo {
  name: string;
  description: string;
}

export function SkillsModal({ open, onClose }: Props) {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) loadSkills();
  }, [open]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const data = await api.getSkills();
      setSkills(data.skills || []);
    } catch {
      setSkills([]);
    }
    setLoading(false);
  };

  const handleLoad = async (name: string) => {
    try {
      const data = await api.loadSkill(name);
      if (data.success) {
        toast.success(`Skill "${name}" loaded`);
        onClose();
      } else {
        toast.error(data.error || 'Failed to load skill');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title"><IconStars size={18} /> Skills</span>
          <div className="flex items-center gap-2">
            <button onClick={loadSkills} className="btn btn-ghost btn-icon" title="Refresh"><IconRefresh size={16} /></button>
            <button className="modal-close" onClick={onClose}><IconX size={18} /></button>
          </div>
        </div>
        <div className="modal-body">
          <p className="text-xs text-fg-subtle mb-4">
            Skills provide specialized instructions for specific tasks. Place <code>.md</code> files in <code>.opencode/skills/</code> directory.
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-fg-subtle text-sm">Loading skills...</div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-fg-subtle text-sm">
              <IconStars size={32} stroke={1} className="opacity-30 mb-2" />
              <span>No skills found</span>
            </div>
          ) : (
            <div className="space-y-2">
              {skills.map(s => (
                <div key={s.name} className="p-3 rounded-lg border border-border-default bg-base-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <IconStars size={16} className="text-fg-accent shrink-0" />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <button onClick={() => handleLoad(s.name)} className="btn btn-primary btn-sm">Load</button>
                  </div>
                  <div className="text-xs text-fg-subtle mt-1 ml-7">{s.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
