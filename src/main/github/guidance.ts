import type {
  Briefing,
  Repository,
  GuidanceDocument,
} from "../../shared/types";
import { GitHubClient, GitHubError } from "./client";
const supported =
  /^(README|CONTRIBUTING|CODE_OF_CONDUCT|CODEOWNERS|MAINTAINERS|GOVERNANCE|SECURITY|AI(?:[-_]?(?:POLICY|USAGE))?|CONTRIBUTION[-_]POLICY)(?:\.(md|txt|rst))?$/i;
export async function fetchGuidance(
  client: GitHubClient,
  repo: Repository,
  signal: AbortSignal,
): Promise<{ briefing: Briefing; partial: boolean }> {
  const observedAt = new Date().toISOString();
  const locations: Briefing["locations"] = [];
  const documents: GuidanceDocument[] = [];
  let budget = 12,
    partial = false;
  for (const directory of ["", ".github", "docs"]) {
    const path = directory || "/";
    const prior = (repo.briefing?.documents ?? []).filter(
      (d) => d.path.split("/").slice(0, -1).join("/") === directory,
    );
    const deferred =
      budget <= 0 || (client.remaining !== null && client.remaining <= 8);
    if (deferred) {
      locations.push({ path, checkedAt: observedAt, status: "deferred" });
      documents.push(...prior.map((d) => ({ ...d, stale: true })));
      partial = true;
      continue;
    }
    try {
      const listing = await client.request<any>(
        `/repos/${repo.id}/contents${directory ? `/${directory}` : ""}`,
        signal,
      );
      if (!Array.isArray(listing.data))
        throw new Error("Unexpected directory response");
      locations.push({ path, checkedAt: observedAt, status: "checked" });
      const files = listing.data
        .filter(
          (f) =>
            f.type === "file" &&
            typeof f.name === "string" &&
            supported.test(f.name),
        )
        .sort((a, b) => a.name.localeCompare(b.name));
      // Contents API directory lists are bounded by GitHub, too.
      if (listing.data.length >= 1000) partial = true;
      for (const file of files) {
        const filePath = directory ? `${directory}/${file.name}` : file.name;
        const previous = prior.find((d) => d.path === filePath);
        if (
          budget <= 0 ||
          (client.remaining !== null && client.remaining <= 8)
        ) {
          partial = true;
          if (previous) documents.push({ ...previous, stale: true });
          continue;
        }
        budget--;
        try {
          const response = await client.request<any>(
            `/repos/${repo.id}/contents/${filePath.split("/").map(encodeURIComponent).join("/")}`,
            signal,
          );
          if (
            response.data.encoding !== "base64" ||
            typeof response.data.content !== "string"
          )
            throw new Error("Unsupported guidance content");
          const text = Buffer.from(response.data.content, "base64").toString(
            "utf8",
          );
          documents.push({
            path: filePath,
            url:
              typeof response.data.html_url === "string"
                ? response.data.html_url
                : `https://github.com/${repo.id}`,
            text: text.slice(0, 100000),
            observedAt,
            truncated: text.length > 100000,
            stale: false,
          });
          partial ||= text.length > 100000;
        } catch (error) {
          if (signal.aborted) throw error;
          partial = true;
          if (previous) documents.push({ ...previous, stale: true });
        }
      }
    } catch (error) {
      if (signal.aborted) throw error;
      const missing = error instanceof GitHubError && error.status === 404;
      locations.push({
        path,
        checkedAt: observedAt,
        status: missing ? "missing" : "unavailable",
      });
      if (!missing) {
        partial = true;
        documents.push(...prior.map((d) => ({ ...d, stale: true })));
      }
    }
  }
  return { briefing: { documents, locations, observedAt }, partial };
}
