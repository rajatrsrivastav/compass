import {
  Bookmark,
  GitPullRequest,
  FolderGit2,
  MessagesSquare,
  ArrowRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Target,
} from "lucide-react";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import { Badge, Empty, Heading, SectionTitle, date } from "./components/common";
import { rank } from "../shared/ranking";
export function Overview() {
  const { data: s, navigate, select, act } = useApp();
  if (!s) return null;
  const opportunities = rank(s.items, s.sources, s.profile),
    saved = s.items.filter((i) => i.saved),
    reviews = s.items.filter(
      (i) => i.kind === "pr" && i.reviewState !== "Reviewed privately",
    ),
    primary =
      s.repositories.find((r) => r.id === s.profile.primary) ??
      s.repositories[0];
  const stats = [
    {
      label: "Tracked repositories",
      value: s.repositories.length,
      icon: FolderGit2,
      page: "Repositories",
      sub: "Your open-source orbit",
    },
    {
      label: "Saved investigations",
      value: saved.length,
      icon: Bookmark,
      page: "Opportunity Radar",
      sub: "Ready for a closer look",
    },
    {
      label: "PRs in your queue",
      value: reviews.length,
      icon: GitPullRequest,
      page: "PR Review Queue",
      sub: "Private review workspace",
    },
    {
      label: "Community sources",
      value: s.sources.length,
      icon: MessagesSquare,
      page: "Community Context",
      sub: "Context worth keeping",
    },
  ];
  return (
    <>
      <Heading
        eyebrow="YOUR CONTRIBUTOR WORKSPACE"
        title={`A little context. A better contribution.`}
        description={`Welcome back, ${s.profile.username}. Here’s where your attention can make a difference.`}
        actions={
          <Button variant="secondary" onClick={() => navigate("My Journey")}>
            <Target size={16} />
            Weekly plan
            <ArrowUpRight size={14} />
          </Button>
        }
      />
      <div className="stat-grid">
        {stats.map(({ label, value, icon: Icon, page, sub }) => (
          <button
            className="stat-card"
            key={label}
            onClick={() => navigate(page)}
          >
            <div className="stat-top">
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <strong>{value}</strong>
            <small>{sub}</small>
          </button>
        ))}
      </div>
      <div className="overview-grid">
        <div>
          <section className="panel briefing">
            <SectionTitle
              title="Your OSS briefing"
              sub="Evidence from your workspace, with a clear next step."
              action={<Badge tone="green">Local intelligence</Badge>}
            />
            {!s.repositories.length ? (
              <Empty title="Your next contribution starts here">
                <p>
                  Add a public repository, or explore a realistic offline
                  workspace.
                </p>
                <div className="inline-actions">
                  <Button onClick={() => navigate("Repositories")}>
                    Connect a repository
                    <ArrowRight size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void act({ type: "demo:seed" })}
                  >
                    Explore demo workspace
                  </Button>
                </div>
              </Empty>
            ) : (
              <>
                {s.changes.slice(0, 4).map((c) => (
                  <button
                    className="brief-row"
                    key={c.id}
                    onClick={() => select(c.itemId)}
                  >
                    <span className="event-icon">
                      <Clock size={18} />
                    </span>
                    <div>
                      <div className="row-meta">
                        OBSERVED CHANGE · {date(c.at)}
                      </div>
                      <h3>{c.title}</h3>
                      <p>{c.detail}</p>
                    </div>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
                {opportunities.slice(0, s.changes.length ? 2 : 3).map((o) => (
                  <button
                    className="brief-row"
                    key={o.item.id}
                    onClick={() => select(o.item.id)}
                  >
                    <span className="event-icon">
                      <Target size={18} />
                    </span>
                    <div>
                      <div className="row-meta">
                        {o.category.toUpperCase()} ·{" "}
                        {o.item.provenance === "demo"
                          ? "SYNTHETIC"
                          : "CACHED GITHUB"}
                      </div>
                      <h3>{o.item.title}</h3>
                      <p>
                        {o.reasons.find((r) => r.includes("Matches")) ??
                          o.reasons[1]}{" "}
                        Start by checking the discussion.
                      </p>
                    </div>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
                {!s.changes.length && (
                  <div className="footnote">
                    <CheckCircle2 size={14} /> No change alerts yet. First
                    synchronization establishes a baseline.
                  </div>
                )}
              </>
            )}
          </section>
          <section className="panel">
            <SectionTitle
              title="Saved for investigation"
              sub="Keep a small, intentional list."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("Opportunity Radar")}
                >
                  View radar
                  <ArrowRight size={14} />
                </Button>
              }
            />
            {saved.length ? (
              saved.slice(0, 5).map((i) => (
                <button
                  className="compact-row"
                  key={i.id}
                  onClick={() => select(i.id)}
                >
                  <Bookmark size={16} />
                  <div>
                    <b>{i.title}</b>
                    <small>
                      {i.repo} #{i.number}
                    </small>
                  </div>
                  <Badge>{i.reviewState}</Badge>
                </button>
              ))
            ) : (
              <Empty title="Room for your next investigation">
                Save an issue from the Opportunity Radar.
              </Empty>
            )}
          </section>
        </div>
        <aside>
          <section className="focus-card">
            <div className="eyebrow">
              <span className="live-dot" /> CURRENT FOCUS
            </div>
            <h2>{primary?.name.split("/")[1] ?? "Choose your project"}</h2>
            <p>
              {primary?.description ??
                "Depth beats breadth. Pick one community to understand first."}
            </p>
            {primary && (
              <div className="focus-meta">
                <span>{primary.language}</span>
                <Badge tone={primary.provenance === "demo" ? "amber" : "green"}>
                  {primary.provenance === "demo"
                    ? "Synthetic demo"
                    : "GitHub cache"}
                </Badge>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => navigate("Repositories")}
            >
              Manage repositories
              <ArrowUpRight size={14} />
            </Button>
          </section>
          <section className="panel">
            <SectionTitle title="This week" sub={s.profile.goal} />
            <div className="capacity">
              <strong>
                {s.tasks
                  .filter((t) => !t.done && t.type !== "achievement")
                  .reduce((n, t) => n + t.hours, 0)}
                <span> / {s.profile.hours}h</span>
              </strong>
              <span>planned</span>
            </div>
            <progress
              max={s.profile.hours}
              value={s.tasks
                .filter((t) => !t.done && t.type !== "achievement")
                .reduce((n, t) => n + t.hours, 0)}
            />
            {s.tasks
              .filter((t) => !t.done)
              .slice(0, 3)
              .map((t) => (
                <button
                  className="task-mini"
                  key={t.id}
                  onClick={() => navigate("My Journey")}
                >
                  <span className="checkbox-dot" />
                  {t.title}
                  <small>{t.hours}h</small>
                </button>
              ))}
            <Button variant="ghost" onClick={() => navigate("My Journey")}>
              Shape your week
              <ArrowRight size={14} />
            </Button>
          </section>
          <div className="principle">
            <CompassMark />
            <p>
              Meaningful work starts with listening.
              <br />
              <span>Understand the need before writing the code.</span>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
function CompassMark() {
  return <Target size={22} />;
}
