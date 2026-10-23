# Devin Code Scans — access blocked, no scans executed

Availability checked in the audit session beginning 2026-10-22. Local baseline: `e68c6b7627889772f1158f600749da22494c04ad`; audit branch `codex/post-codex-audit`. No remote is configured. No Devin-accessible repository or scanned SHA exists.

| Required evidence | Actual result |
|---|---|
| Connected Devin tool | None in available tool inventory |
| Plugin directory search | Search for `Devin` returned an empty plugin list |
| Local integration | No Devin-named environment variable names and no `devin` executable found; secret values were not read |
| Account / organization / permissions | Not available for verification; this does not imply the user has no account |
| Repository integration / ownership | No Git remote or authorized Devin repository mapping available |
| Profiles / usage budget | Unavailable, no paid execution authorized against an identified account |
| Scan category / ID / URL / completion | None; not submitted |
| Findings / severity / affected lines | None from Devin; local findings are in CODE_REVIEW.md |
| Remediation sessions / PRs / merges | None |
| Consumption | No scan/remediation API calls made; account-wide usage unknown |

No Devin findings have been confirmed, rejected, fixed or re-scanned. All source changes in this audit are Codex changes. The permitted fallback is local review and tests, with this blocked-status record.

## Reproducible operator runbook (not executed)

First establish an authorized organization, Git integration and a remote containing the intended commit. Record the immutable `git rev-parse HEAD`, repository owner/name, permitted spending ceiling and operator. Keep credentials in a secret store; do not paste them into reports or commits. Preserve a clean baseline branch.

The official [v3 workflow](https://docs.devin.ai/api-reference/v3/code-scans/triggering-code-scans) documents these organization endpoints, authenticated with a service-user key or personal access token:

| Operation | Path under `https://api.devin.ai/v3/organizations/{org_id}` |
|---|---|
| Inspect profiles | `GET /code-scans/profiles` |
| Inspect one profile | `GET /code-scans/profiles/{profile_id}` |
| Submit | `POST /code-scans` |
| List/poll | `GET /code-scans/scans` (filter repository; identify returned scan ID) |
| Read findings | `GET /code-scans/findings` with `scan_id`; follow pagination |

Verify `ViewCodeScans` / `UseCodeScans` permissions and relevant session permissions with the operator. Start with one scoped scan; do not submit all categories automatically. Poll with backoff and stop on completion/failure/cancellation. Save responses with credentials redacted.

[Creation schema](https://docs.devin.ai/api-reference/v3/code-scans/organizations-code-scans-start): select an available discover profile matching the chosen non-security category. Security supports a profile-less scan. Supported relevant values include `performance`, `test-coverage`, `dead-code`, `accessibility`, `code-quality`, `security`, `db-queries`, `cleanup`. Pin `commit_sha`; use the verified `repo_name`, and `profile_id` where required. `platform` must be configured for that organization. Budget controls require appropriate account permissions; do not use example budgets from documentation. Have the account operator enforce the agreed ceiling before submission.

Prepare and review a JSON request locally with only resolved values (not placeholder identifiers): `repo_name`, `commit_sha`, `scan_type`, matching `profile_id`, and the configured budget/runner options. Submit it only after the prerequisite checks. Record the returned scan ID, URL, organization, category/profile, status, timestamp and actual usage if available.

For each finding, capture its ID, severity, file/line, evidence, local reproduction and classification: confirmed defect, improvement, needs investigation, false positive, not applicable, or deferred with reason. Prioritize data loss/security, then correctness, measured performance, test gaps and accessibility. Preserve historical migrations and Electron entry points when investigating dead-code claims.

For a selected reproduced finding, the [official remediation operation](https://docs.devin.ai/api-reference/v3/code-scans/organizations-code-scans-remediate) is `POST /code-scans/{scan_id}/findings/{finding_id}/remediate`. Retain its returned `session_id` and `finding_id`. Validate budget and repository modification authority before each launch. Inspect the resulting isolated branch/PR, verify scope, run the regression, typecheck/lint/unit/Electron/build checks, and record reviewer verdict. No automatic merge; record a merge only after verifying it occurred. Re-scan only a meaningful target if budget permits.

## Future evidence row

Use a real row only after execution: timestamp | repository | SHA | org | profile/category | scan ID/URL/status | usage | finding ID/severity/location | reproduction | classification | remediation session | PR | validation | accepted/rejected/deferred reason. There are currently zero such rows.
