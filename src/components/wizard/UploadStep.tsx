import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileMusic, ArrowRight, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import type { AudioFile } from '@/types';
import { cn } from '@/lib/utils';

interface UploadStepProps {
  files: AudioFile[];
  onFilesAdded: (newFiles: AudioFile[]) => void;
  onRemoveFile: (id: string) => void;
  onNext: () => void;
  currentStep: number;
}

export function UploadStep({ files, onFilesAdded, onRemoveFile, onNext, currentStep }: UploadStepProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: AudioFile[] = await Promise.all(
      acceptedFiles.map(async (file) => ({
        id: crypto.randomUUID(),
        file,
        path: (file as any).path || '',
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: '',
          album: '',
          duration: 0,
        },
        status: 'pending' as const,
      }))
    );
    onFilesAdded(newFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg'],
    },
    multiple: true,
  });

  const hasFiles = files.length > 0;

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
          <h1 className="text-3xl font-semibold gradient-text mb-2">
            {hasFiles ? 'Files Ready' : 'Add Audio Files'}
          </h1>
          <p className="text-[#8A8F98]">
            {hasFiles
              ? `${files.length} file${files.length !== 1 ? 's' : ''} selected. Add more or continue.`
              : 'Drop your audio files to get started.'
            }
          </p>
        </div>
        <StepIndicator currentStep={currentStep} totalSteps={4} labels={['Upload', 'Arrange', 'Details', 'Export']} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "flex-1 rounded-2xl border-2 border-dashed cursor-pointer",
            "flex flex-col items-center justify-center gap-4 transition-all duration-300",
            "bg-gradient-to-b from-white/[0.02] to-transparent min-h-[200px]",
            isDragActive
              ? "border-[#5E6AD2] bg-[#5E6AD2]/10 scale-[1.01] shadow-[0_0_60px_rgba(94,106,210,0.15)]"
              : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.01]",
            hasFiles && "flex-none h-32" // Shrink when files are present
          )}
        >
          <input {...getInputProps()} />

          <motion.div
            className={cn(
              "p-4 rounded-2xl transition-all duration-300",
              isDragActive
                ? "bg-[#5E6AD2] text-white scale-110"
                : "bg-[#0a0a0c] border border-white/[0.06] text-[#8A8F98]",
              hasFiles && "p-3"
            )}
            animate={{ scale: isDragActive ? 1.1 : 1 }}
          >
            <Upload className={cn("w-8 h-8", hasFiles && "w-6 h-6")} />
          </motion.div>

          <div className="text-center">
            <p className={cn("text-[#EDEDEF] font-medium", hasFiles ? "text-sm" : "text-lg")}>
              {isDragActive ? "Drop files here..." : hasFiles ? "Drop more files" : "Drop audio files here"}
            </p>
            {!hasFiles && (
              <p className="text-[#8A8F98] text-sm mt-1">
                MP3, AAC, M4A, WAV, FLAC
              </p>
            )}
          </div>
        </div>

        {/* File List */}
        {hasFiles && (
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            <AnimatePresence>
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0c] border border-white/[0.06] hover:border-white/[0.12] group transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center">
                    <FileMusic className="w-4 h-4 text-[#5E6AD2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#EDEDEF] truncate">{file.metadata.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#8A8F98] font-mono">
                    <Clock className="w-3 h-3" />
                    {formatDuration(file.metadata.duration)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onRemoveFile(file.id); }}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Navigation - CONSISTENT with other pages */}
      <div className="flex justify-between items-center pt-6 mt-4 border-t border-white/[0.06]">
        <div className="text-sm text-[#8A8F98]">
          {hasFiles && `${files.length} file${files.length !== 1 ? 's' : ''} ready`}
        </div>

        <Button
          disabled={!hasFiles}
          onClick={onNext}
          className={cn(
            "px-6 font-semibold rounded-lg transition-all duration-200",
            "bg-[#5E6AD2] hover:bg-[#6872D9] text-white",
            "shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]",
            "hover:scale-[1.02] active:scale-[0.98]",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
          )}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
