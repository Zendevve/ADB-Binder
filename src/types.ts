export interface AudioFile {
  id: string; // Unique ID (UUID)
  file: File; // The actual file object (from Drag & Drop)
  path: string; // Absolute path (for Electron/FFmpeg)
  metadata: {
    title: string;
    artist: string;
    album: string;
    duration: number; // in seconds
    cover?: string; // base64 or path
  };
  status: 'pending' | 'processing' | 'done' | 'error';
}

export interface Chapter {
  id: number;
  title: string;
  start: number; // in seconds
  end: number; // in seconds
  duration: number; // in seconds
}

export interface ProcessingOptions {
  outputFormat: 'm4b' | 'mp3';
  bitrate: string; // e.g. '128k'
  useChapters: boolean;
}

export interface BookMetadata {
  title: string;
  subtitle?: string;
  author: string;
  genre: string;
  year?: string;
  narrator?: string;
  series?: string;
  seriesNumber?: number;
  publisher?: string;
  description?: string;
  tags?: string[];
  language?: string;
  isbn?: string;
  asin?: string;
  explicit?: boolean;
  coverPath?: string;
  coverData?: string; // base64 data URL for preview
}

export interface ConversionFile {
  id: string;
  name: string;
  path: string;
  size: number;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  outputPath?: string;
  error?: string;
}


export interface UserSettings {
  defaultOutputDirectory?: string;
  defaultOutputFormat?: 'm4b' | 'mp3' | 'aac';
  defaultBitrate?: string;
  theme?: 'dark' | 'light' | 'system';
  selectedPresetId?: string;
  userPresets?: Array<{
    id: string;
    name: string;
    targetFormat: string;
    bitrate: string;
    description: string;
    icon?: string;
    isBuiltIn?: boolean;
  }>;
  autoAddToLibrary?: boolean;
}

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
}

declare global {
  interface Window {
    electron: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      openFiles: () => Promise<string[]>;
      project: {
        save: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
        load: (filePath?: string) => Promise<{ success: boolean; data?: any; error?: string; filePath?: string }>;
      };
      audio: {
        getPathForFile: (file: File) => string;
        readMetadata: (path: string) => Promise<{
          path: string;
          duration: number;
          title: string;
          artist: string;
          album: string;
        }>;
        process: (options: {
          files: { path: string; title: string; duration: number }[];
          outputFormat: 'm4b' | 'aac' | 'mp3';
          bitrate: string;
          coverPath?: string;
          bookMetadata?: {
            title: string;
            author: string;
            genre: string;
            year?: string;
            narrator?: string;
          };
          defaultOutputDirectory?: string;
          itunesCompatibility?: boolean;
        }) => Promise<{ success: boolean; outputPath?: string; cancelled?: boolean }>;
        convert: (options: {
          inputPath: string;
          outputFormat: string;
          bitrate: string;
        }) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
        detectArtwork: (filePaths: string[]) => Promise<{ found: boolean; source?: string; data?: string }>;
        onProgress: (callback: (progress: { percent: number; timemark: string }) => void) => void;
        onConvertProgress: (callback: (data: { inputPath: string; percent: number }) => void) => void;

        removeProgressListener: () => void;
        readChapters: (filePath: string) => Promise<{
          chapters: Chapter[];
          duration: number;
          format: string;
          bitrate: string;
        }>;
        splitByChapters: (options: {
          inputPath: string;
          outputDirectory: string;
          chapters: Chapter[];
          outputFormat: string;
          fileNameTemplate: string;
        }) => Promise<{ success: boolean; results?: any[]; error?: string }>;
        onSplitProgress: (callback: (data: { message: string, current: number, total: number, chapter: string }) => void) => void;
        detectSilence: (options: {
          filePath: string;
          noiseThreshold?: number;
          minDuration?: number;
        }) => Promise<{
          success: boolean;
          silences: { start: number; end: number; duration: number }[];
          suggestedChapters: { start: number; end: number; duration: number }[];
          totalDuration: number;
          error?: string;
        }>;
        onSilenceProgress: (callback: (data: { percent: number; timemark: string }) => void) => void;
        removeSilenceProgressListener: () => void;
      };
      settings: {
        read: () => Promise<UserSettings>;
        write: (settings: UserSettings) => Promise<{ success: boolean; error?: string }>;
        selectDirectory: () => Promise<string | null>;
      };
      recent: {
        read: () => Promise<RecentProject[]>;
        add: (path: string) => Promise<RecentProject[]>;
        clear: () => Promise<RecentProject[]>;
      };
      files: {
        startDrag: (filePath: string) => void;
        addToItunes: (filePath: string) => Promise<{ success: boolean; method?: string; error?: string }>;
      };
    };
  }
}
