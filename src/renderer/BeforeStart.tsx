import type { Item, Snapshot } from "../shared/types";
import { workIndex, assessWork } from "../shared/intelligence";
import { Markdown, OpenButton, Badge, date } from "./components/common";
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
    <section className="evidence-box">
      <div className="eyebrow">BEFORE YOU START</div>
      <h2>{work.status}</h2>
      <p>
        Repository synchronized {date(repo?.syncedAt ?? null)}. Discussion
        observed {date(item.commentsObservedAt ?? null)}.{" "}
        {work.incomplete
          ? "Coverage is partial or insufficient."
          : "No additional related work was found within the synchronized coverage."}{" "}
        Always verify current activity on GitHub.
      </p>
      <h3>Issue requirements</h3>
      <p>
        The description below is the source for requirements; reproduce it
        before assuming scope.
      </p>
      <p>
        Assignments: {item.assignees.join(", ") || "none recorded"}. Local
        investigation: {item.saved ? "saved" : "not saved"};{" "}
        {item.note ? "private notes recorded" : "no private notes"}.
      </p>
      {work.blockers.length > 0 && (
        <p>
          Possible blocker inferred from labels: {work.blockers.join(", ")}.
          Verify the discussion.
        </p>
      )}
      <h3>Existing related work</h3>
      {work.related.length ? (
        work.related.map((r) => (
          <article key={r.item.id}>
            <Badge tone="amber">
              {r.item.state === "open"
                ? "Open related PR"
                : "Previous attempt / closed PR"}
            </Badge>
            <p>
              <button
                className="text-link"
                onClick={() => useApp.getState().select(r.item.id)}
              >
                #{r.item.number} {r.item.title}
              </button>
            </p>
            <p>
              Explicit reference: {r.evidence}; observed{" "}
              {date(r.observedAt || null)}. A reference does not prove it
              implements the requirement.
            </p>
            {r.url && r.item.provenance !== "demo" && (
              <OpenButton url={r.url} label="Reference evidence" />
            )}
          </article>
        ))
      ) : (
        <p>
          No explicit related PR cached. This does not establish that nobody is
          working on the issue.
        </p>
      )}
      <h3>Available discussion</h3>
      {item.comments.slice(-3).map((c, n) => (
        <div key={n}>
          <b>{c.author}</b> · {date(c.at)}
          <Markdown>{c.body.slice(0, 1000)}</Markdown>
          {c.url && <OpenButton url={c.url} label="Discussion evidence" />}
        </div>
      ))}
      {!item.comments.length && (
        <p>No discussion cached. Check the current issue conversation.</p>
      )}
      <h3>Contribution expectations</h3>
      {(repo?.briefing?.documents ?? [])
        .filter((d) =>
          /CONTRIBUT|CODEOWNERS|MAINTAINERS|GOVERNANCE|AI/i.test(d.path),
        )
        .map((d) => (
          <p key={d.path}>
            <OpenButton url={d.url} label={d.path} /> · observed{" "}
            {date(d.observedAt)} {d.stale && "· needs refresh"}
          </p>
        ))}
      <p>
        <button
          className="text-link"
          onClick={() => useApp.getState().navigate("Repositories")}
        >
          Read repository briefing and guidance
        </button>
        . Unavailable policies do not imply permission.
      </p>
      <h3>Suggested research</h3>
      <ol>
        <li>Reproduce the problem and identify the affected subsystem.</li>
        <li>
          Compare the linked attempts and check current assignments and
          discussion.
        </li>
        <li>
          Read contribution and AI policies, then coordinate scope before
          starting.
        </li>
        <li>
          Budget time for tests and feedback; record your findings locally.
        </li>
      </ol>
    </section>
  );
}
