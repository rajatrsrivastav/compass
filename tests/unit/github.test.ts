import { it, expect, afterEach, vi } from "vitest";
import { Store } from "../../src/main/database/store";
import { GitHubClient } from "../../src/main/github/client";
import { mapItem, SyncService } from "../../src/main/github/sync";
const stores: Store[] = [];
function setup(fetcher: typeof fetch) {
  const store = new Store(":memory:");
  stores.push(store);
  return { store, client: new GitHubClient(store, () => undefined, fetcher) };
}
afterEach(() => {
  stores.forEach((s) => s.close());
  stores.length = 0;
});
it("follows pagination Link headers and flags truncation", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response("[1,2]", {
        headers: {
          link: '<https://api.github.com/repos/a/b/issues?page=2>; rel="next"',
        },
      }),
    )
    .mockResolvedValueOnce(new Response("[3]"));
  const { client } = setup(fetcher);
  expect(await client.pages("/repos/a/b/issues", 3)).toEqual({
    data: [1, 2, 3],
    partial: false,
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("does not follow pagination to an unapproved origin", async () => {
  const { client } = setup(
    vi.fn().mockResolvedValue(
      new Response("[1]", {
        headers: { link: '<https://evil.com/repos/a/b>; rel="next"' },
      }),
    ),
  );
  await expect(client.pages("/repos/a/b/issues", 10)).rejects.toThrow(
    "Unapproved",
  );
});
it("uses conditional responses without losing cached pagination", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response("[1]", { headers: { etag: '"abc"' } }))
    .mockResolvedValueOnce(new Response(null, { status: 304 }));
  const { client } = setup(fetcher);
  await client.request("/repos/a/b/issues");
  expect((await client.request("/repos/a/b/issues")).data).toEqual([1]);
  expect(fetcher.mock.calls[1][1].headers["If-None-Match"]).toBe('"abc"');
});
it("stops at rate limits without retry storms", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response("", {
      status: 403,
      headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "999" },
    }),
  );
  const { client } = setup(fetcher);
  await expect(client.request("/repos/a/b")).rejects.toMatchObject({
    status: 403,
    reset: "999",
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("retries transient server errors", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response("", { status: 503 }))
    .mockResolvedValueOnce(new Response("{}"));
  const { client } = setup(fetcher);
  await client.request("/repos/a/b");
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("cancellation avoids a network call", async () => {
  const fetcher = vi.fn();
  const { client } = setup(fetcher);
  const ctrl = new AbortController();
  ctrl.abort();
  await expect(client.request("/repos/a/b", ctrl.signal)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it("filters PRs out of issue results and preserves cached data offline", async () => {
  let offline = false;
  const row = {
    number: 1,
    title: "Issue",
    body: "body",
    state: "open",
    html_url: "https://github.com/a/b/issues/1",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  const fetcher = vi.fn(async (input: any) => {
    if (offline) throw new Error("Offline");
    const path = new URL(input).pathname;
    if (path.includes("/contents/")) return new Response("", { status: 404 });
    if (path.endsWith("/comments") || path.endsWith("/reviews"))
      return new Response("[]");
    if (path.endsWith("/issues"))
      return Response.json([row, { ...row, number: 2, pull_request: {} }]);
    if (path.endsWith("/pulls")) return Response.json([{ ...row, number: 2 }]);
    return Response.json({ description: "test", private: false });
  });
  const { store, client } = setup(fetcher);
  store.put("repositories", {
    id: "a/b",
    name: "a/b",
    description: "",
    language: "",
    stars: 0,
    provenance: "github",
    syncedAt: null,
    error: null,
    partial: false,
    guidance: {},
    remaining: null,
  });
  const sync = new SyncService(store, client);
  await sync.sync("a/b");
  expect(store.all("items").map((i) => i.kind)).toEqual(["issue", "pr"]);
  expect(store.all("changes")).toEqual([]);
  offline = true;
  await expect(sync.sync("a/b")).rejects.toThrow("Offline");
  expect(store.all("items")).toHaveLength(2);
  expect(store.get("repositories", "a/b")?.error).toContain("Offline");
});
it("normalizes GitHub data without inventing checks or review states", () => {
  expect(
    mapItem("a/b", { number: 1, title: "t", state: "open" }, "issue"),
  ).toMatchObject({
    kind: "issue",
    checks: "Not fetched",
    reviewState: "Not reviewed",
    provenance: "github",
  });
});
it("follows repository redirects only within the approved GitHub API", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response("", {
        status: 301,
        headers: { location: "https://api.github.com/repositories/123" },
      }),
    )
    .mockResolvedValueOnce(Response.json({ name: "renamed" }));
  const { client } = setup(fetcher);
  expect((await client.request("/repos/a/b")).data).toEqual({
    name: "renamed",
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("does not forward credentials to a redirect outside GitHub", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response("", {
      status: 301,
      headers: { location: "https://example.com/repos/a/b" },
    }),
  );
  const { client } = setup(fetcher);
  await expect(client.request("/repos/a/b")).rejects.toThrow("Unapproved");
  expect(
    fetcher.mock.calls.every(
      (c) => new URL(c[0]).hostname === "api.github.com",
    ),
  ).toBe(true);
});
it("retains core items when enrichment hits the rate limit and does not advance truncated checkpoints", async () => {
  const row = {
    number: 1,
    title: "Issue",
    state: "open",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  const fetcher = vi.fn(async (input: any) => {
    const path = new URL(input).pathname;
    if (path.endsWith("/comments"))
      return new Response("", {
        status: 429,
        headers: { "retry-after": "60" },
      });
    if (path.endsWith("/issues"))
      return Response.json(
        [
          row,
          ...Array.from({ length: 10 }, (_, n) => ({ ...row, number: n + 2 })),
        ],
        {
          headers: {
            link: '<https://api.github.com/repos/a/b/issues?page=2>; rel="next"',
          },
        },
      );
    if (path.endsWith("/pulls")) return Response.json([]);
    return Response.json({ private: false });
  });
  const { store, client } = setup(fetcher);
  store.setProfile({ ...store.profile(), syncLimit: 10 });
  store.put("repositories", {
    id: "a/b",
    name: "a/b",
    description: "",
    language: "",
    stars: 0,
    provenance: "github",
    syncedAt: null,
    error: null,
    partial: false,
    guidance: {},
    remaining: null,
  });
  await new SyncService(store, client).sync("a/b");
  expect(store.all("items")).toHaveLength(10);
  expect(store.get("repositories", "a/b")).toMatchObject({ partial: true });
  expect(store.get("repositories", "a/b")?.error).toContain(
    "enrichment stopped",
  );
  expect(store.db.prepare("SELECT * FROM sync_checkpoints").all()).toEqual([]);
});
it("reserves low API allowance for core repository data", async () => {
  const row = {
    number: 1,
    title: "Issue",
    state: "open",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
  const fetcher = vi.fn(async (input: any) => {
    const path = new URL(input).pathname;
    const body = path.endsWith("/issues")
      ? [row]
      : path.endsWith("/pulls")
        ? []
        : { private: false };
    return Response.json(body, { headers: { "x-ratelimit-remaining": "7" } });
  });
  const { store, client } = setup(fetcher);
  store.put("repositories", {
    id: "a/b",
    name: "a/b",
    description: "",
    language: "",
    stars: 0,
    provenance: "github",
    syncedAt: null,
    error: null,
    partial: false,
    guidance: {},
    remaining: null,
  });
  await new SyncService(store, client).sync("a/b");
  expect(store.all("items")).toHaveLength(1);
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(store.get("repositories", "a/b")?.error).toContain("allowance is low");
  expect(store.get("repositories", "a/b")?.partial).toBe(true);
});
it("does not persist private metadata", async () => {
  const { store, client } = setup(
    vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { private: true, description: "private fixture" },
          { headers: { etag: '"private"' } },
        ),
      ),
  );
  await expect(client.request("/repos/a/b")).rejects.toThrow("public GitHub");
  expect(store.db.prepare("SELECT * FROM http_cache").all()).toEqual([]);
});
it("stops cyclic pagination even for empty pages", async () => {
  const fetcher = vi.fn().mockImplementation(() =>
    Promise.resolve(
      Response.json([], {
        headers: {
          link: '<https://api.github.com/repos/a/b/issues>; rel="next"',
        },
      }),
    ),
  );
  const { client } = setup(fetcher);
  await expect(client.pages("/repos/a/b/issues", 100)).rejects.toThrow(
    "pagination",
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("owns redirected pagination cache by literal repository and deletes only that owner", async () => {
  const fetcher = vi.fn().mockImplementation((input: URL) =>
    Promise.resolve(
      Response.json([1], {
        headers: {
          etag: '"e"',
          ...(input.pathname.includes("/repos/a/a_b")
            ? {
                link: '<https://api.github.com/repositories/123/issues?page=2>; rel="next"',
              }
            : {}),
        },
      }),
    ),
  );
  const { store, client } = setup(fetcher);
  await client.pages("/repos/a/a_b/issues", 10);
  await client.request("/repos/a/axb/issues");
  store.delete("repositories", "a/a_b");
  expect(store.db.prepare("SELECT repo FROM http_cache").all()).toEqual([
    { repo: "a/axb" },
  ]);
});
it("discovers supported guidance locations, records absence and retires removed documents", async () => {
  const { fetchGuidance } = await import("../../src/main/github/guidance");
  let removed = false;
  const fetcher = vi.fn(async (input: any) => {
    const path = new URL(input).pathname;
    if (path.endsWith("/contents"))
      return Response.json([
        { type: "file", name: "README.md" },
        { type: "file", name: "package.json" },
      ]);
    if (path.endsWith("/contents/.github"))
      return Response.json(
        removed
          ? []
          : [
              { type: "file", name: "CONTRIBUTING.md" },
              { type: "file", name: "AI_POLICY.md" },
            ],
      );
    if (path.endsWith("/contents/docs"))
      return new Response("", { status: 404 });
    return Response.json({
      encoding: "base64",
      content: Buffer.from("Read and coordinate").toString("base64"),
      html_url: "https://github.com/a/b/blob/main/CONTRIBUTING.md",
    });
  });
  const { store, client } = setup(fetcher);
  const repo = {
    id: "a/b",
    name: "a/b",
    description: "",
    language: "",
    stars: 0,
    provenance: "github" as const,
    syncedAt: null,
    error: null,
    partial: false,
    guidance: {},
    remaining: null,
  };
  const first = await fetchGuidance(client, repo, new AbortController().signal);
  expect(first.briefing.documents.map((d) => d.path)).toEqual([
    "README.md",
    ".github/AI_POLICY.md",
    ".github/CONTRIBUTING.md",
  ]);
  expect(first.briefing.locations[2].status).toBe("missing");
  removed = true;
  const second = await fetchGuidance(
    client,
    { ...repo, briefing: first.briefing },
    new AbortController().signal,
  );
  expect(second.briefing.documents.map((d) => d.path)).toEqual(["README.md"]);
  client.remaining = 7;
  const deferred = await fetchGuidance(
    client,
    { ...repo, briefing: first.briefing },
    new AbortController().signal,
  );
  expect(deferred.partial).toBe(true);
  expect(deferred.briefing.documents.every((d) => d.stale)).toBe(true);
  expect(store.all("items")).toHaveLength(0);
});
it("keeps old discussion timestamps when a later core sync skips enrichment", async () => {
  let low = false;
  const fetcher = vi.fn(async (input: any) => {
    const path = new URL(input).pathname;
    if (path.includes("/contents")) return new Response("", { status: 404 });
    const body = path.endsWith("/issues")
      ? [{ number: 1, title: "Issue", state: "open" }]
      : path.endsWith("/pulls") || path.endsWith("/comments")
        ? []
        : { private: false };
    return Response.json(body, {
      headers: { "x-ratelimit-remaining": low ? "7" : "100" },
    });
  });
  const { store, client } = setup(fetcher);
  store.put("repositories", {
    id: "a/b",
    name: "a/b",
    description: "",
    language: "",
    stars: 0,
    provenance: "github",
    syncedAt: null,
    error: null,
    partial: false,
    guidance: {},
    remaining: null,
  });
  const sync = new SyncService(store, client);
  await sync.sync("a/b");
  const old = store.get("items", "a/b#1")!;
  expect(old.commentsComplete).toBe(true);
  expect(old.commentsObservedAt).toBeTruthy();
  low = true;
  await sync.sync("a/b");
  expect(store.get("items", "a/b#1")?.commentsObservedAt).toBe(
    old.commentsObservedAt,
  );
  expect(store.get("repositories", "a/b")?.partial).toBe(true);
});
