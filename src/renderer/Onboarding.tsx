import { useState } from "react";
import {
  Compass,
  ArrowRight,
  Database,
  ShieldCheck,
  GitPullRequest,
} from "lucide-react";
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
  return (
    <div className="onboarding">
      <div className="onboarding-brand">
        <Compass size={36} />
        <b>OSS Compass</b>
      </div>
      <div className="onboarding-grid">
        <section>
          <div className="eyebrow">YOUR NEXT MEANINGFUL CONTRIBUTION</div>
          <h1>
            Find your place.
            <br />
            <span>Make an impact.</span>
          </h1>
          <p>
            A calmer workspace for understanding open-source projects, listening
            to communities, and doing work that matters.
          </p>
          <div className="intro-feature">
            <GitPullRequest />
            <div>
              <b>Context before contribution</b>
              <p>Connect issues, reviews, and community conversations.</p>
            </div>
          </div>
          <div className="intro-feature">
            <Database />
            <div>
              <b>Your workspace, on your device</b>
              <p>Local SQLite storage. No hosted account required.</p>
            </div>
          </div>
          <div className="intro-feature">
            <ShieldCheck />
            <div>
              <b>Thoughtful by design</b>
              <p>Private notes and reviews. Nothing posts automatically.</p>
            </div>
          </div>
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
          <BadgeLabel />
          <h2>Set your direction</h2>
          <p>We’ll use this to explain which opportunities may fit.</p>
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
          <small>
            No API key needed. You can explore synthetic demo data after setup.
          </small>
        </form>
      </div>
    </div>
  );
}
function BadgeLabel() {
  return <div className="eyebrow">WELCOME ABOARD</div>;
}
