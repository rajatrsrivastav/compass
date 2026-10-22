# Testing and actual results

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

Electron-generated screenshots are in `docs/screenshots`. Overview and community screenshots were visually inspected for usable layout; the application exposes actual data rather than screenshot-backed controls. These images contain synthetic test records. Automated desktop checks are not represented as manual user testing or a complete accessibility audit.

## Audit and packaging notes

The audit-suggested older electron-builder version introduced more severe advisories and was reverted to 26.15.3. The remaining transitive packaging advisory has not been hidden with an unverified override. Recheck before distribution. Production-only dependencies audited cleanly.

The first packaging attempt auto-discovered a local signing identity. That process was stopped, `mac.identity: null` was added, and the final artifact was rebuilt with the tool explicitly reporting that signing was skipped. No signed-release or notarization claim is made. The packaged-app smoke test used an isolated temporary profile.
