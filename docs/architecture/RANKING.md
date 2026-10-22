# Explainable opportunity scoring

The default scorer is in `src/shared/ranking.ts`; weights are exported for review and tuning. It ranks only cached open issues and clamps scores to 0–100. This is an investigation-fit score, not an impact metric or probability of acceptance.

| Signal | Weight |
| --- | ---: |
| Open issue | +15 |
| good first issue / beginner / help wanted label | +24 |
| No observed assignee | +12 |
| Declared skill/interest occurs in title/body/labels | +18 |
| Updated within 30 days | +10 |
| Description exceeds 100 characters | +8 |
| Explicit imported reference | +20 |
| Existing assignee | −22 |
| Open cached PR explicitly references or is referenced by the issue | −18 |

Categories: Beginner-friendly, Potentially meaningful, Needs investigation, Community-context match, Possibly blocked or already being addressed. Assignments and related PRs take precedence over positive community signals. Reasons, source IDs, provenance, and observation dates accompany results. Candidate word matches never count as explicit evidence. A community reference says only that the user-supplied text mentions the issue.

Known heuristic limits: skills are comma-separated text matches; PR relationships are indexed from explicit short, qualified and URL references in cached descriptions/discussions; code examples and unrelated numeric/foreign references are excluded; related PR availability depends on cached coverage. Similar words and labels do not establish actual difficulty, community approval, or official program eligibility.

The separate competing-work status distinguishes open related PRs, assignment, possible blockers inferred from labels, previous attempts, insufficient coverage, and no identified competing work in available data. None establish that nobody else is working. Source coverage and observation times accompany Before You Start. A related PR reference is evidence of a mention, not proof it implements the issue.
