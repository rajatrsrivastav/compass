import { useState } from "react";
import { Plus, Download, Check, Trash2, CalendarDays } from "lucide-react";
import { useApp } from "./store";
import type { Task } from "../shared/types";
import { Button } from "./components/ui/button";
import { Heading, Badge, Empty, OpenButton } from "./components/common";
export function Journey() {
  const { data: s, act } = useApp();
  const [title, setTitle] = useState(""),
    [hours, setHours] = useState(1),
    [deadline, setDeadline] = useState(""),
    [type, setType] = useState<Task["type"]>("objective"),
    [url, setUrl] = useState("");
  if (!s) return null;
  const planned = s.tasks
    .filter((t) => !t.done && t.type !== "achievement")
    .reduce((n, t) => n + t.hours, 0);
  return (
    <>
      <Heading
        eyebrow="DEPTH OVER ACTIVITY"
        title="My OSS journey"
        description="Plan within your capacity. Record the work you can stand behind."
        actions={
          <Button
            variant="secondary"
            onClick={() => void act({ type: "export", kind: "journey" })}
          >
            <Download size={15} />
            Export factual report
          </Button>
        }
      />
      <div className="journey-summary panel">
        <div>
          <Badge tone="green">{s.profile.goal}</Badge>
          <h2>Small steps, meaningful progress.</h2>
          <p>
            Private preparation and manually entered achievements stay clearly
            separated from GitHub evidence.
          </p>
        </div>
        <div className="capacity">
          <strong>
            {planned}
            <span> / {s.profile.hours}h</span>
          </strong>
          <span>weekly capacity</span>
          <progress max={s.profile.hours} value={planned} />
        </div>
      </div>
      <form
        className="panel task-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await act({
              type: "task:save",
              task: {
                id: crypto.randomUUID(),
                title,
                hours,
                deadline,
                type,
                url,
                done: false,
              },
            })
          ) {
            setTitle("");
            setUrl("");
          }
        }}
      >
        <h2>Make room for the next step</h2>
        <div className="form-row">
          <label className="grow">
            Objective or achievement
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reproduce the keyboard focus issue"
            />
          </label>
          <label>
            Hours
            <input
              type="number"
              min="0"
              max="80"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </label>
          <label>
            Deadline (optional)
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Record type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Task["type"])}
            >
              <option value="objective">Weekly objective</option>
              <option value="preparation">Private preparation</option>
              <option value="achievement">
                Manual achievement (unverified)
              </option>
            </select>
          </label>
          <label className="grow">
            Public PR or evidence link (optional)
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
            />
          </label>
          <Button>
            <Plus size={16} />
            Add to journey
          </Button>
        </div>
        <div className="inline-actions">
          <small>Preparation templates:</small>
          {["GSoC", "LFX"].map((program) => (
            <Button
              key={program}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setTitle(
                  `${program}: run the project, read contribution guidance, and reproduce one issue`,
                );
                setType("preparation");
                setHours(Math.min(2, s.profile.hours));
                setDeadline("");
              }}
            >
              {program} preparation
            </Button>
          ))}
        </div>
      </form>
      <div className="board">
        {["Planned", "Completed", "Achievements"].map((column, n) => {
          const tasks = s.tasks.filter((t) =>
            n === 2
              ? t.type === "achievement"
              : t.type !== "achievement" && t.done === (n === 1),
          );
          return (
            <section className="board-column" key={column}>
              <div className="section-title">
                <h2>{column}</h2>
                <Badge>{tasks.length}</Badge>
              </div>
              {tasks.map((t) => (
                <article className="panel task-card" key={t.id}>
                  <Badge tone={t.type === "achievement" ? "amber" : "neutral"}>
                    {t.type === "achievement" ? "Manually entered" : t.type}
                  </Badge>
                  <h3>{t.title}</h3>
                  <div className="task-meta">
                    <span>{t.hours}h</span>
                    {t.deadline && (
                      <span>
                        <CalendarDays size={13} />
                        {t.deadline}
                      </span>
                    )}
                  </div>
                  {t.url && <OpenButton url={t.url} label="Evidence link" />}
                  <div className="inline-actions">
                    {t.type !== "achievement" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void act({
                            type: "task:save",
                            task: { ...t, done: !t.done },
                          })
                        }
                      >
                        <Check size={14} />
                        {t.done ? "Reopen" : "Mark complete"}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${t.title}`}
                      onClick={() =>
                        void act({ type: "task:delete", id: t.id })
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </article>
              ))}
              {!tasks.length && (
                <Empty title="Nothing here yet">
                  Your next step can be small.
                </Empty>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
