import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, FileMusic, X, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import { AudioPreview } from '@/components/AudioPreview';
import type { AudioFile } from '@/types';
import { cn } from '@/lib/utils';

interface ArrangeStepProps {
  files: AudioFile[];
  onFilesChange: (files: AudioFile[]) => void;
  onRemoveFile: (id: string) => void;
  onUpdateMetadata: (id: string, field: 'title' | 'artist', value: string) => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '--:--';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Sortable Track Item
function TrackItem({
  file,
  index,
  onRemove,
  onUpdateTitle
}: {
  file: AudioFile;
  index: number;
  onRemove: () => void;
  onUpdateTitle: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
        "bg-[#0a0a0c] border border-white/[0.06]",
        "hover:border-white/[0.12] group",
        isDragging && "opacity-30"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/[0.05] rounded-lg"
      >
        <GripVertical className="w-5 h-5 text-[#8A8F98]" />
      </button>

      {/* Track Number */}
      <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 flex items-center justify-center text-[#5E6AD2] font-semibold text-sm">
        {index + 1}
      </div>

      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <FileMusic className="w-5 h-5 text-[#8A8F98]" />
      </div>

      {/* Audio Preview */}
      <AudioPreview file={file.file} />

      {/* Title Input */}
      <div className="flex-1">
        <Input
          value={file.metadata.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="h-9 bg-transparent border-transparent text-[#EDEDEF] hover:bg-white/[0.03] focus:bg-[#0F0F12] focus:border-[#5E6AD2] rounded-lg transition-all"
          placeholder="Track title..."
        />
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1 text-[#8A8F98] text-sm font-mono">
        <Clock className="w-3.5 h-3.5" />
        {formatDuration(file.metadata.duration)}
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

// Drag Overlay Item (ghost while dragging)
function DragOverlayItem({ file, index }: { file: AudioFile; index: number }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl",
        "bg-[#0a0a0c] border-2 border-[#5E6AD2]",
        "shadow-[0_0_30px_rgba(94,106,210,0.4)]",
        "transform rotate-2 scale-105"
      )}
    >
      <div className="p-1">
        <GripVertical className="w-5 h-5 text-[#5E6AD2]" />
      </div>

      <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/20 border border-[#5E6AD2]/50 flex items-center justify-center text-[#5E6AD2] font-semibold text-sm">
        {index + 1}
      </div>

      <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 flex items-center justify-center">
        <FileMusic className="w-5 h-5 text-[#5E6AD2]" />
      </div>

      <div className="flex-1 text-[#EDEDEF] font-medium truncate">
        {file.metadata.title}
      </div>

      <div className="flex items-center gap-1 text-[#5E6AD2] text-sm font-mono">
        <Clock className="w-3.5 h-3.5" />
        {formatDuration(file.metadata.duration)}
      </div>
    </div>
  );
}

export function ArrangeStep({ files, onFilesChange, onRemoveFile, onUpdateMetadata, onNext, onBack, currentStep }: ArrangeStepProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      onFilesChange(arrayMove(files, oldIndex, newIndex));
    }
  };

  const activeFile = activeId ? files.find(f => f.id === activeId) : null;
  const activeIndex = activeId ? files.findIndex(f => f.id === activeId) : -1;

  const totalDuration = files.reduce((acc, f) => acc + (f.metadata.duration || 0), 0);
  const formatTotalDuration = () => {
    const hours = Math.floor(totalDuration / 3600);
    const mins = Math.floor((totalDuration % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex flex-col px-8 py-4 overflow-hidden"
    >
      {/* Header Row - Title + Step Indicator */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold gradient-text mb-2">Arrange Chapters</h1>
          <p className="text-[#8A8F98]">
            Drag to reorder. Edit track titles for chapter names.
          </p>
        </div>
        <StepIndicator currentStep={currentStep} totalSteps={4} labels={['Upload', 'Arrange', 'Details', 'Export']} />
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-sm">
          <FileMusic className="w-4 h-4 text-[#5E6AD2]" />
          <span className="text-[#EDEDEF]">{files.length} tracks</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-[#5E6AD2]" />
          <span className="text-[#EDEDEF]">{formatTotalDuration()} total</span>
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence>
              {files.map((file, index) => (
                <TrackItem
                  key={file.id}
                  file={file}
                  index={index}
                  onRemove={() => onRemoveFile(file.id)}
                  onUpdateTitle={(value) => onUpdateMetadata(file.id, 'title', value)}
                />
              ))}
            </AnimatePresence>
          </SortableContext>

          {/* Drag Overlay - the visible ghost */}
          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {activeFile ? (
              <DragOverlayItem file={activeFile} index={activeIndex} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 mt-4 border-t border-white/[0.06]">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={onNext}
          className={cn(
            "px-6 font-semibold rounded-lg transition-all duration-200",
            "bg-[#5E6AD2] hover:bg-[#6872D9] text-white",
            "shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
