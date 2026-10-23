import "./styles/app.css";
import { StrictMode, useEffect, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import {
  Compass,
  LayoutDashboard,
  FolderGit2,
  Radar,
  GitPullRequest,
  MessagesSquare,
  Route,
  Sparkles,
  Settings as SettingsIcon,
  ChevronRight,
  Database,
  X,
  Columns3,
  Flag,
} from "lucide-react";
import { useApp } from "./store";
import { Onboarding } from "./Onboarding";
import { Overview } from "./Overview";
import { Repositories } from "./Repositories";
import { Issues } from "./Issues";
import { Community } from "./Community";
import { Journey } from "./Journey";
import { Chat } from "./Chat";
import { Settings } from "./Settings";
import { Detail } from "./Detail";
import { Planning } from "./Planning";
const navigation: {
  label: string;
  pages: [string, ComponentType<{ size?: number }>][];
}[] = [
  {
    label: "Project",
    pages: [
      ["Overview", LayoutDashboard],
      ["Repositories", FolderGit2],
    ],
  },
  {
    label: "Development",
    pages: [
      ["Opportunity Radar", Radar],
      ["Milestones", Flag],
      ["Issue Board", Columns3],
      ["PR Review Queue", GitPullRequest],
    ],
  },
  {
    label: "Personal workspace",
    pages: [
      ["Community Context", MessagesSquare],
      ["My Journey", Route],
      ["AI Copilot", Sparkles],
    ],
  },
];
function App() {
  const { data, page, error, notice, busy, refresh, navigate } = useApp();
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 3000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    document.documentElement.dataset.theme = data?.profile.theme ?? "dark";
  }, [data?.profile.theme]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        navigate("Settings");
      }
      if (e.key === "Escape") useApp.getState().select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  const section = navigation.find((group) =>
    group.pages.some(([name]) => name === page),
  );
  const alert = (
    <>
      {error && (
        <div role="alert" className="toast error">
          <span>{error}</span>
          <button
            aria-label="Dismiss error"
            onClick={() => useApp.setState({ error: "" })}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="toast success">
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => useApp.setState({ notice: "" })}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
  if (!data)
    return (
      <div className="loading">
        <Compass size={36} />
        <p>Opening your local workspace…</p>
        {alert}
      </div>
    );
  if (!data.profile.onboarding)
    return (
      <>
        <Onboarding />
        {alert}
      </>
    );
  return (
    <div className="app">
      <a href="#workspace-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span>
            <Compass size={24} />
          </span>
          <b>OSS Compass</b>
        </div>
        <nav aria-label="Workspace navigation">
          {navigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="workspace-label">{group.label}</div>
              {group.pages.map(([name, Icon]) => (
                <button
                  key={name}
                  className={page === name ? "active" : ""}
                  aria-current={page === name ? "page" : undefined}
                  onClick={() => navigate(name)}
                  aria-label={name}
                  title={name}
                >
                  <Icon size={16} />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={`settings-nav ${page === "Settings" ? "active" : ""}`}
            aria-current={page === "Settings" ? "page" : undefined}
            aria-label="Settings & privacy"
            title="Settings & privacy"
            onClick={() => navigate("Settings")}
          >
            <SettingsIcon size={17} />
            <span>Settings &amp; privacy</span>
            <kbd>⌘ ,</kbd>
          </button>
          <div className="profile-chip">
            <div className="avatar">
              {data.profile.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <b>{data.profile.username}</b>
              <small>{data.profile.goal}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            {section?.label ?? "Application"}
            <ChevronRight size={14} />
            <b>{page}</b>
          </div>
          <nav className="mobile-nav" aria-label="Pages">
            <select
              value={page}
              aria-label="Go to page"
              onChange={(event) => navigate(event.target.value)}
            >
              {navigation.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.pages.map(([name]) => (
                    <option key={name}>{name}</option>
                  ))}
                </optgroup>
              ))}
              <option value="Settings">Settings &amp; privacy</option>
            </select>
          </nav>
          <div>
            {data.profile.demo && (
              <span className="demo-pill">DEMO DATA VISIBLE</span>
            )}
            <span className="cache-status">
              {data.syncing.length || busy ? (
                <>
                  <span className="spinner" />
                  Working…
                </>
              ) : (
                <>
                  <Database size={14} />
                  Local cache
                </>
              )}
            </span>
          </div>
        </header>
        <main id="workspace-content" tabIndex={-1}>
          {page === "Overview" ? (
            <Overview />
          ) : page === "Repositories" ? (
            <Repositories />
          ) : page === "Opportunity Radar" ? (
            <Issues key="radar" />
          ) : page === "Milestones" || page === "Issue Board" ? (
            <Planning board={page === "Issue Board"} />
          ) : page === "PR Review Queue" ? (
            <Issues key="reviews" prs />
          ) : page === "Community Context" ? (
            <Community />
          ) : page === "My Journey" ? (
            <Journey />
          ) : page === "AI Copilot" ? (
            <Chat />
          ) : (
            <Settings />
          )}
        </main>
      </div>
      <Detail />
      {alert}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
