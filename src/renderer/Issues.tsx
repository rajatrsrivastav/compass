import { useMemo, useState } from "react";
import { Search, Bookmark, GitPullRequest, Flag } from "lucide-react";
import { useApp } from "./store";
import { rank } from "../shared/ranking";
import { Heading, Empty, date } from "./components/common";
import { Button } from "./components/ui/button";
export function Issues({ prs = false }: { prs?: boolean }) {
  const { data: s, act, select } = useApp();
  const [query, setQuery] = useState(""),
    [repo, setRepo] = useState(""),
    [milestone, setMilestone] = useState(""),
    [category, setCategory] = useState(""),
    [saved, setSaved] = useState(false),
    [state, setState] = useState("open");
  const ranked = useMemo(
    () =>
      s && !prs
        ? rank(s.items, s.sources, s.profile, Date.now(), s.repositories)
        : [],
    [s, prs],
  );
  if (!s) return null;
  const repositories = new Map(s.repositories.map((r) => [r.id, r]));
  const milestones = repositories.get(repo)?.milestones ?? [];
  const rows = (
    prs
      ? s.items
          .filter((i) => i.kind === "pr")
          .map((item) => ({
            item,
            category: item.reviewState,
            score: 0,
            reasons: [],
            sourceIds: [],
            workStatus: "",
          }))
      : ranked
  ).filter(
    (o) =>
      (!repo || o.item.repo === repo) &&
      (!milestone || String(o.item.milestone) === milestone) &&
      (!state || o.item.state === state) &&
      (!category || o.category === category) &&
      (!saved || o.item.saved) &&
      `${o.item.title} ${o.item.number} ${o.item.labels.join(" ")} ${o.item.author}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const matchedRepos = [...new Set(rows.map((row) => row.item.repo))];
  const onlyRepo =
    matchedRepos.length === 1 ? repositories.get(matchedRepos[0]) : undefined;
  const bundledAt =
    onlyRepo && rows.every((row) => row.item.observedAt === onlyRepo.bundledAt)
      ? onlyRepo.bundledAt
      : undefined;
  return (
    <>
      <Heading
        title={prs ? "PR review queue" : "Opportunity radar"}
        description={
          prs
            ? "Review cached pull requests and track your private review state."
            : "Open issues ranked by your skills, project activity, and linked work."
        }
      />
      <div className="panel filters radar-filters">
        <div className="search">
          <Search size={16} />
          <input
            aria-label="Search items"
            placeholder={
              prs ? "Search pull requests…" : "Search opportunities…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Repository filter"
          value={repo}
          onChange={(e) => {
            setRepo(e.target.value);
            setMilestone("");
          }}
        >
          <option value="">All repositories</option>
          {s.repositories.map((r) => (
            <option key={r.id}>{r.id}</option>
          ))}
        </select>
        {!!milestones.length && !prs && (
          <select
            aria-label="Milestone filter"
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
          >
            <option value="">All milestones</option>
            {milestones.map((m) => (
              <option key={m.number} value={m.number}>
                {m.title}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Category filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{prs ? "All private states" : "All signals"}</option>
          {(prs
            ? [
                "Not reviewed",
                "Investigating",
                "Needs follow-up",
                "Reviewed privately",
                "Watch for changes",
              ]
            : [
                "Beginner-friendly",
                "Potentially meaningful",
                "Needs investigation",
                "Community-context match",
                "Possibly blocked or already being addressed",
              ]
          ).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {prs && (
          <select
            aria-label="State filter"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="">Any state</option>
          </select>
        )}
        <Button
          variant={saved ? "default" : "secondary"}
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
        >
          <Bookmark size={14} />
          Saved
        </Button>
      </div>
      <div className="list-caption">
        <span>
          {rows.length} {prs ? "pull requests" : "opportunities"}
        </span>
        <span>
          {bundledAt
            ? `Bundled GitHub snapshot · ${date(bundledAt)}`
            : prs
              ? "Private review state"
              : "Highest fit first"}
        </span>
      </div>
      <section className="panel issue-list radar-results">
        {rows.map((o) => {
          const repository = repositories.get(o.item.repo);
          const target = repository?.milestones?.find(
            (m) => m.number === o.item.milestone,
          );
          return (
            <article className="issue-row" key={o.item.id}>
              <button className="item-main" onClick={() => select(o.item.id)}>
                {prs ? (
                  <span className="pr-icon">
                    <GitPullRequest size={20} />
                  </span>
                ) : (
                  <div className="score">
                    {o.score}
                    <small>Fit</small>
                  </div>
                )}
                <div>
                  <h3>{o.item.title}</h3>
                  <div className="row-meta">
                    {o.item.repo} <span>#{o.item.number}</span>
                    {o.item.provenance === "demo" && " · Synthetic demo"}
                    {!bundledAt &&
                      o.item.provenance !== "demo" &&
                      ` · ${repository?.bundledAt === o.item.observedAt ? "Snapshot" : "Checked"} ${date(o.item.observedAt)}`}
                  </div>
                  <div className="radar-signals">
                    <span>{o.category}</span>
                    {target && (
                      <span>
                        <Flag size={12} />
                        {target.title}
                      </span>
                    )}
                    {o.item.assignees.length > 0 && (
                      <span>Assigned to {o.item.assignees.join(", ")}</span>
                    )}
                    {o.workStatus === "Related PR already open" && (
                      <span>
                        <GitPullRequest size={12} />
                        Open related PR
                      </span>
                    )}
                    {prs && (
                      <span>
                        {o.item.reviews.length} cached{" "}
                        {o.item.reviews.length === 1 ? "review" : "reviews"} ·{" "}
                        {o.item.checks}
                      </span>
                    )}
                  </div>
                </div>
              </button>
              <Button
                aria-label={`${o.item.saved ? "Unsave" : "Save"} ${o.item.title}`}
                size="icon"
                variant="ghost"
                onClick={() =>
                  void act({
                    type: "item:update",
                    id: o.item.id,
                    saved: !o.item.saved,
                  })
                }
              >
                <Bookmark
                  size={17}
                  fill={o.item.saved ? "currentColor" : "none"}
                />
              </Button>
            </article>
          );
        })}
        {!rows.length && (
          <Empty title="No matching items">
            Add and synchronize a repository, load demo data, or adjust your
            filters.
          </Empty>
        )}
      </section>
    </>
  );
}
