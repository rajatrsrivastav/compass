import type { Store } from "../database/store";
export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public reset: string | null = null,
  ) {
    super(message);
  }
}
export class GitHubClient {
  private tail: Promise<unknown> = Promise.resolve();
  remaining: number | null = null;
  constructor(
    private store: Store,
    private token: () => string | undefined,
    private fetcher: typeof fetch = fetch,
  ) {}
  private approved(url: URL) {
    return (
      url.origin === "https://api.github.com" &&
      !url.username &&
      !url.password &&
      (url.pathname.startsWith("/repos/") ||
        /^\/repositories\/\d+(\/|$)/.test(url.pathname))
    );
  }
  private async fetchApproved(url: URL, init: RequestInit) {
    let destination = url;
    for (let redirects = 0; redirects <= 3; redirects++) {
      if (!this.approved(destination))
        throw new Error("Unapproved GitHub API destination");
      const response = await this.fetcher(destination, {
        ...init,
        redirect: "manual",
      });
      if (![301, 302, 307, 308].includes(response.status)) return response;
      const location = response.headers.get("location");
      if (!location) throw new Error("GitHub redirect had no destination");
      destination = new URL(location, destination);
    }
    throw new Error("Too many GitHub redirects");
  }
  request<T>(
    path: string,
    signal?: AbortSignal,
    owner?: string,
  ): Promise<{ data: T; link: string }> {
    const run = () => this.execute<T>(path, signal, owner);
    const next = this.tail.then(run, run);
    this.tail = next.catch(() => {});
    return next;
  }
  private async execute<T>(
    path: string,
    signal?: AbortSignal,
    owner?: string,
  ): Promise<{ data: T; link: string }> {
    const url = new URL(path, "https://api.github.com");
    if (!this.approved(url))
      throw new Error("Unapproved GitHub API destination");
    const cached = this.store.db
      .prepare("SELECT * FROM http_cache WHERE url=?")
      .get(url.href) as
      { etag: string; body: string; link: string } | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      signal?.throwIfAborted();
      const token = this.token();
      let response: Response;
      try {
        response = await this.fetchApproved(url, {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "OSS-Compass",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(cached ? { "If-None-Match": cached.etag } : {}),
          },
          signal: AbortSignal.any([
            AbortSignal.timeout(20000),
            ...(signal ? [signal] : []),
          ]),
        });
      } catch (error) {
        if (signal?.aborted || attempt === 2) throw error;
        await this.delay(250 * 2 ** attempt, signal);
        continue;
      }
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (remaining !== null) this.remaining = Number(remaining);
      if (response.status === 304 && cached)
        return { data: JSON.parse(cached.body), link: cached.link };
      if (
        response.status === 429 ||
        (response.status === 403 &&
          (remaining === "0" || response.headers.has("retry-after")))
      )
        throw new GitHubError(
          "GitHub rate limit reached. Cached data remains available; retry after the reset time.",
          response.status,
          response.headers.get("x-ratelimit-reset") ||
            response.headers.get("retry-after"),
        );
      if (response.status >= 500 && attempt < 2) {
        await this.delay(250 * 2 ** attempt, signal);
        continue;
      }
      if (!response.ok)
        throw new GitHubError(
          `GitHub returned ${response.status}. ${response.status === 401 ? "Check or remove your token." : response.status === 404 ? "Repository or resource was not found." : "Retry later; cached records are retained."}`,
          response.status,
        );
      const data = (await response.json()) as T,
        etag = response.headers.get("etag"),
        link = response.headers.get("link") ?? "";
      const repo =
        owner ??
        url.pathname.match(/^\/repos\/([^/]+\/[^/]+)/)?.[1]?.toLowerCase() ??
        "";
      if (
        data &&
        typeof data === "object" &&
        "private" in data &&
        data.private === true
      ) {
        this.store.db.prepare("DELETE FROM http_cache WHERE repo=?").run(repo);
        throw new Error(
          "This workspace only stores public GitHub repositories.",
        );
      }
      if (etag && repo)
        this.store.db
          .prepare(
            "INSERT INTO http_cache(url,etag,body,link,repo) VALUES(?,?,?,?,?) ON CONFLICT(url) DO UPDATE SET etag=excluded.etag,body=excluded.body,link=excluded.link,repo=excluded.repo",
          )
          .run(url.href, etag, JSON.stringify(data), link, repo);
      return { data, link };
    }
    throw new Error("GitHub request failed");
  }
  private delay(ms: number, signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new Error("Sync cancelled"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", abort);
        resolve();
      }, ms);
      signal?.addEventListener("abort", abort, { once: true });
    });
  }
  async pages<T>(path: string, limit: number, signal?: AbortSignal) {
    let next = path;
    const owner = new URL(path, "https://api.github.com").pathname
      .match(/^\/repos\/([^/]+\/[^/]+)/)?.[1]
      ?.toLowerCase();
    const visited = new Set<string>();
    const data: T[] = [];
    let partial = false;
    while (next) {
      const key = new URL(next, "https://api.github.com").href;
      if (visited.has(key) || visited.size >= 100)
        throw new Error(
          "GitHub pagination repeated or exceeded the page budget.",
        );
      visited.add(key);
      const result = await this.request<T[]>(next, signal, owner);
      if (!Array.isArray(result.data))
        throw new Error("Unexpected GitHub list response");
      const remaining = limit - data.length;
      data.push(...result.data.slice(0, remaining));
      const link = result.link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? "";
      if (data.length >= limit) {
        partial = !!link || result.data.length > remaining;
        break;
      }
      next = link;
    }
    return { data, partial };
  }
}
