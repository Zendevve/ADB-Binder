import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import os from 'os';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch { /* electron-squirrel-startup not available, ignore */ }

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Only disable webSecurity in development for live reload
  const isDev = !!process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: !isDev, // Enable in production, disable in dev for CORS
    },
    autoHideMenuBar: true,
    backgroundColor: '#050506',
    title: 'Audiobook Toolkit',
    frame: false, // Frameless for custom titlebar
    minWidth: 900,
    minHeight: 600,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});



// Window control handlers
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow?.close());

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobePath.path);

interface FileInfo {
  path: string;
  title: string;
  duration: number;
}

interface ProcessOptions {
  files: FileInfo[];
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
  itunesCompatibility?: boolean; // Enable iTunes compatibility mode for very long books
}

// IPC Handlers
ipcMain.handle('audio:read-metadata', async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('Error reading metadata:', err);
        reject(err);
        return;
      }

      const format = metadata.format;
      const common = format.tags || {};

      resolve({
        path: filePath,
        duration: format.duration || 0,
        title: common.title || path.basename(filePath),
        artist: common.artist || 'Unknown Artist',
        album: common.album || 'Unknown Album',
      });
    });
  });
});

// Open file dialog from main process
ipcMain.handle('dialog:open-files', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Audio Files',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'm4a', 'm4b', 'aac', 'wav', 'flac', 'ogg'] },
    ],
  });
  return result.filePaths;
});

// Show save dialog
ipcMain.handle('audio:show-save-dialog', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Save Audiobook',
    defaultPath: 'audiobook.m4b',
    filters: [
      { name: 'M4B Audiobook', extensions: ['m4b'] },
      { name: 'AAC Audio', extensions: ['aac'] },
      { name: 'MP3 Audio', extensions: ['mp3'] },
    ],
  });
  return result.filePath;
});

// Save Project - Export project state to JSON file
ipcMain.handle('project:save', async (_event, projectData: object) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Project',
    defaultPath: 'audiobook-project.adbp',
    filters: [
      { name: 'Audiobook Toolkit Project', extensions: ['adbp'] },
      { name: 'JSON Files', extensions: ['json'] },
    ],
  });

  if (!result.filePath) {
    return { success: false, cancelled: true };
  }

  try {
    fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2), 'utf8');
    console.log('[PROJECT] Saved to:', result.filePath);
    return { success: true, filePath: result.filePath };
  } catch (err) {
    console.error('[PROJECT] Save error:', err);
    return { success: false, error: (err as Error).message };
  }
});

// Load Project - Import project state from JSON file
ipcMain.handle('project:load', async (_event, filePath?: string) => {
  let targetPath = filePath;

  if (!targetPath) {
    const result = await dialog.showOpenDialog({
      title: 'Open Project',
      properties: ['openFile'],
      filters: [
        { name: 'Audiobook Toolkit Project', extensions: ['adbp', 'json'] },
      ],
    });

    if (!result.filePaths || result.filePaths.length === 0) {
      return { success: false, cancelled: true };
    }
    targetPath = result.filePaths[0];
  }

  try {
    const content = fs.readFileSync(targetPath, 'utf8');
    const projectData = JSON.parse(content);
    console.log('[PROJECT] Loaded from:', targetPath);
    return { success: true, data: projectData, filePath: targetPath };
  } catch (err) {
    console.error('[PROJECT] Load error:', err);
    return { success: false, error: (err as Error).message };
  }
});

// Smart Artwork Detection - Find cover from folder or embedded in audio
ipcMain.handle('audio:detect-artwork', async (_event, filePaths: string[]) => {
  if (!filePaths || filePaths.length === 0) {
    return { found: false };
  }

  console.log('[ARTWORK] Scanning for artwork from', filePaths.length, 'files');

  // Get the directory of the first file
  const firstFilePath = filePaths[0];
  const fileDir = path.dirname(firstFilePath);

  // Common cover image filenames to look for
  const coverNames = [
    'cover.jpg', 'cover.jpeg', 'cover.png',
    'folder.jpg', 'folder.jpeg', 'folder.png',
    'album.jpg', 'album.jpeg', 'album.png',
    'front.jpg', 'front.jpeg', 'front.png',
    'artwork.jpg', 'artwork.jpeg', 'artwork.png',
  ];

  // 1. Check for cover image files in the folder
  for (const coverName of coverNames) {
    const coverPath = path.join(fileDir, coverName);
    if (fs.existsSync(coverPath)) {
      console.log('[ARTWORK] Found cover file:', coverPath);
      try {
        const imageBuffer = fs.readFileSync(coverPath);
        const base64 = imageBuffer.toString('base64');
        const ext = path.extname(coverPath).toLowerCase().slice(1);
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        return {
          found: true,
          source: 'folder',
          data: `data:${mimeType};base64,${base64}`,
        };
      } catch (err) {
        console.error('[ARTWORK] Error reading cover file:', err);
      }
    }
  }

  // 2. Try to extract embedded artwork from audio files using ffmpeg
  for (const filePath of filePaths) {
    try {
      const tempCoverPath = path.join(os.tmpdir(), `cover_${Date.now()}.jpg`);

      await new Promise<void>((resolve, _reject) => {
        ffmpeg(filePath)
          .outputOptions(['-an', '-vcodec', 'copy'])
          .output(tempCoverPath)
          .on('end', () => resolve())
          .on('error', (_err) => {
            // No embedded artwork is not an error, just skip
            resolve();
          })
          .run();
      });

      if (fs.existsSync(tempCoverPath)) {
        const stats = fs.statSync(tempCoverPath);
        if (stats.size > 0) {
          console.log('[ARTWORK] Extracted embedded artwork from:', filePath);
          const imageBuffer = fs.readFileSync(tempCoverPath);
          const base64 = imageBuffer.toString('base64');
          fs.unlinkSync(tempCoverPath); // Cleanup
          return {
            found: true,
            source: 'embedded',
            data: `data:image/jpeg;base64,${base64}`,
          };
        }
        fs.unlinkSync(tempCoverPath); // Cleanup empty file
      }
    } catch (err) {
      // Silently continue to next file
    }
  }

  console.log('[ARTWORK] No artwork found');
  return { found: false };
});

// Process and merge audio files using filter_complex
ipcMain.handle('audio:process', async (_event, options: ProcessOptions) => {
  const { files, bitrate, outputFormat, coverPath, bookMetadata, defaultOutputDirectory } = options;

  if (!files || files.length === 0) {
    throw new Error('No files to process');
  }

  console.log('[MERGE] Starting merge with', files.length, 'files');
  files.forEach((f, i) => console.log(`[MERGE] File ${i}:`, f.path, 'duration:', f.duration));

  // Show save dialog
  const defaultExt = outputFormat === 'mp3' ? 'mp3' : outputFormat === 'aac' ? 'm4a' : 'm4b';
  let defaultPath = `audiobook.${defaultExt}`;
  if (defaultOutputDirectory) {
    defaultPath = path.join(defaultOutputDirectory, defaultPath);
  }

  const result = await dialog.showSaveDialog({
    title: 'Save Audiobook',
    defaultPath,
    filters: [
      { name: 'M4B Audiobook', extensions: ['m4b'] },
      { name: 'MP3 Audio', extensions: ['mp3'] },
      { name: 'AAC Audio', extensions: ['m4a'] },
    ],
  });

  if (!result.filePath) {
    return { success: false, cancelled: true };
  }

  const outputPath = result.filePath;
  console.log('[MERGE] Output path:', outputPath);

  // Create metadata file for chapters
  const tempDir = os.tmpdir();
  const metadataFilePath = path.join(tempDir, `metadata_${Date.now()}.txt`);

  // Generate chapter metadata (only for non-MP3)
  let metadataContent = ';FFMETADATA1\n';
  let currentTime = 0;
  const isMP3 = outputFormat === 'mp3' || outputPath.endsWith('.mp3');

  if (!isMP3) {
    files.forEach((file, index) => {
      const startMs = Math.floor(currentTime * 1000);
      const endMs = Math.floor((currentTime + file.duration) * 1000);

      metadataContent += `[CHAPTER]\n`;
      metadataContent += `TIMEBASE=1/1000\n`;
      metadataContent += `START=${startMs}\n`;
      metadataContent += `END=${endMs}\n`;
      metadataContent += `title=${file.title || `Chapter ${index + 1}`}\n`;

      currentTime += file.duration;
    });
  }

  fs.writeFileSync(metadataFilePath, metadataContent, 'utf8');
  console.log('[MERGE] Metadata written to:', metadataFilePath);

  return new Promise((resolve, reject) => {
    const codec = isMP3 ? 'libmp3lame' : 'aac';

    // Build the filter_complex string for audio concatenation
    // Each input is [0:a], [1:a], etc. - we concatenate all of them
    const inputLabels = files.map((_, i) => `[${i}:a]`).join('');
    const filterComplex = `${inputLabels}concat=n=${files.length}:v=0:a=1[outa]`;

    console.log('[MERGE] Filter complex:', filterComplex);
    console.log('[MERGE] Using codec:', codec, 'bitrate:', bitrate || '128k');

    // Start building the command
    let command = ffmpeg();

    // Add each audio file as an input
    files.forEach((file) => {
      command = command.input(file.path);
    });

    // Add metadata file as last input (for chapters)
    const metadataInputIndex = files.length;
    command = command.input(metadataFilePath);

    // Add cover image as input if provided (non-MP3 only)
    let coverInputIndex = -1;
    if (coverPath && fs.existsSync(coverPath) && !isMP3) {
      coverInputIndex = metadataInputIndex + 1;
      command = command.input(coverPath);
      console.log('[MERGE] Cover image added at input', coverInputIndex, ':', coverPath);
    }

    // Build output options
    const outputOptions = [
      '-filter_complex', filterComplex,
      '-map', '[outa]',
      '-c:a', codec,
      '-b:a', bitrate || '128k',
    ];

    // Add cover art mapping for non-MP3
    if (coverInputIndex >= 0) {
      outputOptions.push('-map', `${coverInputIndex}:v`);
      outputOptions.push('-c:v', 'mjpeg');
      outputOptions.push('-disposition:v', 'attached_pic');
    }

    // Add metadata mapping for non-MP3
    if (!isMP3) {
      outputOptions.push('-map_metadata', String(metadataInputIndex));
      // Add book metadata tags
      if (bookMetadata) {
        if (bookMetadata.title) outputOptions.push('-metadata', `title=${bookMetadata.title}`);
        if (bookMetadata.author) outputOptions.push('-metadata', `artist=${bookMetadata.author}`);
        if (bookMetadata.author) outputOptions.push('-metadata', `album_artist=${bookMetadata.author}`);
        if (bookMetadata.genre) outputOptions.push('-metadata', `genre=${bookMetadata.genre}`);
        if (bookMetadata.year) outputOptions.push('-metadata', `date=${bookMetadata.year}`);
        if (bookMetadata.narrator) outputOptions.push('-metadata', `composer=${bookMetadata.narrator}`);
      }

      // iTunes Compatibility: Use faststart to move moov atom to beginning
      // This helps iTunes/Apple devices handle very long audiobooks better
      if (options.itunesCompatibility) {
        outputOptions.push('-movflags', '+faststart');
        console.log('[MERGE] iTunes Compatibility mode enabled (faststart)');
      }
    }

    command
      .outputOptions(outputOptions)
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[MERGE] FFmpeg command:', cmd);
      })
      .on('stderr', (stderrLine) => {
        // Only log important lines to avoid spam
        if (stderrLine.includes('Error') || stderrLine.includes('error') ||
          stderrLine.includes('Opening') || stderrLine.includes('Output')) {
          console.log('[MERGE] FFmpeg:', stderrLine);
        }
      })
      .on('progress', (progress) => {
        const pct = progress.percent || 0;
        if (pct > 0) {
          console.log('[MERGE] Progress:', pct.toFixed(1) + '%');
        }
        if (mainWindow) {
          mainWindow.webContents.send('audio:progress', {
            percent: pct,
            timemark: progress.timemark,
          });
        }
      })
      .on('end', () => {
        console.log('[MERGE] FFmpeg completed successfully!');
        console.log('[MERGE] Output file:', outputPath);
        // Cleanup temp files
        try {
          fs.unlinkSync(metadataFilePath);
        } catch { /* ignore cleanup errors */ }

        resolve({ success: true, outputPath });
      })
      .on('error', (err, _stdout, stderr) => {
        console.error('[MERGE] FFmpeg error:', err.message);
        console.error('[MERGE] FFmpeg stderr:', stderr);
        // Cleanup temp files
        try {
          fs.unlinkSync(metadataFilePath);
        } catch { /* ignore cleanup errors */ }

        reject(err);
      });

    command.run();
  });
});
// ========================================
// Settings/Preferences Handlers
// ========================================

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

ipcMain.handle('settings:read', async () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[SETTINGS] Failed to read settings:', err);
  }
  return {}; // Return empty object if no settings or error
});

ipcMain.handle('settings:write', async (_event, settings: object) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('[SETTINGS] Failed to write settings:', err);
    return { success: false, error: (err as Error).message };
  }
});

ipcMain.handle('settings:select-directory', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Default Output Directory',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// ========================================
// Recent Projects Handlers
// ========================================

const RECENT_PROJECTS_FILE = path.join(app.getPath('userData'), 'recent_projects.json');

const getRecentProjects = (): { path: string; name: string; lastOpened: number }[] => {
  try {
    if (fs.existsSync(RECENT_PROJECTS_FILE)) {
      return JSON.parse(fs.readFileSync(RECENT_PROJECTS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[RECENT] Failed to read recent projects:', err);
  }
  return [];
};

ipcMain.handle('recent:read', async () => {
  return getRecentProjects();
});

ipcMain.handle('recent:add', async (_event, filePath: string) => {
  try {
    const projects = getRecentProjects();
    const name = path.basename(filePath, path.extname(filePath));

    // Remove existing entry for this path
    const filtered = projects.filter(p => p.path !== filePath);

    // Add to top
    filtered.unshift({ path: filePath, name, lastOpened: Date.now() });

    // Limit to 10
    const limited = filtered.slice(0, 10);

    fs.writeFileSync(RECENT_PROJECTS_FILE, JSON.stringify(limited, null, 2));
    return limited;
  } catch (err) {
    console.error('[RECENT] Failed to add recent project:', err);
    return [];
  }
});

ipcMain.handle('recent:clear', async () => {
  try {
    fs.writeFileSync(RECENT_PROJECTS_FILE, '[]');
    return [];
  } catch (err) {
    console.error('[RECENT] Failed to clear recent projects:', err);
    return [];
  }
});

// ========================================
// Format Conversion IPC Handlers
// ========================================

interface ConversionRequest {
  inputPath: string;
  outputFormat: 'm4b' | 'm4a' | 'mp3' | 'aac';
  bitrate?: string;
}

interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  error?: string;
}

// Helper function for conversion logic (DRY principle, MCAF compliant)
async function convertAudioFile(
  inputPath: string,
  outputFormat: 'm4b' | 'm4a' | 'mp3' | 'aac',
  bitrate: string = '128k',
  progressCallback?: (percent: number, currentTime: string) => void
): Promise<ConversionResult> {
  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const parsedPath = path.parse(inputPath);
    let outputPath = path.join(parsedPath.dir, `${parsedPath.name}.${outputFormat}`);

    // Critical: Prevent self-overwrite
    if (inputPath === outputPath) {
      outputPath = path.join(parsedPath.dir, `${parsedPath.name}_converted.${outputFormat}`);
    }

    // Security: Validate bitrate
    const validBitrates = ['64k', '96k', '128k', '192k', '256k', '320k'];
    if (!validBitrates.includes(bitrate)) {
      console.warn(`[CONVERT] Invalid bitrate '${bitrate}', defaulting to 128k`);
      bitrate = '128k';
    }

    let codec: string;
    let container: string;

    switch (outputFormat) {
      case 'm4b':
        codec = 'aac';
        container = 'ipod';
        break;
      case 'm4a':
        codec = 'aac';
        container = 'mp4';
        break;
      case 'mp3':
        codec = 'libmp3lame';
        container = 'mp3';
        break;
      case 'aac':
        codec = 'aac';
        container = 'adts';
        break;
      default:
        throw new Error(`Unsupported format: ${outputFormat}`);
    }

    console.log(`[CONVERT] ${inputPath} -> ${outputPath} (${codec})`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec(codec)
        .audioBitrate(bitrate)
        .format(container)
        .outputOptions(['-map_metadata', '0'])
        .on('start', (cmdLine: string) => {
          console.log('[CONVERT] FFmpeg command:', cmdLine);
        })
        .on('progress', (progress: { percent?: number; timemark: string }) => {
          if (progressCallback) {
            progressCallback(progress.percent || 0, progress.timemark);
          }
        })
        .on('end', () => {
          console.log('[CONVERT] Conversion complete:', outputPath);
          resolve({ success: true, inputPath, outputPath });
        })
        .on('error', (err: Error) => {
          console.error('[CONVERT] FFmpeg error:', err.message);
          reject({ success: false, inputPath, error: err.message });
        })
        .save(outputPath);
    });
  } catch (err) {
    console.error('[CONVERT] Error:', err);
    return {
      success: false,
      inputPath,
      error: (err as Error).message,
    };
  }
}

ipcMain.handle('audio:convert', async (_event, request: ConversionRequest): Promise<ConversionResult> => {
  const { inputPath, outputFormat, bitrate } = request;

  return convertAudioFile(inputPath, outputFormat, bitrate, (percent, currentTime) => {
    if (_event.sender && !_event.sender.isDestroyed()) {
      _event.sender.send('audio:convertProgress', {
        inputPath,
        percent,
        currentTime,
      });
    }
  });
});

ipcMain.handle('audio:batchConvert', async (_event, requests: ConversionRequest[]): Promise<ConversionResult[]> => {
  const results: ConversionResult[] = [];

  // Process sequentially
  for (const request of requests) {
    const result = await convertAudioFile(request.inputPath, request.outputFormat, request.bitrate);
    results.push(result);
  }

  return results;
});

// ========================================
// Chapter Splitting Handlers
// ========================================

interface ChapterInfo {
  id: number;
  title: string;
  start: number;
  end: number;
  duration: number;
}

interface SplitRequest {
  inputPath: string;
  outputDirectory: string;
  chapters: ChapterInfo[]; // Chapters to export
  outputFormat: 'm4b' | 'm4a' | 'mp3';
  fileNameTemplate: string; // e.g. "{index} - {title}"
}

ipcMain.handle('audio:read-chapters', async (_event, filePath: string) => {
  try {
    // We use spawn to run ffprobe directly to get JSON output with chapters
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const ffprobe = spawn(ffprobePath.path, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_chapters',
        '-show_format',
        filePath
      ]);

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data: any) => stdout += data);
      ffprobe.stderr.on('data', (data: any) => stderr += data);

      ffprobe.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const chapters = (data.chapters || []).map((c: any, index: number) => ({
            id: index + 1,
            title: c.tags?.title || `Chapter ${index + 1}`,
            start: parseFloat(c.start_time),
            end: parseFloat(c.end_time),
            duration: parseFloat(c.end_time) - parseFloat(c.start_time)
          }));
          resolve({
            chapters,
            duration: parseFloat(data.format?.duration || '0'),
            format: data.format?.format_name,
            bitrate: data.format?.bit_rate
          });
        } catch (err) {
          reject(new Error('Failed to parse ffprobe output'));
        }
      });
    });
  } catch (err) {
    console.error('[SPLIT] Error reading chapters:', err);
    throw err;
  }
});

ipcMain.handle('audio:split-by-chapters', async (_event, request: SplitRequest) => {
  const { inputPath, outputDirectory, chapters, outputFormat, fileNameTemplate } = request;
  const results: any[] = [];

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }



  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const safeTitle = chapter.title.replace(/[^a-z0-9]/gi, '_');

    // Construct filename
    let filename = fileNameTemplate
      .replace('{index}', String(chapter.id).padStart(2, '0'))
      .replace('{title}', safeTitle)
      + `.${outputFormat}`;

    const outputPath = path.join(outputDirectory, filename);

    const progressData = {
      message: `Splitting chapter ${i + 1}/${chapters.length}`,
      current: i + 1,
      total: chapters.length,
      chapter: chapter.title
    };

    // Send progress to UI
    if (mainWindow) {
      mainWindow.webContents.send('audio:split-progress', progressData);
    }

    try {
      await new Promise<void>((resolve, reject) => {
        // Use ffmpeg to extract segment
        // -ss start -to end -c copy (fast stream copy) avoiding re-encode
        const cmd = ffmpeg(inputPath)
          .setStartTime(chapter.start)
          .setDuration(chapter.duration)
          .output(outputPath)
          // Try to copy codec if possible (m4b->m4b), otherwise re-encode might be needed
          // For now, default to stream copy for speed and quality
          .outputOptions(['-c', 'copy', '-map_metadata', '0'])
          .outputOptions([
            '-metadata', `track=${chapter.id}/${chapters.length}`,
            '-metadata', `title=${chapter.title}`
          ])
          .on('end', () => resolve())
          .on('error', (err) => reject(err));

        cmd.run();
      });
      results.push({ success: true, path: outputPath, chapterId: chapter.id });
    } catch (err) {
      console.error(`[SPLIT] Failed chapter ${chapter.id}:`, err);
      results.push({ success: false, error: (err as Error).message, chapterId: chapter.id });
    }
  }

  return { success: true, results };
});

// ========================================
// Silence Detection for Auto-Chaptering
// ========================================

interface SilenceDetectOptions {
  filePath: string;
  noiseThreshold?: number; // dB threshold (default: -50dB)
  minDuration?: number;    // Minimum silence duration in seconds (default: 1.5s)
}

interface SilenceGap {
  start: number;   // Silence start in seconds
  end: number;     // Silence end in seconds
  duration: number;
}

interface SilenceDetectResult {
  success: boolean;
  silences: SilenceGap[];
  suggestedChapters: { start: number; end: number; duration: number }[];
  totalDuration: number;
  error?: string;
}

ipcMain.handle('audio:detect-silence', async (_event, options: SilenceDetectOptions): Promise<SilenceDetectResult> => {
  const { filePath, noiseThreshold = -50, minDuration = 1.5 } = options;

  console.log(`[SILENCE] Detecting silence in: ${filePath}`);
  console.log(`[SILENCE] Params: noise=${noiseThreshold}dB, minDuration=${minDuration}s`);

  if (!fs.existsSync(filePath)) {
    return { success: false, silences: [], suggestedChapters: [], totalDuration: 0, error: 'File not found' };
  }

  // First get total duration using ffprobe
  const getDuration = (): Promise<number> => {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          resolve(0);
        } else {
          resolve(metadata.format?.duration || 0);
        }
      });
    });
  };

  const totalDuration = await getDuration();

  return new Promise((resolve) => {
    const silences: SilenceGap[] = [];
    let stderrOutput = '';

    // Use silencedetect filter
    // Output format: [silencedetect @ 0x...] silence_start: 10.5
    //                [silencedetect @ 0x...] silence_end: 12.3 | silence_duration: 1.8
    ffmpeg(filePath)
      .audioFilters(`silencedetect=noise=${noiseThreshold}dB:d=${minDuration}`)
      .format('null')
      .output('-') // Output to null (we only care about stderr)
      .on('start', (cmd) => {
        console.log('[SILENCE] FFmpeg command:', cmd);
      })
      .on('stderr', (line) => {
        stderrOutput += line + '\n';

        // Parse silence_start
        const startMatch = line.match(/silence_start:\s*([\d.]+)/);
        if (startMatch) {
          silences.push({
            start: parseFloat(startMatch[1]),
            end: 0,
            duration: 0
          });
        }

        // Parse silence_end and duration
        const endMatch = line.match(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/);
        if (endMatch && silences.length > 0) {
          const lastSilence = silences[silences.length - 1];
          lastSilence.end = parseFloat(endMatch[1]);
          lastSilence.duration = parseFloat(endMatch[2]);
        }
      })
      .on('progress', (progress) => {
        // Send progress to UI
        if (mainWindow && progress.percent) {
          mainWindow.webContents.send('audio:silence-progress', {
            percent: progress.percent,
            timemark: progress.timemark
          });
        }
      })
      .on('end', () => {
        console.log(`[SILENCE] Detected ${silences.length} silence gaps`);

        // Generate suggested chapters based on silence gaps
        // Chapters are the segments BETWEEN silences
        const suggestedChapters: { start: number; end: number; duration: number }[] = [];

        if (silences.length === 0) {
          // No silence detected - entire file is one chapter
          suggestedChapters.push({
            start: 0,
            end: totalDuration,
            duration: totalDuration
          });
        } else {
          // First chapter: from start to first silence
          if (silences[0].start > 0.5) {
            suggestedChapters.push({
              start: 0,
              end: silences[0].start,
              duration: silences[0].start
            });
          }

          // Middle chapters: between silence gaps
          for (let i = 0; i < silences.length - 1; i++) {
            const chapterStart = silences[i].end;
            const chapterEnd = silences[i + 1].start;
            const chapterDuration = chapterEnd - chapterStart;

            // Only add if chapter is at least 30 seconds
            if (chapterDuration >= 30) {
              suggestedChapters.push({
                start: chapterStart,
                end: chapterEnd,
                duration: chapterDuration
              });
            }
          }

          // Last chapter: from last silence to end
          const lastSilence = silences[silences.length - 1];
          if (totalDuration - lastSilence.end > 0.5) {
            suggestedChapters.push({
              start: lastSilence.end,
              end: totalDuration,
              duration: totalDuration - lastSilence.end
            });
          }
        }

        console.log(`[SILENCE] Suggested ${suggestedChapters.length} chapters`);
        resolve({
          success: true,
          silences,
          suggestedChapters,
          totalDuration
        });
      })
      .on('error', (err) => {
        console.error('[SILENCE] Error:', err.message);
        resolve({
          success: false,
          silences: [],
          suggestedChapters: [],
          totalDuration,
          error: err.message
        });
      })
      .run();
  });
});

// ========================================
// Export Enhancements
// ========================================

ipcMain.on('file:start-drag', (event, filePath: string) => {
  if (fs.existsSync(filePath)) {
    event.sender.startDrag({
      file: filePath,
      icon: path.join(__dirname, '../public/file-icon.png'), // Fallback icon path (may need adjustment)
    });
  }
});

ipcMain.handle('files:add-to-itunes', async (_event, filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    if (process.platform === 'darwin') {
      // macOS: Use 'open -a Music'
      return new Promise((resolve, reject) => {
        exec(`open -a Music "${filePath}"`, (err) => {
          if (err) reject(err);
          else resolve({ success: true });
        });
      });
    } else if (process.platform === 'win32') {
      // Windows: Check for "Automatically Add to iTunes" folder
      const autoAddPath = path.join(os.homedir(), 'Music', 'iTunes', 'iTunes Media', 'Automatically Add to iTunes');

      if (fs.existsSync(autoAddPath)) {
        const destPath = path.join(autoAddPath, path.basename(filePath));
        fs.copyFileSync(filePath, destPath);
        console.log('[ITUNES] Copied to Auto-Add folder:', destPath);
        return { success: true, method: 'copy' };
      } else {
        // Fallback: Open with default player (likely iTunes)
        await shell.openPath(filePath);
        return { success: true, method: 'open' };
      }
    } else {
      // Linux/Other: Just open
      await shell.openPath(filePath);
      return { success: true, method: 'open' };
    }
  } catch (err) {
    console.error('[ITUNES] Error adding to library:', err);
    return { success: false, error: (err as Error).message };
  }
});
