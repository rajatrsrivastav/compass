import { useState } from "react";
import {
  Plus,
  Upload,
  Search,
  FileText,
  Link,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import {
  Heading,
  Badge,
  Empty,
  Markdown,
  OpenButton,
  date,
} from "./components/common";
import type { Annotation } from "../shared/types";
export function Community() {
  const { data: s, act, select, source: routedSource } = useApp();
  const [create, setCreate] = useState(false),
    [active, setActive] = useState(routedSource ?? ""),
    [query, setQuery] = useState(""),
    [title, setTitle] = useState(""),
    [text, setText] = useState(""),
    [format, setFormat] = useState("manual"),
    [repo, setRepo] = useState(""),
    [url, setUrl] = useState(""),
    [meetingDate, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [consent, setConsent] = useState(false),
    [passage, setPassage] = useState(""),
    [kind, setKind] = useState<Annotation["kind"]>("action"),
    [note, setNote] = useState("");
  if (!s) return null;
  const term = query.trim().toLowerCase();
  const sources = s.sources.filter(
      (x) =>
        !term ||
        [x.title, x.text, x.repo, x.format].some((value) =>
          value.toLowerCase().includes(term),
        ),
    ),
    source = sources.find((x) => x.id === active) ?? sources[0];
  return (
    <>
      <Heading
        title="Community context"
        description="Read imported files, annotate passages, and link them to issues."
        actions={
          <Button onClick={() => setCreate(!create)}>
            <Plus size={16} />
            {create ? "Close editor" : "Capture context"}
          </Button>
        }
      />
      {create && (
        <form
          className="panel source-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await act({
                type: "source:add",
                title,
                text,
                format,
                repo,
                date: meetingDate,
                url,
                consent,
              })
            ) {
              setCreate(false);
              setText("");
              setTitle("");
            }
          }}
        >
          <div className="form-row">
            <label>
              Source title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project meeting · engineering notes"
              />
            </label>
            <label>
              Capture method
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="manual">Manual notes (unverified)</option>
                <option value="paste">Pasted messages</option>
                <option value="link">Link and research notes</option>
                <option value="txt">TXT transcript</option>
                <option value="md">Markdown transcript</option>
                <option value="srt">SRT subtitles</option>
                <option value="vtt">VTT subtitles</option>
                <option value="json">Slack JSON export</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Repository context
              <select value={repo} onChange={(e) => setRepo(e.target.value)}>
                <option value="">No unambiguous repository</option>
                {s.repositories.map((r) => (
                  <option key={r.id}>{r.id}</option>
                ))}
              </select>
            </label>
            <label>
              Meeting / source date
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Provenance link (optional)
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>
          <label>
            Source text
            <textarea
              required
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Capture the discussion, decisions, and explicit owner/repo#123 references…"
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            I have permission to store this content locally.
          </label>
          <div className="inline-actions">
            <Button disabled={!consent}>Save source</Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!consent}
              onClick={() => void act({ type: "source:import", repo, consent })}
            >
              <Upload size={15} />
              Choose file instead
            </Button>
            <small>TXT, MD, SRT, VTT, Slack JSON · 2 MB maximum</small>
          </div>
        </form>
      )}
      <div className="community-layout">
        <section className="panel source-sidebar">
          <div className="search">
            <Search size={16} />
            <input
              aria-label="Search community"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search local sources…"
            />
          </div>
          <div className="list-caption">
            {sources.length} {sources.length === 1 ? "source" : "sources"}
          </div>
          {sources.map((x) => (
            <button
              className={`source-entry ${source?.id === x.id ? "active" : ""}`}
              key={x.id}
              aria-current={source?.id === x.id ? "true" : undefined}
              onClick={() => {
                setActive(x.id);
                setPassage("");
              }}
            >
              <FileText size={17} />
              <div>
                <b>{x.title}</b>
                <small>
                  {x.date} · {x.format.toUpperCase()}
                </small>
              </div>
            </button>
          ))}
        </section>
        <section className="panel source-detail">
          {source ? (
            <>
              <div className="section-title">
                <div>
                  <div className="source-kind">
                    {source.provenance === "demo"
                      ? "Synthetic demo source"
                      : source.provenance === "manual"
                        ? "Local note · unverified"
                        : "Imported file · unverified"}
                  </div>
                  <h2>{source.title}</h2>
                  <p>
                    Imported {date(source.importedAt)} · Source date{" "}
                    {source.date}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete source"
                  onClick={() => {
                    if (
                      confirm(
                        "Delete this source, its annotations, and extracted relationships?",
                      )
                    )
                      void act({ type: "source:delete", id: source.id });
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              {source.url && (
                <OpenButton url={source.url} label="Provenance link" />
              )}
              <div
                className="transcript"
                role="region"
                aria-label={`Contents of ${source.title}`}
                tabIndex={0}
                onMouseUp={() => {
                  const selection = window.getSelection()?.toString();
                  if (selection && source.text.includes(selection))
                    setPassage(selection);
                }}
              >
                {source.format === "md" ? (
                  <Markdown>{source.text}</Markdown>
                ) : ["txt", "manual", "paste", "link"].includes(
                    source.format,
                  ) ? (
                  <div className="source-plain-text">{source.text}</div>
                ) : (
                  source.segments.map((seg, n) => (
                    <div className="transcript-segment" key={n}>
                      {seg.timestamp && (
                        <span className="timecode">{seg.timestamp}</span>
                      )}
                      <div className="source-plain-text">{seg.text}</div>
                    </div>
                  ))
                )}
              </div>
              <h3>
                <Link size={15} /> Linked engineering work
              </h3>
              {source.refs.map((r, n) => (
                <button
                  className="reference-row"
                  key={n}
                  onClick={() => select(`${r.repo}#${r.number}`)}
                >
                  <div>
                    <b>
                      {r.repo}#{r.number}
                    </b>
                    <small>{r.evidence}</small>
                  </div>
                  <Badge tone={r.kind === "explicit" ? "green" : "amber"}>
                    {r.kind === "explicit"
                      ? "Explicit"
                      : "Candidate · unverified"}
                  </Badge>
                  <ArrowUpRight size={14} />
                </button>
              ))}
              {!source.refs.length && (
                <p className="muted">
                  No tracked references found. Bare issue numbers need an
                  explicit repository context.
                </p>
              )}
              <h3>Decisions & action items</h3>
              {source.annotations.map((a) => (
                <div className="annotation" key={a.id}>
                  <Badge tone="purple">{a.kind}</Badge>
                  <blockquote>{a.passage}</blockquote>
                  <p>{a.note}</p>
                </div>
              ))}
              <form
                className="annotation-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await act({
                      type: "source:annotate",
                      id: source.id,
                      passage,
                      kind,
                      note,
                    })
                  ) {
                    setPassage("");
                    setNote("");
                  }
                }}
              >
                <label>
                  Highlight a passage above, or paste its exact text
                  <textarea
                    aria-label="Selected passage"
                    value={passage}
                    onChange={(e) => setPassage(e.target.value)}
                    required
                    rows={2}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Classify
                    <select
                      value={kind}
                      onChange={(e) =>
                        setKind(e.target.value as Annotation["kind"])
                      }
                    >
                      {["action", "decision", "priority", "question"].map(
                        (v) => (
                          <option key={v}>{v}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Your annotation
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What should you investigate?"
                    />
                  </label>
                </div>
                <Button variant="secondary" size="sm">
                  Add annotation
                </Button>
              </form>
            </>
          ) : (
            <Empty title={query ? "No matching sources" : "No sources yet"}>
              {query
                ? "Try a different title or phrase."
                : "Capture a note or import a transcript to start your library."}
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
