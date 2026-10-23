import type { Store } from "../database/store";
import type { Briefing, Item, Milestone, Repository } from "../../shared/types";
import readme from "./kuadrant-docs/README.md?raw";
import contributing from "./kuadrant-docs/CONTRIBUTING.md?raw";
import license from "./kuadrant-docs/LICENSE?raw";
import snapshot from "./kuadrant-snapshot.json";

export const kuadrantId = snapshot.id;
const capturedAt = snapshot.capturedAt;
const seedKey = "bundled:kuadrant-mcp-gateway";
const documentRevision = "d53efe36a7d3f8827bd6a3a07757efea1619a133";
const documents = Object.entries({
  "README.md": readme,
  "CONTRIBUTING.md": contributing,
  LICENSE: license,
}).map(([path, text]) => ({
  path,
  text,
  url: `https://github.com/Kuadrant/mcp-gateway/blob/${documentRevision}/${path}`,
  observedAt: capturedAt,
  stale: false,
  truncated: false,
}));
function withBundledFiles(previous?: Briefing): Briefing {
  const merged = new Map(documents.map((d) => [d.path, d]));
  for (const doc of previous?.documents ?? []) {
    if (!merged.has(doc.path) || doc.observedAt > capturedAt)
      merged.set(doc.path, doc);
  }
  return {
    observedAt:
      previous && previous.observedAt > capturedAt
        ? previous.observedAt
        : capturedAt,
    locations: previous?.locations ?? [],
    documents: [...merged.values()],
  };
}

export function seedKuadrant(store: Store, restore = false) {
  const marker = store.db
    .prepare("SELECT value FROM settings WHERE key=?")
    .get(seedKey) as { value: string } | undefined;
  if (!restore && marker) {
    if (marker.value !== documentRevision) {
      store.db.transaction(() => {
        const repo = store.get("repositories", kuadrantId);
        if (repo) {
          const briefing = withBundledFiles(repo.briefing);
          store.put("repositories", {
            ...repo,
            briefing,
            guidance: Object.fromEntries(
              briefing.documents.map((d) => [d.path, d.text]),
            ),
          });
        }
        store.db
          .prepare("UPDATE settings SET value=? WHERE key=?")
          .run(documentRevision, seedKey);
      })();
    }
    return;
  }

  store.db.transaction(() => {
    const current = store.get("repositories", kuadrantId);
    const newer = !!current?.syncedAt && current.syncedAt > capturedAt;
    const milestonesAreNewer =
      !!current?.milestonesObservedAt &&
      current.milestonesObservedAt > capturedAt;
    const briefing = withBundledFiles(current?.briefing);
    const repository: Repository = {
      id: kuadrantId,
      name: kuadrantId,
      description: snapshot.description,
      language: snapshot.language,
      stars: snapshot.stars,
      provenance: "github",
      syncedAt: capturedAt,
      error: null,
      partial: false,
      remaining: null,
      workCatalogComplete: true,
      ...(newer ? current : {}),
      bundledAt: capturedAt,
      briefing,
      guidance: Object.fromEntries(
        briefing.documents.map((doc) => [doc.path, doc.text]),
      ),
      milestones: milestonesAreNewer
        ? current?.milestones
        : (snapshot.milestones as Milestone[]),
      milestonesObservedAt: milestonesAreNewer
        ? current?.milestonesObservedAt
        : capturedAt,
    };
    store.put("repositories", repository);

    for (const record of snapshot.items) {
      const id = `${kuadrantId}#${record.number}`;
      const previous = store.get("items", id);
      if (previous && previous.observedAt > capturedAt) {
        if (
          previous.milestone === undefined &&
          previous.updatedAt === record.updatedAt
        )
          store.put("items", { ...previous, milestone: record.milestone });
        continue;
      }

      const item: Item = {
        ...record,
        kind: record.kind as Item["kind"],
        id,
        repo: kuadrantId,
        observedAt: capturedAt,
        provenance: "github",
        comments: record.comments ?? previous?.comments ?? [],
        commentsObservedAt: record.comments
          ? capturedAt
          : previous?.commentsObservedAt,
        commentsComplete: record.comments ? true : previous?.commentsComplete,
        reviews: previous?.reviews ?? [],
        reviewsObservedAt: previous?.reviewsObservedAt,
        reviewsComplete: previous?.reviewsComplete,
        headSha: record.headSha ?? previous?.headSha,
        checks: previous?.checks ?? "Not fetched",
        checksHeadSha: previous?.checksHeadSha,
        checksObservedAt: previous?.checksObservedAt,
        saved: false,
        reviewState: "Not reviewed",
        note: "",
      };
      // Keep a full description the user already fetched before this capture.
      if (previous && previous.updatedAt === item.updatedAt)
        item.body = previous.body;
      store.saveItem(item, true);
    }
    store.db
      .prepare(
        "INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run(seedKey, documentRevision);
  })();
}
