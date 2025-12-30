import { motion } from 'framer-motion';
import { Disc, ArrowLeft, FileAudio, Clock, AlertTriangle, Apple, Music, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import type { AudioFile } from '@/types';
import type { BookMetadata } from '@/types';
import { cn, formatDuration } from '@/lib/utils';

type OutputFormat = 'm4b' | 'mp3' | 'aac';
type Bitrate = '64k' | '96k' | '128k' | '192k';

import { ProfileSelector } from '@/components/ProfileSelector';
import type { ConversionPreset, AudioFormat } from '@/lib/conversion-presets';

interface ExportStepProps {
  files: AudioFile[];
  metadata: BookMetadata;
  outputFormat: OutputFormat;
  bitrate: Bitrate;
  itunesCompatibility: boolean;
  processing: boolean;
  onFormatChange: (format: OutputFormat) => void;
  onBitrateChange: (bitrate: Bitrate) => void;
  onItunesCompatibilityChange: (enabled: boolean) => void;
  onExport: () => void;
  onBack: () => void;
  currentStep: number;
  // New props for Presets
  userPresets: ConversionPreset[];
  selectedPresetId: string;
  onPresetChange: (preset: ConversionPreset) => void;
  onSaveUserPreset: (preset: ConversionPreset) => void;
  onDeleteUserPreset: (presetId: string) => void;
  // Export Enhancements
  lastExportedPath: string | null;
  onReset: () => void;
  autoAddToLibrary: boolean;
  onAutoAddToLibraryChange: (enabled: boolean) => void;
  onAddToLibrary: (path: string) => Promise<{ success: boolean; error?: string }>;
  onStartDrag: (path: string) => void;
}

export function ExportStep({
  files,
  metadata,
  outputFormat,
  bitrate,
  itunesCompatibility,
  processing,
  onFormatChange,
  onBitrateChange,
  onItunesCompatibilityChange,
  onExport,
  onBack,
  currentStep,
  userPresets,
  selectedPresetId,
  onPresetChange,
  onSaveUserPreset,
  onDeleteUserPreset,
  lastExportedPath,
  onReset,
  autoAddToLibrary,
  onAutoAddToLibraryChange,
  onAddToLibrary,
  onStartDrag,
}: ExportStepProps) {
  const totalDuration = files.reduce((acc, f) => acc + (f.metadata.duration || 0), 0);

  const showMp3Warning = outputFormat === 'mp3' && files.length > 1;

  // Render Success View if valid path
  if (lastExportedPath) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center p-8"
      >
        <div className="w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          {/* Success Glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />

          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 ring-1 ring-green-500/20">
            <Check className="w-8 h-8 text-green-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Export Complete!</h2>
          <p className="text-[#8A8F98] mb-8">Your audiobook is ready.</p>

          {/* Draggable File Card */}
          <div
            draggable
            onDragStart={(e) => {
              e.preventDefault();
              onStartDrag(lastExportedPath);
            }}
            className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-xl mb-6 cursor-grab active:cursor-grabbing hover:bg-white/[0.05] transition-colors group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center text-[#5E6AD2]">
              <FileAudio className="w-6 h-6" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {metadata.title || 'Audiobook'}
              </div>
              <div className="text-xs text-[#8A8F98] truncate">
                {outputFormat.toUpperCase()} • {formatDuration(totalDuration, 'human')}
              </div>
            </div>
            <div className="text-xs text-[#8A8F98] opacity-0 group-hover:opacity-100 transition-opacity">
              Drag me
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button
              disabled={processing} // Reuse processing valid here? Probably fine.
              onClick={async () => {
                // Add to library manually
                await onAddToLibrary(lastExportedPath);
              }}
              variant="outline"
              className="w-full bg-transparent border-white/10 text-white hover:bg-white/5"
            >
              <Music className="w-4 h-4 mr-2" />
              Add to Music Library
            </Button>

            <Button
              onClick={onReset}
              className="w-full bg-[#5E6AD2] hover:bg-[#6872D9] text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start New Project
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Handle format change
  const handleFormatChange = (value: string) => {
    onFormatChange(value as OutputFormat);
    // Keep custom selection, don't auto-switch presets if manually changing options
  };

  // Handle bitrate change
  const handleBitrateChange = (value: string) => {
    onBitrateChange(value as Bitrate);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col px-8 py-4"
      >
        {/* Header Row - Title + Step Indicator */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold gradient-text mb-2">Export</h1>
            <p className="text-[#8A8F98]">
              Review your audiobook and create the final file.
            </p>
          </div>
          <StepIndicator currentStep={currentStep} totalSteps={4} labels={['Upload', 'Arrange', 'Details', 'Export']} />
        </div>

        {/* Centered Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Summary Card */}
          <div className="w-full max-w-lg p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_30px_rgba(0,0,0,0.3)]">
            {/* Book Preview */}
            <div className="flex gap-4 mb-6 pb-6 border-b border-white/[0.06]">
              {metadata.coverData ? (
                <img
                  src={metadata.coverData}
                  alt="Cover"
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#0a0a0c] border border-white/[0.06] flex items-center justify-center">
                  <FileAudio className="w-8 h-8 text-[#8A8F98]" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#EDEDEF] mb-1">
                  {metadata.title || 'Untitled Audiobook'}
                </h2>
                <p className="text-[#8A8F98] text-sm">
                  {metadata.author || 'Unknown Author'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-[#8A8F98]">
                  <span className="flex items-center gap-1">
                    <Disc className="w-3.5 h-3.5" />
                    {files.length} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(totalDuration, 'human')}
                  </span>
                </div>
              </div>
            </div>

            {/* Export Settings */}
            <div className="space-y-4">
              {/* Profile Selector */}
              <div>
                <Label className="text-xs text-[#8A8F98] mb-2 block">Output Profile</Label>
                <ProfileSelector
                  selectedPresetId={selectedPresetId}
                  onPresetChange={onPresetChange}
                  userPresets={userPresets}
                  onSaveUserPreset={onSaveUserPreset}
                  onDeleteUserPreset={onDeleteUserPreset}
                  currentSettings={{
                    format: outputFormat as AudioFormat,
                    bitrate: bitrate,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Format Select */}
                <div>
                  <Label className="text-xs text-[#8A8F98] mb-1.5 block">Format</Label>
                  <Select value={outputFormat} onValueChange={handleFormatChange}>
                    <SelectTrigger className="h-10 bg-[#0a0a0c] border-white/10 text-[#EDEDEF] rounded-lg focus:ring-1 focus:ring-[#5E6AD2]/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0c] border-white/10">
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="m4b">
                        <span className="flex items-center gap-2">
                          M4B (Audiobook)
                        </span>
                      </SelectItem>
                      <SelectItem value="aac">
                        <span className="flex items-center gap-2">
                          AAC
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bitrate Select */}
                <div>
                  <Label className="text-xs text-[#8A8F98] mb-1.5 block">Bitrate</Label>
                  <Select value={bitrate} onValueChange={handleBitrateChange}>
                    <SelectTrigger className="h-10 bg-[#0a0a0c] border-white/10 text-[#EDEDEF] rounded-lg focus:ring-1 focus:ring-[#5E6AD2]/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0c] border-white/10">
                      <SelectItem value="64k">64 kbps</SelectItem>
                      <SelectItem value="96k">
                        <span className="flex items-center gap-2">
                          96 kbps
                        </span>
                      </SelectItem>
                      <SelectItem value="128k">
                        <span className="flex items-center gap-2">
                          128 kbps
                        </span>
                      </SelectItem>
                      <SelectItem value="192k">
                        <span className="flex items-center gap-2">
                          192 kbps
                        </span>
                      </SelectItem>
                      <SelectItem value="256k">
                        <span className="flex items-center gap-2">
                          256 kbps
                        </span>
                      </SelectItem>
                      <SelectItem value="320k">
                        <span className="flex items-center gap-2">
                          320 kbps
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* iTunes Compatibility Toggle */}
              {outputFormat === 'm4b' && (
                <div
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    itunesCompatibility
                      ? "bg-[#5E6AD2]/10 border-[#5E6AD2]/30"
                      : "bg-white/[0.02] border-white/10 hover:border-white/20"
                  )}
                  onClick={() => onItunesCompatibilityChange(!itunesCompatibility)}
                >
                  <div className={cn(
                    "mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    itunesCompatibility
                      ? "bg-[#5E6AD2] border-[#5E6AD2]"
                      : "border-[#8A8F98]"
                  )}>
                    {itunesCompatibility && <Disc className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Apple className="w-4 h-4 text-[#EDEDEF]" />
                      <span className="text-sm font-medium text-[#EDEDEF]">iTunes Compatibility Mode</span>
                    </div>
                    <p className="text-xs text-[#8A8F98] leading-relaxed">
                      Optimizes file for Apple devices (iPod, older iTunes) by moving metadata to the start. Recommended for very long books.
                    </p>
                  </div>
                </div>
              )}

              {/* Auto Add to Library Toggle */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <Checkbox
                  id="auto-add"
                  checked={autoAddToLibrary}
                  onCheckedChange={(checked) => onAutoAddToLibraryChange(checked === true)}
                  className="mt-1 border-white/20 data-[state=checked]:bg-[#5E6AD2] data-[state=checked]:border-[#5E6AD2]"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="auto-add" className="text-sm font-medium text-white cursor-pointer">
                    Automatically add to Music Library
                  </Label>
                  <p className="text-xs text-[#8A8F98]">
                    Import the file into iTunes/Music app immediately after export.
                  </p>
                </div>
              </div>



              {/* MP3 Warning */}
              {showMp3Warning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>MP3 chapters have limited support in audiobook players (works in podcast apps)</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 mt-4 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={processing}
            className="text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            size="lg"
            disabled={processing}
            onClick={onExport}
            className={cn(
              "px-8 font-semibold rounded-lg transition-all duration-300",
              "bg-[#5E6AD2] hover:bg-[#6872D9] text-white",
              "shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_8px_30px_rgba(94,106,210,0.4)]",
              "hover:shadow-[0_0_0_1px_rgba(94,106,210,0.6),0_12px_40px_rgba(94,106,210,0.5)]",
              "hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            <Disc className={cn("w-5 h-5 mr-2", processing && "animate-spin")} />
            {processing ? 'Creating...' : 'Create Audiobook'}
          </Button>
        </div>
      </motion.div>

    </>
  );
}
