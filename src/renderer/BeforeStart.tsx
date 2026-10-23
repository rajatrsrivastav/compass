import type { Item, Snapshot } from "../shared/types";
import { workIndex, assessWork } from "../shared/intelligence";
import { OpenButton, date } from "./components/common";
import { useApp } from "./store";

export function BeforeStart({
  item,
  snapshot: s,
}: {
  item: Item;
  snapshot: Snapshot;
}) {
  const repo = s.repositories.find((r) => r.id === item.repo);
  const work = assessWork(item, repo, workIndex(s.items).get(item.id) ?? []);
  return (
    <section className="reader-section">
      <h2>Before you start</h2>
      <p className="work-summary">{work.status}</p>
      <dl className="reader-facts">
        <dt>Assignees</dt>
        <dd>{item.assignees.join(", ") || "Unassigned"}</dd>
        <dt>Repository snapshot</dt>
        <dd>{date(repo?.syncedAt ?? null)}</dd>
        {!!work.blockers.length && (
          <>
            <dt>Blocker labels</dt>
            <dd>{work.blockers.join(", ")}</dd>
          </>
        )}
      </dl>
      {work.incomplete && (
        <p className="reader-caption">Related-work coverage is incomplete.</p>
      )}
      {work.related.map((r) => (
        <div className="reader-related" key={r.item.id}>
          <button
            className="text-link"
            onClick={() => useApp.getState().select(r.item.id)}
          >
            #{r.item.number} {r.item.title}
          </button>
          <p>
            {r.item.state === "open" ? "Open" : "Closed"} PR · {r.evidence}
          </p>
          {r.url && r.item.provenance !== "demo" && (
            <OpenButton url={r.url} label="Reference evidence" />
          )}
        </div>
      ))}
      <button
        className="text-link"
        onClick={() => useApp.getState().navigate("Repositories")}
      >
        Repository files and contribution guidance
      </button>
    </section>
  );
}
