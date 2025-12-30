# Silence Detection for Auto-Chaptering

## Overview

The Silence Detection feature analyzes audio files to find gaps of silence, then suggests chapter boundaries based on those gaps. This is useful for audiobooks that don't have embedded chapter markers but have natural pauses between chapters.

## How It Works

1. **User clicks "Detect Chapters"** in the Arrange step
2. **FFmpeg analyzes the audio** using the `silencedetect` filter
3. **Silence gaps are identified** based on noise threshold and minimum duration
4. **Chapter boundaries are suggested** based on the audio between silence gaps
5. **Chapter names are auto-generated** as "Chapter N (duration)"

## FFmpeg Filter

```bash
ffmpeg -i input.mp3 -af "silencedetect=noise=-50dB:d=1.5" -f null -
```

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `noise` | -50 dB | Volume threshold below which audio is considered silence |
| `d` | 1.5 s | Minimum silence duration to register as a gap |

## Output Format

The silence detection returns:

```typescript
{
  success: boolean;
  silences: [
    { start: 120.5, end: 122.3, duration: 1.8 },
    { start: 245.2, end: 247.5, duration: 2.3 },
    // ...
  ];
  suggestedChapters: [
    { start: 0, end: 120.5, duration: 120.5 },
    { start: 122.3, end: 245.2, duration: 122.9 },
    // ...
  ];
  totalDuration: number;
}
```

## Implementation Files

| File | Purpose |
|------|---------|
| `electron/main.ts` | IPC handler `audio:detect-silence` |
| `electron/preload.ts` | `detectSilence()` API |
| `src/components/wizard/ArrangeStep.tsx` | UI button |

## Usage

1. Upload audio files to **Binder**
2. Go to **Arrange Chapters** step
3. Click **"Detect Chapters"** button
4. Wait for analysis (progress shown in console)
5. Chapters will be auto-named based on detected segments

## Limitations

- Works best with clear silence gaps (≥1.5 seconds)
- May produce too many/few chapters for audiobooks with music or sound effects
- Currently analyzes only the first file in the queue
