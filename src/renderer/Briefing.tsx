import type { Repository, Item } from "../shared/types";
import { Markdown, OpenButton, Badge, date } from "./components/common";
export function Briefing({ repo, items }: { repo: Repository; items: Item[] }) {
  const docs =
    repo.briefing?.documents ??
    Object.entries(repo.guidance).map(([path, text]) => ({
      path,
      text,
      url: `https://github.com/${repo.id}`,
      observedAt: "",
      truncated: false,
      stale: true,
    }));
  const cached = items.filter((i) => i.repo === repo.id);
  const labels = [...new Set(cached.flatMap((i) => i.labels))].slice(0, 12);
  return (
    <div className="guidance">
      <h3>Organization briefing</h3>
      <p>
        <b>Documented facts</b> · {repo.description} Primary language:{" "}
        {repo.language}.{" "}
        {repo.provenance !== "demo" && (
          <OpenButton
            url={`https://github.com/${repo.id}`}
            label="Repository source"
          />
        )}
      </p>
      <p className="muted">
        Metadata checked {date(repo.syncedAt)}.{" "}
        {repo.partial ? "Partial snapshot." : "Bounded synchronized snapshot."}{" "}
        No maintainer priority is inferred.
      </p>
      {repo.briefing?.locations.map((l) => (
        <p key={l.path}>
          <code>{l.path}</code>: {l.status} · {date(l.checkedAt)}
        </p>
      ))}
      <p>
        Supported discovery: root, .github and docs; at most 12 matching
        guidance files. Other locations and organization-wide defaults are not
        inspected.
      </p>
      {docs.length ? (
        docs.map((d) => (
          <details key={d.path}>
            <summary>
              {d.path} {d.stale && "· cached / recheck"}{" "}
              {d.truncated && "· truncated"}
            </summary>
            <p>
              Observed {date(d.observedAt)}{" "}
              {repo.provenance !== "demo" && (
                <OpenButton url={d.url} label="Document source" />
              )}
            </p>
            <Markdown>{d.text}</Markdown>
          </details>
        ))
      ) : (
        <p>
          No supported guidance documents cached. Missing or unavailable
          documents do not establish an absence of policies.
        </p>
      )}
      <p className="footnote">
        {docs.some((d) => /(?:^|\/)AI(?:[-_.]|$)/i.test(d.path))
          ? "An AI-related file was found; read it and other contribution instructions."
          : "No dedicated AI policy file identified in the inspected locations. AI guidance may be inside other documents."}{" "}
        Missing policy is not permission to submit AI-generated contributions.
      </p>
      <h3>Observed engineering activity</h3>
      <p>
        {cached.filter((i) => i.state === "open" && i.kind === "issue").length}{" "}
        cached open issues;{" "}
        {cached.filter((i) => i.state === "open" && i.kind === "pr").length}{" "}
        cached open PRs. Counts are observations of this bounded cache.
      </p>
      <div className="issue-labels">
        {labels.map((l) => (
          <Badge key={l}>{l}</Badge>
        ))}
      </div>
      {cached
        .filter((i) => i.comments.length || i.reviews.length)
        .slice(0, 5)
        .map((i) => (
          <p key={i.id}>
            #{i.number}: {i.comments.length} discussion entries,{" "}
            {i.reviews.length} review entries. Discussion observed{" "}
            {date(i.commentsObservedAt ?? null)}; reviews observed{" "}
            {date(i.reviewsObservedAt ?? null)}.{" "}
            {i.provenance !== "demo" && (
              <OpenButton url={i.url} label={i.title} />
            )}
          </p>
        ))}
      <h3>Investigation suggestions · inference</h3>
      <p>
        Use the README to identify subsystems, read applicable policies,
        reproduce a small issue and verify current discussion. Cached labels and
        activity do not establish maintainer priorities or authorship.
      </p>
    </div>
  );
}
