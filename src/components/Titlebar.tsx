import { Minus, Square, X, Save, FolderOpen, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRequiresPro } from '@/lib/license-store';

interface TitlebarProps {
  onSaveProject?: () => void;
  onLoadProject?: () => void;
}

export function Titlebar({ onSaveProject, onLoadProject }: TitlebarProps) {
  const requiresPro = useRequiresPro('save_project');

  const handleMinimize = () => {
    // @ts-expect-error Electron IPC
    window.electron?.minimize?.();
  };

  const handleMaximize = () => {
    // @ts-expect-error Electron IPC
    window.electron?.maximize?.();
  };

  const handleClose = () => {
    // @ts-expect-error Electron IPC
    window.electron?.close?.();
  };

  return (
    <div
      className="h-10 flex items-center justify-between px-4 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left - App Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-[#8A8F98]">ADB Binder</h1>

        {/* Project Buttons */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={onLoadProject}
            className={cn(
              "px-2.5 py-1 flex items-center gap-1.5 rounded text-xs transition-colors",
              "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.06]"
            )}
            title="Open Project"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
            {requiresPro && <Lock className="w-3 h-3 text-amber-400" />}
          </button>
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
            {requiresPro && <Lock className="w-3 h-3 text-amber-400" />}
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
