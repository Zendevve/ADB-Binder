import { useState } from 'react';
import { motion } from 'framer-motion';
import { Disc, ArrowLeft, FileAudio, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import type { AudioFile } from '@/types';
import type { BookMetadata } from '@/components/MetadataPanel';
import { cn } from '@/lib/utils';

type OutputFormat = 'm4b' | 'mp3' | 'aac';
type Bitrate = '64k' | '96k' | '128k' | '192k';

interface ExportStepProps {
  files: AudioFile[];
  metadata: BookMetadata;
  outputFormat: OutputFormat;
  bitrate: Bitrate;
  processing: boolean;
  onFormatChange: (format: OutputFormat) => void;
  onBitrateChange: (bitrate: Bitrate) => void;
  onExport: () => void;
  onBack: () => void;
  currentStep: number;
}

export function ExportStep({
  files,
  metadata,
  outputFormat,
  bitrate,
  processing,
  onFormatChange,
  onBitrateChange,
  onExport,
  onBack,
  currentStep,
}: ExportStepProps) {
  const totalDuration = files.reduce((acc, f) => acc + (f.metadata.duration || 0), 0);

  const formatDuration = () => {
    const hours = Math.floor(totalDuration / 3600);
    const mins = Math.floor((totalDuration % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  const showMp3Warning = outputFormat === 'mp3' && files.length > 1;

  // Handle format change
  const handleFormatChange = (value: string) => {
    onFormatChange(value as OutputFormat);
    setSelectedPreset('custom');
  };

  // Handle bitrate change
  const handleBitrateChange = (value: string) => {
    onBitrateChange(value as Bitrate);
    setSelectedPreset('custom');
  };

  // Quality presets
  type QualityPreset = 'spoken' | 'high' | 'custom';
  const [selectedPreset, setSelectedPreset] = useState<QualityPreset>('spoken');

  const handlePresetChange = (preset: QualityPreset) => {
    setSelectedPreset(preset);

    switch (preset) {
      case 'spoken':
        // Spoken Word: MP3 with lower bitrate, optimized for voice
        onFormatChange('mp3');
        onBitrateChange('64k');
        break;
      case 'high':
        // High Quality: M4B with higher bitrate
        onFormatChange('m4b');
        onBitrateChange('128k');
        break;
      case 'custom':
        // Leave current settings
        break;
    }
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
                    {formatDuration()}
                  </span>
                </div>
              </div>
            </div>

            {/* Export Settings */}
            <div className="space-y-4">
              {/* Quality Presets */}
              <div>
                <Label className="text-xs text-[#8A8F98] mb-2 block">Quality Preset</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePresetChange('spoken')}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                      selectedPreset === 'spoken'
                        ? "bg-[#5E6AD2]/20 border-[#5E6AD2] text-[#5E6AD2]"
                        : "bg-white/[0.02] border-white/10 text-[#8A8F98] hover:border-white/20"
                    )}
                  >
                    Spoken Word
                  </button>
                  <button
                    onClick={() => handlePresetChange('high')}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                      selectedPreset === 'high'
                        ? "bg-[#5E6AD2]/20 border-[#5E6AD2] text-[#5E6AD2]"
                        : "bg-white/[0.02] border-white/10 text-[#8A8F98] hover:border-white/20"
                    )}
                  >
                    High Quality
                  </button>
                  <button
                    onClick={() => handlePresetChange('custom')}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                      selectedPreset === 'custom'
                        ? "bg-[#5E6AD2]/20 border-[#5E6AD2] text-[#5E6AD2]"
                        : "bg-white/[0.02] border-white/10 text-[#8A8F98] hover:border-white/20"
                    )}
                  >
                    Custom
                  </button>
                </div>
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
                    </SelectContent>
                  </Select>
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
