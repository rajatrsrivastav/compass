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
  WifiOff,
  X,
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
import "./styles/app.css";
const navigation: [string, ComponentType<{ size?: number }>][] = [
  ["Overview", LayoutDashboard],
  ["Repositories", FolderGit2],
  ["Opportunity Radar", Radar],
  ["PR Review Queue", GitPullRequest],
  ["Community Context", MessagesSquare],
  ["My Journey", Route],
  ["AI Copilot", Sparkles],
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
      <aside className="sidebar">
        <div className="brand">
          <span>
            <Compass size={24} />
          </span>
          <div>
            OSS Compass<small>CONTRIBUTOR WORKSPACE</small>
          </div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {navigation.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "active" : ""}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {page === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-status">
            <span className="live-dot" />
            <div>
              Local-first workspace<small>Your context stays with you</small>
            </div>
          </div>
          <button
            className={`settings-nav ${page === "Settings" ? "active" : ""}`}
            onClick={() => navigate("Settings")}
          >
            <SettingsIcon size={17} />
            Settings & privacy<span>⌘ ,</span>
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
          <div>
            Workspace
            <ChevronRight size={14} />
            <b>{page}</b>
          </div>
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
                  <WifiOff size={13} />
                  Local cache
                </>
              )}
            </span>
          </div>
        </header>
        <main>
          {page === "Overview" ? (
            <Overview />
          ) : page === "Repositories" ? (
            <Repositories />
          ) : page === "Opportunity Radar" ? (
            <Issues />
          ) : page === "PR Review Queue" ? (
            <Issues prs />
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
