# Explaining Electron during the course demonstration

1. Electron supplies Chromium for the React UI and a separate privileged Node-capable main process.
2. Show `src/main/index.ts`: window creation, sandbox/context isolation, main-frame IPC validation, native file dialogs and SQLite lifecycle.
3. Show `src/preload/index.ts`: contextBridge exposes two narrowly typed operations. The renderer never receives ipcRenderer or filesystem access.
4. Show `src/shared/schemas.ts`: Zod checks untrusted renderer input before the main service acts.
5. Show `src/main/database/store.ts`: SQLite persistence, migration ledger, transactions and FTS5.
6. Show `src/main/github/client.ts`: read-only queued HTTP requests, pagination, ETags and error behavior. Then `sync.ts`: observations and baseline handling.
7. Show Community Context: native import, size check, parser, source provenance, references and manual annotation.
8. Show AI Copilot: conversation data in SQLite and truthful deterministic/demo origin markers.
9. Show `electron.vite.config.ts` and `electron-builder.yml`: three bundles, native-module ABI rebuild, ASAR unpacking and NSIS target.
10. Restart the app to demonstrate that settings, saved notes and conversations persist independently of the renderer state.

The complete process diagram and tradeoffs are in the root ARCHITECTURE.md.
