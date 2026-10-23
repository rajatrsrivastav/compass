import { CloudComposer } from "./CloudComposer";
import { useState } from "react";
import {
  Plus,
  Send,
  Download,
  Trash2,
  Pencil,
  Search,
  Paperclip,
} from "lucide-react";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import { Heading, Badge, Empty, Markdown, date } from "./components/common";
export function Chat() {
  const { data: s, act, select, openSource, busy } = useApp();
  const [active, setActive] = useState(""),
    [text, setText] = useState(""),
    [query, setQuery] = useState(""),
    [sources, setSources] = useState<string[]>([]),
    [contextQuery, setContextQuery] = useState(""),
    [visibleSources, setVisibleSources] = useState(40),
    [picker, setPicker] = useState(false),
    [newTitle, setNewTitle] = useState(""),
    [renaming, setRenaming] = useState(false),
    [renameTitle, setRenameTitle] = useState("");
  if (!s) return null;
  const conversations = s.conversations.filter((c) =>
      (c.title + " " + c.messages.map((m) => m.text).join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
    chat = conversations.find((c) => c.id === active) ?? conversations[0];
  const matches = picker
    ? [
        ...s.items.map((i) => ({ id: i.id, title: i.title })),
        ...s.repositories.map((r) => ({
          id: r.id,
          title: `Repository: ${r.name}`,
        })),
        ...s.tasks.map((t) => ({
          id: t.id,
          title: `Plan: ${t.title}`,
        })),
        ...s.changes.map((c) => ({
          id: c.id,
          title: `Change: ${c.title}`,
        })),
        ...s.sources.map((i) => ({ id: i.id, title: i.title })),
      ].filter((x) =>
        (x.id + " " + x.title)
          .toLowerCase()
          .includes(contextQuery.trim().toLowerCase()),
      )
    : [];
  return (
    <>
      <Heading
        title="AI copilot"
        description="Ask questions about selected issues, notes, and repository files."
        actions={
          <Badge>
            {s.ai?.configured
              ? "OpenAI optional · local mode ready"
              : "No external model connected"}
          </Badge>
        }
      />
      <div className="chat-layout panel">
        <aside className="chat-sidebar">
          <label>
            Conversation title
            <input
              aria-label="Conversation title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Contribution investigation"
            />
          </label>
          <Button
            onClick={async () => {
              if (
                await act({
                  type: "chat:create",
                  title: newTitle.trim() || "Contribution investigation",
                })
              ) {
                const newest = useApp.getState().data?.conversations.at(-1);
                if (newest) setActive(newest.id);
                setQuery("");
                setNewTitle("");
              }
            }}
          >
            <Plus size={15} />
            New conversation
          </Button>
          <div className="search">
            <Search size={15} />
            <input
              aria-label="Search conversations"
              placeholder="Search conversations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {conversations.map((c) => (
            <button
              className={`chat-entry ${c.id === chat?.id ? "active" : ""}`}
              aria-current={c.id === chat?.id ? "true" : undefined}
              key={c.id}
              onClick={() => setActive(c.id)}
            >
              <span>{c.title}</span>
              <small>
                {c.demo
                  ? "Synthetic demo conversation"
                  : `${c.messages.length} messages · local`}
              </small>
            </button>
          ))}
        </aside>
        <section className="chat-main">
          {chat ? (
            <>
              <header className="chat-header">
                <div>
                  {renaming ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (
                          await act({
                            type: "chat:rename",
                            id: chat.id,
                            title: renameTitle,
                          })
                        )
                          setRenaming(false);
                      }}
                    >
                      <input
                        aria-label="New conversation title"
                        required
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                      />
                      <Button size="sm">Save title</Button>
                    </form>
                  ) : (
                    <b>{chat.title}</b>
                  )}
                  <small>
                    {chat.demo
                      ? "Synthetic Demo Data · read-only"
                      : "Stored locally in SQLite"}
                  </small>
                </div>
                <div className="inline-actions">
                  <Button
                    aria-label="Rename conversation"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setRenameTitle(chat.title);
                      setRenaming(!renaming);
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    aria-label="Export conversation"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      void act({ type: "export", kind: "chat", id: chat.id })
                    }
                  >
                    <Download size={15} />
                  </Button>
                  <Button
                    aria-label="Delete conversation"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Delete this conversation and its messages?"))
                        void act({ type: "chat:delete", id: chat.id });
                    }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </header>
              <div className="messages">
                {chat.messages.map((m) => (
                  <article className={`message message-${m.role}`} key={m.id}>
                    <div className="message-meta">
                      <b>{m.role === "user" ? "You" : "Compass"}</b>
                      <Badge tone={m.origin === "demo" ? "amber" : "neutral"}>
                        {m.origin}
                      </Badge>
                      <small>{date(m.at)}</small>
                    </div>
                    {m.origin === "model" && (
                      <p className="footnote">
                        OpenAI · {m.model} · {m.totalTokens ?? "unknown"} total
                        tokens · citation IDs checked, claims unverified
                      </p>
                    )}
                    <Markdown>{m.text}</Markdown>
                    {m.evidence && (
                      <details>
                        <summary>
                          Supplied evidence ({m.evidence.length} passages)
                        </summary>
                        {m.evidence.map((c) => (
                          <details key={c.id}>
                            <summary>
                              {c.id} · {c.title}
                            </summary>
                            <p>
                              {c.provenance} · observed {c.observedAt} · {c.url}
                            </p>
                            <pre className="evidence-preview">{c.text}</pre>
                          </details>
                        ))}
                      </details>
                    )}
                    {m.sources.length > 0 && (
                      <div className="message-sources">
                        {m.sources.map((id) => (
                          <button
                            key={id}
                            onClick={() => {
                              if (s.items.some((i) => i.id === id)) select(id);
                              else if (s.sources.some((x) => x.id === id))
                                openSource(id);
                              else
                                useApp
                                  .getState()
                                  .navigate(
                                    s.tasks.some((t) => t.id === id)
                                      ? "My Journey"
                                      : "Repositories",
                                  );
                            }}
                          >
                            {s.sources.find((x) => x.id === id)?.title ?? id}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
                {!chat.messages.length && (
                  <Empty title="Start with a question and a source">
                    Attach an issue or an imported note with the Context button.
                  </Empty>
                )}
              </div>
              {!chat.demo && (
                <form
                  className="composer"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      await act({
                        type: "chat:send",
                        id: chat.id,
                        text,
                        sources,
                      })
                    )
                      setText("");
                  }}
                >
                  {picker && (
                    <div className="context-picker">
                      <label>
                        Find local context
                        <input
                          type="search"
                          value={contextQuery}
                          onChange={(e) => {
                            setContextQuery(e.target.value);
                            setVisibleSources(40);
                          }}
                          placeholder="Search by name or issue number"
                        />
                      </label>
                      {matches.slice(0, visibleSources).map((x) => (
                        <label className="check-label" key={x.id}>
                          <input
                            type="checkbox"
                            checked={sources.includes(x.id)}
                            disabled={
                              sources.length >= 30 && !sources.includes(x.id)
                            }
                            onChange={(e) =>
                              setSources(
                                e.target.checked
                                  ? [...sources, x.id]
                                  : sources.filter((id) => id !== x.id),
                              )
                            }
                          />
                          {x.title}
                        </label>
                      ))}
                      {!matches.length && <p>No matching sources</p>}
                      {matches.length > visibleSources && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setVisibleSources(visibleSources + 40)}
                        >
                          Show more sources ({matches.length - visibleSources})
                        </Button>
                      )}
                    </div>
                  )}
                  <textarea
                    aria-label="Chat message"
                    required
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What should I investigate next?"
                  />
                  <div className="composer-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPicker(!picker)}
                    >
                      <Paperclip size={14} />
                      Context ({sources.length})
                    </Button>
                    <small>Deterministic · local only</small>
                    <Button disabled={!!busy} aria-label="Send message">
                      <Send size={15} />
                      Send
                    </Button>
                  </div>
                  <CloudComposer
                    id={chat.id}
                    question={text}
                    sources={sources}
                    onSent={() => setText("")}
                  />
                </form>
              )}
              {chat.demo && (
                <div className="demo-chat-footer">
                  Start a new conversation to ask about your own sources.
                </div>
              )}
            </>
          ) : (
            <Empty
              title={
                query ? "No matching conversations" : "No conversations yet"
              }
            >
              {query
                ? "Try another search."
                : "Enter a title and create a conversation to get started."}
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
