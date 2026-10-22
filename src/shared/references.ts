import type { Reference } from "./types";
export function extractReferences(
  text: string,
  context: string,
  tracked: string[],
): Reference[] {
  const out: Reference[] = [];
  tracked = tracked.map((r) => r.toLowerCase());
  context = context.toLowerCase();
  // Code examples are not issue relationships. A URL on another host must
  // never turn its fragment into a contextual issue reference.
  text = text.replace(/```[\s\S]*?```|`[^`\n]*`/g, " ");
  const add = (repo: string, n: string, evidence: string) => {
    repo = repo.toLowerCase();
    if (
      Number.isSafeInteger(Number(n)) &&
      Number(n) > 0 &&
      tracked.includes(repo) &&
      !out.some((r) => r.repo === repo && r.number === Number(n))
    )
      out.push({ repo, number: Number(n), kind: "explicit", evidence });
  };
  const consumed = text
    .replace(
      /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:issues|pull)\/(\d+)\b/gi,
      (m, r, n) => {
        add(r, n, m);
        return " ".repeat(m.length);
      },
    )
    .replace(/\b([\w.-]+\/[\w.-]+)#(\d+)\b/g, (m, r, n) => {
      add(r, n, m);
      return " ".repeat(m.length);
    });
  if (context && tracked.includes(context))
    for (const m of consumed
      .replace(/https?:\/\/[^\s<>]+/g, " ")
      .matchAll(/(?<![\w/])#(\d+)\b/g))
      add(context, m[1], m[0]);
  return out;
}
