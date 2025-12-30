export const AUDIO_FORMATS = {
  M4B: {
    ext: '.m4b',
    codec: 'aac',
    container: 'ipod',
    description: 'M4B (Audiobook)',
    supportsChapters: true,
  },
  M4A: {
    ext: '.m4a',
    codec: 'aac',
    container: 'mp4',
    description: 'M4A (AAC Audio)',
    supportsChapters: false,
  },
  MP3: {
    ext: '.mp3',
    codec: 'libmp3lame',
    container: 'mp3',
    description: 'MP3',
    supportsChapters: true, // ID3v2 CHAP frames
  },
  AAC: {
    ext: '.aac',
    codec: 'aac',
    container: 'adts',
    description: 'AAC',
    supportsChapters: false,
  },
  FLAC: {
    ext: '.flac',
    codec: 'flac',
    container: 'flac',
    description: 'FLAC (Lossless)',
    supportsChapters: true,
  },
} as const;

export type AudioFormat = keyof typeof AUDIO_FORMATS;

// Extended preset interface with additional options
export interface ConversionPreset {
  id: string;
  name: string;
  targetFormat: AudioFormat;
  bitrate: string;
  description: string;
  icon?: string;
  isBuiltIn?: boolean;
  itunesCompatibility?: boolean;
  sampleRate?: number; // Optional sample rate override
}

// Built-in presets that cannot be deleted
export const BUILTIN_PRESETS: ConversionPreset[] = [
  {
    id: 'audiobook-standard',
    name: 'Audiobook Standard',
    targetFormat: 'M4B',
    bitrate: '64k',
    description: 'M4B format, 64kbps AAC (best for spoken word)',
    icon: '📚',
    isBuiltIn: true,
    itunesCompatibility: true,
  },
  {
    id: 'audiobook-hq',
    name: 'Audiobook HQ',
    targetFormat: 'M4B',
    bitrate: '128k',
    description: 'M4B format, 128kbps AAC (higher quality)',
    icon: '📖',
    isBuiltIn: true,
    itunesCompatibility: true,
  },
  {
    id: 'podcast',
    name: 'Podcast',
    targetFormat: 'MP3',
    bitrate: '96k',
    description: 'MP3 format, 96kbps (optimized for podcasts)',
    icon: '🎙️',
    isBuiltIn: true,
  },
  {
    id: 'mp3-compatible',
    name: 'MP3 Universal',
    targetFormat: 'MP3',
    bitrate: '128k',
    description: 'MP3 format for maximum device compatibility',
    icon: '🎵',
    isBuiltIn: true,
  },
  {
    id: 'music-hq',
    name: 'Music HQ',
    targetFormat: 'M4A',
    bitrate: '256k',
    description: 'M4A format, 256kbps AAC (music quality)',
    icon: '🎶',
    isBuiltIn: true,
  },
  {
    id: 'lossless',
    name: 'Lossless Archive',
    targetFormat: 'FLAC',
    bitrate: '',
    description: 'Lossless FLAC (archival quality, large files)',
    icon: '💾',
    isBuiltIn: true,
  },
];

// Legacy export for backwards compatibility
export const CONVERSION_PRESETS = BUILTIN_PRESETS;

// Helper to generate unique ID for user presets
export function generatePresetId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Default preset for new users
export const DEFAULT_PRESET_ID = 'audiobook-standard';
