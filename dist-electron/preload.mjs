import { contextBridge as s, ipcRenderer as o, webUtils as n } from "electron";
s.exposeInMainWorld("electron", {
  openFiles: () => o.invoke("dialog:open-files"),
  // Window controls
  minimize: () => o.send("window:minimize"),
  maximize: () => o.send("window:maximize"),
  close: () => o.send("window:close"),
  audio: {
    getPathForFile: (e) => {
      const r = n.getPathForFile(e);
      return console.log("[PRELOAD] getPathForFile:", e.name, "->", r), r;
    },
    readMetadata: (e) => o.invoke("audio:read-metadata", e),
    process: (e) => o.invoke("audio:process", e),
    detectArtwork: (e) => o.invoke("audio:detect-artwork", e),
    onProgress: (e) => {
      o.on("audio:progress", (r, i) => e(i));
    },
    removeProgressListener: () => {
      o.removeAllListeners("audio:progress");
    },
    // Format conversion
    convert: (e) => o.invoke("audio:convert", e),
    batchConvert: (e) => o.invoke("audio:batchConvert", e),
    // Chapter Splitter
    readChapters: (e) => o.invoke("audio:read-chapters", e),
    splitByChapters: (e) => o.invoke("audio:split-by-chapters", e),
    onSplitProgress: (e) => {
      o.on("audio:split-progress", (r, i) => e(i));
    },
    // Silence Detection
    detectSilence: (e) => o.invoke("audio:detect-silence", e),
    onSilenceProgress: (e) => {
      o.on("audio:silence-progress", (r, i) => e(i));
    },
    removeSilenceProgressListener: () => {
      o.removeAllListeners("audio:silence-progress");
    }
  },
  // For direct IPC access (required for image upload events)
  ipcRenderer: {
    on: (e, r) => {
      o.on(e, r);
    },
    removeAllListeners: (e) => {
      o.removeAllListeners(e);
    }
  },
  project: {
    save: (e) => o.invoke("project:save", e),
    load: () => o.invoke("project:load")
  },
  // File System & Drag-Drop
  files: {
    startDrag: (e) => o.send("file:start-drag", e),
    addToItunes: (e) => o.invoke("files:add-to-itunes", e)
  }
});
