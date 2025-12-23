import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileAudio, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AUDIO_FORMATS, CONVERSION_PRESETS } from '@/lib/conversion-presets';
import type { AudioFormat } from '@/lib/conversion-presets';

interface ConversionFile {
  id: string;
  name: string;
  path: string;
  size: number;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  outputPath?: string;
  error?: string;
}

export function Converter() {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<AudioFormat>('M4B');
  const [bitrate, setBitrate] = useState('64k');
  const [converting, setConverting] = useState(false);

  // Handle file drop/select
  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: ConversionFile[] = Array.from(selectedFiles).map((file: any) => ({
      id: crypto.randomUUID(),
      name: file.name,
      path: file.path,
      size: file.size,
      status: 'pending' as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Remove file from queue
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Convert single file
  const convertFile = async (file: ConversionFile) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: 'converting' as const, progress: 0 } : f
        )
      );

      const result = await (window as any).electron.audio.convert({
        inputPath: file.path,
        outputFormat: targetFormat.toLowerCase(),
        bitrate,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
              ...f,
              status: result.success ? ('done' as const) : ('error' as const),
              progress: 100,
              outputPath: result.outputPath,
              error: result.error,
            }
            : f
        )
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: 'error' as const, error: (err as Error).message }
            : f
        )
      );
    }
  };

  // Convert all files
  const handleConvertAll = async () => {
    setConverting(true);
    const pendingFiles = files.filter((f) => f.status === 'pending');

    for (const file of pendingFiles) {
      await convertFile(file);
    }

    setConverting(false);
  };

  // Listen for progress events
  useEffect(() => {
    const handleProgress = (data: { inputPath: string; percent: number }) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.path === data.inputPath ? { ...f, progress: data.percent } : f
        )
      );
    };

    (window as any).electron?.ipcRenderer?.on('audio:convertProgress', (_: any, data: any) => {
      handleProgress(data);
    });

    return () => {
      (window as any).electron?.ipcRenderer?.removeAllListeners('audio:convertProgress');
    };
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Format Converter</h1>
        <p className="text-muted-foreground">
          Convert audio files between M4B, MP3, M4A, AAC, and FLAC formats
        </p>
      </div>

      {/* Format Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target-format">Target Format</Label>
          <Select
            value={targetFormat}
            onValueChange={(value) => setTargetFormat(value as AudioFormat)}
            disabled={converting}
          >
            <SelectTrigger id="target-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AUDIO_FORMATS).map(([key, format]) => (
                <SelectItem key={key} value={key}>
                  {format.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bitrate">Bitrate</Label>
          <Select value={bitrate} onValueChange={setBitrate} disabled={converting}>
            <SelectTrigger id="bitrate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONVERSION_PRESETS.map((preset) => (
                <SelectItem key={preset.bitrate || 'lossless'} value={preset.bitrate || 'lossless'}>
                  {preset.name} - {preset.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drop Zone */}
      <motion.div
        className="border-2 border-dashed border-border rounded-lg p-12 text-center space-y-4 relative overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = 'audio/*';
          input.onchange = (e: any) => handleFileSelect(e.target.files);
          input.click();
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
        <div>
          <p className="text-lg font-medium">Drop audio files here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>
      </motion.div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="flex-1 space-y-4 overflow-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Conversion Queue ({files.length} files)
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {doneCount} / {files.length} complete
              </span>
              <Button
                onClick={handleConvertAll}
                disabled={converting || pendingCount === 0}
                size="sm"
              >
                {converting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  `Convert All (${pendingCount})`
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {file.status === 'done' && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                        {file.status === 'converting' && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {file.status === 'pending' && (
                          <FileAudio className="w-5 h-5 text-muted-foreground" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatSize(file.size)}</span>
                          {file.status === 'done' && file.outputPath && (
                            <>
                              <span>→</span>
                              <span className="truncate" title={file.outputPath}>
                                {file.outputPath.split('/').pop()}
                              </span>
                            </>
                          )}
                          {file.status === 'error' && (
                            <>
                              <span>•</span>
                              <span className="text-red-500">{file.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {file.status !== 'converting' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {file.status === 'converting' && (
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#5E6AD2] transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
