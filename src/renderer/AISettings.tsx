import { useState } from "react";
import { models } from "../shared/ai";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
import { Badge } from "./components/common";
export function AISettings() {
  const { data: s, act } = useApp();
  const [token, setToken] = useState(""),
    [persist, setPersist] = useState(false);
  const [config, setConfig] = useState(s!.ai!.config);
  if (!s?.ai) return null;
  return (
    <section className="panel">
      <h2>Optional OpenAI assistant</h2>
      <Badge>
        {s.ai.configured
          ? s.ai.persistent
            ? "OS-encrypted key"
            : "Session-only key"
          : "Local mode available"}
      </Badge>
      <p>
        Paid API use is optional. Nothing is sent until you preview evidence and
        authorize a request in chat. Account model access is verified by the
        provider when you send.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act({ type: "ai:key", token, persist })) setToken("");
        }}
      >
        <label>
          OpenAI API key
          <input
            type="password"
            autoComplete="off"
            value={token}
            required
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => setPersist(e.target.checked)}
          />
          Remember OpenAI key using OS encryption
        </label>
        <div className="inline-actions">
          <Button variant="secondary">Save OpenAI key</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void act({ type: "ai:delete" })}
          >
            Delete OpenAI key
          </Button>
        </div>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act({ type: "ai:configure", config });
        }}
      >
        <label>
          OpenAI model
          <select
            value={config.model}
            onChange={(e) =>
              setConfig({
                ...config,
                model: e.target.value as typeof config.model,
              })
            }
          >
            {models.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Daily request limit (UTC)
          <input
            type="number"
            min="1"
            max="50"
            value={config.dailyLimit}
            onChange={(e) =>
              setConfig({ ...config, dailyLimit: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Maximum output tokens
          <input
            type="number"
            min="256"
            max="2000"
            value={config.outputTokens}
            onChange={(e) =>
              setConfig({ ...config, outputTokens: Number(e.target.value) })
            }
          />
        </label>
        <p>
          {s.ai.callsToday} requests attempted today. Failed attempts count. One
          request per send, no automatic retries. This local limit is not an
          account-wide spending cap.
        </p>
        <Button variant="secondary">Save AI limits</Button>
      </form>
    </section>
  );
}
