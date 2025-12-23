import { app as v, BrowserWindow as T, ipcMain as u, dialog as y } from "electron";
import f from "path";
import { fileURLToPath as G } from "url";
import { createRequire as W } from "module";
import S from "fluent-ffmpeg";
import I from "ffmpeg-static";
import N from "ffprobe-static";
import n from "fs";
import D from "os";
const z = W(import.meta.url), J = G(import.meta.url), O = f.dirname(J);
try {
  z("electron-squirrel-startup") && v.quit();
} catch {
}
let c = null;
const C = () => {
  c = new T({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: f.join(O, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !1,
      webSecurity: !1
    },
    autoHideMenuBar: !0,
    backgroundColor: "#050506",
    title: "Audiobook Binder",
    frame: !1,
    // Frameless for custom titlebar
    minWidth: 900,
    minHeight: 600
  }), process.env.VITE_DEV_SERVER_URL ? (c.loadURL(process.env.VITE_DEV_SERVER_URL), c.webContents.openDevTools()) : c.loadFile(f.join(O, "../dist/index.html"));
};
v.on("ready", C);
v.on("window-all-closed", () => {
  process.platform !== "darwin" && v.quit();
});
v.on("activate", () => {
  T.getAllWindows().length === 0 && C();
});
u.on("window:minimize", () => c?.minimize());
u.on("window:maximize", () => {
  c?.isMaximized() ? c.unmaximize() : c?.maximize();
});
u.on("window:close", () => c?.close());
S.setFfmpegPath(I);
S.setFfprobePath(N.path);
u.handle("audio:read-metadata", async (m, t) => new Promise((o, i) => {
  S.ffprobe(t, (d, s) => {
    if (d) {
      console.error("Error reading metadata:", d), i(d);
      return;
    }
    const e = s.format, r = e.tags || {};
    o({
      path: t,
      duration: e.duration || 0,
      title: r.title || f.basename(t),
      artist: r.artist || "Unknown Artist",
      album: r.album || "Unknown Album"
    });
  });
}));
u.handle("dialog:open-files", async () => (await y.showOpenDialog({
  title: "Select Audio Files",
  properties: ["openFile", "multiSelections"],
  filters: [
    { name: "Audio Files", extensions: ["mp3", "m4a", "m4b", "aac", "wav", "flac", "ogg"] }
  ]
})).filePaths);
u.handle("audio:show-save-dialog", async () => (await y.showSaveDialog({
  title: "Save Audiobook",
  defaultPath: "audiobook.m4b",
  filters: [
    { name: "M4B Audiobook", extensions: ["m4b"] },
    { name: "AAC Audio", extensions: ["aac"] },
    { name: "MP3 Audio", extensions: ["mp3"] }
  ]
})).filePath);
u.handle("project:save", async (m, t) => {
  const o = await y.showSaveDialog({
    title: "Save Project",
    defaultPath: "audiobook-project.adbp",
    filters: [
      { name: "ADB Binder Project", extensions: ["adbp"] },
      { name: "JSON Files", extensions: ["json"] }
    ]
  });
  if (!o.filePath)
    return { success: !1, cancelled: !0 };
  try {
    return n.writeFileSync(o.filePath, JSON.stringify(t, null, 2), "utf8"), console.log("[PROJECT] Saved to:", o.filePath), { success: !0, filePath: o.filePath };
  } catch (i) {
    return console.error("[PROJECT] Save error:", i), { success: !1, error: i.message };
  }
});
u.handle("project:load", async () => {
  const m = await y.showOpenDialog({
    title: "Open Project",
    properties: ["openFile"],
    filters: [
      { name: "ADB Binder Project", extensions: ["adbp", "json"] }
    ]
  });
  if (!m.filePaths || m.filePaths.length === 0)
    return { success: !1, cancelled: !0 };
  try {
    const t = m.filePaths[0], o = n.readFileSync(t, "utf8"), i = JSON.parse(o);
    return console.log("[PROJECT] Loaded from:", t), { success: !0, data: i, filePath: t };
  } catch (t) {
    return console.error("[PROJECT] Load error:", t), { success: !1, error: t.message };
  }
});
u.handle("audio:detect-artwork", async (m, t) => {
  if (!t || t.length === 0)
    return { found: !1 };
  console.log("[ARTWORK] Scanning for artwork from", t.length, "files");
  const o = t[0], i = f.dirname(o), d = [
    "cover.jpg",
    "cover.jpeg",
    "cover.png",
    "folder.jpg",
    "folder.jpeg",
    "folder.png",
    "album.jpg",
    "album.jpeg",
    "album.png",
    "front.jpg",
    "front.jpeg",
    "front.png",
    "artwork.jpg",
    "artwork.jpeg",
    "artwork.png"
  ];
  for (const s of d) {
    const e = f.join(i, s);
    if (n.existsSync(e)) {
      console.log("[ARTWORK] Found cover file:", e);
      try {
        const w = n.readFileSync(e).toString("base64");
        return {
          found: !0,
          source: "folder",
          data: `data:${f.extname(e).toLowerCase().slice(1) === "png" ? "image/png" : "image/jpeg"};base64,${w}`
        };
      } catch (r) {
        console.error("[ARTWORK] Error reading cover file:", r);
      }
    }
  }
  for (const s of t)
    try {
      const e = f.join(D.tmpdir(), `cover_${Date.now()}.jpg`);
      if (await new Promise((r, w) => {
        S(s).outputOptions(["-an", "-vcodec", "copy"]).output(e).on("end", () => r()).on("error", (p) => {
          r();
        }).run();
      }), n.existsSync(e)) {
        if (n.statSync(e).size > 0) {
          console.log("[ARTWORK] Extracted embedded artwork from:", s);
          const p = n.readFileSync(e).toString("base64");
          return n.unlinkSync(e), {
            found: !0,
            source: "embedded",
            data: `data:image/jpeg;base64,${p}`
          };
        }
        n.unlinkSync(e);
      }
    } catch {
    }
  return console.log("[ARTWORK] No artwork found"), { found: !1 };
});
u.handle("audio:process", async (m, t) => {
  const { files: o, bitrate: i, outputFormat: d, coverPath: s, bookMetadata: e } = t;
  if (!o || o.length === 0)
    throw new Error("No files to process");
  console.log("[MERGE] Starting merge with", o.length, "files"), o.forEach((g, R) => console.log(`[MERGE] File ${R}:`, g.path, "duration:", g.duration));
  const r = d === "mp3" ? "mp3" : d === "aac" ? "m4a" : "m4b", w = await y.showSaveDialog({
    title: "Save Audiobook",
    defaultPath: `audiobook.${r}`,
    filters: [
      { name: "M4B Audiobook", extensions: ["m4b"] },
      { name: "MP3 Audio", extensions: ["mp3"] },
      { name: "AAC Audio", extensions: ["m4a"] }
    ]
  });
  if (!w.filePath)
    return { success: !1, cancelled: !0 };
  const p = w.filePath;
  console.log("[MERGE] Output path:", p);
  const M = D.tmpdir(), P = f.join(M, `metadata_${Date.now()}.txt`);
  let E = `;FFMETADATA1
`, A = 0;
  const j = d === "mp3" || p.endsWith(".mp3");
  return j || o.forEach((g, R) => {
    const x = Math.floor(A * 1e3), k = Math.floor((A + g.duration) * 1e3);
    E += `[CHAPTER]
`, E += `TIMEBASE=1/1000
`, E += `START=${x}
`, E += `END=${k}
`, E += `title=${g.title || `Chapter ${R + 1}`}
`, A += g.duration;
  }), n.writeFileSync(P, E, "utf8"), console.log("[MERGE] Metadata written to:", P), new Promise((g, R) => {
    const x = j ? "libmp3lame" : "aac", _ = `${o.map((a, b) => `[${b}:a]`).join("")}concat=n=${o.length}:v=0:a=1[outa]`;
    console.log("[MERGE] Filter complex:", _), console.log("[MERGE] Using codec:", x, "bitrate:", i || "128k");
    let h = S();
    o.forEach((a) => {
      h = h.input(a.path);
    });
    const $ = o.length;
    h = h.input(P);
    let F = -1;
    s && n.existsSync(s) && !j && (F = $ + 1, h = h.input(s), console.log("[MERGE] Cover image added at input", F, ":", s));
    const l = [
      "-filter_complex",
      _,
      "-map",
      "[outa]",
      "-c:a",
      x,
      "-b:a",
      i || "128k"
    ];
    F >= 0 && (l.push("-map", `${F}:v`), l.push("-c:v", "mjpeg"), l.push("-disposition:v", "attached_pic")), j || (l.push("-map_metadata", String($)), e && (e.title && l.push("-metadata", `title=${e.title}`), e.author && l.push("-metadata", `artist=${e.author}`), e.author && l.push("-metadata", `album_artist=${e.author}`), e.genre && l.push("-metadata", `genre=${e.genre}`), e.year && l.push("-metadata", `date=${e.year}`), e.narrator && l.push("-metadata", `composer=${e.narrator}`))), h.outputOptions(l).output(p).on("start", (a) => {
      console.log("[MERGE] FFmpeg command:", a);
    }).on("stderr", (a) => {
      (a.includes("Error") || a.includes("error") || a.includes("Opening") || a.includes("Output")) && console.log("[MERGE] FFmpeg:", a);
    }).on("progress", (a) => {
      const b = a.percent || 0;
      b > 0 && console.log("[MERGE] Progress:", b.toFixed(1) + "%"), c && c.webContents.send("audio:progress", {
        percent: b,
        timemark: a.timemark
      });
    }).on("end", () => {
      console.log("[MERGE] FFmpeg completed successfully!"), console.log("[MERGE] Output file:", p);
      try {
        n.unlinkSync(P);
      } catch {
      }
      g({ success: !0, outputPath: p });
    }).on("error", (a, b, B) => {
      console.error("[MERGE] FFmpeg error:", a.message), console.error("[MERGE] FFmpeg stderr:", B);
      try {
        n.unlinkSync(P);
      } catch {
      }
      R(a);
    }), h.run();
  });
});
