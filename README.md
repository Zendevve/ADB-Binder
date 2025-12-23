# Audiobook Toolkit

<div align="center">

![Audiobook Toolkit Banner](https://raw.githubusercontent.com/Zendevve/audiobook-toolkit/main/resources/banner.png)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-28-2B2E3A?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Your complete audiobook workflow solution.**
Merge files, convert formats, and enhance audio - all in one beautiful desktop app.

[Download Prebuilt Binary](https://zendevve.gumroad.com/l/audiobook-toolkit) · [Report Bug](https://github.com/Zendevve/audiobook-toolkit/issues) · [Support Development](https://github.com/sponsors/Zendevve)

</div>

---

## 📖 Philosophy: Open Core

**Audiobook Binder** follows an **Open Core** philosophy.

- **Source Code is Free**: The full source code is available here under the **GPL-3.0 with Commons Clause** license. You are free to clone, modify, and build the application yourself for personal use.
- **Convenience is Paid**: To support development, we offer prebuilt installers and portable executables for a small fee. This saves you the time of setting up a build environment.

**Every feature is available in the source code.** There are no features locked behind a paywall in the code itself.

## ✨ Features

- 📚 **Merge Audio**: Combine multiple MP3/M4A/M4B files into a single audiobook.
- 🔖 **Chapter Markers**: Automatically preserve chapters or create custom ones.
- 📝 **Metadata Editor**: Rich editing for Title, Author, Narrator, Series, and Cover Art.
- 🎧 **Format Support**: Output to **M4B** (AAC), **MP3**, or **AAC**.
- 🪄 **Smart Features**: Auto-fill metadata from online sources, smart artwork detection.
- 🎨 **Modern UI**: A beautiful, dark-mode interface designed for ease of use.

> 🚧 **Coming Soon**: Format Converter, Audio Enhancements, Chapter Editor, and more!

## 🚀 How to Use

1.  **Import Files**: Drag and drop your audio files into the window.
2.  **Arrange**: Reorder files if needed to ensure chapters are in the correct sequence.
3.  **Edit Metadata**: Add the book title, author, and cover art. Use "Auto-fill" to fetch data automatically.
4.  **Export**: Choose your format (M4B recommended for audiobooks) and click Export.

## 🛠️ Building from Source

If you prefer to build the application yourself, follow these steps:

### Prerequisites

- **Node.js**: v18 or higher
- **FFmpeg**: Must be installed and available in your system PATH.

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Zendevve/audiobook-toolkit.git
    cd audiobook-toolkit
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Start Development Server:**
    ```bash
    npm run dev
    ```

4.  **Build for Production:**
    ```bash
    npm run build
    ```
    The output binaries/installers will be in the `dist` folder.

## ⚠️ Note on Windows SmartScreen

> [!WARNING]
> **"Windows protected your PC"**
>
> Because I am a student developer, I cannot currently afford the expensive code signing certificates required by Microsoft (**~$400/year**).
>
> When you first run the installer, you may see a blue "Windows protected your PC" popup. This does **not** mean the file is malicious; it simply means it's from an "unknown publisher" (me).
>
> **To install:** Click **"More info"** -> **"Run anyway"**.
>
> The source code is 100% open and you can build it yourself if you prefer!

## 💖 Support Development

If you enjoy using Audiobook Binder and want to support its continued development, please consider:

- [Buying a prebuilt binary on Gumroad](https://zendevve.gumroad.com/l/audiobook-toolkit)
- [Sponsoring me on GitHub](https://github.com/sponsors/Zendevve)

## 📄 License

This project is licensed under the **GNU General Public License v3.0** with the **Commons Clause** addendum.

**You may:**
- Use the software for free.
- Modify the source code for personal use.
- Share your modifications (under the same license).

**You may NOT:**
- Sell this software.
- Sell a service that consists substantially of this software.

See the [LICENSE](LICENSE) file for details.
