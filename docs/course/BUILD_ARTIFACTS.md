# Build artifacts

## Final submission 0.2.1 — 2026-10-23

- [Download universal DMG](https://github.com/rajatrsrivastav/compass/releases/download/v0.2.1/OSS-Compass-0.2.1-universal.dmg) and [checksum](https://github.com/rajatrsrivastav/compass/releases/download/v0.2.1/SHA256SUMS.txt).
- File: `release/OSS-Compass-0.2.1-universal.dmg`, 231,752,149 bytes.
- SHA-256: `53ef6f2c53a1f3331e52751509b2a4484f5e660b07c556783b65641b6507ca7b`.
- macOS 13+, Intel and Apple Silicon binaries. Electron is universal; SQLite retains the matching Node-API prebuild for each architecture.
- Disk-image integrity, read-only mount, Applications shortcut, custom icon, version 0.2.1, bundle ID and both architectures verified. Archive contains only production bundles, runtime dependencies, metadata and license.
- A copy from the DMG launched from a temporary Applications directory on Apple Silicon. SQLite onboarding, demo seed, navigation and production developer-tool restrictions passed. Temporary installation/profile removed and image detached.
- No Developer ID signing or notarization; linker ad-hoc signature only, no TeamIdentifier. Intel hardware, downloaded-file Gatekeeper flow, system installation and packaged Windows installer launch remain unverified.
- Build artifacts are ignored by Git and uploaded separately. Rebuild with `npm ci` and `npm run package:mac`; verify with `node scripts/verify-dmg.mjs release/OSS-Compass-0.2.1-universal.dmg`. CI provides a separate artifact per successful macOS run; its bytes/checksum may differ from the local release.

The published DMG was downloaded with authenticated GitHub access and compared byte-for-byte with the local image. [CI](https://github.com/rajatrsrivastav/compass/actions/runs/39987448617) separately passed macOS and Windows tests/packaging and uploaded both platform artifacts. The user approved public visibility; the direct download was subsequently verified with an unauthenticated HTTP 200 response.

See [TESTING](../../TESTING.md) for actual commands, intermediate corrections and limits.

## Historical ZIP builds

The obsolete local ZIP files and old unpacked arm64 bundle were removed during submission cleanup. Their recorded hashes and previous Git commits remain as development evidence.

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
- Tracked source at `fa0b2f9` also built from a fresh Git archive with existing dependencies linked in; this is a source-completeness check, not byte reproducibility. Packaged Info.plist reports 0.2.0.
