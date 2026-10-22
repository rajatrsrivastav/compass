import type { Store } from "../database/store";
import { GitHubClient, GitHubError } from "./client";
import type { Item, Comment, Repository } from "../../shared/types";
const comments = (rows: any[]): Comment[] =>
  rows.map((c) => ({
    author: c.user?.login ?? "unknown",
    body: c.body ?? "",
    url: c.html_url ?? "",
    at: c.submitted_at ?? c.created_at ?? "",
    state: c.state,
  }));
export function mapItem(repo: string, row: any, kind: "issue" | "pr"): Item {
  return {
    id: `${repo}#${row.number}`,
    repo,
    number: row.number,
    kind,
    title: row.title,
    body: row.body ?? "",
    url: row.html_url,
    state: row.state,
    author: row.user?.login ?? "unknown",
    labels: (row.labels ?? []).map((l: any) =>
      typeof l === "string" ? l : l.name,
    ),
    assignees: (row.assignees ?? []).map((u: any) => u.login),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    observedAt: new Date().toISOString(),
    comments: [],
    reviews: [],
    checks: "Not fetched",
    provenance: "github",
    saved: false,
    reviewState: "Not reviewed",
    note: "",
  };
}
export class SyncService {
  active = new Map<string, AbortController>();
  constructor(
    private store: Store,
    private client: GitHubClient,
  ) {}
  cancel(id: string) {
    this.active.get(id)?.abort();
  }
  async sync(id: string) {
    if (this.active.has(id))
      throw new Error("This repository is already synchronizing");
    const repo = this.store.get("repositories", id);
    if (!repo || repo.provenance === "demo")
      throw new Error("Select a connected GitHub repository");
    const ctrl = new AbortController();
    this.active.set(id, ctrl);
    const signal = ctrl.signal;
    try {
      const metadata = (await this.client.request<any>(`/repos/${id}`, signal))
        .data;
      if (metadata.private)
        throw new Error("This MVP only stores public GitHub repositories.");
      const startedAt = new Date().toISOString();
      const checkpoint = this.store.db
        .prepare("SELECT issues_since FROM sync_checkpoints WHERE repo=?")
        .get(id) as { issues_since: string } | undefined;
      const limit = this.store.profile().syncLimit;
      const since = checkpoint
        ? `&since=${encodeURIComponent(new Date(Date.parse(checkpoint.issues_since) - 60000).toISOString())}`
        : "";
      const issues = await this.client.pages<any>(
        `/repos/${id}/issues?state=all&sort=updated&direction=desc&per_page=100${since}`,
        limit,
        signal,
      );
      const prs = await this.client.pages<any>(
        `/repos/${id}/pulls?state=all&sort=updated&direction=desc&per_page=100`,
        limit,
        signal,
      );
      const items = [
        ...issues.data
          .filter((i) => !i.pull_request)
          .map((i) => mapItem(id, i, "issue")),
        ...prs.data.map((i) => mapItem(id, i, "pr")),
      ];
      let partial = issues.partial || prs.partial;
      let enrichmentStopped = false;
      const warnings: string[] = [];
      // Enrich a bounded set. Preserve older details for records outside this budget.
      for (const item of items) {
        const old = this.store.get("items", item.id);
        if (old) {
          item.comments = old.comments;
          item.reviews = old.reviews;
          item.checks = old.checks;
        }
      }
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Reserve the last requests for core metadata on other tracked repositories.
        if (this.client.remaining !== null && this.client.remaining <= 8) {
          partial = true;
          enrichmentStopped = true;
          warnings.push(
            "Core items synchronized. Discussion enrichment deferred because the GitHub API allowance is low.",
          );
          break;
        }
        if (i >= 12) {
          partial = true;
          continue;
        }
        try {
          const cs = await this.client.pages<any>(
            `/repos/${id}/issues/${item.number}/comments?per_page=100`,
            100,
            signal,
          );
          item.comments = comments(cs.data);
          partial ||= cs.partial;
          if (item.kind === "pr") {
            const rs = await this.client.pages<any>(
              `/repos/${id}/pulls/${item.number}/reviews?per_page=100`,
              100,
              signal,
            );
            const rc = await this.client.pages<any>(
              `/repos/${id}/pulls/${item.number}/comments?per_page=100`,
              100,
              signal,
            );
            item.reviews = [...comments(rs.data), ...comments(rc.data)];
            partial ||= rs.partial || rc.partial;
            const raw = prs.data.find((p) => p.number === item.number);
            if (raw?.head?.sha) {
              try {
                const checks = await this.client.request<any>(
                  `/repos/${id}/commits/${raw.head.sha}/check-runs?per_page=100`,
                  signal,
                );
                item.checks =
                  checks.data.check_runs
                    ?.map((c: any) => `${c.name}: ${c.conclusion ?? c.status}`)
                    .join("; ") || "No check runs available";
                if (checks.data.total_count > 100) {
                  partial = true;
                  item.checks += " (truncated)";
                }
              } catch (e) {
                if (
                  signal.aborted ||
                  (e instanceof GitHubError && [403, 429].includes(e.status))
                )
                  throw e;
                item.checks = "Unavailable with current permissions";
              }
            }
          }
        } catch (e) {
          if (signal.aborted) throw e;
          partial = true;
          if (e instanceof GitHubError && [403, 429].includes(e.status)) {
            warnings.push(
              `Core items synchronized; discussion enrichment stopped: ${e.message}${e.reset ? ` Reset/retry: ${e.reset}.` : ""}`,
            );
            enrichmentStopped = true;
            break;
          }
          warnings.push(`Discussion details for #${item.number} unavailable`);
        }
      }
      const guidance = { ...repo.guidance };
      for (const file of [
        "README.md",
        "CONTRIBUTING.md",
        "CODE_OF_CONDUCT.md",
      ]) {
        if (enrichmentStopped) break;
        if (this.client.remaining !== null && this.client.remaining <= 8) {
          partial = true;
          warnings.push(
            "Contributor guidance deferred because the GitHub API allowance is low.",
          );
          break;
        }
        try {
          const r = await this.client.request<any>(
            `/repos/${id}/contents/${file}`,
            signal,
          );
          if (r.data.encoding === "base64")
            guidance[file] = Buffer.from(r.data.content, "base64")
              .toString("utf8")
              .slice(0, 100000);
        } catch (e) {
          if (signal.aborted) throw e;
          if (e instanceof GitHubError && [403, 429].includes(e.status)) {
            partial = true;
            warnings.push(
              `Core items synchronized; guidance fetch stopped: ${e.message}`,
            );
            break;
          }
          if (!(e instanceof GitHubError && e.status === 404)) {
            partial = true;
            warnings.push(`${file} unavailable`);
          }
        }
      }
      signal.throwIfAborted();
      this.store.db.transaction(() => {
        for (const item of items) this.store.saveItem(item, !repo.syncedAt);
        if (!issues.partial)
          this.store.db
            .prepare(
              "INSERT INTO sync_checkpoints VALUES(?,?) ON CONFLICT(repo) DO UPDATE SET issues_since=excluded.issues_since",
            )
            .run(id, startedAt);
        const updated: Repository = {
          ...repo,
          description: metadata.description ?? "",
          language: metadata.language ?? "Mixed",
          stars: metadata.stargazers_count ?? 0,
          syncedAt: new Date().toISOString(),
          error: warnings.length ? warnings.join("; ") : null,
          partial,
          guidance,
          remaining: this.client.remaining,
        };
        this.store.put("repositories", updated);
      })();
    } catch (e) {
      this.store.put("repositories", {
        ...repo,
        error: signal.aborted
          ? "Sync cancelled. Cached data retained."
          : (e instanceof Error ? e.message : "Synchronization failed") +
            (e instanceof GitHubError && e.reset
              ? ` Reset/retry value: ${e.reset}`
              : ""),
        remaining: this.client.remaining,
      });
      throw e;
    } finally {
      this.active.delete(id);
    }
  }
}
