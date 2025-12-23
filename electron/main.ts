import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
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

import { dialog } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import fs from 'fs';
import os from 'os';

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
      { name: 'ADB Binder Project', extensions: ['adbp'] },
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
ipcMain.handle('project:load', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Project',
    properties: ['openFile'],
    filters: [
      { name: 'ADB Binder Project', extensions: ['adbp', 'json'] },
    ],
  });

  if (!result.filePaths || result.filePaths.length === 0) {
    return { success: false, cancelled: true };
  }

  try {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');
    const projectData = JSON.parse(content);
    console.log('[PROJECT] Loaded from:', filePath);
    return { success: true, data: projectData, filePath };
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
  const { files, bitrate, outputFormat, coverPath, bookMetadata } = options;

  if (!files || files.length === 0) {
    throw new Error('No files to process');
  }

  console.log('[MERGE] Starting merge with', files.length, 'files');
  files.forEach((f, i) => console.log(`[MERGE] File ${i}:`, f.path, 'duration:', f.duration));

  // Show save dialog
  const defaultExt = outputFormat === 'mp3' ? 'mp3' : outputFormat === 'aac' ? 'm4a' : 'm4b';
  const result = await dialog.showSaveDialog({
    title: 'Save Audiobook',
    defaultPath: `audiobook.${defaultExt}`,
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

