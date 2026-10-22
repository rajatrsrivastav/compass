# Known limitations and next engineering work

## Deliberate MVP boundaries

- The copilot is local deterministic logic. External model integration, provider settings and context-upload consent are not shipped. A future adapter must require explicit opt-in, preview selected data, secure the model key, cite stored evidence, and remain optional.
- No OAuth, private repository ingestion, Slack/Discord bots, scraping, native audio, automatic public posting, merges, program submissions, or official deadline claims.
- GitHub snapshots are bounded. Up to 12 items receive discussion/review enrichment per synchronization; each child list has its own cap. Old PR changes outside the bounded recently-updated set may remain cached. Full graph consistency is not claimed.
- Guidance lookup checks root-level standard Markdown filenames, not every nested or differently cased variant.
- FTS indexes source/cached records, but renderer item filters use the in-memory snapshot. Snapshots and aggregate conversation messages should be paginated/normalized before very large workloads.
- Opportunity scoring and contextual links are conservative text heuristics. They do not prove difficulty, priority, endorsement or availability. References are extracted at import time against currently tracked repositories; re-linking after adding repositories is future work.
- Briefings display recent observed changes with timestamps. They are not exhaustive daily activity reports, operating-system notifications, or background work when the app is closed.
- SQLite content is not encrypted. Deleting sources does not rewrite old conversation excerpts, exported files, or backups. The security document explains logical deletion semantics.
- Fine-grained keyboard/focus accessibility audit, localization, automatic updates, code signing, notarization, crash recovery under forced power loss, and large-scale performance work remain.
- The full Windows build/runtime path must be validated on Windows. Native SQLite makes cross-platform packaging more than changing an output extension. CI configuration is provided but a remote CI run is not claimed.

- The native bundle currently uses Electron’s default application icon; in-app branding is implemented.
- Live core synchronization passed for two public repositories; complete discussion/check coverage is not claimed because the low-quota run deliberately deferred optional enrichment.
- Eight moderate development/packaging dependency paths remain in the full audit; production-only dependencies audited cleanly.

## Next steps

1. Validate NSIS installation and secure token persistence on Windows using the existing CI and a human desktop smoke test.
2. Expand sync coverage with resumable per-endpoint cursors, on-demand discussion refresh, explicit freshness per enrichment stream, and rate-reset scheduling.
3. Normalize high-volume messages/comments, paginate IPC snapshots, and add data retention/export management.
4. Add a well-tested opt-in model provider after the grounding, consent-preview and credential UX is reviewed.
5. Add permitted community adapters only through official APIs and appropriate community consent; retain manual capture as a first-class workflow.

The full original product vision is preserved in MASTER_BUILD_PROMPT.md; these limitations are not silently removed requirements.
