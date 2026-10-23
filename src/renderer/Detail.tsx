import { ReviewMemory } from "./ReviewMemory";
import { BeforeStart } from "./BeforeStart";
import { useEffect, useState, useRef, useMemo } from "react";
import { X, Bookmark, FileText } from "lucide-react";
import type { ReviewState } from "../shared/types";
import { useApp } from "./store";
import { rank } from "../shared/ranking";
import { Button } from "./components/ui/button";
import {
  Badge,
  Markdown,
  OpenButton,
  CommentEntry,
  date,
} from "./components/common";

export function Detail() {
  const { data: s, selected, select, act, openSource } = useApp();
  const dialog = useRef<HTMLDialogElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const item = s?.items.find((i) => i.id === selected);
  const [note, setNote] = useState("");
  const [thread, setThread] = useState(false);
  useEffect(() => setNote(item?.note ?? ""), [item?.id, item?.note]);
  useEffect(() => setThread(false), [selected]);
  useEffect(() => {
    scroll.current?.scrollTo(0, 0);
  }, [selected, thread]);
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
  const opportunity = useMemo(
    () =>
      s && item?.kind === "issue"
        ? rank(s.items, s.sources, s.profile, Date.now(), s.repositories).find(
            (r) => r.item.id === item.id,
          )
        : undefined,
    [s, item],
  );
  if (!selected || !s) return null;
  const related = item
    ? s.sources.filter((source) =>
        source.refs.some(
          (r) => r.repo === item.repo && r.number === item.number,
        ),
      )
    : [];
  const comments = item
    ? [...item.comments, ...item.reviews].sort((a, b) =>
        a.at.localeCompare(b.at),
      )
    : [];
  const repo = s.repositories.find((r) => r.id === item?.repo);
  return (
    <dialog
      ref={dialog}
      className="drawer-modal reader-dialog"
      aria-label="Item details"
      onCancel={(e) => {
        e.preventDefault();
        select(null);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) select(null);
      }}
    >
      <aside className="reader-drawer">
        <div className="reader-location">
          <code>
            {item ? (
              <>
                {item.repo} <b>#{item.number}</b>
              </>
            ) : (
              selected
            )}
          </code>
          <Button
            aria-label="Close details"
            size="icon"
            variant="ghost"
            onClick={() => select(null)}
          >
            <X size={18} />
          </Button>
        </div>
        {!item ? (
          <div className="reader-scroll">
            <h2>Reference not cached</h2>
            <p>Check the repository on GitHub for this item.</p>
          </div>
        ) : (
          <>
            <div className="reader-nav" aria-label="Item views">
              <button aria-pressed={!thread} onClick={() => setThread(false)}>
                {item.kind === "issue" ? "Issue" : "Pull request"}
              </button>
              <button aria-pressed={thread} onClick={() => setThread(true)}>
                Discussion <span>{comments.length}</span>
              </button>
            </div>
            <div className="reader-scroll" ref={scroll}>
              <header className="reader-title">
                <div className="reader-byline">
                  <Badge>{item.state}</Badge>
                  <span>{item.author}</span>
                  <span>{date(item.createdAt)}</span>
                </div>
                <h1>{item.title}</h1>
              </header>
              {thread ? (
                <section
                  className="reader-section thread-list"
                  aria-label="Discussion thread"
                >
                  <h2>Discussion</h2>
                  <details className="discussion-coverage">
                    <summary>
                      {item.commentsComplete &&
                      (item.kind === "issue" || item.reviewsComplete)
                        ? "Capture details"
                        : "Partial discussion · capture details"}
                    </summary>
                    <dl className="reader-facts">
                      <dt>Comments</dt>
                      <dd>
                        {date(item.commentsObservedAt ?? null)}
                        {item.commentsObservedAt &&
                          !item.commentsComplete &&
                          " · partial"}
                      </dd>
                      {item.kind === "pr" && (
                        <>
                          <dt>Reviews</dt>
                          <dd>
                            {date(item.reviewsObservedAt ?? null)}
                            {item.reviewsObservedAt &&
                              !item.reviewsComplete &&
                              " · partial"}
                          </dd>
                        </>
                      )}
                    </dl>
                  </details>
                  {comments.map((c, n) => (
                    <CommentEntry key={c.url + n} comment={c} />
                  ))}
                  {!comments.length && (
                    <p>
                      {item.commentsComplete
                        ? "No comments in the captured discussion."
                        : "No discussion cached."}
                    </p>
                  )}
                </section>
              ) : (
                <>
                  <div className="issue-labels">
                    {item.labels.map((l) => (
                      <Badge key={l}>{l}</Badge>
                    ))}
                  </div>
                  <div className="reader-actions">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void act({
                          type: "item:update",
                          id: item.id,
                          saved: !item.saved,
                        })
                      }
                    >
                      <Bookmark
                        size={14}
                        fill={item.saved ? "currentColor" : "none"}
                      />
                      {item.saved
                        ? "Saved for investigation"
                        : "Save for investigation"}
                    </Button>
                    {item.provenance !== "demo" && (
                      <OpenButton url={item.url} />
                    )}
                  </div>
                  <p className="reader-caption">
                    {item.provenance === "demo"
                      ? "Synthetic demo"
                      : repo?.bundledAt === item.observedAt
                        ? "GitHub snapshot captured"
                        : "GitHub cache updated"}{" "}
                    · {date(item.observedAt)}
                  </p>
                  <section className="reader-section">
                    <h2>Description</h2>
                    <Markdown sourceUrl={item.url}>
                      {item.body || "No description available."}
                    </Markdown>
                  </section>
                  {item.kind === "issue" && (
                    <BeforeStart item={item} snapshot={s} />
                  )}
                  {opportunity && (
                    <details className="reader-disclosure">
                      <summary>
                        Ranking signals · {opportunity.category}
                      </summary>
                      <ul>
                        {opportunity.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {item.kind === "pr" && (
                    <>
                      <section className="reader-section">
                        <h2>Private review</h2>
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
                        <h3>Checks</h3>
                        <p>{item.checks}</p>
                        <p className="reader-caption">
                          Observed {date(item.checksObservedAt ?? null)} ·{" "}
                          {item.headSha && item.checksHeadSha === item.headSha
                            ? "Matches cached head"
                            : "Head unverified"}
                        </p>
                        {item.provenance !== "demo" && (
                          <OpenButton
                            url={item.url + "/files"}
                            label="Inspect GitHub diff"
                          />
                        )}
                      </section>
                      <ReviewMemory item={item} />
                    </>
                  )}
                  <section className="reader-section">
                    <h2>Investigation notes</h2>
                    <textarea
                      aria-label="Investigation notes"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add private notes…"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        void act({ type: "item:update", id: item.id, note })
                      }
                    >
                      Save private note
                    </Button>
                  </section>
                  <section className="reader-section">
                    <h2>Community context</h2>
                    {related.map((source) => (
                      <div className="source-link" key={source.id}>
                        <FileText size={15} />
                        <div>
                          <button
                            className="text-link"
                            onClick={() => openSource(source.id)}
                          >
                            {source.title}
                          </button>
                          {source.refs
                            .filter(
                              (r) =>
                                r.repo === item.repo &&
                                r.number === item.number,
                            )
                            .map((r, n) => (
                              <p key={n}>
                                <Badge>
                                  {r.kind === "explicit"
                                    ? "Explicit reference"
                                    : "Unverified candidate"}
                                </Badge>{" "}
                                {r.evidence}
                              </p>
                            ))}
                        </div>
                      </div>
                    ))}
                    {!related.length && (
                      <p className="reader-caption">No linked local sources.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </dialog>
  );
}
