import { Minus, Square, X, Save, FolderOpen, Settings, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import type { RecentProject } from '@/types';

interface TitlebarProps {
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onOpenSettings?: () => void;
  onLoadRecentProject?: (path: string) => void;
}

export function Titlebar({ onSaveProject, onLoadProject, onOpenSettings, onLoadRecentProject }: TitlebarProps) {
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRecentOpen && window.electron?.recent) {
      window.electron.recent.read().then(setRecentProjects);
    }
  }, [isRecentOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRecentOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMinimize = () => {
    window.electron?.minimize?.();
  };

  const handleMaximize = () => {
    window.electron?.maximize?.();
  };

  const handleClose = () => {
    window.electron?.close?.();
  };

  const handleClearRecent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.electron?.recent) {
      await window.electron.recent.clear();
      setRecentProjects([]);
    }
  };

  return (
    <div
      className="h-10 flex items-center justify-between px-4 select-none relative z-50 bg-[#0a0a0c]"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left - App Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-[#8A8F98]">Audiobook Toolkit</h1>

        {/* Project Buttons */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Recent / Open Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsRecentOpen(!isRecentOpen)}
              className={cn(
                "px-2.5 py-1 flex items-center gap-1.5 rounded text-xs transition-colors",
                isRecentOpen ? "bg-white/[0.1] text-[#EDEDEF]" : "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.06]"
              )}
              title="Open Project"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {isRecentOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#0a0a0c] border border-white/[0.08] rounded-lg shadow-xl overflow-hidden py-1">
                <button
                  onClick={() => {
                    onLoadProject?.();
                    setIsRecentOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#EDEDEF] hover:bg-white/[0.06] flex items-center gap-2"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Browse from Disk...
                </button>

                {recentProjects.length > 0 && (
                  <>
                    <div className="h-px bg-white/[0.06] my-1" />
                    <div className="px-3 py-1 text-[10px] text-[#8A8F98] font-medium uppercase tracking-wider flex justify-between items-center group">
                      Recent
                      <button
                        onClick={handleClearRecent}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity"
                        title="Clear Recent"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {recentProjects.map((proj, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onLoadRecentProject?.(proj.path);
                          setIsRecentOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#EDEDEF] hover:bg-white/[0.06] truncate group relative"
                        title={proj.path}
                      >
                        {proj.name}
                        <span className="block text-[10px] text-[#8A8F98] truncate opacity-50">{proj.path}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onSaveProject}
            className={cn(
              "px-2.5 py-1 flex items-center gap-1.5 rounded text-xs transition-colors",
              "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.06]"
            )}
            title="Save Project"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={onOpenSettings}
            className={cn(
              "p-1.5 flex items-center gap-1.5 rounded text-xs transition-colors ml-2",
              "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.06]"
            )}
            title="Settings"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right - Window Controls */}
      <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          className={cn(
            "w-10 h-7 flex items-center justify-center rounded-md transition-colors",
            "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.06]"
          )}
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={handleMaximize}
          className={cn(
            "w-10 h-7 flex items-center justify-center rounded-md transition-colors",
            "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.06]"
          )}
        >
          <Square className="w-3 h-3" />
        </button>

        <button
          onClick={handleClose}
          className={cn(
            "w-10 h-7 flex items-center justify-center rounded-md transition-colors",
            "text-[#8A8F98] hover:text-white hover:bg-red-500/80"
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
