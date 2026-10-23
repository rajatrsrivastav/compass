import {
  Bookmark,
  GitPullRequest,
  FolderGit2,
  MessagesSquare,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Target,
} from "lucide-react";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import { Badge, Empty, Heading, SectionTitle, date } from "./components/common";
import "./styles/pages.css";
import "./styles/workspace.css";
import { rank } from "../shared/ranking";
export function Overview() {
  const { data: s, navigate, select, act } = useApp();
  if (!s) return null;
  const opportunities = rank(
      s.items,
      s.sources,
      s.profile,
      Date.now(),
      s.repositories,
    ),
    saved = s.items.filter((i) => i.saved),
    reviews = s.items.filter(
      (i) =>
        i.kind === "pr" &&
        i.state === "open" &&
        i.reviewState !== "Reviewed privately",
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
    },
    {
      label: "Saved investigations",
      value: saved.length,
      icon: Bookmark,
      page: "Opportunity Radar",
    },
    {
      label: "PRs in your queue",
      value: reviews.length,
      icon: GitPullRequest,
      page: "PR Review Queue",
    },
    {
      label: "Community sources",
      value: s.sources.length,
      icon: MessagesSquare,
      page: "Community Context",
    },
  ];
  return (
    <>
      <Heading
        title="Workspace overview"
        description={`${s.profile.username} · ${s.profile.goal}`}
        actions={
          <Button variant="secondary" onClick={() => navigate("My Journey")}>
            <Target size={16} />
            Weekly plan
            <ArrowUpRight size={14} />
          </Button>
        }
      />
      <div className="stat-grid overview-metrics">
        {stats.map(({ label, value, icon: Icon, page }) => (
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
          </button>
        ))}
      </div>
      <div className="overview-grid">
        <div>
          <section className="panel briefing">
            <SectionTitle title="Project activity" />
            {!s.repositories.length ? (
              <Empty title="No repositories yet">
                <p>Add a public repository or load the sample workspace.</p>
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
                        Repository update · {date(c.at)}
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
                        {o.item.repo}#{o.item.number} · {o.category}
                        {o.item.provenance === "demo" && " · Synthetic demo"}
                      </div>
                      <h3>{o.item.title}</h3>
                      <p>
                        {o.reasons.find((r) => r.includes("Matches")) ??
                          o.reasons[1]}
                      </p>
                    </div>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
                {!s.changes.length && !opportunities.length && (
                  <Empty title="No project activity yet">
                    Synchronize a repository to load issues and pull requests.
                  </Empty>
                )}
              </>
            )}
          </section>
          <section className="panel">
            <SectionTitle
              title="Saved for investigation"
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
              <Empty title="No saved items">
                Save an issue from the Opportunity Radar.
              </Empty>
            )}
          </section>
        </div>
        <aside>
          <section className="panel overview-project">
            <div className="project-caption">
              <FolderGit2 size={15} /> Primary repository
            </div>
            <h2>{primary?.name ?? "Choose a project"}</h2>
            <p>
              {primary?.description ??
                "Choose a primary repository from the repository list."}
            </p>
            {primary && (
              <div className="focus-meta">
                <span>{primary.language}</span>
                <Badge
                  tone={primary.provenance === "demo" ? "amber" : "neutral"}
                >
                  {primary.provenance === "demo"
                    ? "Synthetic demo"
                    : primary.bundledAt === primary.syncedAt
                      ? "Bundled GitHub snapshot"
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
            {!s.profile.demo && !!s.repositories.length && (
              <Button
                variant="ghost"
                onClick={() => void act({ type: "demo:seed" })}
              >
                Explore demo workspace
              </Button>
            )}
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
              Open weekly plan
              <ArrowRight size={14} />
            </Button>
          </section>
        </aside>
      </div>
    </>
  );
}
