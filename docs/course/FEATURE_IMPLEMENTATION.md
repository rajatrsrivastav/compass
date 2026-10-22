# Implemented features and boundaries

| Workspace | Working behavior | Boundary |
| --- | --- | --- |
| Onboarding | Username, skills, interests, hours, goal | No GitHub account verification |
| Overview | Local counts, observed changes, recommendations, saved items, current focus and plan | No invented graph data or push scheduler |
| Repositories | Add/delete, primary focus, sync/cancel, errors, limits, documented organization briefing | Public repositories only; cached bounded observations |
| Opportunity Radar | Search, repo/category/saved filters, ranked evidence, competing-work coverage, Before You Start and notes | Heuristic fit, not endorsement |
| PR Review Queue | Search/filter, discussions/reviews/checks, local states, inspection/head history, stale-note warnings, external diff | No review submission or merge |
| Community Context | Manual notes, paste/link, file imports, FTS search, references, annotations | Authorized text only; no Slack/Discord connection |
| My Journey | Objectives, capacity, completion, deadlines, manual achievements, Markdown report | Links do not automatically prove contribution authorship |
| AI Copilot | Real persistent local conversations, context selection, rename/search/delete/export, labeled examples | Local deterministic default; optional consent-gated OpenAI, live provider validation outstanding |
| Settings & privacy | Profile/theme/demo/sync budget, separate credential create/delete, optional provider limits, local privacy explanation | OS encryption availability varies by platform |

Screenshots are from the actual Electron E2E test using synthetic demo records. They are not screenshots of live community activity.
