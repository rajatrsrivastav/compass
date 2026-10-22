import { it, expect } from "vitest";
import { mapItem } from "../../src/main/github/sync";
import { workIndex, assessWork } from "../../src/shared/intelligence";
import { rank } from "../../src/shared/ranking";
import { defaultProfile } from "../../src/main/database/store";
import type { Repository } from "../../src/shared/types";
const issue = mapItem(
  "a/b.c",
  {
    number: 42,
    title: "Keyboard navigation",
    state: "open",
    updated_at: "2026-10-01",
  },
  "issue",
);
const pr = (body: string, state = "open") =>
  mapItem(
    "a/b.c",
    { number: 50, title: "Improve keyboard", body, state },
    "pr",
  );
const repo: Repository = {
  id: issue.repo,
  name: issue.repo,
  description: "",
  language: "",
  stars: 0,
  provenance: "github",
  syncedAt: "2026-10-22",
  error: null,
  partial: false,
  guidance: {},
  remaining: 20,
};
it("matches explicit short, qualified and URL references without closing keywords", () => {
  for (const body of [
    "See #42",
    "Related: A/B.C#42",
    "https://github.com/a/b.c/issues/42",
  ])
    expect(workIndex([issue, pr(body)]).get(issue.id)).toHaveLength(1);
});
it("rejects bare numbers, code, foreign references and regex lookalikes", () => {
  for (const body of [
    "Fix 42",
    "Fixes #420",
    "a/other#42",
    "https://github.com/a/bxc/issues/42",
    "`#42`",
    "https://example.org/?fragment=#42",
    "```js\n#42\n```",
    "#0",
  ])
    expect(workIndex([issue, pr(body)]).get(issue.id)).toBeUndefined();
});
it("finds reverse references and discussion evidence with provenance", () => {
  const p = pr("");
  const i = {
    ...issue,
    commentsObservedAt: "2026-10-22",
    comments: [
      {
        author: "someone",
        body: "See #50",
        url: "https://github.com/a/b.c/issues/42#issuecomment-1",
        at: "2026-10-21",
      },
    ],
  };
  expect(workIndex([i, p]).get(i.id)?.[0]).toMatchObject({
    evidence: "#50",
    observedAt: "2026-10-22",
    url: i.comments[0].url,
  });
});
it("classifies bounded coverage, previous attempts, assignment and blockers", () => {
  const complete = {
    ...issue,
    commentsObservedAt: "2026-10-22",
    commentsComplete: true,
  };
  expect(assessWork(issue, repo, []).status).toBe(
    "Insufficient synchronized information",
  );
  expect(assessWork(complete, { ...repo, partial: true }, []).status).toBe(
    "Insufficient synchronized information",
  );
  expect(assessWork(complete, repo, []).status).toBe(
    "No competing work identified in available data",
  );
  expect(
    assessWork({ ...complete, assignees: ["alex"] }, repo, []).status,
  ).toBe("Assigned or potentially being investigated");
  expect(
    assessWork({ ...complete, labels: ["blocked"] }, repo, []).status,
  ).toBe("Possibly blocked");
  const closed = workIndex([complete, pr("See #42", "closed")]).get(
    complete.id,
  )!;
  expect(assessWork(complete, repo, closed).status).toBe(
    "Previous attempt exists",
  );
  const ranked = rank(
    [complete, pr("See #42")],
    [],
    defaultProfile,
    Date.now(),
    [repo],
  )[0];
  expect(ranked.workStatus).toBe("Related PR already open");
  expect(ranked.relatedIds).toEqual(["a/b.c#50"]);
});
