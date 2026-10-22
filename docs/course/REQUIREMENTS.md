# Requirements traceability

The unabridged requirements are in `docs/ai/MASTER_BUILD_PROMPT.md`.

| Requirement group | Implementation / evidence |
| --- | --- |
| Real Electron, strict TS, React, Tailwind, compatible shadcn primitive, Zustand | Build config, renderer, Button CVA/Radix component; Electron E2E |
| SQLite and migrations, FTS5, private state | Store, four migrations; persistence tests |
| Public GitHub, issues vs PRs, pagination, retries, limits, cancellation | GitHubClient and SyncService; mocked edge tests and opt-in live test |
| Profiles and multi-repository tracking | Onboarding, repository screen, Settings |
| Opportunities and PR workflow | Reference index/classification tests, Before You Start, briefing, private inspection history |
| Manual/community imports without integrations | Parser, native dialog, consent, references, annotations; E2E |
| Genuine change detection and briefing | Baseline-aware item upserts and source change events |
| Journey/capacity/deadlines/report | Task service validation, board, Markdown export |
| Persistent chat and demo separation | Conversations/messages in SQLite; restart and demo-mode E2E |
| Credential and renderer security | safeStorage/session abstraction, validated IPC, CSP, sandbox E2E |
| Offline fixtures and provenance | Explicit synthetic project/meeting/conversations and labels |
| Build, tests, documentation, real history | Scripts, packaging config, this documentation and actual commits |
| Optional live AI provider | Optional OpenAI adapter with exact preview, consent, FTS chunks/citations, usage limits; mock contract and real desktop privacy tests, no live provider call |
| Windows installer | Configuration and CI provided; local host cannot establish Windows runtime correctness |

Unimplemented vision items are retained in KNOWN_LIMITATIONS rather than represented by dummy controls.
