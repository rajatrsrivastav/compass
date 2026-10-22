# SQLite schema and data lifecycle

| Table | Key and contents | Lifecycle |
| --- | --- | --- |
| migrations | Integer version, applied timestamp | Four real forward migrations; idempotent on reopen |
| settings | Key, JSON value | Contributor profile, theme, capacity, goal, demo visibility, sync limit |
| repositories | Canonical lowercase owner/repo, JSON | Metadata, provenance, last success, partial/error/rate state, guidance |
| items | owner/repo#number, repository FK, JSON | Issue/PR body, labels, authors, assignments, timestamps, comments, reviews, checks, saved flag, private status and note |
| sources | UUID, JSON | Manual/import provenance, source date, import date, URL, segments, timestamps, explicit references, candidate links, annotations |
| tasks | UUID, JSON | Objective/preparation/manual achievement, hours, completion, deadline, evidence link |
| conversations | UUID, JSON | Title, demo indicator, creation time, ordered message records |
| changes | UUID, repository index, JSON | Newly observed/state/review updates and imported references with optional source ID |
| http_cache | Request URL, ETag, body, Link header | Conditional request cache; no authorization headers stored |
| sync_checkpoints | Repository FK, complete issue-list start time | Advances only when issue pagination was not truncated |
| search | FTS5 id/kind/text | Transactional searchable aggregate text, parameterized literal token queries |
| prompt_templates | Version, body | Deterministic-v1 grounding rule |

Message entities include UUID, role, text, timestamp, source IDs and actual origin (`user`, `deterministic`, `demo`; `model` includes optional model/usage metadata and supplied evidence chunks). Comments/reviews, segments, references, annotations, saved state and private investigation notes are embedded in owner aggregates rather than independent SQL tables. TypeScript models are the canonical shape. At larger scale, split high-volume messages/comments into normalized tables and introduce paged IPC queries.

Repository deletion cascades items and clears cached API paths and search entries. Source deletion clears source/search data and its associated events. Conversation deletion removes its aggregate and search entry. Exports and excerpts in other aggregates are independent records. See SECURITY for deletion semantics.

A successful sync transaction uses old observations to create change events before advancing metadata. A failed/cancelled sync keeps cached items and updates only the error state. SQLite foreign keys and WAL are enabled. Migrations run once on startup and are tested against reopening.

## Audit additions

Migration 3 removes disposable legacy HTTP cache entries, adds a literal repository owner and index, and preserves all domain rows. Redirected page caches inherit the originating repository. Migration 4 adds the evidence FTS table and backfills supported records transactionally. Both remain idempotent. PR JSON aggregates now preserve an append-only local inspection history, note head anchor and separate discussion/review/check observation metadata; legacy fields are optional and display unknown coverage. Daily OpenAI attempts and configuration use settings; keys never do.
