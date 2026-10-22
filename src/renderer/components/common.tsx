import ReactMarkdown from "react-markdown";
import type { ReactNode } from "react";
import { ExternalLink, ArrowUpRight, Inbox } from "lucide-react";
import { Button } from "./ui/button";
import { useApp } from "../store";
export function Markdown({ children }: { children: string }) {
  const act = useApp((s) => s.act);
  return (
    <div className="markdown">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <button
              className="text-link"
              onClick={() => href && void act({ type: "external", url: href })}
            >
              {children}
              <ExternalLink size={12} />
            </button>
          ),
          img: () => <span>[Remote image omitted]</span>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
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
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
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
