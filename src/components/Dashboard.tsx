import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Titlebar } from '@/components/Titlebar';
import { UploadStep } from '@/components/wizard/UploadStep';
import { ArrangeStep } from '@/components/wizard/ArrangeStep';
import { MetadataStep } from '@/components/wizard/MetadataStep';
import { ExportStep } from '@/components/wizard/ExportStep';
import { UpgradeModal } from '@/components/UpgradeModal';
import { defaultMetadata } from '@/components/MetadataPanel';
import type { BookMetadata } from '@/components/MetadataPanel';
import { AudioAnalyzer } from '@/lib/audio-analyzer';
import { useLicenseStore } from '@/lib/license-store';
import type { AudioFile } from '@/types';

type OutputFormat = 'm4b' | 'mp3' | 'aac';
type Bitrate = '64k' | '96k' | '128k' | '192k';

export default function Dashboard() {
  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Data state
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [metadata, setMetadata] = useState<BookMetadata>(defaultMetadata);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');
  const [bitrate, setBitrate] = useState<Bitrate>('64k');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, timemark: '' });

  // License state
  const licenseTier = useLicenseStore((s) => s.tier);

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
    setFiles((prev) => prev.filter((f) => f.id !== id));
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
        licenseTier, // Pass license tier for watermark logic
      });

      if (result.success) {
        // Reset to start
        setCurrentStep(1);
        setFiles([]);
        setMetadata(defaultMetadata);
      }
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setProcessing(false);
    }
  }, [files, metadata, outputFormat, bitrate, licenseTier]);

  // Project State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = useLicenseStore((s) => s.isPro());

  // Save Project Handler
  const handleSaveProject = useCallback(async () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }

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
      // @ts-expect-error Electron IPC
      const result = await window.electron.project.save(projectData);
      if (result.success) {
        console.log('Project saved:', result.filePath);
      }
    } catch (error) {
      console.error('Save project error:', error);
    }
  }, [isPro, files, metadata, outputFormat, bitrate]);

  // Load Project Handler
  const handleLoadProject = useCallback(async () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      // @ts-expect-error Electron IPC
      const result = await window.electron.project.load();
      if (result.success && result.data) {
        const project = result.data;

        // Restore metadata and settings
        if (project.metadata) setMetadata(project.metadata);
        if (project.outputFormat) setOutputFormat(project.outputFormat);
        if (project.bitrate) setBitrate(project.bitrate);

        // Note: We can't restore actual File objects from paths
        // User needs to re-add files after loading
        console.log('Project loaded. Note: Audio files need to be re-added.');
      }
    } catch (error) {
      console.error('Load project error:', error);
    }
  }, [isPro]);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Cinematic Background Blobs */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-[20%] left-1/4 w-[900px] h-[1400px] bg-[#5E6AD2]/20 rounded-full blur-[150px] opacity-70 animate-float" />
        <div className="absolute top-[30%] -left-[15%] w-[600px] h-[800px] bg-purple-600/12 rounded-full blur-[120px] opacity-60 animate-float-slow" />
        <div className="absolute top-[50%] -right-[10%] w-[500px] h-[700px] bg-indigo-500/10 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Titlebar with project controls */}
      <Titlebar onSaveProject={handleSaveProject} onLoadProject={handleLoadProject} />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <UploadStep
            key="upload"
            files={files}
            onFilesAdded={addFiles}
            onRemoveFile={removeFile}
            onNext={nextStep}
            currentStep={currentStep}
          />
        )}
        {currentStep === 2 && (
          <ArrangeStep
            key="arrange"
            files={files}
            onFilesChange={setFiles}
            onRemoveFile={removeFile}
            onUpdateMetadata={updateMetadata}
            onNext={nextStep}
            onBack={prevStep}
            currentStep={currentStep}
          />
        )}
        {currentStep === 3 && (
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
        {currentStep === 4 && (
          <ExportStep
            key="export"
            files={files}
            metadata={metadata}
            outputFormat={outputFormat}
            bitrate={bitrate}
            processing={processing}
            onFormatChange={setOutputFormat}
            onBitrateChange={setBitrate}
            onExport={handleProcess}
            onBack={prevStep}
            currentStep={currentStep}
          />
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

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
