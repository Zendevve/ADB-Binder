# Audiobook Binder

<div align="center">

![Audiobook Binder Banner](https://raw.githubusercontent.com/Zendevve/audiobook-binder/main/resources/banner.png)

A modern, open-core audiobook creation tool that merges audio files and adds chapter markers using FFmpeg.
Built with Electron, React, TypeScript, and Vite.

[Download Prebuilt Binary via Gumroad](https://zendevve.gumroad.com/l/audiobook-binder) · [Support on GitHub](https://github.com/sponsors/Zendevve)

</div>

---

## Philosophy: Open Core

**Audiobook Binder** follows an **Open Core** philosophy.

- **Source Code is Free**: The full source code is available here under the **GPL-3.0 with Commons Clause** license. You are free to clone, modify, and build the application yourself for personal use.
- **Convenience is Paid**: To support development, we offer prebuilt, signed installers and portable executables for a small fee. This saves you the time of setting up a build environment.

**Every feature is available in the source code.** There are no features locked behind a paywall in the code itself.

## Features

- **Merge Audio**: Combine multiple MP3/M4A/M4B files into a single audiobook.
- **Chapter Markers**: Automatically preservation of chapters or custom chapter creation.
- **Metadata Editor**: Rich metadata editing (Title, Author, Narrator, Series, Cover Art).
- **Format Support**: Output to **M4B** (AAC), **MP3**, or **AAC**.
- **Smart Features**: Auto-fill metadata from online sources, smart artwork detection.
- **Modern UI**: A beautiful, dark-mode interface designed for ease of use.

## Building from Source

If you prefer to build the application yourself, follow these steps:

### Prerequisites

- **Node.js**: v18 or higher
- **FFmpeg**: Must be installed and available in your system PATH.

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Zendevve/audiobook-binder.git
    cd audiobook-binder
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

## Support Development

If you enjoy using Audiobook Binder and want to support its continued development, please consider:

- [Buying a prebuilt binary on Gumroad](https://zendevve.gumroad.com/l/audiobook-binder)
- [Sponsoring me on GitHub](https://github.com/sponsors/Zendevve)

## License

This project is licensed under the **GNU General Public License v3.0** with the **Commons Clause** addendum.

**You may:**
- Use the software for free.
- Modify the source code for personal use.
- Share your modifications (under the same license).

**You may NOT:**
- Sell this software.
- Sell a service that consists substantially of this software.

See the [LICENSE](LICENSE) file for details.
