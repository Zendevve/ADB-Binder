import { app as T, BrowserWindow as L, ipcMain as p, dialog as v, shell as G } from "electron";
import { exec as q } from "child_process";
import m from "path";
import { fileURLToPath as K } from "url";
import { createRequire as H } from "module";
import d from "fs";
import F from "fluent-ffmpeg";
import Y from "ffmpeg-static";
import B from "ffprobe-static";
import A from "os";
const V = H(import.meta.url), Q = K(import.meta.url), O = m.dirname(Q);
try {
  V("electron-squirrel-startup") && T.quit();
} catch {
}
let g = null;
const J = () => {
  const n = !!process.env.VITE_DEV_SERVER_URL;
  n && (process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true"), g = new L({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: m.join(O, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !1,
      webSecurity: !n
      // Enable in production, disable in dev for CORS
    },
    autoHideMenuBar: !0,
    backgroundColor: "#050506",
    title: "Audiobook Toolkit",
    frame: !1,
    // Frameless for custom titlebar
    minWidth: 900,
    minHeight: 600
  }), process.env.VITE_DEV_SERVER_URL ? (g.loadURL(process.env.VITE_DEV_SERVER_URL), g.webContents.openDevTools()) : g.loadFile(m.join(O, "../dist/index.html"));
};
T.on("ready", J);
T.on("window-all-closed", () => {
  process.platform !== "darwin" && T.quit();
});
T.on("activate", () => {
  L.getAllWindows().length === 0 && J();
});
p.on("window:minimize", () => g?.minimize());
p.on("window:maximize", () => {
  g?.isMaximized() ? g.unmaximize() : g?.maximize();
});
p.on("window:close", () => g?.close());
F.setFfmpegPath(Y);
F.setFfprobePath(B.path);
p.handle("audio:read-metadata", async (n, t) => new Promise((e, a) => {
  F.ffprobe(t, (s, l) => {
    if (s) {
      console.error("Error reading metadata:", s), a(s);
      return;
    }
    const o = l.format, c = o.tags || {};
    e({
      path: t,
      duration: o.duration || 0,
      title: c.title || m.basename(t),
      artist: c.artist || "Unknown Artist",
      album: c.album || "Unknown Album"
    });
  });
}));
p.handle("dialog:open-files", async () => (await v.showOpenDialog({
  title: "Select Audio Files",
  properties: ["openFile", "multiSelections"],
  filters: [
    { name: "Audio Files", extensions: ["mp3", "m4a", "m4b", "aac", "wav", "flac", "ogg"] }
  ]
})).filePaths);
p.handle("audio:show-save-dialog", async () => (await v.showSaveDialog({
  title: "Save Audiobook",
  defaultPath: "audiobook.m4b",
  filters: [
    { name: "M4B Audiobook", extensions: ["m4b"] },
    { name: "AAC Audio", extensions: ["aac"] },
    { name: "MP3 Audio", extensions: ["mp3"] }
  ]
})).filePath);
p.handle("project:save", async (n, t) => {
  const e = await v.showSaveDialog({
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
    return d.writeFileSync(e.filePath, JSON.stringify(t, null, 2), "utf8"), console.log("[PROJECT] Saved to:", e.filePath), { success: !0, filePath: e.filePath };
  } catch (a) {
    return console.error("[PROJECT] Save error:", a), { success: !1, error: a.message };
  }
});
p.handle("project:load", async (n, t) => {
  let e = t;
  if (!e) {
    const a = await v.showOpenDialog({
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
    const a = d.readFileSync(e, "utf8"), s = JSON.parse(a);
    return console.log("[PROJECT] Loaded from:", e), { success: !0, data: s, filePath: e };
  } catch (a) {
    return console.error("[PROJECT] Load error:", a), { success: !1, error: a.message };
  }
});
p.handle("audio:detect-artwork", async (n, t) => {
  if (!t || t.length === 0)
    return { found: !1 };
  console.log("[ARTWORK] Scanning for artwork from", t.length, "files");
  const e = t[0], a = m.dirname(e), s = [
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
  for (const l of s) {
    const o = m.join(a, l);
    if (d.existsSync(o)) {
      console.log("[ARTWORK] Found cover file:", o);
      try {
        const i = d.readFileSync(o).toString("base64");
        return {
          found: !0,
          source: "folder",
          data: `data:${m.extname(o).toLowerCase().slice(1) === "png" ? "image/png" : "image/jpeg"};base64,${i}`
        };
      } catch (c) {
        console.error("[ARTWORK] Error reading cover file:", c);
      }
    }
  }
  for (const l of t)
    try {
      const o = m.join(A.tmpdir(), `cover_${Date.now()}.jpg`);
      if (await new Promise((c, i) => {
        F(l).outputOptions(["-an", "-vcodec", "copy"]).output(o).on("end", () => c()).on("error", (r) => {
          c();
        }).run();
      }), d.existsSync(o)) {
        if (d.statSync(o).size > 0) {
          console.log("[ARTWORK] Extracted embedded artwork from:", l);
          const r = d.readFileSync(o).toString("base64");
          return d.unlinkSync(o), {
            found: !0,
            source: "embedded",
            data: `data:image/jpeg;base64,${r}`
          };
        }
        d.unlinkSync(o);
      }
    } catch {
    }
  return console.log("[ARTWORK] No artwork found"), { found: !1 };
});
p.handle("audio:process", async (n, t) => {
  const { files: e, bitrate: a, outputFormat: s, coverPath: l, bookMetadata: o, defaultOutputDirectory: c } = t;
  if (!e || e.length === 0)
    throw new Error("No files to process");
  console.log("[MERGE] Starting merge with", e.length, "files"), e.forEach((b, j) => console.log(`[MERGE] File ${j}:`, b.path, "duration:", b.duration));
  let r = `audiobook.${s === "mp3" ? "mp3" : s === "aac" ? "m4a" : "m4b"}`;
  c && (r = m.join(c, r));
  const f = await v.showSaveDialog({
    title: "Save Audiobook",
    defaultPath: r,
    filters: [
      { name: "M4B Audiobook", extensions: ["m4b"] },
      { name: "MP3 Audio", extensions: ["mp3"] },
      { name: "AAC Audio", extensions: ["m4a"] }
    ]
  });
  if (!f.filePath)
    return { success: !1, cancelled: !0 };
  const u = f.filePath;
  console.log("[MERGE] Output path:", u);
  const w = A.tmpdir(), S = m.join(w, `metadata_${Date.now()}.txt`);
  let E = `;FFMETADATA1
`, $ = 0;
  const P = s === "mp3" || u.endsWith(".mp3");
  return P || e.forEach((b, j) => {
    const k = Math.floor($ * 1e3), N = Math.floor(($ + b.duration) * 1e3);
    E += `[CHAPTER]
`, E += `TIMEBASE=1/1000
`, E += `START=${k}
`, E += `END=${N}
`, E += `title=${b.title || `Chapter ${j + 1}`}
`, $ += b.duration;
  }), d.writeFileSync(S, E, "utf8"), console.log("[MERGE] Metadata written to:", S), new Promise((b, j) => {
    const k = P ? "libmp3lame" : "aac", M = `${e.map((h, _) => `[${_}:a]`).join("")}concat=n=${e.length}:v=0:a=1[outa]`;
    console.log("[MERGE] Filter complex:", M), console.log("[MERGE] Using codec:", k, "bitrate:", a || "128k");
    let R = F();
    e.forEach((h) => {
      R = R.input(h.path);
    });
    const I = e.length;
    R = R.input(S);
    let C = -1;
    l && d.existsSync(l) && !P && (C = I + 1, R = R.input(l), console.log("[MERGE] Cover image added at input", C, ":", l));
    const y = [
      "-filter_complex",
      M,
      "-map",
      "[outa]",
      "-c:a",
      k,
      "-b:a",
      a || "128k"
    ];
    C >= 0 && (y.push("-map", `${C}:v`), y.push("-c:v", "mjpeg"), y.push("-disposition:v", "attached_pic")), P || (y.push("-map_metadata", String(I)), o && (o.title && y.push("-metadata", `title=${o.title}`), o.author && y.push("-metadata", `artist=${o.author}`), o.author && y.push("-metadata", `album_artist=${o.author}`), o.genre && y.push("-metadata", `genre=${o.genre}`), o.year && y.push("-metadata", `date=${o.year}`), o.narrator && y.push("-metadata", `composer=${o.narrator}`)), t.itunesCompatibility && (y.push("-movflags", "+faststart"), console.log("[MERGE] iTunes Compatibility mode enabled (faststart)"))), R.outputOptions(y).output(u).on("start", (h) => {
      console.log("[MERGE] FFmpeg command:", h);
    }).on("stderr", (h) => {
      (h.includes("Error") || h.includes("error") || h.includes("Opening") || h.includes("Output")) && console.log("[MERGE] FFmpeg:", h);
    }).on("progress", (h) => {
      const _ = h.percent || 0;
      _ > 0 && console.log("[MERGE] Progress:", _.toFixed(1) + "%"), g && g.webContents.send("audio:progress", {
        percent: _,
        timemark: h.timemark
      });
    }).on("end", () => {
      console.log("[MERGE] FFmpeg completed successfully!"), console.log("[MERGE] Output file:", u);
      try {
        d.unlinkSync(S);
      } catch {
      }
      b({ success: !0, outputPath: u });
    }).on("error", (h, _, z) => {
      console.error("[MERGE] FFmpeg error:", h.message), console.error("[MERGE] FFmpeg stderr:", z);
      try {
        d.unlinkSync(S);
      } catch {
      }
      j(h);
    }), R.run();
  });
});
const D = m.join(T.getPath("userData"), "settings.json");
p.handle("settings:read", async () => {
  try {
    if (d.existsSync(D)) {
      const n = d.readFileSync(D, "utf8");
      return JSON.parse(n);
    }
  } catch (n) {
    console.error("[SETTINGS] Failed to read settings:", n);
  }
  return {};
});
p.handle("settings:write", async (n, t) => {
  try {
    return d.writeFileSync(D, JSON.stringify(t, null, 2), "utf8"), { success: !0 };
  } catch (e) {
    return console.error("[SETTINGS] Failed to write settings:", e), { success: !1, error: e.message };
  }
});
p.handle("settings:select-directory", async () => {
  const n = await v.showOpenDialog({
    title: "Select Default Output Directory",
    properties: ["openDirectory", "createDirectory"]
  });
  return !n.canceled && n.filePaths.length > 0 ? n.filePaths[0] : null;
});
const x = m.join(T.getPath("userData"), "recent_projects.json"), U = () => {
  try {
    if (d.existsSync(x))
      return JSON.parse(d.readFileSync(x, "utf8"));
  } catch (n) {
    console.error("[RECENT] Failed to read recent projects:", n);
  }
  return [];
};
p.handle("recent:read", async () => U());
p.handle("recent:add", async (n, t) => {
  try {
    const e = U(), a = m.basename(t, m.extname(t)), s = e.filter((o) => o.path !== t);
    s.unshift({ path: t, name: a, lastOpened: Date.now() });
    const l = s.slice(0, 10);
    return d.writeFileSync(x, JSON.stringify(l, null, 2)), l;
  } catch (e) {
    return console.error("[RECENT] Failed to add recent project:", e), [];
  }
});
p.handle("recent:clear", async () => {
  try {
    return d.writeFileSync(x, "[]"), [];
  } catch (n) {
    return console.error("[RECENT] Failed to clear recent projects:", n), [];
  }
});
async function W(n, t, e = "128k", a) {
  try {
    if (!d.existsSync(n))
      throw new Error(`Input file not found: ${n}`);
    const s = m.parse(n);
    let l = m.join(s.dir, `${s.name}.${t}`);
    n === l && (l = m.join(s.dir, `${s.name}_converted.${t}`)), ["64k", "96k", "128k", "192k", "256k", "320k"].includes(e) || (console.warn(`[CONVERT] Invalid bitrate '${e}', defaulting to 128k`), e = "128k");
    let c, i;
    switch (t) {
      case "m4b":
        c = "aac", i = "ipod";
        break;
      case "m4a":
        c = "aac", i = "mp4";
        break;
      case "mp3":
        c = "libmp3lame", i = "mp3";
        break;
      case "aac":
        c = "aac", i = "adts";
        break;
      default:
        throw new Error(`Unsupported format: ${t}`);
    }
    return console.log(`[CONVERT] ${n} -> ${l} (${c})`), new Promise((r, f) => {
      F(n).audioCodec(c).audioBitrate(e).format(i).outputOptions(["-map_metadata", "0"]).on("start", (u) => {
        console.log("[CONVERT] FFmpeg command:", u);
      }).on("progress", (u) => {
        a && a(u.percent || 0, u.timemark);
      }).on("end", () => {
        console.log("[CONVERT] Conversion complete:", l), r({ success: !0, inputPath: n, outputPath: l });
      }).on("error", (u) => {
        console.error("[CONVERT] FFmpeg error:", u.message), f({ success: !1, inputPath: n, error: u.message });
      }).save(l);
    });
  } catch (s) {
    return console.error("[CONVERT] Error:", s), {
      success: !1,
      inputPath: n,
      error: s.message
    };
  }
}
p.handle("audio:convert", async (n, t) => {
  const { inputPath: e, outputFormat: a, bitrate: s } = t;
  return W(e, a, s, (l, o) => {
    n.sender && !n.sender.isDestroyed() && n.sender.send("audio:convertProgress", {
      inputPath: e,
      percent: l,
      currentTime: o
    });
  });
});
p.handle("audio:batchConvert", async (n, t) => {
  const e = [];
  for (const a of t) {
    const s = await W(a.inputPath, a.outputFormat, a.bitrate);
    e.push(s);
  }
  return e;
});
p.handle("audio:read-chapters", async (n, t) => {
  try {
    const { spawn: e } = V("child_process");
    return new Promise((a, s) => {
      const l = e(B.path, [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_chapters",
        "-show_format",
        t
      ]);
      let o = "", c = "";
      l.stdout.on("data", (i) => o += i), l.stderr.on("data", (i) => c += i), l.on("close", (i) => {
        if (i !== 0) {
          s(new Error(`ffprobe exited with code ${i}: ${c}`));
          return;
        }
        try {
          const r = JSON.parse(o), f = (r.chapters || []).map((u, w) => ({
            id: w + 1,
            title: u.tags?.title || `Chapter ${w + 1}`,
            start: parseFloat(u.start_time),
            end: parseFloat(u.end_time),
            duration: parseFloat(u.end_time) - parseFloat(u.start_time)
          }));
          a({
            chapters: f,
            duration: parseFloat(r.format?.duration || "0"),
            format: r.format?.format_name,
            bitrate: r.format?.bit_rate
          });
        } catch {
          s(new Error("Failed to parse ffprobe output"));
        }
      });
    });
  } catch (e) {
    throw console.error("[SPLIT] Error reading chapters:", e), e;
  }
});
p.handle("audio:split-by-chapters", async (n, t) => {
  const { inputPath: e, outputDirectory: a, chapters: s, outputFormat: l, fileNameTemplate: o } = t, c = [];
  d.existsSync(a) || d.mkdirSync(a, { recursive: !0 });
  for (let i = 0; i < s.length; i++) {
    const r = s[i], f = r.title.replace(/[^a-z0-9]/gi, "_");
    let u = o.replace("{index}", String(r.id).padStart(2, "0")).replace("{title}", f) + `.${l}`;
    const w = m.join(a, u), S = {
      message: `Splitting chapter ${i + 1}/${s.length}`,
      current: i + 1,
      total: s.length,
      chapter: r.title
    };
    g && g.webContents.send("audio:split-progress", S);
    try {
      await new Promise((E, $) => {
        F(e).setStartTime(r.start).setDuration(r.duration).output(w).outputOptions(["-c", "copy", "-map_metadata", "0"]).outputOptions([
          "-metadata",
          `track=${r.id}/${s.length}`,
          "-metadata",
          `title=${r.title}`
        ]).on("end", () => E()).on("error", (b) => $(b)).run();
      }), c.push({ success: !0, path: w, chapterId: r.id });
    } catch (E) {
      console.error(`[SPLIT] Failed chapter ${r.id}:`, E), c.push({ success: !1, error: E.message, chapterId: r.id });
    }
  }
  return { success: !0, results: c };
});
p.handle("audio:detect-silence", async (n, t) => {
  const { filePath: e, noiseThreshold: a = -50, minDuration: s = 1.5 } = t;
  if (console.log(`[SILENCE] Detecting silence in: ${e}`), console.log(`[SILENCE] Params: noise=${a}dB, minDuration=${s}s`), !d.existsSync(e))
    return { success: !1, silences: [], suggestedChapters: [], totalDuration: 0, error: "File not found" };
  const o = await new Promise((c) => {
    F.ffprobe(e, (i, r) => {
      c(i ? 0 : r.format?.duration || 0);
    });
  });
  return new Promise((c) => {
    const i = [];
    F(e).audioFilters(`silencedetect=noise=${a}dB:d=${s}`).format("null").output("-").on("start", (r) => {
      console.log("[SILENCE] FFmpeg command:", r);
    }).on("stderr", (r) => {
      const f = r.match(/silence_start:\s*([\d.]+)/);
      f && i.push({
        start: parseFloat(f[1]),
        end: 0,
        duration: 0
      });
      const u = r.match(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/);
      if (u && i.length > 0) {
        const w = i[i.length - 1];
        w.end = parseFloat(u[1]), w.duration = parseFloat(u[2]);
      }
    }).on("progress", (r) => {
      g && r.percent && g.webContents.send("audio:silence-progress", {
        percent: r.percent,
        timemark: r.timemark
      });
    }).on("end", () => {
      console.log(`[SILENCE] Detected ${i.length} silence gaps`);
      const r = [];
      if (i.length === 0)
        r.push({
          start: 0,
          end: o,
          duration: o
        });
      else {
        i[0].start > 0.5 && r.push({
          start: 0,
          end: i[0].start,
          duration: i[0].start
        });
        for (let u = 0; u < i.length - 1; u++) {
          const w = i[u].end, S = i[u + 1].start, E = S - w;
          E >= 30 && r.push({
            start: w,
            end: S,
            duration: E
          });
        }
        const f = i[i.length - 1];
        o - f.end > 0.5 && r.push({
          start: f.end,
          end: o,
          duration: o - f.end
        });
      }
      console.log(`[SILENCE] Suggested ${r.length} chapters`), c({
        success: !0,
        silences: i,
        suggestedChapters: r,
        totalDuration: o
      });
    }).on("error", (r) => {
      console.error("[SILENCE] Error:", r.message), c({
        success: !1,
        silences: [],
        suggestedChapters: [],
        totalDuration: o,
        error: r.message
      });
    }).run();
  });
});
p.on("file:start-drag", (n, t) => {
  d.existsSync(t) && n.sender.startDrag({
    file: t,
    icon: m.join(O, "../public/file-icon.png")
    // Fallback icon path (may need adjustment)
  });
});
p.handle("files:add-to-itunes", async (n, t) => {
  try {
    if (!d.existsSync(t))
      throw new Error("File not found");
    if (process.platform === "darwin")
      return new Promise((e, a) => {
        q(`open -a Music "${t}"`, (s) => {
          s ? a(s) : e({ success: !0 });
        });
      });
    if (process.platform === "win32") {
      const e = m.join(A.homedir(), "Music", "iTunes", "iTunes Media", "Automatically Add to iTunes");
      if (d.existsSync(e)) {
        const a = m.join(e, m.basename(t));
        return d.copyFileSync(t, a), console.log("[ITUNES] Copied to Auto-Add folder:", a), { success: !0, method: "copy" };
      } else
        return await G.openPath(t), { success: !0, method: "open" };
    } else
      return await G.openPath(t), { success: !0, method: "open" };
  } catch (e) {
    return console.error("[ITUNES] Error adding to library:", e), { success: !1, error: e.message };
  }
});
