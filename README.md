# OSS Compass

A local-first desktop workspace for open-source contributors. Investigate public GitHub issues, keep private PR review notes, connect authorized community context, and plan work using evidence from your local cache.

![OSS Compass with explicitly labeled synthetic demo data](docs/screenshots/overview-dark.png)

## Features

- Public repository synchronization with pagination, caching, cancellation, rate-limit handling, and visible coverage/freshness limits.
- Opportunity ranking, related-PR warnings, contribution guidance, and a Before You Start assessment.
- Private investigation notes, saved issues, PR review states, inspection history, and stale-head warnings.
- Manual community notes and TXT, Markdown, SRT, VTT, or Slack channel JSON imports with references, annotations, and local search.
- Weekly capacity planning, deadlines, user-entered achievements, and Markdown exports.
- Persistent conversations with a deterministic local assistant. Optional OpenAI responses require a separate API key, exact evidence preview, and explicit consent for every request.
- Dark/light themes, native file dialogs, and an optional, clearly labeled offline demo.

GitHub access is read-only and public-repository-only. Cached observations and heuristic rankings do not establish current availability or maintainer endorsement. There are no community bots, automatic reviews, merges, or public posts. See [limitations](docs/course/KNOWN_LIMITATIONS.md) and [privacy/security](SECURITY.md).

## Download and install

The submission build is **0.2.1**, packaged as `OSS-Compass-0.2.1-universal.dmg` for Intel and Apple Silicon Macs running macOS 13 or later. It is **not Developer ID signed or notarized**. Only the Apple Silicon runtime has been tested locally; Intel binaries are checked structurally.

Download the DMG from the [0.2.1 release](https://github.com/rajatrsrivastav/compass/releases/tag/v0.2.1). The [direct DMG download](https://github.com/rajatrsrivastav/compass/releases/download/v0.2.1/OSS-Compass-0.2.1-universal.dmg) is accompanied by [SHA256SUMS.txt](https://github.com/rajatrsrivastav/compass/releases/download/v0.2.1/SHA256SUMS.txt). The locally built file is also in `release/`. The **Verify OSS Compass** workflow builds a downloadable **OSS-Compass-macOS-universal-unsigned** artifact containing the DMG and `SHA256SUMS.txt`. Open the repository's **Actions** tab, select a successful run, download the artifact, and unzip it. GitHub artifact downloads require sign-in and expire after 90 days.

Open the DMG, drag **OSS Compass.app** onto **Applications**, eject the disk image, and launch the copied app. macOS may block this unsigned course build; if you trust its source, use the app-specific **Open Anyway** control in System Settings → Privacy & Security. See [Apple’s guidance](https://support.apple.com/en-au/102445); do not disable system security globally. Verify the file against its supplied SHA-256 checksum before installation.

## Development

Requires Node.js **22.12+** (Node 22 recommended), npm, and a desktop session. Native SQLite compilation may require Xcode Command Line Tools on macOS or Visual Studio C++ Build Tools on Windows.

```sh
npm ci
npm run dev
```

Complete onboarding, open **Repositories**, add `owner/repo`, and select **Synchronize**. Public repositories work without a token; an optional read-only token increases available quota. For a repeatable offline demonstration, select **Explore demo workspace** after onboarding. Demo records remain visibly labeled and can be hidden in Settings.

Use **Opportunity Radar** to save an issue and write investigation notes. Use **PR Review Queue → Record inspection** to retain your private review context. Import authorized text through **Community Context**, plan tasks in **My Journey**, and export reports through the native save dialog. In **AI Copilot**, create a conversation and select local evidence; ordinary **Send message** stays local. Cloud use is optional and described in [optional AI](docs/architecture/OPTIONAL_AI.md).

The main process stores `compass.db` and optional OS-encrypted credentials in Electron's `userData` directory (normally `~/Library/Application Support/oss-compass` during development). SQLite content itself is not encrypted. `OSS_COMPASS_DATA_DIR` selects an isolated test/demo profile. Never share a real profile or private exports as course fixtures.

## Build and package

```sh
npm run build                 # production main, preload, and renderer in out/
npm run start                 # preview the built desktop app
npm run package:mac           # universal DMG, run on macOS
npm run package:mac:arm64     # smaller Apple Silicon-only DMG
npm run package:win           # Windows x64 NSIS installer, run on Windows
npm run package               # unpacked application for the host
```

Artifacts go into ignored `release/`. The universal package merges the Electron architectures and retains both architecture-specific SQLite Node-API binaries. No signing credentials or publishing are selected automatically. The macOS workflow repeats the build and verifies the DMG and copied application; Windows CI builds the installer separately. Windows CI passed the source-app desktop workflows and NSIS build; installation and launch of the packaged Windows installer remain unverified.

```sh
node scripts/verify-dmg.mjs release/OSS-Compass-0.2.1-universal.dmg
cd release
shasum -a 256 OSS-Compass-0.2.1-universal.dmg
```

Verification mounts the image read-only, checks metadata, the icon, Applications link and binary architectures, copies the app into a temporary Applications directory, launches it with an isolated profile, then cleans up. It does not install into the system Applications folder or test Gatekeeper's downloaded-file workflow. The committed icon can be regenerated on macOS with `npm run icon`.

## Architecture and source layout

Electron 45, React 19, TypeScript, Vite/electron-vite, Tailwind CSS, Zustand, Radix UI, Zod, and better-sqlite3/SQLite FTS5. electron-builder creates distributions; Vitest and Playwright verify behavior. Exact dependency versions are locked in `package-lock.json`.

| Path | Responsibility |
| --- | --- |
| `src/main/` | SQLite migrations, GitHub queue/sync, imports, credentials, optional AI, native dialogs |
| `src/preload/` | Narrow typed IPC bridge; no filesystem access exposed to the renderer |
| `src/renderer/` | React workspaces, state, accessible dialogs, styling |
| `src/shared/` | Types, Zod schemas, ranking, reference and review logic |
| `tests/` | Unit/integration, Electron workflows, synthetic fixtures |
| `resources/` | Production icon assets |
| `scripts/` | Icon generation, live tests, packaged-app and DMG verification, Git evidence |
| `docs/` | Architecture details, genuine course/development evidence, curated screenshots |
| `.github/workflows/` | macOS and Windows verification/build artifacts |

The sandboxed renderer calls a validated preload bridge; the main process owns privileged operations. Data persists in SQLite independently of the UI. See [architecture](ARCHITECTURE.md) for the process/data design.

## Verification and course evidence

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:live             # optional public GitHub test; depends on network/quota
```

The scripts prepare native dependencies for their target runtime: `npm test` runs the Node rebuild; desktop scripts and packaging run the Electron rebuild. The locked SQLite 13 package uses Node-API prebuilds selected by platform and architecture. Do not run them concurrently against the same `node_modules`. If switching manually, use `npm run native:node` or `npm run native:electron`.

Submission verification: clean `npm ci`, typecheck and lint; **53 local tests passed**, with live/benchmark opt-ins skipped; **3 Electron workflows passed**, including restart persistence, imports/exports and cloud consent. The final universal DMG passed integrity, metadata, package-content and architecture checks; an app copied from it passed the Apple Silicon launch/SQLite smoke test. No live OpenAI account call, Intel hardware test or packaged Windows installer launch, independent accessibility audit, Developer ID signing or notarization is claimed. [macOS and Windows CI](https://github.com/rajatrsrivastav/compass/actions/runs/39987448617) also passed dependency installation, typecheck, lint, local/desktop tests and packaging. macOS CI additionally verified the DMG and copied app. The published release DMG was downloaded with authenticated access and matched the local file byte-for-byte. Current and historical results are recorded in [TESTING.md](TESTING.md).

Use [AI_CHAT_HISTORY.md](AI_CHAT_HISTORY.md) for the course's **AI Chat History Link**. It separates actual user prompts from evidence-based session summaries. Original briefs, dated journals, Git milestones, requirements, and the [demonstration walkthrough](docs/course/DEMO_WALKTHROUGH.md) remain available. Synthetic in-app conversations are examples, not development transcripts.

MIT licensed. See [LICENSE](LICENSE) and [contributing](CONTRIBUTING.md).
