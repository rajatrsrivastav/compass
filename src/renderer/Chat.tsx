import { useState } from "react";
import {
  Plus,
  Send,
  Download,
  Trash2,
  Pencil,
  Sparkles,
  Search,
  Paperclip,
} from "lucide-react";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import { Heading, Badge, Empty, Markdown, date } from "./components/common";
export function Chat() {
  const { data: s, act, select, busy } = useApp();
  const [active, setActive] = useState(""),
    [text, setText] = useState(""),
    [query, setQuery] = useState(""),
    [sources, setSources] = useState<string[]>([]),
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
  return (
    <>
      <Heading
        eyebrow="THINK WITH YOUR SOURCES"
        title="AI copilot"
        description="A persistent conversation workspace. The built-in assistant uses local, deterministic evidence."
        actions={<Badge tone="green">No external model connected</Badge>}
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
          <div className="chat-privacy">
            <Sparkles size={18} />
            <b>Useful without an API key</b>
            <p>
              Select evidence for a structured local summary. This assistant
              does not generate model responses or send data off-device.
            </p>
          </div>
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
                    <Markdown>{m.text}</Markdown>
                    {m.sources.length > 0 && (
                      <div className="message-sources">
                        {m.sources.map((id) => (
                          <button
                            key={id}
                            onClick={() => {
                              if (s.items.some((i) => i.id === id)) select(id);
                              else
                                useApp.getState().navigate("Community Context");
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
                    Select relevant issues or imported notes below. Responses
                    are labeled with their actual origin.
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
                      <b>Selected local context · nothing is uploaded</b>
                      {[
                        ...s.items.map((i) => ({ id: i.id, title: i.title })),
                        ...s.sources.map((i) => ({ id: i.id, title: i.title })),
                      ].map((x) => (
                        <label className="check-label" key={x.id}>
                          <input
                            type="checkbox"
                            checked={sources.includes(x.id)}
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
                </form>
              )}
              {chat.demo && (
                <div className="demo-chat-footer">
                  This is a synthetic example, not a live model response. Start
                  a new conversation for real local interactions.
                </div>
              )}
            </>
          ) : (
            <Empty title="A little help connecting the dots">
              Create a conversation, or enable demo mode to explore labeled
              examples.
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
