import { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPreviewProps {
  file: File;
  className?: string;
}

export function AudioPreview({ file, className }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Create stable object URL for the file
  const audioUrl = useMemo(() => {
    try {
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }, [file]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle play/pause
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!audioRef.current || hasError) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Pause any other playing audio
      document.querySelectorAll('audio').forEach((audio) => {
        if (audio !== audioRef.current) {
          audio.pause();
        }
      });
      audioRef.current.play().catch(() => setHasError(true));
    }
  };

  // Update progress bar
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    setProgress(duration ? (currentTime / duration) * 100 : 0);
  };

  // Handle audio events
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };
  const handleError = () => setHasError(true);

  if (!audioUrl || hasError) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
          isPlaying
            ? "bg-[#5E6AD2] text-white"
            : "bg-white/[0.05] text-[#8A8F98] hover:bg-[#5E6AD2]/20 hover:text-[#5E6AD2]"
        )}
        title={isPlaying ? "Pause" : "Play preview"}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>

      {/* Mini Progress Bar (only visible when playing) */}
      {isPlaying && (
        <div className="w-16 h-1 bg-white/[0.1] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5E6AD2] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
