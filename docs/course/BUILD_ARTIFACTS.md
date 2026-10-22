# Actual build artifacts — 2026-10-22

- Platform: macOS arm64.
- Application: `release/mac-arm64/OSS Compass.app`.
- Distributable: `release/OSS Compass-0.1.0-arm64-mac.zip` (approximately 130 MB).
- SHA-256: `f63350fae0e6a1d9634f14f5a5740e677c7f44d1f2797da6d1487ef8e063ee40`.
- Bundles: `out/main/index.js`, `out/preload/index.cjs`, `out/renderer/index.html` and assets.
- Signing: explicitly disabled; no notarization or Developer ID distribution claim.
- Packaged smoke: passed; `app.isPackaged=true`, onboarding, SQLite, demo seed and issue navigation verified.
- Windows: valid NSIS x64 configuration and workflow supplied; no Windows installer was produced or run on this macOS host.

Build artifacts are deliberately ignored by Git. Reproduce with `npm ci` and `npm run package:mac`, or run `npm run package:win` on Windows. The macOS archive's hash is for this actual build, not a reproducible-build guarantee.

Use the final `v0.1.0` release tag. The earlier `v0.1.0-desktop-mvp` development tag predates the credential-source ignore-rule fix; history is preserved rather than rewritten. The final tracked-source archive was built successfully.

## Version 0.2.0 — 2026-10-23

- Distributable: `release/OSS Compass-0.2.0-arm64-mac.zip`.
- Size: 136,473,810 bytes.
- SHA-256: `983297e0fa76ef769d6324fdfa2997c8533759f49d547cc304fd180695cfa81b`.
- `npm run package:mac`: succeeded on macOS arm64; code signing explicitly skipped via identity=null. No notarization. Default Electron icon retained.
- The unpacked `release/mac-arm64/OSS Compass.app` now contains 0.2.0; the historical 0.1 ZIP remains separate.
- Same native SQLite packaging and platform limits apply. Windows build/runtime and live OpenAI validation are not claimed.
- Packaged smoke passed: actual bundled executable, app.isPackaged=true, onboarding, SQLite demo seed and issue navigation.
