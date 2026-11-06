# Contributing to DesiPDF Desktop 🇮🇳

Thank you for your interest in contributing to **DesiPDF / BharatPDF**! We are committed to building a completely open-source, air-gapped, privacy-first document engine suite for Indian citizens and global users.

---

## 🛠️ Tech Stack Overview

- **Desktop Shell**: [Tauri 2.0](https://tauri.app/) (Rust + OS Native WebViews)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **PDF Core**: `pdf-lib`, `pdfjs-dist` (WebAssembly), `tesseract.js`
- **Build System**: GitHub Actions automated multi-platform matrix (`.exe`, `.msi`, `.dmg`, `.AppImage`)

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (v20 or v22+) & `npm`
- **Rust & Cargo** (for desktop compilation): [Install Rust via rustup](https://rustup.rs/)
- **Windows**: Microsoft Visual Studio C++ Build Tools

### 2. Getting Started
```bash
# Clone the repository
git clone https://github.com/literalmanish/bharatpdf.git
cd bharatpdf

# Install dependencies
npm install

# Run Web Development Server (Browser mode)
npm run dev

# Run Desktop Application (Native Window mode)
npm run tauri dev
```

---

## 💡 How to Add a New Tool Engine

1. Create your engine logic under `src/lib/pdf/<your-tool>.ts`.
2. Ensure operations run **purely in local RAM** (zero external network requests).
3. Add the tool definition to `src/data/tools.ts`.
4. Submit a Pull Request!
