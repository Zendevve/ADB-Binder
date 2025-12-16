import * as mediabunny from 'mediabunny';

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration: number;
  cover?: string;
}

export class AudioAnalyzer {
  static async getMetadata(file: File): Promise<AudioMetadata> {
    // Basic validation
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(m4b|m4a|mp3|wav|flac|ogg)$/i)) {
      throw new Error('Invalid file type');
    }

    try {
      const input = new mediabunny.Input({
        source: new mediabunny.BlobSource(file),
        formats: mediabunny.ALL_FORMATS
      });

      // Calculate duration
      const duration = await input.computeDuration();

      // Extract metadata tags
      const tags = await input.getMetadataTags();
      const title = tags.title;
      const artist = tags.artist;
      const album = tags.album;

      // Extract cover art if available
      let cover: string | undefined;
      const coverImage = tags.images?.find(img => img.kind === 'coverFront' || img.kind === 'unknown');

      if (coverImage) {
        const blob = new Blob([coverImage.data as any], { type: coverImage.mimeType });
        cover = URL.createObjectURL(blob);
      }

      // Don't forget to dispose!
      input.dispose();

      return {
        title,
        artist,
        album,
        duration,
        cover
      };
    } catch (error) {
      console.error('Mediabunny analysis failed:', error);
      throw error;
    }
  }

  static async getWaveform(_file: File, _sampleCount = 100): Promise<number[]> {
    try {
      // Placeholder
      return [];
    } catch (e) {
      console.error('Waveform generation failed', e);
      return [];
    }
  }
}
