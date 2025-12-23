import { contextBridge as n, ipcRenderer as o, webUtils as t } from "electron";
n.exposeInMainWorld("electron", {
  openFiles: () => o.invoke("dialog:open-files"),
  // Window controls
  minimize: () => o.send("window:minimize"),
  maximize: () => o.send("window:maximize"),
  close: () => o.send("window:close"),
  audio: {
    getPathForFile: (e) => {
      const i = t.getPathForFile(e);
      return console.log("[PRELOAD] getPathForFile:", e.name, "->", i), i;
    },
    readMetadata: (e) => o.invoke("audio:read-metadata", e),
    process: (e) => o.invoke("audio:process", e),
    detectArtwork: (e) => o.invoke("audio:detect-artwork", e),
    onProgress: (e) => {
      o.on("audio:progress", (i, r) => e(r));
    },
    removeProgressListener: () => {
      o.removeAllListeners("audio:progress");
    }
  },
  project: {
    save: (e) => o.invoke("project:save", e),
    load: () => o.invoke("project:load")
  }
});
