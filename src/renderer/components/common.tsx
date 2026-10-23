import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/reader.css";
import "../styles/repository.css";
import { type ReactNode, useState } from "react";
import type { Comment } from "../../shared/types";
import { ArrowUpRight, Code2, Inbox } from "lucide-react";
import { Button } from "./ui/button";
import { useApp } from "../store";
export function TextFile({
  children,
  numbered = false,
}: {
  children: string;
  numbered?: boolean;
}) {
  if (!numbered) return <pre className="plain-file">{children}</pre>;
  const lines = children.split("\n");
  return (
    <pre className="plain-file numbered-file">
      {lines.map((line, index) => (
        <span className="file-line" key={index} data-line={index + 1}>
          {line}
          {index < lines.length - 1 ? "\n" : ""}
        </span>
      ))}
    </pre>
  );
}

export function Markdown({
  children,
  sourceUrl,
  hideHtml = false,
}: {
  children: string;
  sourceUrl?: string;
  hideHtml?: boolean;
}) {
  const act = useApp((s) => s.act);
  return (
    <div className="markdown reader-prose">
      <ReactMarkdown
        skipHtml={hideHtml}
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            let url: URL;
            try {
              if (!href) return <>{children}</>;
              url = new URL(href, sourceUrl);
            } catch {
              return <>{children}</>;
            }
            if (url.protocol !== "https:") return <>{children}</>;
            return (
              <a
                href={url.href}
                onClick={(e) => {
                  e.preventDefault();
                  void act({ type: "external", url: url.href });
                }}
              >
                {children}
              </a>
            );
          },
          img: ({ alt }) => (
            <span className="reader-image-alt">{alt || "Image"}</span>
          ),
          table: ({ children }) => (
            <div className="reader-table">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
export function CommentEntry({ comment }: { comment: Comment }) {
  const [source, setSource] = useState(false);
  const act = useApp((s) => s.act);
  return (
    <article className="thread-entry">
      <header>
        <span className="comment-initial" aria-hidden="true">
          {comment.author.slice(0, 1).toUpperCase()}
        </span>
        <strong>{comment.author}</strong>
        {comment.state && <Badge>{comment.state}</Badge>}
        {comment.url ? (
          <button
            className="thread-date"
            title="Open original on GitHub"
            onClick={() => void act({ type: "external", url: comment.url })}
          >
            <time dateTime={comment.at}>{date(comment.at)}</time>
            <ArrowUpRight size={12} />
          </button>
        ) : (
          <time dateTime={comment.at}>{date(comment.at)}</time>
        )}
      </header>
      {comment.body && (
        <>
          {source ? (
            <TextFile>{comment.body}</TextFile>
          ) : (
            <Markdown sourceUrl={comment.url} hideHtml>
              {comment.body}
            </Markdown>
          )}
          <footer>
            <button
              type="button"
              aria-pressed={source}
              onClick={() => setSource(!source)}
            >
              <Code2 size={13} /> {source ? "Show preview" : "View source"}
            </button>
          </footer>
        </>
      )}
    </article>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={28} />
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function SectionTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
export function OpenButton({
  url,
  label = "Open on GitHub",
}: {
  url: string;
  label?: string;
}) {
  const act = useApp((s) => s.act);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void act({ type: "external", url })}
    >
      {label}
      <ArrowUpRight size={14} />
    </Button>
  );
}
export function date(value: string | null) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not synchronized";
}
