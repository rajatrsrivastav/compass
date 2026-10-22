import type { Reference, Segment, Item } from "../../shared/types";
export const MAX_IMPORT = 2_000_000;
export function parseImport(text: string, format: string): Segment[] {
  if (
    Buffer.byteLength(text) > MAX_IMPORT ||
    !text.trim() ||
    text.includes("\0")
  )
    throw new Error("Import must be non-empty UTF-8 text, at most 2 MB.");
  if (
    !["manual", "paste", "link", "txt", "md", "srt", "vtt", "json"].includes(
      format,
    )
  )
    throw new Error("Unsupported import format.");
  if (format === "json") {
    const raw = JSON.parse(text);
    const messages = Array.isArray(raw) ? raw : raw?.messages;
    if (
      !Array.isArray(messages) ||
      !messages.every(
        (m) => m && typeof m === "object" && typeof m.text === "string",
      )
    )
      throw new Error(
        "Expected a Slack channel export array or { messages: [...] }.",
      );
    return messages.map((m) => {
      const milliseconds =
        typeof m.ts === "string" || typeof m.ts === "number"
          ? Number(m.ts) * 1000
          : NaN;
      const validTime =
        Number.isFinite(milliseconds) && Math.abs(milliseconds) <= 8.64e15;
      return {
        text: `${typeof m.user === "string" ? m.user : "Unknown speaker"}: ${m.text}`,
        timestamp: validTime ? new Date(milliseconds).toISOString() : null,
      };
    });
  }
  if (format === "srt" || format === "vtt") {
    const blocks = text.replace(/\r/g, "").split(/\n\s*\n/);
    return blocks.flatMap((block) => {
      const lines = block.split("\n"),
        i = lines.findIndex((l) => l.includes("-->"));
      return i < 0
        ? []
        : [
            {
              timestamp: lines[i].split("-->")[0].trim(),
              text: lines
                .slice(i + 1)
                .join("\n")
                .replace(/<[^>]*>/g, ""),
            },
          ];
    });
  }
  return text
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((text) => ({ text, timestamp: null }));
}
export { extractReferences } from "../../shared/references";
export function candidates(
  text: string,
  items: Item[],
  explicit: Reference[],
): Reference[] {
  const terms = new Set(text.toLowerCase().match(/\b[a-z]{5,}\b/g));
  return items
    .filter(
      (i) => !explicit.some((r) => r.repo === i.repo && r.number === i.number),
    )
    .flatMap((i) => {
      const common = [
        ...new Set(i.title.toLowerCase().match(/\b[a-z]{5,}\b/g)),
      ].filter((w) => terms.has(w));
      return common.length >= 2
        ? [
            {
              repo: i.repo,
              number: i.number,
              kind: "candidate" as const,
              evidence: `Shared words: ${common.join(", ")}. Unverified relationship.`,
            },
          ]
        : [];
    })
    .slice(0, 20);
}
