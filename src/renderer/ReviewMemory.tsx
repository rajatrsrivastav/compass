import type { Item } from "../shared/types";
import { reviewDelta } from "../shared/review";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import { Markdown, OpenButton, date } from "./components/common";
export function ReviewMemory({ item }: { item: Item }) {
  const { act } = useApp();
  const delta = reviewDelta(item);
  return (
    <section className="evidence-box">
      <h3>Personal review memory</h3>
      <p>
        Current cached head:{" "}
        <code>{item.headSha?.slice(0, 12) ?? "not synchronized"}</code> ·
        observed {date(item.observedAt)}.
      </p>
      {delta.last ? (
        <>
          <p>
            Last inspected {date(delta.last.inspectedAt)} at head{" "}
            <code>{delta.last.headSha?.slice(0, 12) ?? "unknown"}</code>.
            Private state then: {delta.last.privateState}.
          </p>
          <p>
            {!delta.headKnown
              ? "Head comparison unavailable; synchronize commit metadata before drawing conclusions."
              : delta.headChanged
                ? "A different head commit was observed since your inspection. Recheck the diff; this may include a rebase or force push."
                : "No head change identified in the available cached metadata. Verify current GitHub state."}
          </p>
          {delta.notesStale && (
            <p role="status" className="error-text">
              Earlier notes may be outdated by the newly observed head commit.
            </p>
          )}
          <p>
            {delta.newFeedback.length} newly observed feedback entries or review
            states since inspection.{" "}
            {delta.feedbackComplete
              ? "Discussion pages were refreshed after inspection within the fetch limits."
              : "Feedback coverage is incomplete or has not been refreshed since inspection."}{" "}
            Exact code changes and edited-comment diffs are not available here.
          </p>
          {delta.newFeedback.map((c, n) => (
            <article key={n}>
              <b>{c.author}</b> · {c.state ?? "comment"} · {date(c.at)}
              <Markdown>{c.body}</Markdown>
              {c.url && <OpenButton url={c.url} label="Feedback source" />}
            </article>
          ))}
        </>
      ) : (
        <p>
          No inspection recorded. Record one after reviewing the currently
          available evidence.
        </p>
      )}
      <Button
        variant="secondary"
        onClick={() => void act({ type: "item:inspect", id: item.id })}
      >
        Record inspection
      </Button>
      <p className="footnote">
        Records saved notes, head and observed feedback locally. Save edited
        notes first. This never posts an official GitHub review.
      </p>
      <details>
        <summary>Inspection history ({item.inspections?.length ?? 0})</summary>
        {[...(item.inspections ?? [])].reverse().map((entry) => (
          <article className="comment" key={entry.id}>
            <b>{date(entry.inspectedAt)}</b>
            <p>
              Head {entry.headSha ?? "unknown"} · {entry.privateState}
            </p>
            <p>
              Reviews observed {date(entry.reviewsObservedAt)} ·{" "}
              {entry.reviewsComplete
                ? "page coverage complete at observation"
                : "partial / unknown"}
              .
            </p>
            {entry.reviews.map((r, n) => (
              <p key={n}>
                {r.author}: {r.state} · {date(r.at)}{" "}
                {r.url && <OpenButton url={r.url} label="Review source" />}
              </p>
            ))}
            <p>Saved note at inspection:</p>
            <Markdown>{entry.note || "No saved note."}</Markdown>
          </article>
        ))}
      </details>
    </section>
  );
}
