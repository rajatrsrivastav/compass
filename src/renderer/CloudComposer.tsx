import { useEffect, useState, useRef } from "react";
import type { CloudPreview } from "../shared/ai";
import { useApp } from "./store";
import { Button } from "./components/ui/button";
export function CloudComposer({
  id,
  question,
  sources,
  onSent,
}: {
  id: string;
  question: string;
  sources: string[];
  onSent: () => void;
}) {
  const { act, data: s } = useApp();
  const [preview, setPreview] = useState<CloudPreview | null>(null),
    [consent, setConsent] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0);
  const selection = JSON.stringify(sources);
  useEffect(() => {
    generation.current++;
    setPreview(null);
    setConsent(false);
  }, [id, question, selection]);
  async function prepare() {
    const requestGeneration = generation.current;
    setError("");
    setConsent(false);
    setPending(true);
    try {
      const result = await window.compass.act({
        type: "chat:preview",
        id,
        text: question,
        sources,
      });
      if (requestGeneration === generation.current)
        setPreview(result.preview ?? null);
    } catch (e) {
      setError(String(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="cloud-composer">
      <p>
        Optional cloud mode ·{" "}
        {s?.ai?.configured
          ? "OpenAI key configured"
          : "Add your key in Settings to send"}
        . Local Send remains available.
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={pending || !question.trim() || !sources.length}
        onClick={() => void prepare()}
      >
        Preview OpenAI evidence
      </Button>
      {error && <p role="alert">{error}</p>}
      {preview && (
        <div className="evidence-box">
          <h3>Review what will leave this device</h3>
          <p>
            OpenAI · {preview.model} · up to {preview.outputTokens} output
            tokens. Preview expires in five minutes. Only the question and these{" "}
            {preview.chunks.length} passages, including their displayed
            metadata, are sent with fixed grounding instructions. Earlier
            conversation history and private item notes are excluded. Provider
            data handling policies apply; store=false is requested and is not a
            zero-retention guarantee.
          </p>
          <p>
            <b>Question:</b> {preview.question}
          </p>
          {preview.chunks.map((c) => (
            <details key={c.id}>
              <summary>
                {c.title} · {c.provenance}
              </summary>
              <p>
                Record {c.recordId} · {c.id} · observed {c.observedAt} · {c.url}
              </p>
              <pre className="evidence-preview">{c.text}</pre>
            </details>
          ))}
          <label className="check-label">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            I authorize sending this question and these passages, including any
            imported community content, to OpenAI.
          </label>
          <Button
            type="button"
            disabled={!consent || pending || !s?.ai?.configured}
            onClick={async () => {
              setPending(true);
              try {
                if (
                  await act({
                    type: "chat:cloud",
                    id,
                    previewId: preview.id,
                    consent: true,
                  })
                ) {
                  setPreview(null);
                  setConsent(false);
                  onSent();
                }
              } finally {
                setPending(false);
              }
            }}
          >
            Send approved evidence to OpenAI
          </Button>
          <p className="footnote">
            Citation IDs are checked against the supplied passages. Valid IDs do
            not prove a claim is correct. No posting or review tools are
            available.
          </p>
        </div>
      )}
    </div>
  );
}
