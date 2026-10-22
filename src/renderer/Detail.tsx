import { useEffect, useState, useRef } from "react";
import { X, Bookmark, ExternalLink, FileText, CheckCheck } from "lucide-react";
import type { ReviewState } from "../shared/types";
import { useApp } from "./store";
import { rank } from "../shared/ranking";
import { Button } from "./components/ui/button";
import { Badge, Markdown, OpenButton, date } from "./components/common";
export function Detail() {
  const { data: s, selected, select, act, openSource } = useApp();
  const dialog = useRef<HTMLDialogElement>(null);
  const item = s?.items.find((i) => i.id === selected);
  const [note, setNote] = useState("");
  useEffect(() => setNote(item?.note ?? ""), [item?.id, item?.note]);
  useEffect(() => {
    if (!selected) return;
    const prior = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    node?.showModal();
    node?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      node?.close();
      if (prior?.isConnected) prior.focus();
    };
  }, [selected]);
  if (!selected || !s) return null;
  if (!item)
    return (
      <dialog
        ref={dialog}
        className="drawer-modal"
        aria-label="Item details"
        onCancel={(e) => {
          e.preventDefault();
          select(null);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) select(null);
        }}
      >
        <aside className="drawer" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" onClick={() => select(null)}>
            Close
          </Button>
          <h2>Reference not cached</h2>
          <p>
            This source references {selected}. It may fall outside the
            synchronization limit. Check the repository on GitHub.
          </p>
        </aside>
      </dialog>
    );
  const opportunity = rank(s.items, s.sources, s.profile).find(
      (r) => r.item.id === item.id,
    ),
    related = s.sources.filter((source) =>
      source.refs.some((r) => r.repo === item.repo && r.number === item.number),
    );
  return (
    <dialog
      ref={dialog}
      className="drawer-modal"
      aria-label="Item details"
      onCancel={(e) => {
        e.preventDefault();
        select(null);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) select(null);
      }}
    >
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-top">
          <Badge tone={item.provenance === "demo" ? "amber" : "green"}>
            {item.provenance === "demo"
              ? "Synthetic demo"
              : "Cached GitHub evidence"}
          </Badge>
          <Button
            aria-label="Close details"
            size="icon"
            variant="ghost"
            onClick={() => select(null)}
          >
            <X size={20} />
          </Button>
        </div>
        <div className="row-meta">
          {item.repo} #{item.number}
        </div>
        <h1>{item.title}</h1>
        <div className="issue-labels">
          <Badge>{item.state}</Badge>
          {item.labels.map((l) => (
            <Badge key={l}>{l}</Badge>
          ))}
        </div>
        <p className="muted">
          By {item.author} · Last checked {date(item.observedAt)}
        </p>
        <div className="inline-actions">
          <Button
            variant={item.saved ? "default" : "secondary"}
            onClick={() =>
              void act({ type: "item:update", id: item.id, saved: !item.saved })
            }
          >
            <Bookmark size={15} />
            {item.saved ? "Saved for investigation" : "Save for investigation"}
          </Button>
          {item.provenance !== "demo" && <OpenButton url={item.url} />}
        </div>
        {opportunity && (
          <section className="evidence-box">
            <div className="eyebrow">WHY THIS APPEARS</div>
            <h3>{opportunity.category}</h3>
            <ul>
              {opportunity.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <small>
              Signals checked against cached item and selected local sources. No
              endorsement inferred.
            </small>
          </section>
        )}
        <h2>Description</h2>
        <Markdown>{item.body || "No description available."}</Markdown>
        {item.kind === "pr" && (
          <section>
            <h2>Private review workspace</h2>
            <label>
              My review state
              <select
                value={item.reviewState}
                onChange={(e) =>
                  void act({
                    type: "item:update",
                    id: item.id,
                    reviewState: e.target.value as ReviewState,
                  })
                }
              >
                {[
                  "Not reviewed",
                  "Investigating",
                  "Needs follow-up",
                  "Reviewed privately",
                  "Watch for changes",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <p className="footnote">
              <CheckCheck size={14} />
              This never submits an official GitHub review.
            </p>
            <h3>Available checks</h3>
            <p>{item.checks}</p>
            {item.provenance !== "demo" && (
              <OpenButton
                url={`${item.url}/files`}
                label="Inspect GitHub diff"
              />
            )}
          </section>
        )}
        <section>
          <h2>Investigation notes</h2>
          <textarea
            aria-label="Investigation notes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reproduction steps, questions, and your next action…"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void act({ type: "item:update", id: item.id, note })}
          >
            Save private note
          </Button>
        </section>
        <section>
          <h2>Community context</h2>
          {related.length ? (
            related.map((source) => (
              <div className="source-link" key={source.id}>
                <FileText size={16} />
                <div>
                  <button
                    className="text-link"
                    onClick={() => {
                      openSource(source.id);
                    }}
                  >
                    {source.title}
                    <ExternalLink size={12} />
                  </button>
                  {source.refs
                    .filter(
                      (r) => r.repo === item.repo && r.number === item.number,
                    )
                    .map((r, n) => (
                      <p key={n}>
                        <Badge tone={r.kind === "explicit" ? "green" : "amber"}>
                          {r.kind === "explicit"
                            ? "Explicit reference"
                            : "Unverified candidate"}
                        </Badge>{" "}
                        {r.evidence}
                      </p>
                    ))}
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No linked local sources yet.</p>
          )}
        </section>
        <section>
          <h2>Discussion & review activity</h2>
          {[...item.comments, ...item.reviews].map((c, n) => (
            <article className="comment" key={n}>
              <div className="comment-head">
                <b>{c.author}</b>
                <small>{date(c.at)}</small>
                {c.state && <Badge tone="purple">{c.state}</Badge>}
              </div>
              <Markdown>{c.body}</Markdown>
              {c.url && <OpenButton url={c.url} label="Source" />}
            </article>
          ))}
          {!item.comments.length && !item.reviews.length && (
            <p className="muted">
              No discussion cached. Enrichment is bounded; open GitHub to verify
              the complete conversation.
            </p>
          )}
        </section>
      </aside>
    </dialog>
  );
}
