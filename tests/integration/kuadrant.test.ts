import { expect, it } from "vitest";
import { Store } from "../../src/main/database/store";
import { kuadrantId, seedKuadrant } from "../../src/main/data/kuadrant";
import { mapItem } from "../../src/main/github/sync";

it("fills an existing Kuadrant cache without overwriting private state and respects removal", () => {
  const store = new Store(":memory:");
  try {
    const id = `${kuadrantId}#1467`;
    store.put("repositories", {
      id: kuadrantId,
      name: kuadrantId,
      description: "",
      language: "",
      stars: 0,
      provenance: "github",
      syncedAt: null,
      error: "Rate limited",
      partial: true,
      remaining: 0,
      guidance: {},
    });
    store.put("items", {
      ...mapItem(kuadrantId, { number: 1467, title: "Old title" }, "issue"),
      observedAt: "2026-01-01",
      saved: true,
      boardStage: "Blocked",
      note: "My investigation",
    });

    seedKuadrant(store);
    const item = store.get("items", id)!;
    expect(item).toMatchObject({
      boardStage: "Blocked",
      saved: true,
      note: "My investigation",
      milestone: 11,
      commentsComplete: true,
    });
    expect(store.all("items").filter((i) => i.kind === "issue")).toHaveLength(
      609,
    );
    expect(store.get("repositories", kuadrantId)?.milestones).toHaveLength(10);
    expect(store.all("changes")).toEqual([]);

    store.saveItem(
      { ...item, boardStage: undefined, title: "Updated by sync" },
      false,
    );
    seedKuadrant(store);
    expect(store.get("items", id)).toMatchObject({
      title: "Updated by sync",
      boardStage: "Blocked",
    });
    const repo = store.get("repositories", kuadrantId)!;
    store.put("repositories", { ...repo, guidance: {}, briefing: undefined });
    store.db
      .prepare("UPDATE settings SET value=? WHERE key=?")
      .run(repo.bundledAt, "bundled:kuadrant-mcp-gateway");
    seedKuadrant(store);
    expect(
      store.get("repositories", kuadrantId)?.guidance["README.md"],
    ).toContain("# MCP Gateway");
    expect(store.get("items", id)?.note).toBe("My investigation");
    store.delete("repositories", kuadrantId);
    seedKuadrant(store);
    expect(store.get("repositories", kuadrantId)).toBeUndefined();
  } finally {
    store.close();
  }
});
