import { Briefing } from "./Briefing";
import { useState } from "react";
import {
  FolderGit2,
  BookOpen,
  Plus,
  RefreshCw,
  Star,
  AlertCircle,
  ChevronDown,
  Clock3,
  Trash2,
  Square,
} from "lucide-react";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import { Heading, Badge, Empty, date } from "./components/common";
// Older snapshots store the raw reset header in their human-readable error.
function syncMessage(message: string) {
  return message
    .replace(
      "GitHub rate limit reached. Cached data remains available; retry after the reset time.",
      "GitHub rate limit reached. Your cached files are available.",
    )
    .replace(/ Reset\/retry(?: value)?: (\d+)\.?/g, (_, raw: string) => {
      const value = Number(raw);
      if (value >= 1_000_000_000 && value < 10_000_000_000)
        return ` Retry after ${date(new Date(value * 1000).toISOString())}.`;
      return ` Retry after ${raw} seconds.`;
    });
}
export function Repositories() {
  const { data: s, act } = useApp();
  const [adding, setAdding] = useState(!s?.repositories.length);
  const [name, setName] = useState(""),
    [guide, setGuide] = useState<string | null>(
      () => s?.repositories.find((r) => r.bundledAt)?.id ?? null,
    );
  if (!s) return null;
  return (
    <>
      <Heading
        title="Repositories"
        description="Read cached project files and manage GitHub synchronization."
        actions={
          <Button
            variant={adding ? "secondary" : "default"}
            aria-expanded={adding}
            aria-controls="connect-repository"
            onClick={() => setAdding(!adding)}
          >
            {!adding && <Plus size={15} />}
            {adding ? "Close form" : "Add repository"}
          </Button>
        }
      />
      {adding && (
        <form
          id="connect-repository"
          className="connect-bar panel"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await act({ type: "repository:add", value: name })) {
              setName("");
              setAdding(false);
            }
          }}
        >
          <input
            autoFocus
            aria-label="Repository URL"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="owner/repo or https://github.com/owner/repo"
          />
          <Button>
            <Plus size={16} />
            Add repository
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void act({ type: "demo:seed" })}
          >
            Load demo data
          </Button>
        </form>
      )}
      <div className="repo-grid repository-library">
        {s.repositories.map((r) => (
          <article className="panel repo-card" key={r.id}>
            <div className="repository-heading">
              <FolderGit2 size={18} />
              <h2>{r.name}</h2>
              <Badge tone={r.provenance === "demo" ? "amber" : "neutral"}>
                {r.provenance === "demo"
                  ? "Synthetic demo"
                  : r.bundledAt === r.syncedAt
                    ? "Bundled snapshot"
                    : "Public GitHub"}
              </Badge>
            </div>
            <p>{r.description}</p>
            <div className="repo-meta">
              <span>{r.language}</span>
              {r.provenance !== "demo" && (
                <span>
                  <Star size={13} />
                  {r.stars.toLocaleString()}
                </span>
              )}
              <span>
                {s.items.filter((i) => i.repo === r.id).length} cached items
              </span>
            </div>
            {r.error && (
              <div className="repo-sync-notice" role="status">
                <AlertCircle size={15} aria-hidden="true" />
                <span>{syncMessage(r.error)}</span>
              </div>
            )}
            <div className="repo-command-row">
              <div className="inline-actions">
                <Button
                  aria-expanded={guide === r.id}
                  variant="secondary"
                  onClick={() => setGuide(guide === r.id ? null : r.id)}
                >
                  <BookOpen size={15} /> Repository files
                </Button>
                {r.provenance !== "demo" &&
                  (s.syncing.includes(r.id) ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void act({ type: "sync:cancel", id: r.id })
                      }
                    >
                      <Square size={14} />
                      Cancel sync
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => void act({ type: "sync", id: r.id })}
                    >
                      <RefreshCw size={14} />
                      Synchronize
                    </Button>
                  ))}
                <Button
                  variant="ghost"
                  onClick={() =>
                    void act({
                      type: "profile",
                      value: { ...s.profile, primary: r.id },
                    })
                  }
                >
                  <Star
                    size={14}
                    fill={s.profile.primary === r.id ? "currentColor" : "none"}
                  />
                  {s.profile.primary === r.id ? "Primary focus" : "Set primary"}
                </Button>

                <Button
                  aria-label={`Delete ${r.id}`}
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (
                      confirm(
                        "Delete this repository and its cached issues and private item notes? Imported sources remain.",
                      )
                    )
                      void act({ type: "repository:delete", id: r.id });
                  }}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
              <details className="repo-sync-details">
                <summary>
                  <Clock3 size={13} aria-hidden="true" />
                  {r.syncedAt ? `Cached ${date(r.syncedAt)}` : "Sync details"}
                  {r.partial && " · Partial snapshot"}
                  <ChevronDown size={13} aria-hidden="true" />
                </summary>
                <div>
                  {r.bundledAt && r.bundledAt === r.syncedAt && (
                    <p>
                      Open-item comments are available offline. Synchronize to
                      fetch PR reviews and checks.
                    </p>
                  )}
                  {r.remaining !== null && (
                    <p>GitHub API requests remaining: {r.remaining}</p>
                  )}
                  <p>
                    {r.syncedAt
                      ? `Last successful capture: ${date(r.syncedAt)}`
                      : "No successful sync yet."}
                  </p>
                </div>
              </details>
            </div>
            {guide === r.id && <Briefing repo={r} items={s.items} />}
          </article>
        ))}
      </div>
      {!s.repositories.length && (
        <Empty title="No tracked repositories">
          Add a repository above. Public access works without a token.
        </Empty>
      )}
    </>
  );
}
