# Course testing report

The authoritative actual outcomes, commands, coverage, live-integration failure, audit result and platform limitations are in [TESTING.md](../../TESTING.md).

On 2026-10-22: strict typecheck and ESLint passed; 32 deterministic unit/integration tests passed; two real Electron E2E tests passed, including restart persistence and native file import/export. The production build and unsigned macOS arm64 package succeeded. The actual packaged app launched and used its bundled native SQLite successfully.

The two-repository live GitHub test initially hit exhausted public quota, then passed on the continued run after adding proactive low-quota enrichment deferral. The live result verifies core synchronization with truthful partial-coverage labels. Windows installation/runtime and real OS credential persistence with a personal token are not claimed tested. No external language-model API is connected.

Screenshots: [overview](../screenshots/overview-dark.png), [community](../screenshots/community.png), [copilot](../screenshots/copilot.png), [light theme](../screenshots/copilot-light.png). All fixture activity is synthetic and visibly labeled.
