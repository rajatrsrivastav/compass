# Security and privacy

## Enforced boundaries

- Renderer context isolation, disabled Node integration, sandbox, web security, denied browser permissions, denied webviews/new windows, and restricted navigation.
- Narrow preload API; Zod input validation plus exact sender/main-frame checks.
- Default-deny CSP. Development WebSocket connections are permitted only on localhost. Remote HTML and images are not loaded through Markdown; Markdown raw HTML is not enabled.
- GitHub requests restricted to HTTPS api.github.com repository endpoints, including validated same-origin redirects. Authorization is not forwarded to other origins. External browser links require standard HTTPS URLs and reject local IP/localhost destinations.
- No shell-command execution from GitHub or community text. All source text is data, including prompt-like instructions.
- Import permission acknowledgement, explicit formats, 2 MB size limit, null-byte rejection, source provenance, and exact-passage annotation validation.
- Token persistence uses Electron safeStorage only when encryption is available and the backend is not basic_text. Otherwise session-only storage is offered. A token is not stored in SQLite, browser storage, source, or logs.
- No telemetry, automatic comments/reviews/merges, hidden uploads, Slack/Discord scraping, or external AI requests.

## Local-data limitations

The SQLite database and Markdown exports are not encrypted. Imported source text can appear in its FTS index and in user-selected conversation excerpts. Deleting a source removes its source record, extracted links, annotations, and associated change events; it does not silently rewrite existing conversations or already exported files. Delete those separately when required. SQLite deletion is logical deletion, not guaranteed forensic erasure of filesystem backups, free pages, or prior WAL contents. Full-device encryption is recommended for confidential work.

An OS-backed encryption implementation is exercised with a test double in deterministic tests. Session-only behavior and rejection of insecure backends are tested; no real personal GitHub token was used during development. macOS signing affects Keychain behavior across app builds; production credential continuity requires signing and platform validation.

## Dependency audit

The final packaging-tool audit status is recorded in TESTING.md. Avoid blind forced dependency downgrades: the audit-suggested older electron-builder version was experimentally found to introduce higher-severity old dependencies and was not retained. Recheck advisories before distributing a release.

## Reporting

Do not put secrets, private transcripts, or live tokens in public issue reports. Provide a minimal sanitized reproduction. This repository has no configured external vulnerability-reporting address.
