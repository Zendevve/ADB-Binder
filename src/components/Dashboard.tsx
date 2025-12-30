import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Titlebar } from '@/components/Titlebar';
import { UploadStep } from '@/components/wizard/UploadStep';
import { ArrangeStep } from '@/components/wizard/ArrangeStep';
import { MetadataStep } from '@/components/wizard/MetadataStep';
import { ExportStep } from '@/components/wizard/ExportStep';
import { Converter } from '@/components/Converter';
import { ChapterSplitter } from '@/components/ChapterSplitter';
import { defaultMetadata } from '@/components/MetadataPanel';
import { AudioAnalyzer } from '@/lib/audio-analyzer';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { SettingsModal } from '@/components/SettingsModal';
import type { AudioFile, BookMetadata, UserSettings } from '@/types';
import { type ConversionPreset, DEFAULT_PRESET_ID } from '@/lib/conversion-presets';

type OutputFormat = 'm4b' | 'mp3' | 'aac';
type Bitrate = '64k' | '96k' | '128k' | '192k';

export default function Dashboard() {
  // Tool mode
  const [toolMode, setToolMode] = useState<'binder' | 'converter' | 'splitter'>('binder');

  // Step state (for Binder)
  const [currentStep, setCurrentStep] = useState(1);

  // Data state
  // Undo/Redo Hook for Files
  const {
    state: files,
    set: setFiles,
    undo,
    redo,
    reset: resetFiles
  } = useUndoRedo<AudioFile[]>([]);

  const [metadata, setMetadata] = useState<BookMetadata>(defaultMetadata);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');
  const [bitrate, setBitrate] = useState<Bitrate>('64k');
  const [itunesCompatibility, setItunesCompatibility] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, timemark: '' });
  const [lastExportedPath, setLastExportedPath] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({});

  // Tracking refs for cleanup
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      filesRef.current.forEach(f => {
        if (f.metadata?.cover?.startsWith('blob:')) {
          URL.revokeObjectURL(f.metadata.cover);
        }
      });
    };
  }, []);

  // Load Settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.electron?.settings) {
          const data = await window.electron.settings.read();
          setUserSettings(data);
          if (data.defaultOutputFormat) setOutputFormat(data.defaultOutputFormat as OutputFormat);
          if (data.defaultBitrate) setBitrate(data.defaultBitrate as Bitrate);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if input is focused to avoid conflicts
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleSaveSettings = useCallback(async (newSettings: UserSettings) => {
    try {
      const result = await window.electron.settings.write(newSettings);
      if (result.success) {
        setUserSettings(newSettings);
        if (newSettings.defaultOutputFormat) setOutputFormat(newSettings.defaultOutputFormat as OutputFormat);
        if (newSettings.defaultBitrate) setBitrate(newSettings.defaultBitrate as Bitrate);
      }
    } catch (e) {
      console.error('Failed to save settings', e);
      throw e;
    }
  }, []);



  // File handlers
  const addFiles = useCallback(async (newFiles: AudioFile[]) => {
    // Analyze files for duration
    const analyzedFiles = await Promise.all(
      newFiles.map(async (file) => {
        try {
          const metadata = await AudioAnalyzer.getMetadata(file.file);
          return { ...file, metadata: { ...file.metadata, duration: metadata.duration } };
        } catch {
          return file;
        }
      })
    );
    setFiles((prev) => [...prev, ...analyzedFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.metadata?.cover?.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.metadata.cover);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const updateMetadata = useCallback((id: string, field: 'title' | 'artist', value: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, metadata: { ...f.metadata, [field]: value } } : f
      )
    );
  }, []);

  // Navigation
  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // Set up progress listener
  useEffect(() => {
    window.electron?.audio?.onProgress?.((p: { percent: number; timemark: string }) => {
      setProgress(p);
    });

    return () => {
      window.electron?.audio?.removeProgressListener?.();
    };
  }, []);

  // Process handler
  const handleProcess = useCallback(async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setLastExportedPath(null);
    setProgress({ percent: 0, timemark: '' });

    try {
      const result = await (window as any).electron.audio.process({
        files: files.map((f) => ({
          path: (f.file as any).path || '',
          title: f.metadata.title,
          duration: f.metadata.duration || 0,
        })),
        bookMetadata: {
          title: metadata.title,
          author: metadata.author,
          genre: metadata.genre || 'Audiobook',
          year: metadata.year,
          narrator: metadata.narrator,
        },
        coverPath: metadata.coverData, // Pass cover data
        outputFormat,
        bitrate,
        defaultOutputDirectory: userSettings.defaultOutputDirectory,
        itunesCompatibility,
      });

      if (result.success) {
        toast.success('Audiobook created successfully!', {
          description: `Saved to: ${result.outputPath}`,
        });

        setLastExportedPath(result.outputPath);

        // Auto-add to library if enabled
        if (userSettings.autoAddToLibrary && result.outputPath && window.electron?.files?.addToItunes) {
          window.electron.files.addToItunes(result.outputPath)
            .then(res => {
              if (res.success) toast.success('Added to Music Library');
              else toast.error('Failed to add to Library', { description: res.error });
            });
        }
      } else if (result.cancelled) {
        toast.info('Export cancelled');
      }
      setProcessing(false);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to create audiobook', {
        description: (error as Error).message,
      });
      setProcessing(false);
    }
  }, [files, metadata, outputFormat, bitrate, userSettings]);

  const handleReset = useCallback(() => {
    // Cleanup blobs
    filesRef.current.forEach(f => {
      if (f.metadata?.cover?.startsWith('blob:')) {
        URL.revokeObjectURL(f.metadata.cover);
      }
    });

    setCurrentStep(1);
    resetFiles([]);
    setMetadata(defaultMetadata);
    setLastExportedPath(null);
  }, []);


  // Save Project Handler
  const handleSaveProject = useCallback(async () => {
    const projectData = {
      version: 1,
      createdAt: new Date().toISOString(),
      metadata,
      outputFormat,
      bitrate,
      files: files.map((f) => ({
        path: (f.file as any).path || '',
        name: f.file.name,
        size: f.file.size,
        metadata: f.metadata,
      })),
    };

    try {

      const result = await window.electron.project.save(projectData);
      if (result.success) {
        if (result.filePath && window.electron?.recent) {
          await window.electron.recent.add(result.filePath);
        }
        toast.success('Project saved', {
          description: result.filePath,
        });
      }
    } catch (error) {
      console.error('Save project error:', error);
      toast.error('Failed to save project', {
        description: (error as Error).message,
      });
    }
  }, [files, metadata, outputFormat, bitrate]);

  // Load Project Handler
  const handleLoadProject = useCallback(async () => {
    try {

      const result = await window.electron.project.load();
      if (result.success && result.data) {
        const project = result.data;

        // Restore metadata and settings
        if (project.metadata) setMetadata(project.metadata);
        if (project.outputFormat) setOutputFormat(project.outputFormat);
        if (project.bitrate) setBitrate(project.bitrate);

        if (result.filePath && window.electron?.recent) {
          await window.electron.recent.add(result.filePath);
        }

        toast.success('Project loaded', {
          description: 'Audio files need to be re-added.',
        });
      }
    } catch (error) {
      console.error('Load project error:', error);
      toast.error('Failed to load project', {
        description: (error as Error).message,
      });
    }
  }, []);

  const handleLoadRecentProject = useCallback(async (path: string) => {
    try {
      const result = await window.electron.project.load(path);
      if (result.success && result.data) {
        const project = result.data;
        if (project.metadata) setMetadata(project.metadata);
        if (project.outputFormat) setOutputFormat(project.outputFormat);
        if (project.bitrate) setBitrate(project.bitrate);

        if (result.filePath && window.electron?.recent) {
          await window.electron.recent.add(result.filePath);
        }

        setToolMode('binder');
        setCurrentStep(1); // Go to upload step since files need re-adding usually (unless I store file paths and they are valid?)
        // Currently project save stores file list but they might not be valid.
        // Logic just restores metadata.

        toast.success('Project loaded');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load project');
    }
  }, []);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Cinematic Background Blobs */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-[20%] left-1/4 w-[900px] h-[1400px] bg-[#5E6AD2]/20 rounded-full blur-[150px] opacity-70 animate-float" />
        <div className="absolute top-[30%] -left-[15%] w-[600px] h-[800px] bg-purple-600/12 rounded-full blur-[120px] opacity-60 animate-float-slow" />
        <div className="absolute top-[50%] -right-[10%] w-[500px] h-[700px] bg-indigo-500/10 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Titlebar with project controls */}
      <Titlebar
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onLoadRecentProject={handleLoadRecentProject}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Tool Navigation Tabs */}
      <div className="flex border-b border-white/[0.06] px-6 bg-[#0a0a0c]">
        <button
          onClick={() => setToolMode('binder')}
          className={`px-6 py-3 font-medium transition-all relative ${toolMode === 'binder'
            ? 'text-[#5E6AD2]'
            : 'text-[#8A8F98] hover:text-[#EDEDEF]'
            }`}
        >
          Audiobook Binder
          {toolMode === 'binder' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E6AD2]"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setToolMode('converter')}
          className={`px-6 py-3 font-medium transition-all relative ${toolMode === 'converter'
            ? 'text-[#5E6AD2]'
            : 'text-[#8A8F98] hover:text-[#EDEDEF]'
            }`}
        >
          Format Converter
          {toolMode === 'converter' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E6AD2]"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setToolMode('splitter')}
          className={`px-6 py-3 font-medium transition-all relative ${toolMode === 'splitter'
            ? 'text-[#5E6AD2]'
            : 'text-[#8A8F98] hover:text-[#EDEDEF]'
            }`}
        >
          Chapter Splitter
          {toolMode === 'splitter' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E6AD2]"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {toolMode === 'binder' && currentStep === 1 && (
          <UploadStep
            key="upload"
            files={files}
            onFilesAdded={addFiles}
            onRemoveFile={removeFile}
            onNext={nextStep}
            currentStep={currentStep}
          />
        )}
        {toolMode === 'binder' && currentStep === 2 && (
          <ArrangeStep
            key="arrange"
            files={files}
            onFilesChange={setFiles}
            onRemoveFile={removeFile}
            onUpdateMetadata={updateMetadata}
            onNext={nextStep}
            onBack={prevStep}
            currentStep={currentStep}
            asin={metadata.asin}
          />
        )}
        {toolMode === 'binder' && currentStep === 3 && (
          <MetadataStep
            key="metadata"
            files={files}
            metadata={metadata}
            onChange={setMetadata}
            onNext={nextStep}
            onBack={prevStep}
            currentStep={currentStep}
          />
        )}
        {toolMode === 'binder' && currentStep === 4 && (
          <ExportStep
            key="export"
            files={files}
            metadata={metadata}
            outputFormat={outputFormat}
            bitrate={bitrate}
            itunesCompatibility={itunesCompatibility}
            processing={processing}
            onFormatChange={setOutputFormat}
            onBitrateChange={setBitrate}
            onItunesCompatibilityChange={setItunesCompatibility}
            onExport={handleProcess}
            onBack={prevStep}
            currentStep={currentStep}
            lastExportedPath={lastExportedPath}
            userPresets={(userSettings.userPresets as unknown as ConversionPreset[]) || []}
            selectedPresetId={userSettings.selectedPresetId || DEFAULT_PRESET_ID}
            onPresetChange={(preset) => {
              setOutputFormat(preset.targetFormat as OutputFormat);
              setBitrate(preset.bitrate as Bitrate);
              if (preset.itunesCompatibility !== undefined) {
                setItunesCompatibility(preset.itunesCompatibility);
              }
              handleSaveSettings({ ...userSettings, selectedPresetId: preset.id });
            }}
            onSaveUserPreset={async (preset) => {
              const updatedPresets = [...(userSettings.userPresets || []), preset];
              await handleSaveSettings({
                ...userSettings,
                userPresets: updatedPresets,
                selectedPresetId: preset.id
              });
            }}
            onDeleteUserPreset={async (presetId) => {
              const updatedPresets = (userSettings.userPresets || []).filter(p => p.id !== presetId);
              const newSettings: UserSettings = { ...userSettings, userPresets: updatedPresets };
              if (userSettings.selectedPresetId === presetId) {
                newSettings.selectedPresetId = 'audiobook-standard';
                setOutputFormat('m4b');
                setBitrate('64k');
              }
              await handleSaveSettings(newSettings);
            }}
            onReset={handleReset}
            autoAddToLibrary={userSettings.autoAddToLibrary || false}
            onAutoAddToLibraryChange={(enabled) => handleSaveSettings({ ...userSettings, autoAddToLibrary: enabled })}
            onAddToLibrary={async (path) => {
              if (window.electron?.files?.addToItunes) {
                return await window.electron.files.addToItunes(path);
              }
              return { success: false, error: 'Not supported' };
            }}
            onStartDrag={(path) => {
              if (window.electron?.files?.startDrag) {
                window.electron.files.startDrag(path);
              }
            }}

          />
        )}
        {toolMode === 'converter' && (
          <Converter key="converter" />
        )}
        {toolMode === 'splitter' && (
          <ChapterSplitter key="splitter" />
        )}
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#050506]/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="w-full max-w-md p-8 rounded-2xl bg-[#0a0a0c] border border-white/[0.06] shadow-2xl flex flex-col gap-6 items-center">
              <div className="w-16 h-16 rounded-full border-4 border-[#5E6AD2] border-t-transparent animate-spin" />
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-[#EDEDEF]">Creating Audiobook...</h2>
                <p className="text-[#5E6AD2] font-mono text-lg">{progress.percent.toFixed(1)}%</p>
                <p className="text-xs text-[#8A8F98] font-mono">Time: {progress.timemark}</p>
              </div>
              <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#5E6AD2]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
                  transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={userSettings}
        onSave={handleSaveSettings}
      />

    </div>
  );
}
