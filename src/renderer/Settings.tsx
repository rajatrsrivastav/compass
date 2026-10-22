import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, Database, Lock, Sun, Moon } from "lucide-react";
import { useApp } from "./store";
import { goals } from "./Onboarding";
import { Button } from "./components/ui/button";
import { Heading, Badge } from "./components/common";
export function Settings() {
  const { data: s, act } = useApp();
  const [p, setP] = useState(s!.profile),
    [token, setToken] = useState(""),
    [persist, setPersist] = useState(false);
  const persistedProfile = JSON.stringify(s?.profile);
  useEffect(() => {
    if (persistedProfile) setP(JSON.parse(persistedProfile));
  }, [persistedProfile]);
  if (!s) return null;
  return (
    <>
      <Heading
        eyebrow="MAKE IT YOURS"
        title="Settings & privacy"
        description="Your profile, your credentials, your local workspace."
      />
      <div className="settings-grid">
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void act({ type: "profile", value: p });
          }}
        >
          <h2>Contributor profile</h2>
          <label>
            GitHub username
            <input
              required
              value={p.username}
              onChange={(e) => setP({ ...p, username: e.target.value })}
            />
          </label>
          <label>
            Technical skills
            <input
              value={p.skills}
              onChange={(e) => setP({ ...p, skills: e.target.value })}
            />
          </label>
          <label>
            Interests
            <input
              value={p.interests}
              onChange={(e) => setP({ ...p, interests: e.target.value })}
            />
          </label>
          <div className="form-row">
            <label>
              Weekly hours
              <input
                type="number"
                min="1"
                max="80"
                value={p.hours}
                onChange={(e) => setP({ ...p, hours: Number(e.target.value) })}
              />
            </label>
            <label>
              Goal
              <select
                value={p.goal}
                onChange={(e) => setP({ ...p, goal: e.target.value })}
              >
                {goals.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Maximum records per endpoint per sync
            <input
              type="number"
              min="10"
              max="500"
              value={p.syncLimit}
              onChange={(e) =>
                setP({ ...p, syncLimit: Number(e.target.value) })
              }
            />
          </label>
          <p className="footnote">
            Comments and reviews are enriched for up to 12 recently updated
            items per synchronization. Larger snapshots are labeled partial.
          </p>
          <Button>Save profile</Button>
        </form>
        <div>
          <section className="panel">
            <h2>
              <KeyRound size={18} />
              GitHub access
            </h2>
            <Badge tone={s.credential.present ? "green" : "neutral"}>
              {s.credential.present
                ? s.credential.persistent
                  ? "OS-encrypted token"
                  : "Session-only token"
                : "Unauthenticated public access"}
            </Badge>
            <p>
              Public repositories work without a token. An optional read-only
              token can increase the API allowance. Write access is never used.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await act({ type: "credential:set", token, persist }))
                  setToken("");
              }}
            >
              <label>
                GitHub token
                <input
                  aria-label="GitHub token"
                  autoComplete="off"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Optional read-only token"
                  required
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                />
                Remember using OS-backed encryption
              </label>
              <div className="inline-actions">
                <Button variant="secondary">Save token</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void act({ type: "credential:delete" })}
                >
                  Delete stored credential
                </Button>
              </div>
            </form>
          </section>
          <section className="panel">
            <h2>Workspace preferences</h2>
            <div className="preference">
              <div>
                <b>Appearance</b>
                <p>Choose the theme that suits your space.</p>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  void act({
                    type: "profile",
                    value: {
                      ...s.profile,
                      theme: s.profile.theme === "dark" ? "light" : "dark",
                    },
                  })
                }
              >
                {s.profile.theme === "dark" ? (
                  <Sun size={16} />
                ) : (
                  <Moon size={16} />
                )}{" "}
                {s.profile.theme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={s.profile.demo}
                onChange={(e) =>
                  void act({
                    type: "profile",
                    value: { ...s.profile, demo: e.target.checked },
                  })
                }
              />
              Show synthetic demo records and conversations
            </label>
            <Button
              variant="ghost"
              onClick={() => void act({ type: "demo:seed" })}
            >
              Load offline demo fixtures
            </Button>
          </section>
        </div>
      </div>
      <section className="panel privacy">
        <h2>
          <ShieldCheck size={20} />
          Privacy & data
        </h2>
        <div className="privacy-grid">
          <div>
            <Database />
            <h3>Stored on this device</h3>
            <p>
              Profiles, cached public GitHub content, imported community text,
              annotations, private reviews, plans, and conversations are stored
              in SQLite in the app’s user-data directory. The database itself is
              not encrypted.
            </p>
          </div>
          <div>
            <Lock />
            <h3>What leaves your device</h3>
            <p>
              Repository requests go only to api.github.com. Your optional token
              accompanies those requests. Clicking an external link opens your
              browser. There is no telemetry, automatic posting, Slack scraping,
              or community-content upload.
            </p>
          </div>
          <div>
            <ShieldCheck />
            <h3>You remain in control</h3>
            <p>
              Import only content you may store. Delete repositories, sources,
              and conversations in their workspaces. Delete tokens above. Keep
              exports private as needed. OS-backed token encryption is required
              for persistence; session-only use is available.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
