import { createHash } from "node:crypto";
import type { EvidenceChunk } from "../../shared/ai";
import type {
  Item,
  Source,
  Repository,
  Task,
  Change,
} from "../../shared/types";
export const evidenceTables = [
  "items",
  "sources",
  "repositories",
  "tasks",
  "changes",
] as const;
export function chunksFor(table: string, value: unknown): EvidenceChunk[] {
  let text: string, title: string, provenance: string, observedAt: string;
  let url = "";
  const record = value as { id: string };
  if (table === "items") {
    const i = value as Item;
    title = i.title;
    url = i.url;
    provenance = i.provenance;
    observedAt = i.observedAt;
    text = `${i.repo}#${i.number} (${i.kind}, ${i.state})\n${i.title}\n${i.body}\nAssignments: ${i.assignees.join(", ")}\nLabels: ${i.labels.join(", ")}\nHead: ${i.headSha ?? "unknown"}\nDiscussion observed: ${i.commentsObservedAt ?? "unknown"}; complete: ${!!i.commentsComplete}\nReviews observed: ${i.reviewsObservedAt ?? "unknown"}; complete: ${!!i.reviewsComplete}\n${[...i.comments, ...i.reviews].map((c) => `${c.author} ${c.at} ${c.state ?? ""}: ${c.body} ${c.url}`).join("\n")}`;
  } else if (table === "sources") {
    const s = value as Source;
    title = s.title;
    url = s.url;
    provenance = s.provenance;
    observedAt = s.importedAt;
    text = s.segments.map((p) => `${p.timestamp ?? ""} ${p.text}`).join("\n\n");
  } else if (table === "repositories") {
    const r = value as Repository;
    title = r.name;
    url = `https://github.com/${r.id}`;
    provenance = r.provenance;
    observedAt = r.syncedAt ?? "unknown";
    text = `${r.description}\nPrimary language: ${r.language}\nPartial coverage: ${r.partial}\n${
      r.briefing?.documents
        .map(
          (d) =>
            `${d.path} ${d.url} observed ${d.observedAt} stale:${d.stale}\n${d.text}`,
        )
        .join("\n\n") ??
      Object.entries(r.guidance)
        .map(([name, body]) => `${name}\n${body}`)
        .join("\n\n")
    }`;
  } else if (table === "tasks") {
    const t = value as Task;
    title = t.title;
    url = t.url;
    provenance = "manual";
    observedAt = "local plan";
    text = `${t.title}; ${t.hours} hours; ${t.type}; completed: ${t.done}; deadline ${t.deadline || "none"}. User-entered, unverified.`;
  } else if (table === "changes") {
    const c = value as Change;
    title = c.title;
    provenance = c.provenance;
    observedAt = c.at;
    text = `${c.title}\n${c.detail}\nRecord ${c.itemId}`;
  } else return [];
  const chunks: EvidenceChunk[] = [];
  for (let start = 0; start < text.length; start += 1600) {
    const part = text.slice(start, start + 1600);
    const metadata = {
      recordId: record.id,
      title,
      url,
      provenance,
      observedAt,
    };
    const id =
      "chunk-" +
      createHash("sha256")
        .update(JSON.stringify([table, metadata, start, part]))
        .digest("hex")
        .slice(0, 24);
    chunks.push({ id, ...metadata, text: part });
  }
  return chunks;
}
