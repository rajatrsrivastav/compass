# Course testing report

The authoritative actual outcomes, commands, coverage, live-integration failure, audit result and platform limitations are in [TESTING.md](../../TESTING.md).

On 2026-10-22: strict typecheck and ESLint passed; 32 deterministic unit/integration tests passed; two real Electron E2E tests passed, including restart persistence and native file import/export. The production build and unsigned macOS arm64 package succeeded. The actual packaged app launched and used its bundled native SQLite successfully.

The two-repository live GitHub test initially hit exhausted public quota, then passed on the continued run after adding proactive low-quota enrichment deferral. The live result verifies core synchronization with truthful partial-coverage labels. Windows installation/runtime and real OS credential persistence with a personal token are not claimed tested. No external language-model API is connected.

Screenshots: [overview](../screenshots/overview-dark.png), [community](../screenshots/community.png), [copilot](../screenshots/copilot.png), [light theme](../screenshots/copilot-light.png). All fixture activity is synthetic and visibly labeled.

## Version 0.2 — 2026-10-23

Final typecheck and lint pass. `npm test`: 53 passed, two opt-in tests skipped (2.05 s). `npm run test:e2e`: three real Electron workflows passed (17.5 s), including privacy-preview gating, briefing rendering, native import/export and inspection/conversation restart persistence. The live GitHub test passed separately for electron/electron-quick-start (10 items) and octocat/Hello-World (13 items), both truthfully partial under low quota. Build and unsigned arm64 packaging passed. Packaged launch verification is recorded in BUILD_ARTIFACTS.md.

The baseline was 32 local tests and two desktop workflows. The 2,000-record ranking microbenchmark fell from median 192.974 ms to 3.967 ms on the same Apple M3/Node 22.16.0; this does not measure overall application performance. Full and production npm audit returned zero at release time; baseline npm ci reported eight moderate development paths and dependency versions were unchanged. Raw audit JSON is preserved.

Optional OpenAI now exists, but all provider responses during testing were controlled fixtures. The real desktop consent test sends nothing to OpenAI. No live API key, personal-token persistence, Windows runtime, or comprehensive accessibility certification was tested. No Devin scan, finding or remediation exists. Codex performed the audit/fixes and automated validation; no Claude or human acceptance activity is fabricated.

New screen evidence: [Before You Start](../screenshots/before-you-start.png), [Organization Briefing](../screenshots/organization-briefing.png), [Review memory](../screenshots/review-memory.png), [Cloud consent](../screenshots/cloud-consent.png). All data shown is synthetic and labeled.
