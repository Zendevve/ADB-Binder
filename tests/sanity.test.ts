/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

describe('Environment Sanity Check', () => {
  it('should have ffmpeg-static available', () => {
    expect(ffmpegPath).toBeDefined();
    expect(fs.existsSync(ffmpegPath!)).toBe(true);
  });

  it('should have test assets generated', () => {
    const assetsDir = path.resolve(__dirname, '../test-assets');
    expect(fs.existsSync(assetsDir)).toBe(true);
    expect(fs.existsSync(path.join(assetsDir, 'audio1.mp3'))).toBe(true);
  });
});
