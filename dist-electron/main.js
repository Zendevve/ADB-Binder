import { app as v, BrowserWindow as I, ipcMain as p, dialog as T } from "electron";
import m from "path";
import { fileURLToPath as z } from "url";
import { createRequire as q } from "module";
import u from "fs";
import F from "fluent-ffmpeg";
import K from "ffmpeg-static";
import G from "ffprobe-static";
import V from "os";
const B = q(import.meta.url), H = z(import.meta.url), N = m.dirname(H);
try {
  B("electron-squirrel-startup") && v.quit();
} catch {
}
let h = null;
const J = () => {
  const t = !!process.env.VITE_DEV_SERVER_URL;
  t && (process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true"), h = new I({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: m.join(N, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !1,
      webSecurity: !t
      // Enable in production, disable in dev for CORS
    },
    autoHideMenuBar: !0,
    backgroundColor: "#050506",
    title: "Audiobook Toolkit",
    frame: !1,
    // Frameless for custom titlebar
    minWidth: 900,
    minHeight: 600
  }), process.env.VITE_DEV_SERVER_URL ? (h.loadURL(process.env.VITE_DEV_SERVER_URL), h.webContents.openDevTools()) : h.loadFile(m.join(N, "../dist/index.html"));
};
v.on("ready", J);
v.on("window-all-closed", () => {
  process.platform !== "darwin" && v.quit();
});
v.on("activate", () => {
  I.getAllWindows().length === 0 && J();
});
p.on("window:minimize", () => h?.minimize());
p.on("window:maximize", () => {
  h?.isMaximized() ? h.unmaximize() : h?.maximize();
});
p.on("window:close", () => h?.close());
F.setFfmpegPath(K);
F.setFfprobePath(G.path);
p.handle("audio:read-metadata", async (t, r) => new Promise((e, a) => {
  F.ffprobe(r, (n, s) => {
    if (n) {
      console.error("Error reading metadata:", n), a(n);
      return;
    }
    const o = s.format, i = o.tags || {};
    e({
      path: r,
      duration: o.duration || 0,
      title: i.title || m.basename(r),
      artist: i.artist || "Unknown Artist",
      album: i.album || "Unknown Album"
    });
  });
}));
p.handle("dialog:open-files", async () => (await T.showOpenDialog({
  title: "Select Audio Files",
  properties: ["openFile", "multiSelections"],
  filters: [
    { name: "Audio Files", extensions: ["mp3", "m4a", "m4b", "aac", "wav", "flac", "ogg"] }
  ]
})).filePaths);
p.handle("audio:show-save-dialog", async () => (await T.showSaveDialog({
  title: "Save Audiobook",
  defaultPath: "audiobook.m4b",
  filters: [
    { name: "M4B Audiobook", extensions: ["m4b"] },
    { name: "AAC Audio", extensions: ["aac"] },
    { name: "MP3 Audio", extensions: ["mp3"] }
  ]
})).filePath);
p.handle("project:save", async (t, r) => {
  const e = await T.showSaveDialog({
    title: "Save Project",
    defaultPath: "audiobook-project.adbp",
    filters: [
      { name: "Audiobook Toolkit Project", extensions: ["adbp"] },
      { name: "JSON Files", extensions: ["json"] }
    ]
  });
  if (!e.filePath)
    return { success: !1, cancelled: !0 };
  try {
    return u.writeFileSync(e.filePath, JSON.stringify(r, null, 2), "utf8"), console.log("[PROJECT] Saved to:", e.filePath), { success: !0, filePath: e.filePath };
  } catch (a) {
    return console.error("[PROJECT] Save error:", a), { success: !1, error: a.message };
  }
});
p.handle("project:load", async (t, r) => {
  let e = r;
  if (!e) {
    const a = await T.showOpenDialog({
      title: "Open Project",
      properties: ["openFile"],
      filters: [
        { name: "Audiobook Toolkit Project", extensions: ["adbp", "json"] }
      ]
    });
    if (!a.filePaths || a.filePaths.length === 0)
      return { success: !1, cancelled: !0 };
    e = a.filePaths[0];
  }
  try {
    const a = u.readFileSync(e, "utf8"), n = JSON.parse(a);
    return console.log("[PROJECT] Loaded from:", e), { success: !0, data: n, filePath: e };
  } catch (a) {
    return console.error("[PROJECT] Load error:", a), { success: !1, error: a.message };
  }
});
p.handle("audio:detect-artwork", async (t, r) => {
  if (!r || r.length === 0)
    return { found: !1 };
  console.log("[ARTWORK] Scanning for artwork from", r.length, "files");
  const e = r[0], a = m.dirname(e), n = [
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
  for (const s of n) {
    const o = m.join(a, s);
    if (u.existsSync(o)) {
      console.log("[ARTWORK] Found cover file:", o);
      try {
        const l = u.readFileSync(o).toString("base64");
        return {
          found: !0,
          source: "folder",
          data: `data:${m.extname(o).toLowerCase().slice(1) === "png" ? "image/png" : "image/jpeg"};base64,${l}`
        };
      } catch (i) {
        console.error("[ARTWORK] Error reading cover file:", i);
      }
    }
  }
  for (const s of r)
    try {
      const o = m.join(V.tmpdir(), `cover_${Date.now()}.jpg`);
      if (await new Promise((i, l) => {
        F(s).outputOptions(["-an", "-vcodec", "copy"]).output(o).on("end", () => i()).on("error", (c) => {
          i();
        }).run();
      }), u.existsSync(o)) {
        if (u.statSync(o).size > 0) {
          console.log("[ARTWORK] Extracted embedded artwork from:", s);
          const c = u.readFileSync(o).toString("base64");
          return u.unlinkSync(o), {
            found: !0,
            source: "embedded",
            data: `data:image/jpeg;base64,${c}`
          };
        }
        u.unlinkSync(o);
      }
    } catch {
    }
  return console.log("[ARTWORK] No artwork found"), { found: !1 };
});
p.handle("audio:process", async (t, r) => {
  const { files: e, bitrate: a, outputFormat: n, coverPath: s, bookMetadata: o, defaultOutputDirectory: i } = r;
  if (!e || e.length === 0)
    throw new Error("No files to process");
  console.log("[MERGE] Starting merge with", e.length, "files"), e.forEach((w, j) => console.log(`[MERGE] File ${j}:`, w.path, "duration:", w.duration));
  let c = `audiobook.${n === "mp3" ? "mp3" : n === "aac" ? "m4a" : "m4b"}`;
  i && (c = m.join(i, c));
  const y = await T.showSaveDialog({
    title: "Save Audiobook",
    defaultPath: c,
    filters: [
      { name: "M4B Audiobook", extensions: ["m4b"] },
      { name: "MP3 Audio", extensions: ["mp3"] },
      { name: "AAC Audio", extensions: ["m4a"] }
    ]
  });
  if (!y.filePath)
    return { success: !1, cancelled: !0 };
  const d = y.filePath;
  console.log("[MERGE] Output path:", d);
  const b = V.tmpdir(), R = m.join(b, `metadata_${Date.now()}.txt`);
  let E = `;FFMETADATA1
`, k = 0;
  const P = n === "mp3" || d.endsWith(".mp3");
  return P || e.forEach((w, j) => {
    const $ = Math.floor(k * 1e3), A = Math.floor((k + w.duration) * 1e3);
    E += `[CHAPTER]
`, E += `TIMEBASE=1/1000
`, E += `START=${$}
`, E += `END=${A}
`, E += `title=${w.title || `Chapter ${j + 1}`}
`, k += w.duration;
  }), u.writeFileSync(R, E, "utf8"), console.log("[MERGE] Metadata written to:", R), new Promise((w, j) => {
    const $ = P ? "libmp3lame" : "aac", D = `${e.map((f, _) => `[${_}:a]`).join("")}concat=n=${e.length}:v=0:a=1[outa]`;
    console.log("[MERGE] Filter complex:", D), console.log("[MERGE] Using codec:", $, "bitrate:", a || "128k");
    let S = F();
    e.forEach((f) => {
      S = S.input(f.path);
    });
    const M = e.length;
    S = S.input(R);
    let O = -1;
    s && u.existsSync(s) && !P && (O = M + 1, S = S.input(s), console.log("[MERGE] Cover image added at input", O, ":", s));
    const g = [
      "-filter_complex",
      D,
      "-map",
      "[outa]",
      "-c:a",
      $,
      "-b:a",
      a || "128k"
    ];
    O >= 0 && (g.push("-map", `${O}:v`), g.push("-c:v", "mjpeg"), g.push("-disposition:v", "attached_pic")), P || (g.push("-map_metadata", String(M)), o && (o.title && g.push("-metadata", `title=${o.title}`), o.author && g.push("-metadata", `artist=${o.author}`), o.author && g.push("-metadata", `album_artist=${o.author}`), o.genre && g.push("-metadata", `genre=${o.genre}`), o.year && g.push("-metadata", `date=${o.year}`), o.narrator && g.push("-metadata", `composer=${o.narrator}`)), r.itunesCompatibility && (g.push("-movflags", "+faststart"), console.log("[MERGE] iTunes Compatibility mode enabled (faststart)"))), S.outputOptions(g).output(d).on("start", (f) => {
      console.log("[MERGE] FFmpeg command:", f);
    }).on("stderr", (f) => {
      (f.includes("Error") || f.includes("error") || f.includes("Opening") || f.includes("Output")) && console.log("[MERGE] FFmpeg:", f);
    }).on("progress", (f) => {
      const _ = f.percent || 0;
      _ > 0 && console.log("[MERGE] Progress:", _.toFixed(1) + "%"), h && h.webContents.send("audio:progress", {
        percent: _,
        timemark: f.timemark
      });
    }).on("end", () => {
      console.log("[MERGE] FFmpeg completed successfully!"), console.log("[MERGE] Output file:", d);
      try {
        u.unlinkSync(R);
      } catch {
      }
      w({ success: !0, outputPath: d });
    }).on("error", (f, _, U) => {
      console.error("[MERGE] FFmpeg error:", f.message), console.error("[MERGE] FFmpeg stderr:", U);
      try {
        u.unlinkSync(R);
      } catch {
      }
      j(f);
    }), S.run();
  });
});
const C = m.join(v.getPath("userData"), "settings.json");
p.handle("settings:read", async () => {
  try {
    if (u.existsSync(C)) {
      const t = u.readFileSync(C, "utf8");
      return JSON.parse(t);
    }
  } catch (t) {
    console.error("[SETTINGS] Failed to read settings:", t);
  }
  return {};
});
p.handle("settings:write", async (t, r) => {
  try {
    return u.writeFileSync(C, JSON.stringify(r, null, 2), "utf8"), { success: !0 };
  } catch (e) {
    return console.error("[SETTINGS] Failed to write settings:", e), { success: !1, error: e.message };
  }
});
p.handle("settings:select-directory", async () => {
  const t = await T.showOpenDialog({
    title: "Select Default Output Directory",
    properties: ["openDirectory", "createDirectory"]
  });
  return !t.canceled && t.filePaths.length > 0 ? t.filePaths[0] : null;
});
const x = m.join(v.getPath("userData"), "recent_projects.json"), L = () => {
  try {
    if (u.existsSync(x))
      return JSON.parse(u.readFileSync(x, "utf8"));
  } catch (t) {
    console.error("[RECENT] Failed to read recent projects:", t);
  }
  return [];
};
p.handle("recent:read", async () => L());
p.handle("recent:add", async (t, r) => {
  try {
    const e = L(), a = m.basename(r, m.extname(r)), n = e.filter((o) => o.path !== r);
    n.unshift({ path: r, name: a, lastOpened: Date.now() });
    const s = n.slice(0, 10);
    return u.writeFileSync(x, JSON.stringify(s, null, 2)), s;
  } catch (e) {
    return console.error("[RECENT] Failed to add recent project:", e), [];
  }
});
p.handle("recent:clear", async () => {
  try {
    return u.writeFileSync(x, "[]"), [];
  } catch (t) {
    return console.error("[RECENT] Failed to clear recent projects:", t), [];
  }
});
async function W(t, r, e = "128k", a) {
  try {
    if (!u.existsSync(t))
      throw new Error(`Input file not found: ${t}`);
    const n = m.parse(t);
    let s = m.join(n.dir, `${n.name}.${r}`);
    t === s && (s = m.join(n.dir, `${n.name}_converted.${r}`)), ["64k", "96k", "128k", "192k", "256k", "320k"].includes(e) || (console.warn(`[CONVERT] Invalid bitrate '${e}', defaulting to 128k`), e = "128k");
    let i, l;
    switch (r) {
      case "m4b":
        i = "aac", l = "ipod";
        break;
      case "m4a":
        i = "aac", l = "mp4";
        break;
      case "mp3":
        i = "libmp3lame", l = "mp3";
        break;
      case "aac":
        i = "aac", l = "adts";
        break;
      default:
        throw new Error(`Unsupported format: ${r}`);
    }
    return console.log(`[CONVERT] ${t} -> ${s} (${i})`), new Promise((c, y) => {
      F(t).audioCodec(i).audioBitrate(e).format(l).outputOptions(["-map_metadata", "0"]).on("start", (d) => {
        console.log("[CONVERT] FFmpeg command:", d);
      }).on("progress", (d) => {
        a && a(d.percent || 0, d.timemark);
      }).on("end", () => {
        console.log("[CONVERT] Conversion complete:", s), c({ success: !0, inputPath: t, outputPath: s });
      }).on("error", (d) => {
        console.error("[CONVERT] FFmpeg error:", d.message), y({ success: !1, inputPath: t, error: d.message });
      }).save(s);
    });
  } catch (n) {
    return console.error("[CONVERT] Error:", n), {
      success: !1,
      inputPath: t,
      error: n.message
    };
  }
}
p.handle("audio:convert", async (t, r) => {
  const { inputPath: e, outputFormat: a, bitrate: n } = r;
  return W(e, a, n, (s, o) => {
    t.sender && !t.sender.isDestroyed() && t.sender.send("audio:convertProgress", {
      inputPath: e,
      percent: s,
      currentTime: o
    });
  });
});
p.handle("audio:batchConvert", async (t, r) => {
  const e = [];
  for (const a of r) {
    const n = await W(a.inputPath, a.outputFormat, a.bitrate);
    e.push(n);
  }
  return e;
});
p.handle("audio:read-chapters", async (t, r) => {
  try {
    const { spawn: e } = B("child_process");
    return new Promise((a, n) => {
      const s = e(G.path, [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_chapters",
        "-show_format",
        r
      ]);
      let o = "", i = "";
      s.stdout.on("data", (l) => o += l), s.stderr.on("data", (l) => i += l), s.on("close", (l) => {
        if (l !== 0) {
          n(new Error(`ffprobe exited with code ${l}: ${i}`));
          return;
        }
        try {
          const c = JSON.parse(o), y = (c.chapters || []).map((d, b) => ({
            id: b + 1,
            title: d.tags?.title || `Chapter ${b + 1}`,
            start: parseFloat(d.start_time),
            end: parseFloat(d.end_time),
            duration: parseFloat(d.end_time) - parseFloat(d.start_time)
          }));
          a({
            chapters: y,
            duration: parseFloat(c.format?.duration || "0"),
            format: c.format?.format_name,
            bitrate: c.format?.bit_rate
          });
        } catch {
          n(new Error("Failed to parse ffprobe output"));
        }
      });
    });
  } catch (e) {
    throw console.error("[SPLIT] Error reading chapters:", e), e;
  }
});
p.handle("audio:split-by-chapters", async (t, r) => {
  const { inputPath: e, outputDirectory: a, chapters: n, outputFormat: s, fileNameTemplate: o } = r, i = [];
  u.existsSync(a) || u.mkdirSync(a, { recursive: !0 });
  for (let l = 0; l < n.length; l++) {
    const c = n[l], y = c.title.replace(/[^a-z0-9]/gi, "_");
    let d = o.replace("{index}", String(c.id).padStart(2, "0")).replace("{title}", y) + `.${s}`;
    const b = m.join(a, d), R = {
      message: `Splitting chapter ${l + 1}/${n.length}`,
      current: l + 1,
      total: n.length,
      chapter: c.title
    };
    h && h.webContents.send("audio:split-progress", R);
    try {
      await new Promise((E, k) => {
        F(e).setStartTime(c.start).setDuration(c.duration).output(b).outputOptions(["-c", "copy", "-map_metadata", "0"]).outputOptions([
          "-metadata",
          `track=${c.id}/${n.length}`,
          "-metadata",
          `title=${c.title}`
        ]).on("end", () => E()).on("error", (w) => k(w)).run();
      }), i.push({ success: !0, path: b, chapterId: c.id });
    } catch (E) {
      console.error(`[SPLIT] Failed chapter ${c.id}:`, E), i.push({ success: !1, error: E.message, chapterId: c.id });
    }
  }
  return { success: !0, results: i };
});
