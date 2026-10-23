# Testing and actual results

## Final submission 0.2.1 — 2026-10-23

- `npm ci`: clean locked installation, 542 packages, zero reported advisories. Library versions are unchanged.
- `npm run typecheck`, `npm run lint`, `git diff --check`: passed.
- `npm test`: 53 passed, two explicit live/benchmark opt-ins skipped (2.21 s).
- `npm run test:e2e`: three real Electron workflows passed (31.2 s); source functionality and persistence checks remain intact. Fresh screenshots go to ignored test output.
- `npm run package:mac`: passed, universal DMG with custom icon, Electron arm64/x86_64 and separate SQLite Node-API binaries for each architecture.
- `node scripts/verify-dmg.mjs release/OSS-Compass-0.2.1-universal.dmg`: passed. Disk-image checksum valid; mounted read-only; Applications link, bundle ID/version/icon and architecture verified. Archive contains only LICENSE, node_modules, out, and package.json. App copied into a temporary Applications directory and launched with a fresh isolated profile; production renderer, disabled developer tools, onboarding, native SQLite, demo seed and issue navigation passed without renderer exceptions. The image was detached and the temporary copy/profile removed.
- DMG size: 231,752,149 bytes. SHA-256: `53ef6f2c53a1f3331e52751509b2a4484f5e660b07c556783b65641b6507ca7b`.
- Minimum macOS in Info.plist: 13.0. Actual launch host: Apple Silicon. Intel runtime, downloaded-file Gatekeeper flow, system Applications installation, packaged Windows installer launch and live OpenAI remain unverified.
- No Developer ID signing or notarization. `identity: null` deliberately skips signing; the executable retains a linker ad-hoc signature with no TeamIdentifier or sealed resources, which does not authenticate the developer.

Intermediate packaging failures were corrected: universal merging rejected identical SQLite prebuilds; the actual SQLite 13 loader required retaining both Mac architecture files. An exclusion-only macOS file filter admitted development files; adding a positive production whitelist fixed this. The first strengthened smoke assertion queried an Electron preference absent from its snapshot; the corrected test checks that developer tools cannot actually open. The successful final verification used the rebuilt, cleaned DMG, not an earlier candidate.

The GitHub destination is [rajatrsrivastav/compass](https://github.com/rajatrsrivastav/compass). The source branch and v0.2.1 tag were pushed without force. The release DMG and checksum were uploaded, downloaded through authenticated GitHub access, and compared byte-for-byte with the local files. The user explicitly approved public visibility for course submission. GitHub now reports public visibility, and the direct DMG URL returned HTTP 200 without authentication.

[Independent CI run](https://github.com/rajatrsrivastav/compass/actions/runs/39987448617) completed successfully for macOS and Windows on the release source commit `6a07206`: locked installation, typecheck, lint, local tests, three desktop workflows and platform packaging passed. macOS also passed disk-image/copied-app verification and uploaded a universal DMG artifact; Windows uploaded its NSIS installer. Installing and launching that packaged Windows installer remains unverified. This later CI result does not change the historical local-only reports below.

## Historical verification records

Validated on 2026-10-22 using Node 22.16.0 and Electron 45.0.0 on macOS arm64.

| Check | Actual outcome |
| --- | --- |
| `npm run typecheck` | Passed, strict TypeScript |
| `npm run lint` | Passed |
| `npx vitest run` after `native:node` | 32 passed; 1 opt-in live test skipped; 5 passing files, 1 skipped file |
| `npm run test:e2e`, followed by the expanded `npx playwright test` | 2 desktop tests passed in 15.2 seconds on the final run |
| `npm run build` | Passed for main, CJS preload and renderer; also passed from a tracked Git source archive using the installed dependencies |
| `npm run package:mac` | Passed; unsigned macOS arm64 ZIP and unpacked app |
| `node scripts/smoke-packaged.mjs 'release/mac-arm64/OSS Compass.app/Contents/MacOS/OSS Compass'` | Passed; app.isPackaged=true; onboarding, SQLite, demo seeding and issue navigation worked |
| `npm audit --omit=dev` | 0 production dependency vulnerabilities |
| Full dependency audit | 8 moderate vulnerable dependency paths in development/packaging tools, originating in sprintf-js via roarr/global-agent |
| Real GitHub two-repository test | Passed on the continued run in 6.26 seconds; unauthenticated core issues/PR synchronization, with partial/enrichment limits visible |
| Windows installation/runtime | Not executed on this macOS host; configuration and Windows CI supplied |

## Commands

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:live   # opt-in public network test; may hit GitHub limits
```

Node and Electron use distinct native-module ABIs. `npm test` rebuilds better-sqlite3 for Node; `test:e2e`, `predev`, `prestart` and packaging rebuild for Electron. Do not run both native runtimes' tests concurrently against the same node_modules.

## Coverage

- Repository name/URL parsing and rejected external URL schemes/destinations.
- Zod IPC payload validation and import permission acknowledgement.
- GitHub pagination, ETags/304, cancellation, transient retry, rate limits, approved redirects and blocked foreign-origin redirects.
- Filtering PRs from issue results; core-data retention during enrichment rate limits; no checkpoint advancement on truncated issue lists; offline cached data retention.
- SQLite idempotent migrations, upserts, private-note preservation, repository deletion, FTS5 queries and baseline-aware changes.
- Explainable ranking, related-PR warnings, source IDs, and exclusion of closed issues.
- Subtitle timestamps, Slack JSON, invalid/oversized imports, manual note provenance, annotation and deletion.
- Explicit vs unresolved bare references and conservative candidate behavior.
- Conversation persistence after database reopen, actual response origin and demo separation.
- Session-only credential use, insecure backend rejection, encrypted-storage behavior with a test double, and deletion.
- Capacity constraints, honest export labels, ignored files and repository hygiene.
- Real Electron onboarding, profile persistence, issue save/note, private PR state, manual/pasted/native imports, reference linking, annotation, demo chat, real deterministic chat, restart, dark/light themes and demo hiding.
- Native Markdown report export, pending profile edits surviving refresh, credential deletion, renderer isolation, and rejected arbitrary IPC action.

## Live integration evidence

The opt-in test uses `electron/electron-quick-start` and `octocat/Hello-World`. Initial real requests exposed a repository redirect; the client was corrected to follow only approved GitHub destinations. A subsequent attempt was blocked by the public quota (0/60), and that failure was recorded at the time.

After the user asked to continue later on 2026-10-22, the quota check reported 13 requests remaining. The client was improved to defer optional enrichment at eight remaining requests rather than consuming the last allowance. **`npm run test:live` then passed for both repositories at approximately 23:08 Asia/Kolkata, in 6.26 seconds.** Assertions verified stored core records, successful observation timestamps and GitHub provenance. No token was used. The low-quota snapshots are explicitly partial; this does not claim exhaustive discussion or check coverage.

The earlier failure and successful retry are both retained in the development journal. The success, failure, partial-enrichment and offline paths also have deterministic tests. Re-run `npm run test:live` only when public quota is available; ordinary tests skip it.

## Visual and manual checks

Curated Electron-generated screenshots are in `docs/screenshots`. New test runs write to ignored `test-results/screenshots` and do not overwrite course evidence. Overview and community screenshots were visually inspected for usable layout; the application exposes actual data rather than screenshot-backed controls. These images contain synthetic test records. Automated desktop checks are not represented as manual user testing or a complete accessibility audit.

## Audit and packaging notes

The audit-suggested older electron-builder version introduced more severe advisories and was reverted to 26.15.3. The remaining transitive packaging advisory has not been hidden with an unverified override. Recheck before distribution. Production-only dependencies audited cleanly.

The first packaging attempt auto-discovered a local signing identity. That process was stopped, `mac.identity: null` was added, and the final artifact was rebuilt with the tool explicitly reporting that signing was skipped. No signed-release or notarization claim is made. The packaged-app smoke test used an isolated temporary profile.

## Version 0.2 audit verification — 2026-10-23

This section supersedes current-state claims in the historical v0.1 report above; earlier results remain historical evidence.

| Command/check | Actual result |
|---|---|
| `npm ci` at audit baseline | Passed; 542 packages; baseline reported 8 moderate development paths |
| `npm run typecheck` / `npm run lint` | Passed on final 0.2 source |
| `npm test` | 53 passed; 2 opt-in tests skipped (live API and performance); 2.05 s final run |
| `npm run test:e2e` | 3 passed in 17.5 s; real Electron, no live model traffic |
| Live GitHub check | Passed for two public repositories in 25.30 s; partial coverage and low remaining quota correctly reported |
| Ranking workload | Median 192.974 ms before, 3.967 ms after on same M3; synthetic ranking only |
| `npm run build` | Passed, including final package build |
| `npm run package:mac` | Passed; unsigned arm64 ZIP, default Electron icon |
| Full / production `npm audit --json` | Both returned zero advisories; JSON retained in docs/audits. No dependency upgrade was made, so earlier advisory paths are not claimed repaired |
| OpenAI | Controlled contract/failure/privacy tests passed; no live provider/account validation |
| Devin | Access unavailable; no scans or remediations |

New behavior coverage: encryption/write failure preserves old credentials; malformed Slack rows and timestamp bounds; private metadata never cached; cache deletion after redirected pagination; cycle/page budget; literal reference matching and false positives; missing/removed/deferred policy docs; per-stream observation time; related PRs in local chat; migration from v2; inspection history, heads, feedback and stale notes; cloud-preview consent/payload scope, stable chunk IDs, source changes/deletion, key absence, daily limits, invalid citations, provider errors/refusal/truncation/abstention, local fallback, model provenance/evidence restart and export.

The Electron suite verifies modal focus entry/Tab containment, native imports/exports, saved settings/notes/inspection history/conversations after restart, demo separation, briefing rendering, optional cloud preview/consent/invalidation, and runtime context isolation. New screenshots were inspected visually. This is not a complete WCAG audit. Windows, signing/notarization, real personal-token OS persistence, and live OpenAI quality/access remain unverified. The first baseline sandboxed launch failed with EPERM/SIGABRT; rerunning with desktop launch permission passed. An initial new focus assertion failed, was fixed, and passed before its milestone commit.

See [audit](docs/audits/CODE_REVIEW.md), [journal](docs/development-journal/2026-10-23.md) and [artifact evidence](docs/course/BUILD_ARTIFACTS.md).
