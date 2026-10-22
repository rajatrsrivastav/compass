# Optional grounded OpenAI integration

Implemented during the 2026-10-23 audit. No live provider call was made during development: no user-provided OpenAI credential was configured for validation. Contract, privacy and failure behavior were tested with controlled HTTP responses. Account-specific model access and live answer quality remain unverified.

## User workflow

Save an optional API key in Settings. Session-only is the default; persistent storage uses the same atomic OS-backed credential implementation as GitHub, in a separate encrypted file. The renderer never receives stored keys. Choose the documented model alias `gpt-5.4-mini` or pinned `gpt-5.4-mini-2026-03-17`, a daily request limit and output-token cap. Those IDs are documented by the [official model page](https://developers.openai.com/api/docs/models/gpt-5.4-mini); that does not establish access for a particular account.

In a real local conversation, select records and write a question. “Preview OpenAI evidence” performs local retrieval only. Review the displayed question, passages and metadata, then explicitly authorize cloud processing. The ordinary Send button remains deterministic and local. Synthetic conversations stay read-only, and any selected synthetic evidence retains its provenance label.

Only the previewed question, up to eight 1,600-character passages with metadata, and fixed grounding instructions are sent. The cloud prompt excludes previous conversation messages and private item notes/inspection history. Select journey tasks, changes or repository guidance explicitly for those questions. A new question, selection, provider configuration, deleted/changed evidence or expired preview requires a new approval. Previews expire after five minutes and live only in main-process memory. They are consumed on send; there is no automatic retry.

## Storage and retrieval

Migration 4 adds a separate FTS5 `evidence` index, backfilled from existing domain rows without replacing them. Stable IDs hash the record identity, metadata, passage offset and text. Source transcripts retain available segment timestamps. Updates/deletions maintain the index in the same transaction as the domain row. Retrieval intersects FTS hits with the explicitly selected visible record IDs, limits results to eight, and falls back to opening passages if no lexical hit exists. The preview exposes exactly what that bounded retrieval found; it does not imply full-record coverage. Local data remains unencrypted SQLite.

Model messages reuse the conversation table and preserve timestamp, provider model, total token usage when returned, source record IDs and the exact evidence snapshot. Deleting an original source does not erase excerpts already retained in conversations or exports; delete those conversations/exports separately. Exports and snapshots can contain private community data.

## Request and validation boundaries

The main process issues one POST to `https://api.openai.com/v1/responses`, rejects redirects, uses a 60-second timeout, requests `store:false`, and offers no tools. The [Responses structured-output format](https://developers.openai.com/api/docs/guides/structured-outputs) requests an abstention flag and claims with citation IDs. Local schema validation rejects malformed/incomplete/refused answers and missing/unknown citation IDs. An insufficient-evidence response abstains. Citation validity proves only membership in supplied passages, not factual correctness, relevance or resistance to all prompt injection. Users must verify claims.

Usage is reserved transactionally before a network attempt and persists across restarts, with a UTC daily boundary. Failed attempts count because the provider may already have processed them. Output limits are 256–2,000 tokens; daily attempts 1–50, default five. These are local limits, not account-wide monetary caps. Configure billing controls with the provider. No pricing estimate is embedded in the app.

`store:false` follows the [official conversation-state guidance](https://developers.openai.com/api/docs/guides/conversation-state). It does not promise zero retention; provider account policies apply. No imported text is sent during setup, preview, local chat, synchronization or background work. API errors never echo a response body or credential; the local assistant remains usable.

## Verification

Tests cover consent rejection before network, exact preview payload, key absence, no tools/history, source mutation/deletion, demo visibility, stable chunk IDs, exclusion of private notes, invalid citations, persisted limits, authentication/rate limits/refusal/incomplete answers, abstention, model-message restart persistence and deterministic fallback. Electron tests exercise preview text, consent gating, invalidation on question change and key deletion without making a provider request. Real service validation remains an explicit next step using an authorized account and non-sensitive evidence.
