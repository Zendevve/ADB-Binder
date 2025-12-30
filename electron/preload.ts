import { contextBridge, ipcRenderer, webUtils } from 'electron';

interface FileInfo {
  path: string;
  title: string;
  duration: number;
}

interface ProcessOptions {
  files: FileInfo[];
  outputFormat: 'm4b' | 'aac' | 'mp3';
  bitrate: string;
}

contextBridge.exposeInMainWorld('electron', {
  openFiles: () => ipcRenderer.invoke('dialog:open-files'),
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  audio: {
    getPathForFile: (file: File) => {
      const path = webUtils.getPathForFile(file);
      console.log('[PRELOAD] getPathForFile:', file.name, '->', path);
      return path;
    },
    readMetadata: (filePath: string) => ipcRenderer.invoke('audio:read-metadata', filePath),
    process: (options: ProcessOptions) => ipcRenderer.invoke('audio:process', options),
    detectArtwork: (filePaths: string[]) => ipcRenderer.invoke('audio:detect-artwork', filePaths),
    onProgress: (callback: (progress: { percent: number; timemark: string }) => void) => {
      ipcRenderer.on('audio:progress', (_, progress) => callback(progress));
    },
    removeProgressListener: () => {
      ipcRenderer.removeAllListeners('audio:progress');
    },
    // Format conversion
    convert: (request: { inputPath: string; outputFormat: string; bitrate?: string }) =>
      ipcRenderer.invoke('audio:convert', request),
    batchConvert: (requests: Array<{ inputPath: string; outputFormat: string; bitrate?: string }>) =>
      ipcRenderer.invoke('audio:batchConvert', requests),
    // Chapter Splitter
    readChapters: (filePath: string) => ipcRenderer.invoke('audio:read-chapters', filePath),
    splitByChapters: (options: any) => ipcRenderer.invoke('audio:split-by-chapters', options),
    onSplitProgress: (callback: (data: any) => void) => {
      ipcRenderer.on('audio:split-progress', (_, data) => callback(data));
    },
    // Silence Detection
    detectSilence: (options: { filePath: string; noiseThreshold?: number; minDuration?: number }) =>
      ipcRenderer.invoke('audio:detect-silence', options),
    onSilenceProgress: (callback: (data: { percent: number; timemark: string }) => void) => {
      ipcRenderer.on('audio:silence-progress', (_, data) => callback(data));
    },
    removeSilenceProgressListener: () => {
      ipcRenderer.removeAllListeners('audio:silence-progress');
    },
  },
  // For direct IPC access (required for image upload events)
  ipcRenderer: {
    on: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.on(channel, callback);
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  project: {
    save: (projectData: object) => ipcRenderer.invoke('project:save', projectData),
    load: () => ipcRenderer.invoke('project:load'),
  },
  // File System & Drag-Drop
  files: {
    startDrag: (filePath: string) => ipcRenderer.send('file:start-drag', filePath),
    addToItunes: (filePath: string) => ipcRenderer.invoke('files:add-to-itunes', filePath),
  },
});

