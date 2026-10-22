import type { Item, Repository } from "./types";
import { extractReferences } from "./references";
export interface RelatedWork {
  item: Item;
  evidence: string;
  url: string;
  observedAt: string;
}
export function workIndex(items: Item[]) {
  const records = new Map(items.map((i) => [i.id.toLowerCase(), i]));
  const repos = [...new Set(items.map((i) => i.repo.toLowerCase()))];
  const index = new Map<string, RelatedWork[]>();
  const add = (
    issue: Item,
    pr: Item,
    evidence: string,
    url: string,
    observedAt: string,
  ) => {
    const links = index.get(issue.id) ?? [];
    if (!links.some((r) => r.item.id === pr.id))
      links.push({ item: pr, evidence, url, observedAt });
    index.set(issue.id, links);
  };
  for (const item of items) {
    const passages = [
      { body: item.body, url: item.url, at: item.observedAt },
      ...item.comments.map((c) => ({
        body: c.body,
        url: c.url,
        at: item.commentsObservedAt ?? "",
      })),
    ];
    for (const passage of passages) {
      for (const ref of extractReferences(passage.body, item.repo, repos)) {
        const target = records.get(`${ref.repo}#${ref.number}`);
        if (!target || target.kind === item.kind) continue;
        add(
          item.kind === "issue" ? item : target,
          item.kind === "pr" ? item : target,
          ref.evidence,
          passage.url,
          passage.at,
        );
      }
    }
  }
  return index;
}
export function assessWork(
  item: Item,
  repository: Repository | undefined,
  related: RelatedWork[],
) {
  const blockers = item.labels.filter((l) =>
    /\bblocked\b|needs[- ](?:decision|design)|waiting[- ]on/i.test(l),
  );
  const incomplete =
    !repository?.syncedAt ||
    repository.partial ||
    !item.commentsObservedAt ||
    !item.commentsComplete;
  const status = related.some((r) => r.item.state === "open")
    ? "Related PR already open"
    : item.assignees.length
      ? "Assigned or potentially being investigated"
      : blockers.length
        ? "Possibly blocked"
        : related.length
          ? "Previous attempt exists"
          : incomplete
            ? "Insufficient synchronized information"
            : "No competing work identified in available data";
  return { status, blockers, incomplete, related };
}
