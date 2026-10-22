import { useState } from "react";
import {
  FolderGit2,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Square,
} from "lucide-react";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import { Heading, Badge, Empty, Markdown, date } from "./components/common";
export function Repositories() {
  const { data: s, act } = useApp();
  const [name, setName] = useState(""),
    [guide, setGuide] = useState<string | null>(null);
  if (!s) return null;
  return (
    <>
      <Heading
        eyebrow="BUILD FAMILIARITY"
        title="Your repositories"
        description="Track public projects. Keep their context close, even when you’re offline."
      />
      <form
        className="connect-bar panel"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act({ type: "repository:add", value: name })) setName("");
        }}
      >
        <FolderGit2 size={20} />
        <input
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
      <div className="repo-grid">
        {s.repositories.map((r) => (
          <article className="panel repo-card" key={r.id}>
            <div className="repo-top">
              <span className="repo-icon">
                <FolderGit2 />
              </span>
              <Badge tone={r.provenance === "demo" ? "amber" : "green"}>
                {r.provenance === "demo" ? "Synthetic demo" : "Public GitHub"}
              </Badge>
            </div>
            <h2>{r.name}</h2>
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
            <div className="sync-info">
              <span>Last successful sync</span>
              <b>{date(r.syncedAt)}</b>
              {r.remaining !== null && (
                <span>API requests remaining: {r.remaining}</span>
              )}
              {r.partial && (
                <Badge tone="amber">Bounded / partial snapshot</Badge>
              )}
              {r.error && <p className="error-text">{r.error}</p>}
            </div>
            <div className="inline-actions">
              {r.provenance !== "demo" &&
                (s.syncing.includes(r.id) ? (
                  <Button
                    variant="secondary"
                    onClick={() => void act({ type: "sync:cancel", id: r.id })}
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
                {s.profile.primary === r.id ? "★ Primary focus" : "Set primary"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setGuide(guide === r.id ? null : r.id)}
              >
                Guidance
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
            {guide === r.id && (
              <div className="guidance">
                {Object.keys(r.guidance).length ? (
                  Object.entries(r.guidance).map(([name, body]) => (
                    <details key={name}>
                      <summary>{name}</summary>
                      <Markdown>{body}</Markdown>
                    </details>
                  ))
                ) : (
                  <p>
                    No root-level guidance is cached yet. Synchronize the
                    repository, or read its public documentation.
                  </p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
      {!s.repositories.length && (
        <Empty title="Choose a community you care about">
          Add a repository above. Public access works without a token.
        </Empty>
      )}
      <p className="footnote">
        Synchronization is read-only. Cached records include their last-checked
        time; bounded results are explicitly marked. Credentials are optional in
        Settings.
      </p>
    </>
  );
}
