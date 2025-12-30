import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, FileAudio, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AUDIO_FORMATS } from '@/lib/conversion-presets';
import type { AudioFormat } from '@/lib/conversion-presets';
import type { ConversionFile } from '@/types';



export function Converter() {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<AudioFormat>('M4B');
  const [bitrate, setBitrate] = useState('64k');
  const [converting, setConverting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Handle file drop/select
  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: ConversionFile[] = Array.from(selectedFiles).map((file: any) => ({
      id: crypto.randomUUID(),
      name: file.name,
      path: window.electron.audio.getPathForFile(file),
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
    setPaused(false);
    setStartTime(Date.now());
    const pendingFiles = files.filter((f) => f.status === 'pending');

    let index = 0;
    for (const file of pendingFiles) {
      // Check for pause
      if (paused) break;

      await convertFile(file);
      index++;
    }

    setConverting(false);
    setStartTime(null);

    // Show completion toast
    const results = files.filter(f => pendingFiles.some(p => p.id === f.id));
    const successCount = results.filter(f => f.status === 'done').length;
    const errorCount = results.filter(f => f.status === 'error').length;

    if (errorCount === 0 && successCount > 0) {
      toast.success(`Converted ${successCount} file${successCount !== 1 ? 's' : ''}`);
    } else if (successCount > 0) {
      toast.warning(`Converted ${successCount} files, ${errorCount} failed`);
    }
  };

  // Retry failed files
  const handleRetryFailed = async () => {
    setFiles(prev => prev.map(f =>
      f.status === 'error' ? { ...f, status: 'pending' as const, error: undefined, progress: 0 } : f
    ));
  };

  // Clear completed files
  const handleClearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'done'));
  };

  // Clear all files
  const handleClearAll = () => {
    if (!converting) {
      setFiles([]);
    }
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
  const errorCount = files.filter((f) => f.status === 'error').length;
  const convertingCount = files.filter((f) => f.status === 'converting').length;

  // Calculate ETA
  const getEta = () => {
    if (!startTime || !converting || doneCount === 0) return null;
    const elapsed = Date.now() - startTime;
    const avgPerFile = elapsed / (doneCount + convertingCount);
    const remaining = pendingCount * avgPerFile;
    const minutes = Math.ceil(remaining / 60000);
    return minutes > 0 ? `~${minutes} min remaining` : 'Almost done...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex flex-col p-6 space-y-6"
    >
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
              <SelectItem value="64k">64 kbps (Voice)</SelectItem>
              <SelectItem value="96k">96 kbps (Standard)</SelectItem>
              <SelectItem value="128k">128 kbps (High)</SelectItem>
              <SelectItem value="192k">192 kbps (Very High)</SelectItem>
              <SelectItem value="256k">256 kbps (Music)</SelectItem>
              <SelectItem value="320k">320 kbps (Max)</SelectItem>
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
            <div>
              <h2 className="text-lg font-semibold">
                Conversion Queue ({files.length} files)
              </h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="text-green-500">{doneCount} done</span>
                {errorCount > 0 && <span className="text-red-500">{errorCount} failed</span>}
                {pendingCount > 0 && <span>{pendingCount} pending</span>}
                {converting && getEta() && (
                  <span className="text-[#5E6AD2]">{getEta()}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Clear Buttons */}
              {!converting && doneCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCompleted}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Done
                </Button>
              )}
              {!converting && errorCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetryFailed}
                  className="text-orange-400 hover:text-orange-300"
                >
                  Retry Failed
                </Button>
              )}
              {!converting && files.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-red-400 hover:text-red-300"
                >
                  Clear All
                </Button>
              )}

              {/* Convert Button */}
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
    </motion.div>
  );
}
