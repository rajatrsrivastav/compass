# Post-Codex audit

Auditor: Codex, in the actual continuation session beginning 2026-10-22. This is not a Claude or Devin report. Baseline: `e68c6b7627889772f1158f600749da22494c04ad` (`v0.1.0`). Clean branch `codex/oss-compass`; no Git remote. Existing architecture, journal, migrations, UI actions, service implementations, tests and course records inspected. The separately mentioned OpenSource Copilot research report was not present; the supplied brief provides the requirements.

## Baseline verification

`npm ci` succeeded (542 packages); typecheck and lint passed. Unit/integration: 32 passed, one opt-in live test skipped. Production build passed. The first desktop E2E attempt was blocked by the process sandbox (macOS Electron launch SIGABRT/EPERM); it does not establish a product regression. A permitted unsandboxed rerun is recorded below when complete. Eight moderate development dependency advisories were reported; no dependency change made during baseline.

## Feature and risk audit at baseline

| Feature / implementation | Status and evidence | Verified defect or gap | Recommendation / priority / risk |
|---|---|---|---|
| Electron main/preload boundary (`src/main/index.ts`, `src/preload/index.ts`, `shared/schemas.ts`) | Implemented: two IPC methods, sender/frame validation, sandbox/isolation, Zod actions, external HTTPS only; hygiene and E2E coverage | No verified boundary escape | Preserve; regression checks / P1 / low |
| Profile/settings (`renderer/Settings.tsx`, `Store.profile`) | Implemented and persisted; E2E pending-edit/restart coverage | None verified | Preserve / P2 / low |
| SQLite migrations/FTS (`main/database/store.ts`) | Migrations 1–2, transactions, literal token search, cascade tests | Cache deletion uses SQL LIKE with wildcard repository names; source/event deletion spans transactions | Literal cache scope + transactional deletion / P1 / medium |
| GitHub sync (`main/github/client.ts`, `sync.ts`) | Read-only GET, ETags, paging, retries, cancel, conservative checkpoint, bounded enrichment; 12 unit cases | Private metadata can reach HTTP cache before rejection; pagination has no cycle guard; retained detail has no freshness metadata | Guard cache, cap pages, track detail observation / P1 / medium |
| Credentials (`main/security/credentials.ts`) | OS-backed safeStorage or session-only; ciphertext tests | `clear()` precedes encryption/write: failed replacement destroys working credential | Atomic replacement and failure regression / P1 / medium |
| Opportunity Radar (`shared/ranking.ts`, `renderer/Issues.tsx`) | Transparent deterministic weights and linked sources | Closing-keyword-only matching; bare-number and regex metacharacter ambiguity; no previous-attempt/coverage status | Shared explicit-reference index + Before You Start / P1 / medium |
| Repository guidance (`renderer/Repositories.tsx`, sync) | README/CONTRIBUTING/CoC at root | No organization briefing, policy location coverage or absence timestamps; old guidance retained after 404 | Bounded root/.github/docs discovery with evidence links / P1 / medium |
| PR private workflow (`renderer/Detail.tsx`, `Store.saveItem`) | States and notes survive sync | No last inspected head, feedback snapshot or persistent history | Explicit inspection checkpoint/history and cautious delta UI / P1 / medium |
| Community import (`main/imports/parse.ts`, renderer/Community) | Manual, text, VTT/SRT, authorized Slack JSON; references and FTS | Null/invalid JSON rows and out-of-range timestamps cause unhelpful runtime errors; linked source navigation does not select source | Validate shapes/dates; route exact source / P1 / low |
| Conversations (`main/service.ts`, renderer/Chat) | Persistent deterministic selected-source summaries; demo separation; restart tested | Chat ranks one issue in isolation and misses related PRs | Use full cached work context with citations / P1 / low |
| Optional model | Not implemented, truthfully labeled | No provider, retrieval chunks, cloud consent or model tests | M5 only after stable priority work / P2 / medium |
| Accessibility (`renderer/Detail.tsx`, main, styles) | Labels, focus styling, headings and status messages exist | Drawer has no focus containment/entry/restore; reduced motion missing | Native modal semantics and keyboard E2E / P1 / low |
| Performance | 3-second whole snapshot polling and repeated ranking scans observed in code | Cost not yet measured; no speed claim supported | Repeatable cache workload; only optimize measured issues / P2 / medium |
| Course/export/package | Actual historical commits, native export, unsigned arm64 package and prior smoke recorded | New audit/Devin evidence missing | Preserve history and append genuine results / P1 / low |

## Scope and attribution

No main-service replacement, framework migration, GitHub write API, mandatory chat connector, autonomous posting, or rewritten history is planned. All local changes are Codex work. Devin availability and execution evidence are tracked separately in DEVIN_SCAN_REPORT.md. Findings above are local review findings, not scanner output. New tests must distinguish confirmed defects from hypotheses.

## Milestone results

Results and exact commands will be appended as each milestone completes. Optional external work must not be reported as executed without evidence.

M0 completed: permitted `npx playwright test` rerun passed both Electron tests (32.6 s), including restart persistence, native import/export and runtime isolation checks. Baseline production build passed as part of `npm run test:e2e`. No live API rerun yet in this audit; historical live evidence is not counted as a new result.

M1 completed: atomic credential replacement; safe malformed Slack JSON handling; private metadata rejected before caching; cyclic/excessive paging rejected; migration 3 adds literal cache ownership including redirected pages and invalidates only disposable legacy HTTP responses; transactional source/event deletion; native modal focus and reduced-motion support; exact linked-source navigation. Existing domain data and migrations retained. `typecheck`, `lint`, 38 local tests and two Electron E2E tests pass (15.9 s). The initial new focus assertion failed, was repaired with explicit initial focus, and passed on rerun. No WCAG certification is claimed.

M3 local verification (2026-10-23): 45 unit/integration tests pass; optional live and benchmark tests are skipped in the normal suite. Explicit reference fixtures cover short/qualified/URL/reverse/discussion references and reject plain numbers, foreign repositories, code examples and regexp-like names. Guidance tests cover root/.github/docs discovery, missing locations, retired files and low-quota stale evidence. Retained discussion keeps its original observation time. Chat summaries now include related cached PRs and their record IDs.

Performance experiment on Apple M3, macOS arm64, Node 22.16.0: `COMPASS_BENCH=1 npx vitest run tests/unit/performance.test.ts --reporter=verbose --disableConsoleIntercept`, 1,000 issues plus 1,000 explicitly referencing PRs, two warmups and ten samples. Before indexed matching: median 192.974 ms, range 190.044–200.965 ms. After: median 3.967 ms, range 2.137–4.641 ms. This is a synthetic ranking microbenchmark, not a startup or full-app speed claim. The index is built once per ranking pass; it also corrects reference semantics. Full desktop workflow and live API results are reported separately. Whole-snapshot polling remains a measured-work follow-up, not an unsupported optimization claim.

M3 desktop verification: build and both Electron workflows pass (13.9 s), including Before You Start rendering and keyboard navigation.

M4 completed: explicit private inspection checkpoints persist the cached head, observed review states, feedback identities, saved note, private state and observation coverage. Sync preserves history and note head anchors. Changed cached heads and newly observed feedback are distinguished from exact code/comment diffs; unknown heads and stale enrichment abstain from comparisons. Checks show the head they were fetched for. Tests cover old-schema migration, repeated upserts, changed/unknown heads, new feedback, stale notes even after a newer inspection, and database reopen. Typecheck/lint and 47 local tests pass; two desktop workflows pass (14.6 s) including inspection history after restart. No external review is submitted.

M5 completed with live-provider validation outstanding: optional OpenAI Responses integration, separate OS/session key storage, model/usage controls, migration 4 FTS5 evidence retrieval, stable chunk IDs, expiring exact-payload preview and explicit cloud consent. Private item notes and earlier conversation history are excluded; selected community passages require consent. Structured replies must cite supplied IDs; this is not a factuality guarantee. The deterministic local assistant remains available. Typecheck/lint and 53 local tests pass. Three Electron workflows pass (19.1 s), including consent gating and local fallback without provider traffic. Provider success, refusal, authentication/rate failure, incomplete replies, invalid citations and abstention are tested with controlled responses. No live OpenAI request or account model-access validation is claimed. See OPTIONAL_AI.md for implementation limits and official documentation sources.

M6 verification: final 0.2 typecheck/lint passed; 53 local tests passed with two opt-ins skipped; three desktop workflows passed in 17.5 s, including organization briefing, modal focus, inspection restart, cloud preview and native export. The model chat export now includes actual model/token metadata and supplied evidence snapshots. Read-only live GitHub check passed for two public repositories (10 and 13 items), both partial with low remaining quota. Full/production npm audit returned zero; baseline npm ci reported eight moderate development paths without any subsequent dependency change. Both outputs are preserved honestly. Production build and unsigned arm64 package succeeded; artifact checksum is in BUILD_ARTIFACTS.md. Screenshots inspected. Final packaged smoke and Git release completion are recorded below.

## Remaining priorities

1. Configure authorized Devin repository/org/profiles and a bounded budget; follow the recorded runbook. No scan IDs, confirmed Devin findings, remediation changes, rejected PRs or merged PRs exist.
2. Validate the optional provider with an authorized account and non-sensitive evidence, evaluate grounding/abstention, and review real OS credential continuity. Current tests establish contract/privacy behavior, not live model quality.
3. Validate Windows installer/runtime, signing and notarization on the intended target platforms.
4. Add on-demand discussion refresh/resumable coverage, then measure large real workspaces before changing whole-snapshot polling or aggregate history storage.

The original Electron/main/preload/React/Zustand/SQLite/npm architecture, historical migrations and Git history, manual community import fallback, deterministic chat, demo separation and prohibition on automatic GitHub writes were preserved. No broad rewrite, secret migration, external publishing or account messaging occurred.

Packaged smoke passed against the actual 0.2.0 executable: app.isPackaged=true, SQLite/onboarding/demo/navigation succeed. No remote is configured; no push, PR or publication was performed.

Final source-completeness check passed: archived committed source at fa0b2f9 built in a separate temporary directory using installed dependencies. Package metadata reports 0.2.0. Actual milestone hashes are in the regenerated GIT_MILESTONES report; the report's own final documentation commit is necessarily subsequent to generation.
