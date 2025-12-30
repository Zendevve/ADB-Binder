# Contributing to Audiobook Toolkit

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to Audiobook Toolkit. These are just guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Getting Started

### System Requirements & Environment Preparation

Before attempting to compile the source code, ensure your development environment adheres to the following strict specifications. Failure to meet these requirements may result in `node-gyp` compilation errors or Electron binary mismatch.

1.  **Runtime Environment**:
    *   **Node.js**: Strictly **LTS (Hydrogen/Iron)**. Current recommended: v20.11.0+.
        *   *Validation*: Run `node -v` and `npm -v`. Ensure npm is v10.x+.
    *   **Python**: Version 3.10+ (Required for `node-gyp` native module recompilation).
    *   **Build Tools**:
        *   **Windows**: Visual Studio 2022 Build Tools (checking "Desktop development with C++" workload is mandatory).
        *   **macOS**: Xcode Command Line Tools (`xcode-select --install`).

2.  **Git Configuration**:
    *   Ensure `core.autocrlf` is configured correctly for your OS to prevent linting errors on `CRLF`/`LF` divergence.
        *   Windows: `git config --global core.autocrlf true`
        *   Unix: `git config --global core.autocrlf input`

### Source Acquisition & Dependency Resolution

1.  **Repository Cloning**:
    Perform a full clone of the repository. We recommend verifying the SSL fingerprint of the remote before cloning.
    ```bash
    git clone https://github.com/Zendevve/audiobook-toolkit.git
    cd audiobook-toolkit/modern_markable
    ```

2.  **Integrity Check (Optional)**:
    Verify the HEAD commit hash against the latest signed tag in the release stream to ensure source integrity.

3.  **Dependency Installation**:
    Do **not** use `npm install` for reproducible builds. Use `npm ci` (Clean Install) to strictly adhere to the `package-lock.json` integrity hashes.
    ```bash
    # This will delete local node_modules and reinstall from lockfile
    npm ci --include=dev
    ```
    *Note: If `electron` fails to download, ensure `ELECTRON_MIRROR` environment variables are set or that your firewall permits traffic to GitHub Releases.*

### Compilation & Execution

1.  **Native Module Rebuilding**:
    If you encounter ABI mismatch errors, force a rebuild of native dependencies for the Electron runtime:
    ```bash
    npm run postinstall -- --arch=x64 --platform=win32 # Adjust platform logic as needed
    ```

2.  **Development Server Initialization**:
    Initialize the Vite dev server and the Electron main process concurrently.
    ```bash
    npm run dev
    ```
    *The IPC bridge will automatically attach. If the window remains blank, check the DevTools Console (F12) for Context Isolation violations.*

## Development Workflow

1.  **Create a Branch**: Always create a new branch for your feature or fix.
    ```bash
    git checkout -b feat/your-feature-name
    # or
    git checkout -b fix/your-bug-fix
    ```

2.  **Code Style**:
    - We use **ESLint** and **Prettier** (via ESLint) to maintain code quality.
    - Run the linter before committing:
        ```bash
        npm run lint
        ```
    - Use **TypeScript** strictly. Avoid `any` types whenever possible.

3.  **Testing**:
    - Run unit tests with Vitest:
        ```bash
        npm run test
    ```

## Pull Request Process

1.  Ensure your code builds locally (`npm run build`).
2.  Update the `README.md` or documentation with details of changes to the interface, if applicable.
3.  Open a Pull Request against the `main` branch.
4.  Provide a clear description of the problem and solution.

## Commit Messages

We encourage the **Conventional Commits** specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

Example: `feat: add batch rename modal`
