import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Image, RefreshCw, X, ChevronDown, ChevronUp, Hash, Building2 } from 'lucide-react';

import type { BookMetadata } from '@/types';

interface MetadataPanelProps {
  metadata: BookMetadata;
  onChange: (metadata: BookMetadata) => void;
  collapsed?: boolean;
}

export function MetadataPanel({ metadata, onChange, collapsed = false }: MetadataPanelProps) {
  const onCoverDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Get file path for Electron
    const filePath = window.electron?.audio?.getPathForFile?.(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        ...metadata,
        coverPath: filePath || file.name,
        coverData: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }, [metadata, onChange]);

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({
    onDrop: onCoverDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
  });

  // Swap title and author
  const handleSwap = () => {
    onChange({
      ...metadata,
      title: metadata.author,
      author: metadata.title,
    });
  };

  const handleClearCover = () => {
    onChange({
      ...metadata,
      coverPath: undefined,
      coverData: undefined,
    });
  };

  if (collapsed) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.02] border-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4)] rounded-2xl">
      <div className="flex gap-4">
        {/* Cover Art Drop Zone */}
        <div className="flex-shrink-0">
          <div
            {...getCoverRootProps()}
            className={`
              w-32 h-32 rounded-xl border border-dashed cursor-pointer
              flex items-center justify-center overflow-hidden
              transition-all duration-200
              ${isCoverDragActive
                ? 'border-[#5E6AD2] bg-[#5E6AD2]/10'
                : 'border-white/[0.08] hover:border-[#5E6AD2]/30 hover:bg-white/[0.05]'
              }
            `}>
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
                    handleClearCover();
                  }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="text-center p-2">
                <Image className="w-8 h-8 mx-auto text-[#8A8F98] mb-1" />
                <span className="text-xs text-white/40">
                  {isCoverDragActive ? 'Drop image' : 'Add Cover'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="flex-1 space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="title" className="text-xs text-[#8A8F98]">Title</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => onChange({ ...metadata, title: e.target.value })}
                placeholder="Book title..."
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05]"
              onClick={handleSwap}
              title="Swap title and author"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="author" className="text-xs text-[#8A8F98]">Author</Label>
              <Input
                id="author"
                value={metadata.author}
                onChange={(e) => onChange({ ...metadata, author: e.target.value })}
                placeholder="Author name..."
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
            <div>
              <Label htmlFor="genre" className="text-xs text-[#8A8F98]">Genre</Label>
              <Input
                id="genre"
                value={metadata.genre}
                onChange={(e) => onChange({ ...metadata, genre: e.target.value })}
                placeholder="Audiobook"
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="narrator" className="text-xs text-[#8A8F98]">Narrator</Label>
              <Input
                id="narrator"
                value={metadata.narrator || ''}
                onChange={(e) => onChange({ ...metadata, narrator: e.target.value })}
                placeholder="Optional..."
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
            <div>
              <Label htmlFor="year" className="text-xs text-[#8A8F98]">Year</Label>
              <Input
                id="year"
                value={metadata.year || ''}
                onChange={(e) => onChange({ ...metadata, year: e.target.value })}
                placeholder={new Date().getFullYear().toString()}
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details Section */}
      <ExpandedDetails metadata={metadata} onChange={onChange} />
    </Card>
  );
}

/**
 * Collapsible section for advanced metadata fields
 */
function ExpandedDetails({
  metadata,
  onChange
}: {
  metadata: BookMetadata;
  onChange: (m: BookMetadata) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any advanced fields have values
  const hasAdvancedData = !!(metadata.series || metadata.publisher || metadata.description || metadata.asin);

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-[#8A8F98] hover:text-[#EDEDEF] transition-colors w-full"
      >
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span>More Details</span>
        {hasAdvancedData && !isExpanded && (
          <span className="ml-auto text-[#5E6AD2] text-[10px]">Has data</span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Series Row */}
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <div>
              <Label htmlFor="series" className="text-xs text-[#8A8F98] flex items-center gap-1">
                Series
              </Label>
              <Input
                id="series"
                value={metadata.series || ''}
                onChange={(e) => onChange({ ...metadata, series: e.target.value })}
                placeholder="e.g. Harry Potter"
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
            <div>
              <Label htmlFor="seriesNumber" className="text-xs text-[#8A8F98] flex items-center gap-1">
                <Hash className="w-3 h-3" /> #
              </Label>
              <Input
                id="seriesNumber"
                type="number"
                min="1"
                value={metadata.seriesNumber || ''}
                onChange={(e) => onChange({ ...metadata, seriesNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="1"
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
          </div>

          {/* Publisher & Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="publisher" className="text-xs text-[#8A8F98] flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Publisher
              </Label>
              <Input
                id="publisher"
                value={metadata.publisher || ''}
                onChange={(e) => onChange({ ...metadata, publisher: e.target.value })}
                placeholder="Optional..."
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
            <div>
              <Label htmlFor="language" className="text-xs text-[#8A8F98]">Language</Label>
              <Input
                id="language"
                value={metadata.language || ''}
                onChange={(e) => onChange({ ...metadata, language: e.target.value })}
                placeholder="English"
                className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30"
              />
            </div>
          </div>

          {/* ASIN */}
          <div>
            <Label htmlFor="asin" className="text-xs text-[#8A8F98]">ASIN</Label>
            <Input
              id="asin"
              value={metadata.asin || ''}
              onChange={(e) => onChange({ ...metadata, asin: e.target.value })}
              placeholder="B0XXXXXX (Audible ID)"
              className="h-9 rounded-lg border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 font-mono text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-xs text-[#8A8F98]">Description</Label>
            <textarea
              id="description"
              value={metadata.description || ''}
              onChange={(e) => onChange({ ...metadata, description: e.target.value })}
              placeholder="Book description or summary..."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-[#0F0F12] text-[#EDEDEF] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 p-2 text-sm resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultMetadata: BookMetadata = {
  title: '',
  author: '',
  genre: 'Audiobook',
};
