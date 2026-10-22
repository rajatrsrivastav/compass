import { useMemo, useState } from "react";
import {
  Search,
  Bookmark,
  GitPullRequest,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { useApp } from "./store";
import { rank } from "../shared/ranking";
import { Heading, Badge, Empty, date } from "./components/common";
import { Button } from "./components/ui/button";
export function Issues({ prs = false }: { prs?: boolean }) {
  const { data: s, act, select } = useApp();
  const [query, setQuery] = useState(""),
    [repo, setRepo] = useState(""),
    [category, setCategory] = useState(""),
    [saved, setSaved] = useState(false),
    [state, setState] = useState("open");
  const ranked = useMemo(
    () => (s ? rank(s.items, s.sources, s.profile) : []),
    [s],
  );
  if (!s) return null;
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
          }))
      : ranked
  ).filter(
    (o) =>
      (!repo || o.item.repo === repo) &&
      (!state || o.item.state === state) &&
      (!category || o.category === category) &&
      (!saved || o.item.saved) &&
      `${o.item.title} ${o.item.number} ${o.item.labels.join(" ")} ${o.item.author}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow={prs ? "CONTRIBUTE THROUGH REVIEW" : "EVIDENCE, NOT GUESSWORK"}
        title={prs ? "PR review queue" : "Opportunity radar"}
        description={
          prs
            ? "Understand the discussion, record a private review, and follow through."
            : "Find useful work at the intersection of your skills and community context."
        }
        actions={
          <Badge tone="green">
            {prs ? "Private workspace" : "Deterministic ranking"}
          </Badge>
        }
      />
      <div className="panel filters">
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
          onChange={(e) => setRepo(e.target.value)}
        >
          <option value="">All repositories</option>
          {s.repositories.map((r) => (
            <option key={r.id}>{r.id}</option>
          ))}
        </select>
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
          <SlidersHorizontal size={13} />
          {prs ? "Review state is local only" : "Ranked by explainable signals"}
        </span>
      </div>
      <section className="panel issue-list">
        {rows.map((o) => (
          <article className="issue-row" key={o.item.id}>
            <button className="item-main" onClick={() => select(o.item.id)}>
              {prs ? (
                <span className="pr-icon">
                  <GitPullRequest size={20} />
                </span>
              ) : (
                <div className="score">
                  {o.score}
                  <small>FIT</small>
                </div>
              )}
              <div>
                <div className="row-meta">
                  {o.item.repo} <span>#{o.item.number}</span> ·{" "}
                  {o.item.provenance === "demo"
                    ? "SYNTHETIC DEMO"
                    : "CACHED GITHUB"}
                </div>
                <h3>{o.item.title}</h3>
                <div className="issue-labels">
                  <Badge tone={prs ? "purple" : "green"}>{o.category}</Badge>
                  {o.item.labels.slice(0, 3).map((l) => (
                    <Badge key={l}>{l}</Badge>
                  ))}
                </div>
                <p>
                  {prs
                    ? `${o.item.reviews.length} cached review entries · ${o.item.checks}`
                    : (o.reasons.find((r) => r.includes("Matches")) ??
                      o.reasons[1])}
                </p>
                <small>Last checked {date(o.item.observedAt)}</small>
              </div>
              <ArrowUpRight size={16} />
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
        ))}
        {!rows.length && (
          <Empty title="No matching items">
            Add and synchronize a repository, load demo data, or adjust your
            filters.
          </Empty>
        )}
      </section>
      <p className="footnote">
        {prs
          ? "No review, approval, merge, or comment is submitted to GitHub."
          : "A high score is a starting point for investigation. Imported references and keyword candidates do not prove maintainer priority."}
      </p>
    </>
  );
}
