# Audiobook Binder - AGENTS.md

## Project Context
**Project**: Audiobook Binder
**Description**: A modern, desktop-based audiobook creation tool that merges audio files and adds chapter markers. Open Core model: Free to build from source, paid prebuilt binaries.
**Stack**:
- **Runtime**: Electron (Main Process), Node.js
- **Frontend**: React, TypeScript, Vite
- **Styling**: TailwindCSS, Shadcn/UI
- **Audio Engine**: FFmpeg (via `fluent-ffmpeg` and `ffmpeg-static`)
- **Testing**: Vitest (Unit/Integration), Playwright (E2E)

## Commands
- **Build**: `npm run build` (Compiles Electron and React)
- **Dev**: `npm run dev` (Starts development server)
- **Lint**: `npm run lint` (ESLint)
- **Test**: `npm test` (Vitest - Unit & Integration)
- **E2E**: `npm run e2e` (Playwright)

## Development Flow (MCAF)
1.  **Describe**: Read/Update `docs/Features/` and `docs/ADR/` before coding.
2.  **Plan**: Propose changes covering files, tests, and docs.
3.  **Implement**: Write tests and code together.
    - **Verification Rule**: Use *real* dependencies. Do not mock FFmpeg; use sample audio files in tests.
4.  **Verify**: Run `npm test` and `npm run lint`.
5.  **Update**: Update docs if behavior evolved.

## Coding Rules
- **No iTunes Dependency**: The system MUST NOT rely on iTunes installation.
- **Strict Typing**: No `any`. Use TypeScript interfaces for all data structures.
- **Constants**: Centralize configuration in `src/config/` or similar. Do not hardcode paths or magic numbers.
- **Path Handling**: Use `path` module for cross-platform compatibility (Windows/macOS).

## Testing Discipline
- **Integration over Unit**: Prefer tests that actually invoke the audio processing logic over mocking the wrapper.
- **Real Files**: maintain a `test-assets/` folder with small dummy MP3s for testing merge logic.
- **Static Analysis**: ESLint must pass.

## Self-Learning
- **Pattern**: User prefers "Director's Cut" / Premium aesthetics.
- **Constraint**: Strict adherence to MCAF structure.
