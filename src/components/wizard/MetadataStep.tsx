import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  X,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  Tags,
  Loader2,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import type { BookMetadata } from '@/components/MetadataPanel';
import { cn } from '@/lib/utils';
import { autoFillBookMetadata } from '@/lib/open-library';
import type { AudioFile } from '@/types';

interface MetadataStepProps {
  files: AudioFile[];
  metadata: BookMetadata;
  onChange: (metadata: BookMetadata) => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
}

export function MetadataStep({ files, metadata, onChange, onNext, onBack, currentStep }: MetadataStepProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDescription, setShowDescription] = useState(!!metadata.description);
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [artworkLoading, setArtworkLoading] = useState(false);

  // Smart Artwork Detection
  const handleDetectArtwork = async () => {
    // Get file paths from audio files
    const filePaths = files.map(f => (f.file as any).path).filter(Boolean);
    if (filePaths.length === 0) return;

    setArtworkLoading(true);
    try {
      // @ts-expect-error Electron IPC
      const result = await window.electron.audio.detectArtwork(filePaths);
      if (result.found && result.data) {
        onChange({ ...metadata, coverData: result.data });
      }
    } catch (error) {
      console.error('Artwork detection failed:', error);
    } finally {
      setArtworkLoading(false);
    }
  };

  const onCoverDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ ...metadata, coverData: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }, [metadata, onChange]);

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({
    onDrop: onCoverDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
  });

  const handleSwap = () => {
    onChange({ ...metadata, title: metadata.author, author: metadata.title });
  };

  const handleAutoFill = async () => {
    const query = metadata.title || 'untitled';
    if (!query.trim()) return;

    setAutoFillLoading(true);
    try {
      const result = await autoFillBookMetadata(query);
      if (result) {
        onChange({
          ...metadata,
          title: result.title || metadata.title,
          subtitle: result.subtitle,
          author: result.author || metadata.author,
          year: result.year,
          description: result.description,
          tags: result.tags,
          publisher: result.publisher,
          isbn: result.isbn,
          coverData: result.coverData || metadata.coverData,
        });
        // Show description section if we got one
        if (result.description) {
          setShowDescription(true);
        }
      }
    } catch (error) {
      console.error('Auto-fill failed:', error);
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({
      ...metadata,
      tags: (metadata.tags || []).filter(t => t !== tagToRemove)
    });
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
          <h1 className="text-3xl font-semibold gradient-text mb-2">Book Details</h1>
          <p className="text-[#8A8F98]">
            Add metadata that will be embedded in your audiobook.
          </p>
        </div>
        <StepIndicator currentStep={currentStep} totalSteps={4} labels={['Upload', 'Arrange', 'Details', 'Export']} />
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-2 space-y-6">
        {/* Basic Info Section */}
        <div className="flex gap-6">
          {/* Cover Art */}
          <div className="flex-shrink-0">
            <Label className="text-xs text-[#8A8F98] mb-2 flex items-center gap-1.5">
              Cover Art
            </Label>

            {/* Cover Upload Area */}
            <div
              {...getCoverRootProps()}
              className={cn(
                "w-40 h-40 rounded-2xl border-2 border-dashed cursor-pointer",
                "flex items-center justify-center overflow-hidden transition-all duration-200",
                isCoverDragActive
                  ? "border-[#5E6AD2] bg-[#5E6AD2]/10"
                  : "border-white/[0.08] hover:border-[#5E6AD2]/30 hover:bg-white/[0.02]"
              )}
            >
              <input {...getCoverInputProps()} />
              {metadata.coverData ? (
                <div className="relative w-full h-full group">
                  <img
                    src={metadata.coverData}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ ...metadata, coverData: undefined });
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-10 h-10 mx-auto text-[#8A8F98] mb-2" />
                  <span className="text-sm text-[#8A8F98]">
                    {isCoverDragActive ? "Drop image" : "Add Cover"}
                  </span>
                </div>
              )}
            </div>

            {/* Smart Artwork Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDetectArtwork}
              disabled={artworkLoading || files.length === 0}
              className="mt-2 text-xs text-[#8A8F98] hover:text-[#EDEDEF] w-full flex items-center justify-center gap-1.5"
            >
              {artworkLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
              <span>Smart Artwork</span>
            </Button>
          </div>

          {/* Form Fields */}
          <div className="flex-1 space-y-4">
            {/* Title Row with Auto-fill */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="title" className="text-xs text-[#8A8F98] mb-1.5 block">Title</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => onChange({ ...metadata, title: e.target.value })}
                  placeholder="Book title..."
                  className="h-11 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-xl text-lg"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwap}
                className="h-11 w-11 text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05]"
                title="Swap title and author"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              {/* Auto-fill Button */}
              <div className="relative">
                <Button
                  onClick={handleAutoFill}
                  disabled={autoFillLoading}
                  className={cn(
                    "h-11 px-4 rounded-xl font-medium transition-all duration-200",
                    "bg-gradient-to-r from-[#5E6AD2] to-[#7C3AED] hover:opacity-90 text-white"
                  )}
                >
                  {autoFillLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Auto-fill
                    </>
                  )}
                </Button>


              </div>
            </div>

            {/* Subtitle */}
            <div>
              <Label htmlFor="subtitle" className="text-xs text-[#8A8F98] mb-1.5 block">Subtitle</Label>
              <Input
                id="subtitle"
                value={metadata.subtitle || ''}
                onChange={(e) => onChange({ ...metadata, subtitle: e.target.value })}
                placeholder="Optional subtitle..."
                className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg"
              />
            </div>

            {/* Author & Narrator */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author" className="text-xs text-[#8A8F98] mb-1.5 block">Author</Label>
                <Input
                  id="author"
                  value={metadata.author}
                  onChange={(e) => onChange({ ...metadata, author: e.target.value })}
                  placeholder="Author name..."
                  className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="narrator" className="text-xs text-[#8A8F98] mb-1.5 block">Narrator</Label>
                <Input
                  id="narrator"
                  value={metadata.narrator || ''}
                  onChange={(e) => onChange({ ...metadata, narrator: e.target.value })}
                  placeholder="Narrator name..."
                  className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg"
                />
              </div>
            </div>

            {/* Series & Year */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="series" className="text-xs text-[#8A8F98] mb-1.5 block">Series</Label>
                <div className="flex gap-2">
                  <Input
                    id="series"
                    value={metadata.series || ''}
                    onChange={(e) => onChange({ ...metadata, series: e.target.value })}
                    placeholder="Series name..."
                    className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={metadata.seriesNumber || ''}
                    onChange={(e) => onChange({ ...metadata, seriesNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="#"
                    className="w-16 h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg text-center"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="year" className="text-xs text-[#8A8F98] mb-1.5 block">Year</Label>
                <Input
                  id="year"
                  value={metadata.year || ''}
                  onChange={(e) => onChange({ ...metadata, year: e.target.value })}
                  placeholder={new Date().getFullYear().toString()}
                  className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5E6AD2]" />
              <span className="text-sm font-medium text-[#EDEDEF]">Description</span>
              {metadata.description && (
                <span className="text-xs text-[#8A8F98]">
                  ({metadata.description.length} chars)
                </span>
              )}
            </div>
            {showDescription ? (
              <ChevronUp className="w-4 h-4 text-[#8A8F98]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8A8F98]" />
            )}
          </button>

          <AnimatePresence>
            {showDescription && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <textarea
                    value={metadata.description || ''}
                    onChange={(e) => onChange({ ...metadata, description: e.target.value })}
                    placeholder="Add a synopsis or description for this audiobook..."
                    rows={4}
                    className="w-full bg-[#0F0F12] border border-white/10 text-[#EDEDEF] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags Section */}
        {(metadata.tags && metadata.tags.length > 0) && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tags className="w-4 h-4 text-[#5E6AD2]" />
              <span className="text-sm font-medium text-[#EDEDEF]">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 text-[#5E6AD2] text-xs"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Section */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#5E6AD2]" />
              <span className="text-sm font-medium text-[#EDEDEF]">Advanced Metadata</span>
            </div>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-[#8A8F98]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8A8F98]" />
            )}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  {/* Genre & Publisher */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="genre" className="text-xs text-[#8A8F98] mb-1.5 block">Genre</Label>
                      <Input
                        id="genre"
                        value={metadata.genre}
                        onChange={(e) => onChange({ ...metadata, genre: e.target.value })}
                        placeholder="Audiobook"
                        className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="publisher" className="text-xs text-[#8A8F98] mb-1.5 block">Publisher</Label>
                      <Input
                        id="publisher"
                        value={metadata.publisher || ''}
                        onChange={(e) => onChange({ ...metadata, publisher: e.target.value })}
                        placeholder="Publisher name..."
                        className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* ISBN & Language */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="isbn" className="text-xs text-[#8A8F98] mb-1.5 block">ISBN</Label>
                      <Input
                        id="isbn"
                        value={metadata.isbn || ''}
                        onChange={(e) => onChange({ ...metadata, isbn: e.target.value })}
                        placeholder="978-..."
                        className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="language" className="text-xs text-[#8A8F98] mb-1.5 block">Language</Label>
                      <Input
                        id="language"
                        value={metadata.language || ''}
                        onChange={(e) => onChange({ ...metadata, language: e.target.value })}
                        placeholder="English"
                        className="h-10 bg-[#0F0F12] border-white/10 text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
