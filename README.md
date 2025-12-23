# Audiobook Toolkit

<div align="center">

![Audiobook Toolkit](https://via.placeholder.com/1200x300/1a1a2e/FFFFFF?text=Audiobook+Toolkit)

**Your complete audiobook workflow solution.**
Merge, convert, and enhance audiobooks - all in one beautiful desktop app.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3%20%2B%20Commons%20Clause-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-28-2B2E3A?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Download Prebuilt Binary](https://zendevve.gumroad.com/l/audiobook-toolkit) · [Report Bug](https://github.com/Zendevve/audiobook-toolkit/issues) · [Support Development](https://github.com/sponsors/Zendevve)

</div>

---

## ✨ Features

📚 **Audiobook Binder** - Merge multiple audio files into a single audiobook with chapter markers
🔄 **Format Converter** - Convert between M4B, MP3, M4A, AAC, and FLAC *(coming soon)*
📝 **Rich Metadata Editor** - Edit title, author, narrator, series, cover art, and more
🪄 **Smart Features** - Auto-fill metadata from online sources, smart artwork detection
🎨 **Modern UI** - Beautiful dark-mode interface with premium aesthetics
🔓 **100% Open Source** - Every feature available in the source code (Open Core model)

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React, TypeScript, TailwindCSS, Shadcn/UI, Vite |
| **Backend** | Electron (Node.js), FFmpeg |
| **Audio Engine** | `fluent-ffmpeg`, `ffmpeg-static`, `ffprobe-static` |
| **Testing** | Vitest (Unit/Integration), Playwright (E2E) |
| **Styling** | TailwindCSS, Radix UI primitives |

---

## 🎯 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **FFmpeg** (bundled via `ffmpeg-static`)
- **npm** or **yarn**

### Installation

```bash
# Clone the repo
git clone https://github.com/Zendevve/audiobook-toolkit.git
cd audiobook-toolkit

# Install dependencies
npm install
# or
yarn install
```

### Running Locally

```bash
# Development server
npm run dev

# Build for production
npm run build
```

App will launch in Electron automatically.

---

## 📖 Documentation

- [Feature Documentation](docs/Features/) - Detailed feature specs
- [Architecture Decisions](docs/ADR/) - ADRs for technical choices
- [Testing Strategy](docs/Testing/strategy.md) - How we test
- [AGENTS.md](AGENTS.md) - AI coding guidelines (MCAF framework)

---

## 📖 Philosophy: Open Core

**Audiobook Toolkit** follows an **Open Core** philosophy:

- **Source Code is Free**: The full source code is available here under **GPL-3.0 with Commons Clause**. You are free to clone, modify, and build the application yourself.
- **Convenience is Paid**: To support development, we offer prebuilt installers and portable executables for a small fee on Gumroad.

**Every feature is available in the source code.** There are no features locked behind a paywall.

---

## ⚠️ Note on Windows SmartScreen

> [!WARNING]
> **"Windows protected your PC"**
>
> Because I am a student developer, I cannot currently afford code signing certificates (**~$400/year**).
>
> When you first run the installer, you may see a "Windows protected your PC" popup. This does **not** mean the file is malicious.
>
> **To install:** Click **"More info"** → **"Run anyway"**.

---

## 🤝 Contributing

We welcome contributions! To get started:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Follow [MCAF](AGENTS.md) guidelines (docs before code, tests with implementation)
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

See [AGENTS.md](AGENTS.md) for detailed development workflow.

---

## 💖 Support Development

If you enjoy using Audiobook Toolkit and want to support its continued development:

- [Buy a prebuilt binary on Gumroad](https://zendevve.gumroad.com/l/audiobook-toolkit)
- [Sponsor me on GitHub](https://github.com/sponsors/Zendevve)

Your support helps cover development costs and keeps this project actively maintained!

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** with the **Commons Clause** addendum.

**You may:**
- ✅ Use the software for free
- ✅ Modify the source code
- ✅ Share your modifications (under the same license)

**You may NOT:**
- ❌ Sell this software
- ❌ Sell a service that consists substantially of this software

See the [LICENSE](LICENSE) file for full details.

---

## 🙌 Acknowledgments

- Built with [MCAF](https://mcaf.managed-code.com/) - Managed Code AI Framework
- Powered by [FFmpeg](https://ffmpeg.org/) for audio processing
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Thanks to all contributors!

---

## 📞 Contact

👨‍💻 **Developer**: Zendevve
💼 **GitHub**: [@Zendevve](https://github.com/Zendevve)
💖 **Sponsor**: [GitHub Sponsors](https://github.com/sponsors/Zendevve)
🛒 **Product**: [Gumroad](https://zendevve.gumroad.com/l/audiobook-toolkit)

---

<div align="center">
  <sub>Made with ❤️ following <a href="https://mcaf.managed-code.com/">MCAF</a> principles</sub>
</div>
