import { it, expect } from "vitest";
import { Store } from "../../src/main/database/store";
import { GitHubClient } from "../../src/main/github/client";
import { SyncService } from "../../src/main/github/sync";
it.skipIf(!process.env.OSS_COMPASS_LIVE_TEST)(
  "synchronizes two real public repositories without credentials",
  async () => {
    const store = new Store(":memory:");
    try {
      const client = new GitHubClient(store, () => undefined),
        sync = new SyncService(store, client);
      store.setProfile({ ...store.profile(), syncLimit: 10 });
      for (const id of [
        "electron/electron-quick-start",
        "octocat/Hello-World",
      ]) {
        store.put("repositories", {
          id,
          name: id,
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
        await sync.sync(id);
        const repo = store.get("repositories", id)!;
        expect(repo.syncedAt).toBeTruthy();
        expect(
          store.all("items").filter((i) => i.repo === id).length,
        ).toBeGreaterThan(0);
        expect(repo.provenance).toBe("github");
        console.log(
          JSON.stringify({
            repository: id,
            items: store.all("items").filter((i) => i.repo === id).length,
            partial: repo.partial,
            remaining: repo.remaining,
            syncedAt: repo.syncedAt,
          }),
        );
      }
    } finally {
      store.close();
    }
  },
  120000,
);
