# Requirements traceability

The unabridged requirements are in `docs/ai/MASTER_BUILD_PROMPT.md`.

| Requirement group | Implementation / evidence |
| --- | --- |
| Real Electron, strict TS, React, Tailwind, compatible shadcn primitive, Zustand | Build config, renderer, Button CVA/Radix component; Electron E2E |
| SQLite and migrations, FTS5, private state | Store, two migrations; persistence tests |
| Public GitHub, issues vs PRs, pagination, retries, limits, cancellation | GitHubClient and SyncService; mocked edge tests and opt-in live test |
| Profiles and multi-repository tracking | Onboarding, repository screen, Settings |
| Opportunities and PR workflow | Ranking tests, radar, detail drawer, private review state |
| Manual/community imports without integrations | Parser, native dialog, consent, references, annotations; E2E |
| Genuine change detection and briefing | Baseline-aware item upserts and source change events |
| Journey/capacity/deadlines/report | Task service validation, board, Markdown export |
| Persistent chat and demo separation | Conversations/messages in SQLite; restart and demo-mode E2E |
| Credential and renderer security | safeStorage/session abstraction, validated IPC, CSP, sandbox E2E |
| Offline fixtures and provenance | Explicit synthetic project/meeting/conversations and labels |
| Build, tests, documentation, real history | Scripts, packaging config, this documentation and actual commits |
| Optional live AI provider | Deferred; local deterministic assistant ships and is clearly labeled |
| Windows installer | Configuration and CI provided; local host cannot establish Windows runtime correctness |

Unimplemented vision items are retained in KNOWN_LIMITATIONS rather than represented by dummy controls.
