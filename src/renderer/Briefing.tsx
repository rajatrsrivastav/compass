import { useEffect, useRef, useState } from "react";
import { FileText, List } from "lucide-react";
import type { Repository, Item } from "../shared/types";
import { Markdown, OpenButton, TextFile, date } from "./components/common";

export function Briefing({ repo, items }: { repo: Repository; items: Item[] }) {
  const docs =
    repo.briefing?.documents ??
    Object.entries(repo.guidance).map(([path, text]) => ({
      path,
      text,
      url: "",
      observedAt: "",
      truncated: false,
      stale: true,
    }));
  const [path, setPath] = useState("");
  const [source, setSource] = useState(false);
  const doc =
    docs.find((d) => d.path === path) ??
    docs.find((d) => /^README(?:\.(?:md|rst|txt))?$/i.test(d.path)) ??
    docs[0];
  const markdown = !!doc && /(?:\.md|(?:^|\/)readme)$/i.test(doc.path);
  const content = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<HTMLElement[]>([]);
  useEffect(() => {
    const headings =
      content.current?.querySelectorAll<HTMLElement>(".reader-prose h2");
    setSections(headings ? Array.from(headings) : []);
  }, [doc?.path, doc?.text, source]);
  const cached = items.filter((i) => i.repo === repo.id && i.state === "open");
  const prCount = cached.filter((i) => i.kind === "pr").length;

  return (
    <section className="repository-reader">
      <header className="repo-reader-heading">
        <h3>Repository files</h3>
        <p className="reader-caption">
          {repo.language} · {cached.length - prCount} open issues · {prCount}{" "}
          open pull requests
        </p>
      </header>
      {doc ? (
        <div className="file-frame">
          <div className="file-toolbar">
            <FileText size={16} aria-hidden="true" />
            <select
              aria-label="Repository file"
              value={doc.path}
              onChange={(e) => {
                setPath(e.target.value);
                setSource(false);
              }}
            >
              {docs.map((d) => (
                <option key={d.path}>{d.path}</option>
              ))}
            </select>
            {markdown && (
              <div className="reader-switch" aria-label="File display">
                <button
                  type="button"
                  aria-pressed={!source}
                  onClick={() => setSource(false)}
                >
                  Preview
                </button>
                <button
                  type="button"
                  aria-pressed={source}
                  onClick={() => setSource(true)}
                >
                  Source
                </button>
              </div>
            )}
          </div>
          <div className="file-layout">
            <div
              ref={content}
              className="file-content"
              key={doc.path + source}
              tabIndex={0}
              aria-label={doc.path + " contents"}
            >
              {markdown && !source ? (
                <Markdown sourceUrl={doc.url || undefined} hideHtml>
                  {doc.text}
                </Markdown>
              ) : (
                <TextFile numbered={source}>{doc.text}</TextFile>
              )}
            </div>
            {sections.length > 1 && (
              <nav className="file-outline" aria-label="File contents">
                <h4>
                  <List size={14} /> On this page
                </h4>
                {sections.map((heading, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const pane = content.current;
                      if (!pane) return;
                      pane.scrollTop +=
                        heading.getBoundingClientRect().top -
                        pane.getBoundingClientRect().top -
                        18;
                      heading.tabIndex = -1;
                      heading.focus({ preventScroll: true });
                    }}
                  >
                    {heading.textContent}
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div className="file-footer">
            <span>
              {doc.text.split(/\r?\n/).length.toLocaleString()} lines ·{" "}
              {doc.observedAt
                ? `Captured ${date(doc.observedAt)}`
                : "Cached copy"}
              {doc.stale && " · needs refresh"}
              {doc.truncated && " · excerpt"}
            </span>
            {repo.provenance !== "demo" && doc.url && (
              <OpenButton url={doc.url} label="Original file" />
            )}
          </div>
        </div>
      ) : (
        <p>No repository files cached.</p>
      )}
      <details className="reader-disclosure">
        <summary>Source coverage</summary>
        <p>
          {repo.partial ? "Partial repository snapshot" : "Repository snapshot"}{" "}
          · {date(repo.syncedAt)}
        </p>
        {repo.briefing?.locations.map((l) => (
          <p key={l.path}>
            <code>{l.path}</code> · {l.status} · {date(l.checkedAt)}
          </p>
        ))}
        {repo.provenance !== "demo" && (
          <OpenButton
            url={`https://github.com/${repo.id}`}
            label="Repository source"
          />
        )}
        <p className="reader-caption">
          Check the project’s contribution policy for its current AI guidelines.
        </p>
      </details>
    </section>
  );
}
