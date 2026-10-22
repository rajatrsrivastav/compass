import type { Comment, Item } from "./types";
// Identity reflects newly observed entries/states, not an exact diff of edited text.
export function feedbackId(c: Comment) {
  return JSON.stringify([c.url, c.author, c.at, c.state ?? ""]);
}
export function reviewDelta(item: Item) {
  const last = item.inspections?.at(-1);
  if (!last)
    return {
      last,
      headChanged: false,
      headKnown: false,
      newFeedback: [],
      notesStale: false,
      feedbackComplete: false,
    };
  const headKnown = !!last.headSha && !!item.headSha;
  const headChanged = headKnown && last.headSha !== item.headSha;
  const prior = new Set(last.feedbackIds);
  const noteHead = item.noteHeadSha ?? last.headSha;
  return {
    last,
    headKnown,
    headChanged,
    notesStale:
      !!item.note && !!noteHead && !!item.headSha && noteHead !== item.headSha,
    newFeedback: [...item.comments, ...item.reviews].filter(
      (c) => !prior.has(feedbackId(c)),
    ),
    feedbackComplete:
      !!item.commentsComplete &&
      !!item.reviewsComplete &&
      !!item.commentsObservedAt &&
      !!item.reviewsObservedAt &&
      item.commentsObservedAt >= last.inspectedAt &&
      item.reviewsObservedAt >= last.inspectedAt,
  };
}
