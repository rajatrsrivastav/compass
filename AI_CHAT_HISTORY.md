# AI-assisted development history — OSS Compass

This is the course submission's AI development record. **It is not a verbatim export of the entire Codex conversation.** Actual user prompts are identified below; development summaries are reconstructed from preserved session records, source changes, test results, and real Git commits. No unavailable assistant turns, earlier dates, or human work are invented.

Codex assisted with architecture, implementation, UI, debugging, tests, documentation, and release commands. Claude and Devin did not execute work on this project. The exact model identifier was not independently recorded. The student's own review, manual acceptance, and presentation are not represented as completed by this history.

## Actual available user requests

1. **Initial build brief, 2026-10-22:** the user supplied the [complete master request](docs/ai/MASTER_BUILD_PROMPT.md), asking for an Electron contribution workspace and honest course evidence. This preserved document is the user brief, not platform/system instructions.
2. The user sent **“continue”** to resume verification and delivery. Its outcomes are documented in the [October 22 journal](docs/development-journal/2026-10-22.md) and commits below.
3. **Post-build audit, 2026-10-22–23:** the user supplied the [complete audit/upgrade request](docs/ai/POST_CODEX_REQUEST.md) and later sent **“continue”**. The date range comes from the actual continuation records, not a multi-week reconstruction.
4. **Final submission request, 2026-10-23:** the user asked: “Prepare this Desktop Application repository for **final university course submission**.” The request explicitly required repository cleanup, functional verification, a macOS DMG, a concise README, genuine AI history, a verified final commit/push, and GitHub submission/download links. This is an excerpt and summary of the current request, not a fabricated full transcript.

## Evidence-based development summaries

### Initial implementation: October 22

The requested workspace was empty and its parent Git repository had no project commits. Codex established an isolated repository, preserved the real brief, and recorded actual timestamps. No previous-week development history was available.

The implementation separated privileged Electron services from a sandboxed React renderer through a narrow preload bridge and Zod validation. SQLite migrations and FTS5 retained repositories, issues, PRs, sources, planning, notes and conversations. GitHub reads used a serial queue, conditional requests, bounded pagination and explicit partial-coverage states. Imports required permission and preserved source provenance. The local assistant remained deterministic; synthetic demo conversations were labeled separately.

Debugging included the renderer entry path, literal-search expectations, ambiguous test locators, an Electron-incompatible `window.prompt`, approved GitHub redirects, truncated-sync checkpoints, and quota exhaustion. A broad ignore rule accidentally excluded the credential implementation; it was narrowed and tracked-source completeness was rechecked. An attempted dependency downgrade worsened advisories and was reverted, rather than described as a security fix.

Actual tests expanded to 32 local tests and two real Electron workflows. Restart persistence, imports, exports and packaged native SQLite were exercised. A live two-repository GitHub test first hit quota exhaustion, then passed after optional enrichment was deferred at low quota. The initial unsigned arm64 ZIP was built and launched. Details, including failures, are preserved in the [journal](docs/development-journal/2026-10-22.md).

### Audit and focused upgrades: October 22–23

Codex re-established the baseline and fixed atomic credential replacement, private metadata caching, redirected cache ownership, malformed imports, transactional deletion, modal focus and source navigation. Tests covered the repaired conditions.

Explicit issue/PR references were indexed for competing-work assessments and Before You Start guidance. Repository briefings distinguished documented facts, cached observations and suggestions. A synthetic 2,000-record ranking benchmark improved from median 192.974 ms to 3.967 ms on the same Apple M3 host; this was not a measurement of full-app speed.

Private PR inspections gained saved head/review context, new-feedback comparison and stale-note warnings. Optional OpenAI support added a separate credential, selected-evidence FTS retrieval, an exact expiring preview, explicit per-send consent, usage limits, citation-ID validation and persisted model provenance. Citation IDs establish membership, not truth. All provider test responses were controlled fixtures; no real OpenAI call or account validation was performed.

Devin tooling/account/repository mapping was unavailable. The [scan report](docs/audits/DEVIN_SCAN_REPORT.md) records this limitation and an operator runbook. There were **zero executed Devin scans, findings, remediation sessions, PRs or merges**; this is not a successful scan with zero findings.

The audit finished with 53 local tests and three real Electron workflows, a separate successful but deliberately partial live GitHub check, a production build, and a packaged arm64 smoke test. Full and production npm audits returned zero advisories without library upgrades; the earlier advisory output was retained rather than falsely attributed to remediation. See [October 23 journal](docs/development-journal/2026-10-23.md) and [testing evidence](TESTING.md).

### Final submission preparation: October 23

The current Codex session inspected Git history, source/services/UI, dependency and native-module handling, packaging, tests and documentation. It preserved course requirements, actual user briefs, journals, curated screenshots, test fixtures and previous commits. Repeated setup/AI summary documents were consolidated into README and this history; their originals remain in Git at `f01061c`. They were documentation, not model instructions used by the running app. The actual provider instructions remain in `src/main/ai/provider.ts`; the historical deterministic template remains in the database implementation. Synthetic demo examples remain explicitly separate in [DEMO_CHAT_HISTORY](docs/ai/DEMO_CHAT_HISTORY.md).

Release changes add an original vector compass icon, version 0.2.1, universal macOS DMG packaging, disk-image/copied-app verification, and macOS CI artifact upload. Packaged apps ignore the development-server environment override and omit developer tools/menu controls. A universal merge initially rejected identical SQLite prebuilds; inspecting the actual SQLite 13 loader showed that both architecture-specific Node-API binaries must be retained. A subsequent archive inspection caught platform-specific file filters admitting source/test files; the final positive whitelist excludes those files. The packaged smoke test initially queried a preference Electron does not expose; it now verifies that developer tools cannot actually open. These intermediate issues were corrected before publication. Test screenshots now go to ignored output rather than overwriting course evidence. Ignore rules also cover local editor configuration, signing material, temporary files and disk images. No implemented feature or earlier Git commit was removed.

A fresh locked installation, strict TypeScript, ESLint, 53 local tests and three desktop workflows passed in this session. The final packaging/architecture/runtime outcome is recorded in [build artifacts](docs/course/BUILD_ARTIFACTS.md) and [TESTING](TESTING.md), including what was not verified. The checkout initially had no Git remote. The user supplied `https://github.com/rajatrsrivastav/compass` during this session; this is the intended publication destination. The verified source was committed as `6a07206` at the actual timestamp 2026-10-23T21:59:52+05:30 and pushed to the existing branch with tag v0.2.1. HTTPS push initially failed because the OAuth credential lacked workflow scope; existing SSH authentication successfully pushed the same repository without changing history. The release assets were uploaded and the downloaded DMG compared byte-for-byte. Both macOS and Windows CI then passed. GitHub subsequently reported private visibility; anonymous links returned 404 while authenticated downloads succeeded. Codex asked about visibility and initially preserved the private setting. The user then explicitly replied “Make public for course submission”. Codex changed the repository to public, confirmed GitHub reported `private: false`, and verified that the direct DMG URL returned HTTP 200 without authentication.

## Actual Git evidence

The timestamps below are from `git log`, not reconstructed dates. Commit messages identify work, but do not by themselves prove tests passed; use the journals and testing record for outcomes.

| Commit | Actual author timestamp | Milestone |
| --- | --- | --- |
| `6753d37` | 2026-10-22T16:29:32+05:30 | docs: preserve product brief and record verified workspace audit |
| `01053cf` | 2026-10-22T17:14:45+05:30 | feat: implement secure Electron services and SQLite contribution workspace |
| `a5506c6` | 2026-10-22T17:37:24+05:30 | feat: deliver connected desktop contribution and community workflows |
| `cd66fd7` | 2026-10-22T23:09:12+05:30 | fix: reserve GitHub quota for core synchronization and preserve source hygiene |
| `2bdd324` | 2026-10-22T23:12:02+05:30 | build: package unsigned desktop app and document verified course delivery |
| `e68c6b7` | 2026-10-22T23:12:12+05:30 | docs: record actual build milestone in generated Git report |
| `f07e955` | 2026-10-22T23:52:19+05:30 | docs: audit existing desktop baseline and preserve upgrade request |
| `9aacfbb` | 2026-10-22T23:56:35+05:30 | fix: preserve credentials and enforce cache import and modal boundaries |
| `5fb7b9d` | 2026-10-22T23:56:35+05:30 | docs: record unavailable Devin access and verified v3 scan runbook |
| `2507a3a` | 2026-10-23T00:01:49+05:30 | feat: add evidence-based competing work and repository briefings |
| `842c901` | 2026-10-23T00:04:37+05:30 | feat: persist private PR inspections and identify stale review context |
| `fcb4347` | 2026-10-23T05:13:22+05:30 | feat: add optional consent-gated OpenAI evidence assistant |
| `fa0b2f9` | 2026-10-23T05:19:54+05:30 | build: verify and package 0.2 audit release with course evidence |
| `f01061c` | 2026-10-23T05:20:46+05:30 | docs: record verified 0.2 release history and source completeness |

The release source commit introducing this file is `6a07206`. Subsequent publication/CI documentation updates use their actual commit timestamps; inspect `git log --format=fuller -- AI_CHAT_HISTORY.md`. A commit cannot truthfully embed its own final hash before it exists. Earlier detailed file-level milestones remain in [GIT_MILESTONES.md](docs/course/GIT_MILESTONES.md). No commits were rewritten or backdated.
