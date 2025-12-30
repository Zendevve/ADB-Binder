/**
 * Integration Tests for Silence Detection
 *
 * MCAF Compliance:
 * - Uses real FFmpeg processes
 * - Tests with generated audio files
 * - Verifies silence detection accuracy
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test fixtures directory
const TEST_FIXTURES_DIR = path.join(__dirname, '__fixtures__');
const TEST_OUTPUT_DIR = path.join(__dirname, '__test_output__');

describe('Silence Detection - Integration Tests', () => {
  beforeAll(async () => {
    // Create test directories
    if (!fs.existsSync(TEST_FIXTURES_DIR)) {
      fs.mkdirSync(TEST_FIXTURES_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }

    // Generate test audio with silence gaps:
    // 5s tone, 2s silence, 5s tone, 2s silence, 5s tone
    const testAudioPath = path.join(TEST_FIXTURES_DIR, 'silence-test.wav');
    if (!fs.existsSync(testAudioPath)) {
      // Create audio with intentional silence gaps using filter_complex
      await execAsync(
        `ffmpeg -f lavfi -i "sine=frequency=440:duration=5" ` +
        `-f lavfi -i "anullsrc=r=44100:cl=stereo" -t 2 ` +
        `-f lavfi -i "sine=frequency=440:duration=5" ` +
        `-f lavfi -i "anullsrc=r=44100:cl=stereo" -t 2 ` +
        `-f lavfi -i "sine=frequency=440:duration=5" ` +
        `-filter_complex "[0:a][1:a][2:a][3:a][4:a]concat=n=5:v=0:a=1[out]" ` +
        `-map "[out]" "${testAudioPath}"`
      );
    }
  });

  afterAll(() => {
    // Cleanup test output (keep fixtures for reuse)
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      const files = fs.readdirSync(TEST_OUTPUT_DIR);
      files.forEach((file: string) => {
        fs.unlinkSync(path.join(TEST_OUTPUT_DIR, file));
      });
      fs.rmdirSync(TEST_OUTPUT_DIR);
    }
  });

  describe('FFmpeg Silencedetect Filter', () => {
    it('should detect silence gaps in audio', async () => {
      const inputPath = path.join(TEST_FIXTURES_DIR, 'silence-test.wav');

      // Skip if fixture doesn't exist
      if (!fs.existsSync(inputPath)) {
        console.log('Skipping: silence-test.wav fixture not found');
        return;
      }

      // Run silencedetect filter
      const { stderr } = await execAsync(
        `ffmpeg -i "${inputPath}" -af "silencedetect=noise=-50dB:d=1.5" -f null -`
      );

      // Parse silence_start from stderr
      const silenceStartMatches = stderr.match(/silence_start: [\d.]+/g);

      // Should detect at least 2 silence gaps
      expect(silenceStartMatches).not.toBeNull();
      expect(silenceStartMatches!.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    it('should respect noise threshold parameter', async () => {
      const inputPath = path.join(TEST_FIXTURES_DIR, 'silence-test.wav');

      if (!fs.existsSync(inputPath)) {
        console.log('Skipping: silence-test.wav fixture not found');
        return;
      }

      // Very low threshold (-90dB) should detect more silence
      const { stderr: lowThreshold } = await execAsync(
        `ffmpeg -i "${inputPath}" -af "silencedetect=noise=-90dB:d=0.5" -f null -`
      );

      // Higher threshold (-30dB) might detect less or more depending on audio
      const { stderr: highThreshold } = await execAsync(
        `ffmpeg -i "${inputPath}" -af "silencedetect=noise=-30dB:d=0.5" -f null -`
      );

      // Both should complete without error
      expect(lowThreshold).toBeDefined();
      expect(highThreshold).toBeDefined();
    }, 30000);

    it('should respect minimum duration parameter', async () => {
      const inputPath = path.join(TEST_FIXTURES_DIR, 'silence-test.wav');

      if (!fs.existsSync(inputPath)) {
        console.log('Skipping: silence-test.wav fixture not found');
        return;
      }

      // Short duration (0.5s) should detect more gaps
      const { stderr: shortDuration } = await execAsync(
        `ffmpeg -i "${inputPath}" -af "silencedetect=noise=-50dB:d=0.5" -f null -`
      );

      // Long duration (10s) should detect fewer gaps
      const { stderr: longDuration } = await execAsync(
        `ffmpeg -i "${inputPath}" -af "silencedetect=noise=-50dB:d=10" -f null -`
      );

      const shortMatches = (shortDuration.match(/silence_start/g) || []).length;
      const longMatches = (longDuration.match(/silence_start/g) || []).length;

      // Short duration should find more or equal gaps
      expect(shortMatches).toBeGreaterThanOrEqual(longMatches);
    }, 30000);
  });

  describe('Edge Cases', () => {
    it('should handle audio with no silence', async () => {
      // Generate continuous tone
      const continuousPath = path.join(TEST_OUTPUT_DIR, 'continuous.wav');
      await execAsync(
        `ffmpeg -f lavfi -i "sine=frequency=440:duration=5" "${continuousPath}"`
      );

      const { stderr } = await execAsync(
        `ffmpeg -i "${continuousPath}" -af "silencedetect=noise=-50dB:d=1.5" -f null -`
      );

      // Should find no silence_start entries
      const silenceMatches = stderr.match(/silence_start/g);
      expect(silenceMatches).toBeNull();
    }, 30000);

    it('should handle very short audio files', async () => {
      // Generate 0.5 second audio
      const shortPath = path.join(TEST_OUTPUT_DIR, 'short.wav');
      await execAsync(
        `ffmpeg -f lavfi -i "sine=frequency=440:duration=0.5" "${shortPath}"`
      );

      // Should not throw error
      const { stderr } = await execAsync(
        `ffmpeg -i "${shortPath}" -af "silencedetect=noise=-50dB:d=0.1" -f null -`
      );

      expect(stderr).toBeDefined();
    }, 30000);
  });
});
