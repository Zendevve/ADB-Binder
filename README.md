
<div align="center">
    <a href="https://github.com/Zendevve/audiobook-toolkit" target="_blank">
        <img src="docs/images/logo.png" width="200" height="200" alt="Audiobook Toolkit Logo"/>
    </a>
</div>

<h1 align="center">Audiobook Toolkit</h1>

<div align="center">

[![PRG Gold](https://img.shields.io/badge/PRG-Gold%20Project-FFD700?style=for-the-badge&logo=data:image/svg%2bxml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iMjYuMDAwMDAwcHQiIGhlaWdodD0iMzQuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCAyNi4wMDAwMDAgMzQuMDAwMDAwIgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCI+Cgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCwzNC4wMDAwMDApIHNjYWxlKDAuMTAwMDAwLC0wLjEwMDAwMCkiCmZpbGw9IiNGRkQ3MDAiIHN0cm9rZT0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAzMjggYy04IC04IC0xMiAtNTEgLTEyIC0xMzUgMCAtMTA5IDIgLTEyNSAxOSAtMTQwIDQyIC0zOCA0OAotNDIgNTkgLTMxIDcgNyAxNyA2IDMxIC0xIDEzIC03IDIxIC04IDIxIC0yIDAgNiAyOCAxMSA2MyAxMyBsNjIgMyAwIDE1MCAwCjE1MCAtMTE1IDMgYy04MSAyIC0xMTkgLTEgLTEyOCAtMTB6IG0xMDIgLTc0IGMtNiAtMzMgLTUgLTM2IDE3IC0zMiAxOCAyIDIzCjggMjEgMjUgLTMgMjQgMTUgNDAgMzAgMjUgMTQgLTE0IC0xNyAtNTkgLTQ4IC02NiAtMjAgLTUgLTIzIC0xMSAtMTggLTMyIDYKLTIxIDMgLTI1IC0xMSAtMjIgLTE2IDIgLTE4IDEzIC0xOCA2NiAxIDc3IDAgNzIgMTggNzIgMTMgMCAxNSAtNyA5IC0zNnoKbTExNiAtMTY5IGMwIC0yMyAtMyAtMjUgLTQ5IC0yNSAtNDAgMCAtNTAgMyAtNTQgMjAgLTMgMTQgLTE0IDIwIC0zMiAyMCAtMTgKMCAtMjkgLTYgLTMyIC0yMCAtNyAtMjUgLTIzIC0yNiAtMjMgLTIgMCAyOSA4IDMyIDEwMiAzMiA4NyAwIDg4IDAgODggLTI1eiIvPgo8L2c+Cjwvc3ZnPgo=)](https://github.com/scottgriv/PRG-Personal-Repository-Guidelines)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3%20%2B%20Commons%20Clause-blue.svg?style=for-the-badge)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-28-2B2E3A?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Download Prebuilt Binary](https://zendevve.gumroad.com/l/audiobook-toolkit) · [Report Bug](https://github.com/Zendevve/audiobook-toolkit/issues) · [Support Development](https://github.com/sponsors/Zendevve)

</div>

---------------

A comprehensive, open-source desktop application for managing and upgrading your digital audiobook collection. Turn scattered, proprietary, or messy audio files into a single, clean, and compatible library.

![Files Ready View](docs/images/files-ready-view.png)

## Table of Contents

- [Features](#features)
- [Background Story](#background-story)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Philosophy: Open Core](#philosophy-open-core)
- [What's Inside?](#whats-inside)
- [Contributing](#contributing)
- [License](#license)
- [Footer](#footer)

## Features

### 📚 Audiobook Binder
*Stop dealing with "Chapter 001.mp3", "Chapter 002.mp3"...*
- **Multiprocess Binding**: Merges MP3, M4A, FLAC, OGG, and WAV files into a single `.m4b` container.
- **Smart Chapters**: Automatically generates chapter markers based on input filenames or reads existing metadata.
- **Stream Copy Mode**: Detects compatible input streams (e.g., AAC input to M4B output) and stitches them without re-encoding, preserving 100% of original quality.

### ✂️ Chapter Splitter
*Extract specific chapters from a massive 30-hour audiobook file.*
- **Lossless Splitting**: Extracts chapters using FFmpeg stream copying—instant speed, zero quality loss.
- **Metadata Aware**: Reads embedded Apple layout and standard MP4/QuickTime chapter markers.
- **Precise**: Handles sample-accurate split points to ensure seamless playback.

### 🔄 Format Converter
*Modernize your library or create compatible versions for legacy devices.*
- **Batch Processing**: Queue up to 100+ files for sequential conversion.
- **Metadata Retention**: Preserves Title, Author, Narrator, Album Artist, Genre, Year, and embedded Cover Art during conversion.
- **Supported Formats**:
    - **Input**: M4B, M4A, MP3, FLAC, AAC, WAV
    - **Output**: M4B (AAC), M4A (AAC), MP3 (LAME), FLAC (Lossless)
- **High Efficiency**: Uses multi-core optimized FFmpeg encoding presets.

### 🍎 iTunes Compatibility Engine
*Fix the dreaded "forgetting playback position" bug.*
- **32-bit Integer Fix**: Modifies internal file atoms (stco/co64) to ensure compatibility with 32-bit legacy devices (iPod Classic, older iPhones, 3rd party car stereos).
- **QuickTime Optimization**: Restructures file atoms for stream-ability and faster loading on Apple Books.

### 🔍 Smart Metadata Auto-Fill
*No more manual typing of Title, Author, Narrator...*
- **Audnexus API**: Fetches rich audiobook metadata including narrators, series info, and cover art using ASIN.
- **Audible Scraper**: Falls back to scraping Audible search results when ASIN is unavailable.
- **Open Library Fallback**: Tertiary source for general book metadata.
- **3-Tier Priority**: Automatically tries Audnexus → Audible → Open Library.

### 📖 Chapter Import from Audnexus
*Get official chapter names with one click.*
- **ASIN Lookup**: Enter an Audible ASIN to fetch chapter titles from Audnexus.
- **Auto-Apply**: Chapter names are applied to your audio files in order.
- **Smart Handling**: Handles mismatches between file count and chapter count gracefully.

### 🔊 Silence Detection for Auto-Chaptering
*Automatically detect chapter breaks from audio silence.*
- **FFmpeg Analysis**: Uses the `silencedetect` audio filter to find silence gaps.
- **Configurable Sensitivity**: Adjust noise threshold (-50dB default) and minimum duration (1.5s default).
- **Suggested Chapters**: Generates chapter boundaries based on detected silence gaps.

### 🕵️ Privacy & Local First
- **Offline**: Zero network calls required for core functionality.
- **Transparent**: No analytics, no tracking pixels, no account requirements.
- **Verified**: Build directly from source to verify exactly what's running on your machine.

## Background Story

I built **Audiobook Toolkit** because the current state of digital audiobook management is user-hostile.

Archivists and collectors often deal with "scene releases" that come as hundreds of poorly tagged MP3s, or proprietary rips that don't play nice with standard players. Existing solutions fall into two camps: powerful CLI tools (ffmpeg, mp3tag) that require technical expertise, or expensive closed-source GUI apps.

I wanted a tool that respects the user: **Open Core**, privacy-respecting, and powerful enough for the power user but simple enough for anyone. Following the **MCAF (Managed Code AI Framework)**, this project aims to set a gold standard for modern desktop tools, proving that Electron apps can be fast, beautiful, and respectful of system resources.

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript 5, TailwindCSS, Shadcn/UI, Framer Motion |
| **Backend** | Electron 28 (Node.js), FFmpeg 6.1 (via fluent-ffmpeg) |
| **Audio Engine** | `ffmpeg-static` (bundled binaries), `ffprobe-static` |
| **Testing** | Vitest (Unit/Integration), Playwright (E2E), React Testing Library |
| **State** | React Context + IPC Bridge (for system operations) |
| **Styling** | TailwindCSS, Radix UI primitives, Lucide Icons |

## Getting Started

### System Requirements & Compilation Prerequisites

Compilation from source requires a precise development environment to ensure native module stability.

- **Runtime**: Node.js **20.11.0 LTS** (Strict requirement for Electron ABI compatibility).
- **Compiler Toolchain**:
    - **Windows**: Visual Studio 2022 Build Tools (C++ workload) + Windows 10 SDK (10.0.19041.0).
    - **macOS**: Xcode 15+ + Command Line Tools (required for `node-gyp`).
    - **Python**: v3.11 (for rebuilding native dependencies).
    - **FFmpeg**: Compiled binaries must be manually linked or provided via `ffmpeg-static` override.

### Manual Compilation Guide

1.  **Repository Cloning & Integrity Check**:
    Clone with full history to ensure git-flow hooks function correctly.
    ```bash
    git clone https://github.com/Zendevve/audiobook-toolkit.git
    cd audiobook-toolkit/modern_markable
    ```

2.  **Dependency Resolution**:
    Recommended to use `npm ci` over `npm install` to enforce strict lockfile adherence and prevent dependency drift.
    ```bash
    npm ci --include=dev
    # Ensure electron binary downloads complete successfully
    ```

3.  **Native Module Rebuild**:
    Force recompilation of C++ modules (`better-sqlite3`, system bindings) against the specific Electron version header.
    ```bash
    npm run postinstall -- --arch=x64 --platform=win32
    ```

4.  **Dev Server Initialization**:
    Launch the Vite wrapper and attach the Electron debugger.
    ```bash
    npm run dev
    ```

> [!CAUTION]
> **Code Signing & Unsigned Binaries**:
> Builds generated locally are **unsigned**. Windows SmartScreen and macOS Gatekeeper will aggressively block execution.
> You must manually whitelist the binary or purchase an EV Code Signing Certificate ($400+/year) to remove these warnings.

## Documentation

- [Feature Documentation](docs/Features/) - Detailed specs for Binder, Splitter, Converter.
- [Architecture Decisions](docs/ADR/) - Why we chose Electron, MCAF, etc.
- [Testing Strategy](docs/Testing/strategy.md) - Our approach to high reliability.
- [AGENTS.md](AGENTS.md) - AI coding guidelines (MCAF framework).

## Philosophy: Open Core

**Audiobook Toolkit** follows an **Open Core** philosophy:

- **Source Code is Free**: The full source code is available here under **GPL-3.0 with Commons Clause**. You are free to clone, modify, and build the application yourself.
- **Convenience is Paid**: To support development, we offer prebuilt installers and portable executables for a small fee on Gumroad.

**Every feature is available in the source code.** There are no features locked behind a paywall.

## What's Inside?

```bash
├── .github/          # GitHub templates (PRG compliance)
│   ├── CHANGELOG.md  # Version history
│   └── CONTRIBUTING.md # Contribution guidelines
├── docs/             # Documentation & assets
│   ├── FMHY_SUBMISSION.md # Marketing pitch
│   ├── Features/     # Detailed feature specs
│   └── ADR/          # Architecture decisions
├── src/
│   ├── components/   # React UI components
│   │   ├── wizard/   # Binder Wizard steps
│   │   └── ui/       # Shared UI components
│   ├── electron/     # Electron main process code
│   └── lib/          # Utilities (FFmpeg wrappers)
├── AGENTS.md         # MCAF AI coding guidelines
└── README.md         # This file
```

## Contributing

Contributions are welcome! Please read the [Contributing Guidelines](.github/CONTRIBUTING.md) for details on our code of conduct and the submission process. We follow **MCAF** principles, so please check `AGENTS.md` before starting major work.

## License

This project is licensed under the **GNU General Public License v3.0** with the **Commons Clause** addendum.

**You may:**
- ✅ Use the software for free
- ✅ Modify the source code
- ✅ Share your modifications (under the same license)

**You may NOT:**
- ❌ Sell this software
- ❌ Sell a service that consists substantially of this software

See [LICENSE](LICENSE) for full details.

## Footer

**Author**: [Zendevve](https://github.com/Zendevve)
**Support**: [Buy Me a Coffee / Gumroad](https://zendevve.gumroad.com/l/audiobook-toolkit)

### Acknowledgments
- Built with [MCAF](https://mcaf.managed-code.com/)
- UI by [Shadcn/UI](https://ui.shadcn.com/)

---------------

<div align="center">
    <a href="https://github.com/Zendevve/audiobook-toolkit" target="_blank">
        <img src="docs/images/logo.png" width="100" height="100" alt="Audiobook Toolkit Footer Icon"/>
    </a>
</div>
