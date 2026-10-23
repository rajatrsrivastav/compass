import { useMemo, useState } from "react";
import { ArrowUpRight, Flag, GitPullRequest } from "lucide-react";
import {
  boardStages,
  type BoardStage,
  type Item,
  type Milestone,
  type Repository,
} from "../shared/types";
import { workIndex } from "../shared/intelligence";
import { useApp } from "./store";
import { Badge, date, Empty, Heading, OpenButton } from "./components/common";
import { Button } from "./components/ui/button";

const pageSize = 18;

function boardStage(issue: Item): BoardStage {
  if (issue.state === "closed") return "Done";
  if (issue.boardStage) return issue.boardStage;
  if (issue.labels.some((label) => /(^|[/ ])blocked$/i.test(label)))
    return "Blocked";
  if (issue.labels.some((label) => /(^|[/ ])in[- ]progress$/i.test(label)))
    return "In progress";
  return "Backlog";
}

function MilestoneCard({
  milestone,
  selected,
  onSelect,
}: {
  milestone: Milestone;
  selected: boolean;
  onSelect: () => void;
}) {
  const total = milestone.openItems + milestone.closedItems;
  const percent = total ? Math.round((milestone.closedItems * 100) / total) : 0;
  return (
    <button
      className="milestone-card panel"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="milestone-title">
        <Flag size={16} />
        <strong>{milestone.title}</strong>
        <Badge>{milestone.state === "open" ? "Open" : "Closed"}</Badge>
      </div>
      <p>
        {milestone.description ||
          (milestone.dueOn ? `Due ${date(milestone.dueOn)}` : "No due date")}
      </p>
      <progress
        aria-label={`${milestone.title} completion`}
        value={milestone.closedItems}
        max={total || 1}
      />
      <div className="planning-card-top">
        <span>{percent}% complete</span>
        <span>
          {milestone.closedItems} / {total} closed
        </span>
      </div>
    </button>
  );
}

function IssueBoard({
  issues,
  allItems,
}: {
  issues: Item[];
  allItems: Item[];
}) {
  const { act, select } = useApp();
  const [shown, setShown] = useState<Partial<Record<BoardStage, number>>>({});
  const [dragged, setDragged] = useState<string | null>(null);
  const related = useMemo(() => workIndex(allItems), [allItems]);
  const move = (issue: Item, stage: BoardStage | null) =>
    void act({ type: "item:update", id: issue.id, boardStage: stage });

  return (
    <div className="board-scroll">
      <div className="issue-board">
        {boardStages.map((stage) => {
          const rows = issues
            .filter((issue) => boardStage(issue) === stage)
            .sort((a, b) => Number(!!b.boardStage) - Number(!!a.boardStage));
          const count = shown[stage] ?? pageSize;
          return (
            <section
              className={
                dragged ? "board-column board-droppable" : "board-column"
              }
              key={stage}
              aria-label={stage}
              onDragOver={(e) => {
                if (dragged) e.preventDefault();
              }}
              onDrop={(e) => {
                if (!dragged) return;
                e.preventDefault();
                const issue = issues.find((row) => row.id === dragged);
                setDragged(null);
                if (issue && boardStage(issue) !== stage) move(issue, stage);
              }}
            >
              <h2>
                <span className="stage-dot" />
                {stage}
                <Badge>{rows.length}</Badge>
              </h2>
              {rows.slice(0, count).map((issue) => {
                const prs = (related.get(issue.id) ?? []).filter(
                  (p) => p.item.state === "open",
                );
                const priority = issue.labels.find((label) =>
                  /^priority\//i.test(label),
                );
                return (
                  <article
                    key={issue.id}
                    className="board-issue panel"
                    draggable={issue.state === "open"}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", issue.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragged(issue.id);
                    }}
                    onDragEnd={() => setDragged(null)}
                  >
                    <div className="planning-card-top">
                      <span className="board-issue-number">
                        #{issue.number}
                      </span>
                      {priority && (
                        <Badge
                          tone={
                            /high|critical/i.test(priority)
                              ? "amber"
                              : "neutral"
                          }
                        >
                          {priority.split("/")[1]} priority
                        </Badge>
                      )}
                    </div>
                    {stage === "Done" && issue.state === "open" && (
                      <span className="row-meta">Still open on GitHub</span>
                    )}
                    <button
                      className="planning-issue-link"
                      onClick={() => select(issue.id)}
                    >
                      {issue.title}
                    </button>
                    {issue.assignees.length > 0 && (
                      <p>Assigned to {issue.assignees.join(", ")}</p>
                    )}
                    {!!prs.length && (
                      <span className="board-related">
                        <GitPullRequest size={13} /> {prs.length} open related{" "}
                        {prs.length === 1 ? "PR" : "PRs"}
                      </span>
                    )}
                    {issue.state === "open" && (
                      <select
                        aria-label={`Local stage for #${issue.number}`}
                        value={issue.boardStage ?? ""}
                        onChange={(e) =>
                          move(
                            issue,
                            (e.target.value || null) as BoardStage | null,
                          )
                        }
                      >
                        <option value="">Automatic stage</option>
                        {boardStages.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    )}
                  </article>
                );
              })}
              {!rows.length && <p className="empty-column">No issues</p>}
              {rows.length > count && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setShown({ ...shown, [stage]: count + pageSize })
                  }
                >
                  Show more ({rows.length - count})
                </Button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MilestoneIssues({
  repo,
  milestone,
  issues,
}: {
  repo: Repository;
  milestone: Milestone;
  issues: Item[];
}) {
  const { navigate, select } = useApp();
  const [state, setState] = useState("all");
  const [shown, setShown] = useState(pageSize);
  const rows = issues.filter((i) => state === "all" || i.state === state);
  const open = issues.filter((i) => i.state === "open");
  return (
    <section className="panel milestone-issues">
      <div className="milestone-header">
        <div>
          <h2>{milestone.title}</h2>
          <p>
            {milestone.dueOn ? `Due ${date(milestone.dueOn)}` : "No due date"} ·{" "}
            {open.length} open issues cached ·{" "}
            {open.filter((i) => !i.assignees.length).length} unassigned
          </p>
        </div>
        <div className="inline-actions">
          {milestone.url && <OpenButton url={milestone.url} />}
          <Button variant="secondary" onClick={() => navigate("Issue Board")}>
            View on issue board <ArrowUpRight size={14} />
          </Button>
        </div>
      </div>
      <div className="inline-actions milestone-issue-filters">
        <select
          aria-label="Milestone issue state"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="all">All issues</option>
          <option value="open">Open issues</option>
          <option value="closed">Closed issues</option>
        </select>
        <small>
          {rows.length} cached issues · Milestones checked{" "}
          {date(repo.milestonesObservedAt ?? null)}
        </small>
      </div>
      {rows.slice(0, shown).map((issue) => (
        <button
          className="milestone-issue-row"
          key={issue.id}
          onClick={() => select(issue.id)}
        >
          <span className="row-meta">#{issue.number}</span>
          <strong>{issue.title}</strong>
          <Badge>{issue.state}</Badge>
          <ArrowUpRight size={14} />
        </button>
      ))}
      {!rows.length && (
        <p className="empty-column">No cached issues match this view.</p>
      )}
      {rows.length > shown && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShown(shown + pageSize)}
        >
          Show more
        </Button>
      )}
    </section>
  );
}

export function Planning({ board }: { board: boolean }) {
  const { data, navigate } = useApp();
  const [repository, setRepository] = useState("");
  const [milestoneNumber, setMilestone] = useState<number | null>(null);
  const [milestoneState, setMilestoneState] = useState("open");
  const [issueState, setIssueState] = useState("all");
  const [query, setQuery] = useState("");
  const repos = data?.repositories ?? [];
  const repo =
    repos.find((r) => r.id === repository) ??
    repos.find((r) => r.id === data?.profile.primary) ??
    repos.find((r) => r.bundledAt) ??
    repos[0];
  const allItems = useMemo(
    () => data?.items.filter((i) => i.repo === repo?.id) ?? [],
    [data?.items, repo?.id],
  );
  const milestone = repo?.milestones?.find((m) => m.number === milestoneNumber);
  const shownMilestones = (repo?.milestones ?? []).filter(
    (m) => milestoneState === "all" || m.state === milestoneState,
  );
  const issues = allItems
    .filter(
      (i) =>
        i.kind === "issue" && (!milestone || i.milestone === milestone.number),
    )
    .sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.number - a.number,
    );
  const term = query.trim().toLowerCase();
  const matchingIssues = issues.filter(
    (i) =>
      (issueState === "all" || i.state === issueState) &&
      `#${i.number} ${i.title} ${i.labels.join(" ")} ${i.assignees.join(" ")}`
        .toLowerCase()
        .includes(term),
  );

  return (
    <>
      <Heading
        title={board ? "Issue board" : "Milestones"}
        description={
          board
            ? "Organize cached issues in private stages. Drag a card or use its stage menu."
            : "Select a milestone to inspect its issues or open its board."
        }
        actions={
          repo?.bundledAt && repo.bundledAt === repo.syncedAt ? (
            <Badge>Bundled snapshot · {date(repo.bundledAt)}</Badge>
          ) : undefined
        }
      />
      {repo ? (
        <>
          <div className="panel filters planning-filters">
            <select
              aria-label="Planning repository"
              value={repo.id}
              onChange={(e) => {
                setRepository(e.target.value);
                setMilestone(null);
              }}
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {board ? (
              <>
                <select
                  aria-label="Board milestone"
                  value={milestone?.number ?? ""}
                  onChange={(e) => setMilestone(Number(e.target.value) || null)}
                >
                  <option value="">All milestones</option>
                  {(repo.milestones ?? []).map((m) => (
                    <option key={m.number} value={m.number}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Board issue state"
                  value={issueState}
                  onChange={(e) => setIssueState(e.target.value)}
                >
                  <option value="all">All issues</option>
                  <option value="open">Open on GitHub</option>
                  <option value="closed">Closed on GitHub</option>
                </select>
                <input
                  aria-label="Search board issues"
                  placeholder="Search by title, number, label, or assignee"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </>
            ) : (
              <>
                <select
                  aria-label="Milestone state"
                  value={milestoneState}
                  onChange={(e) => {
                    setMilestoneState(e.target.value);
                    if (
                      e.target.value !== "all" &&
                      milestone?.state !== e.target.value
                    )
                      setMilestone(null);
                  }}
                >
                  <option value="open">Open milestones</option>
                  <option value="closed">Closed milestones</option>
                  <option value="all">All milestones</option>
                </select>
                <Button
                  variant="secondary"
                  onClick={() => navigate("Issue Board")}
                >
                  Open issue board
                </Button>
              </>
            )}
          </div>
          {board ? (
            <>
              <div className="list-caption">
                <span>{matchingIssues.length} issues</span>
                <span>Stage changes stay on this device</span>
              </div>
              <IssueBoard
                key={repo.id}
                issues={matchingIssues}
                allItems={allItems}
              />
            </>
          ) : (
            <>
              {shownMilestones.length ? (
                <div className="milestone-grid">
                  {shownMilestones.map((m) => (
                    <MilestoneCard
                      key={m.number}
                      milestone={m}
                      selected={m.number === milestone?.number}
                      onSelect={() => setMilestone(m.number)}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  title={
                    repo.milestones
                      ? "No milestones in this view"
                      : "Milestones aren’t cached yet"
                  }
                >
                  {repo.milestones
                    ? "Try another milestone state."
                    : "Synchronize the repository to load any available GitHub milestones."}
                </Empty>
              )}
              {milestone && shownMilestones.includes(milestone) && (
                <MilestoneIssues
                  key={`${repo.id}#${milestone.number}`}
                  repo={repo}
                  milestone={milestone}
                  issues={issues}
                />
              )}
            </>
          )}
        </>
      ) : (
        <Empty title="No repository tracked">
          <Button variant="secondary" onClick={() => navigate("Repositories")}>
            Go to repositories
          </Button>
        </Empty>
      )}
    </>
  );
}
