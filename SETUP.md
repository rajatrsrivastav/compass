# Setup and packaging

## Development

Use Node 22.12+ and npm. The implementation was built using Node 22.16.0 on macOS arm64. Native modules may require Xcode Command Line Tools on macOS or Visual Studio C++ Build Tools on Windows if a matching prebuilt binary is unavailable.

```sh
npm ci
npm run dev
```

Open Repositories, add a public `owner/repo` or HTTPS GitHub repository URL, and synchronize. An optional public-repository read-only token can be saved in Settings. Public reading needs no registered OAuth app. Tokens are never read from checked-in configuration.

## Native module ABI

Node and Electron require different better-sqlite3 builds. Scripts handle the switch explicitly:

```sh
npm test                 # rebuild for Node, then Vitest
npm run native:electron # switch back before desktop development
npm run test:e2e         # build, rebuild for Electron, run Playwright
```

If Electron reports a NODE_MODULE_VERSION mismatch, run `npm run native:electron`. If unit tests report one, run `npm run native:node`. Do not run Node tests and Electron tests concurrently against the same node_modules directory.

## Production

```sh
npm run build            # out/main, out/preload, out/renderer
npm run package          # unpacked application in release/
npm run package:mac      # unsigned macOS ZIP, on macOS
npm run package:win      # NSIS Windows x64 installer, on Windows
```

Windows packaging is configured but cannot be claimed tested from this macOS host. Native SQLite must be rebuilt for Windows/Electron; use the provided Windows CI workflow or a Windows machine. Do not redistribute a macOS-native SQLite binary inside a Windows installer. No signing certificates, notarization, auto-update service, or store submission are configured.

## Data locations

Electron `app.getPath('userData')` contains `compass.db`, SQLite WAL files, and optionally encrypted `credentials.enc`. Typical macOS location is `~/Library/Application Support/oss-compass`; use Electron's actual path when troubleshooting. Data is never written into the repository. `OSS_COMPASS_DATA_DIR` overrides the directory for tests or separate demo profiles.

The database contains potentially sensitive imported text in plaintext. OS disk encryption and account permissions protect the local data; the app does not claim SQLCipher encryption. Do not commit or share the database. Exported Markdown may contain private notes.

## Offline demo

Complete onboarding, then load demo data. Fixture records and example chats are synthetic and labeled. Disable their visibility in Settings to return to the ordinary live/imported view. Existing real user conversations are retained, even if they previously referenced demo data; excerpts remain labeled with their provenance.
