# Contributing

Make contributions that improve a real workflow. Reproduce the problem, explain its impact, and keep the change focused. Respect upstream community rules; never automate public feedback merely to increase activity counts.

1. Create a descriptive feature branch, such as `feature/import-validation`.
2. Read the architecture and the original product requirements.
3. Implement a complete vertical slice with clear provenance and usable offline states.
4. Run typecheck, lint, relevant unit/integration tests, and Electron tests for changed desktop flows.
5. Update the development journal and affected course documentation using actual dates and outcomes.
6. Commit a cohesive tested milestone. Never backdate commits or invent test evidence.

Use `npm run format` for TypeScript/React/CSS formatting. Keep API tokens, databases, personal exports, build products, and node_modules out of Git. Fixtures must say Synthetic Demo Data. AI-generated changes require review and tests; record assistance honestly.

For network tests, set `OSS_COMPASS_LIVE_TEST=1`; ordinary test runs remain deterministic. Never rely on current GitHub counts in fixture assertions.
