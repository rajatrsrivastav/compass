import { useState } from "react";
import { Compass, ArrowRight, FolderGit2 } from "lucide-react";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
export const goals = [
  "First OSS contribution",
  "GSoC preparation",
  "LFX preparation",
  "Regular contributor",
  "Reviewer or maintainer",
];
export function Onboarding() {
  const { data, act, busy } = useApp();
  const [profile, setProfile] = useState(data!.profile);
  const bundled = data?.repositories.find((r) => r.bundledAt);
  const items = data?.items.filter((i) => i.repo === bundled?.id) ?? [];
  return (
    <div className="onboarding">
      <div className="onboarding-brand">
        <Compass size={36} />
        <b>OSS Compass</b>
      </div>
      <div className="onboarding-grid">
        <section className="onboarding-project">
          <h1>Create a local workspace</h1>
          <p>
            Review issues, read project documents, and keep your contribution
            notes on this device.
          </p>
          {bundled && (
            <div className="onboarding-snapshot">
              <div className="project-caption">
                <FolderGit2 size={16} /> Included repository
              </div>
              <h2>{bundled.name}</h2>
              <p>{bundled.description}</p>
              <dl>
                <div>
                  <dt>Open issues</dt>
                  <dd>
                    {
                      items.filter(
                        (i) => i.kind === "issue" && i.state === "open",
                      ).length
                    }
                  </dd>
                </div>
                <div>
                  <dt>Open pull requests</dt>
                  <dd>
                    {
                      items.filter((i) => i.kind === "pr" && i.state === "open")
                        .length
                    }
                  </dd>
                </div>
                <div>
                  <dt>Milestones</dt>
                  <dd>{bundled.milestones?.length ?? 0}</dd>
                </div>
              </dl>
            </div>
          )}
        </section>
        <form
          className="panel onboarding-form"
          onSubmit={(e) => {
            e.preventDefault();
            void act({
              type: "profile",
              value: { ...profile, onboarding: true },
            });
          }}
        >
          <h2>Contributor profile</h2>
          <p>Your skills and interests help rank open issues.</p>
          <label>
            GitHub username
            <input
              required
              value={profile.username}
              onChange={(e) =>
                setProfile({ ...profile, username: e.target.value })
              }
              placeholder="Your GitHub handle"
            />
          </label>
          <label>
            Technical skills
            <input
              value={profile.skills}
              onChange={(e) =>
                setProfile({ ...profile, skills: e.target.value })
              }
              placeholder="React, TypeScript, Python"
            />
          </label>
          <label>
            Interests
            <input
              value={profile.interests}
              onChange={(e) =>
                setProfile({ ...profile, interests: e.target.value })
              }
              placeholder="Accessibility, developer tools, education"
            />
          </label>
          <div className="form-row">
            <label>
              Weekly capacity
              <input
                type="number"
                min="1"
                max="80"
                value={profile.hours}
                onChange={(e) =>
                  setProfile({ ...profile, hours: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Your goal
              <select
                value={profile.goal}
                onChange={(e) =>
                  setProfile({ ...profile, goal: e.target.value })
                }
              >
                {goals.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
          </div>
          <Button disabled={!!busy} type="submit">
            Create my workspace
            <ArrowRight size={16} />
          </Button>
          <small>You can change this profile in Settings.</small>
        </form>
      </div>
    </div>
  );
}
