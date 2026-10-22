import { it, expect, afterEach } from "vitest";
import { Store } from "../../src/main/database/store";
import { seedDemo } from "../../src/main/demo";
import { rank } from "../../src/shared/ranking";
const stores: Store[] = [];
function db() {
  const s = new Store(":memory:");
  stores.push(s);
  return s;
}
afterEach(() => stores.forEach((s) => s.close()));
it("migrates idempotently and indexes data", () => {
  const s = db();
  s.migrate();
  seedDemo(s);
  expect(s.all("items")).toHaveLength(5);
  expect(s.search("canvas").length).toBeGreaterThan(0);
  expect(() => s.search('" OR *')).not.toThrow();
});
it("upserts preserve private notes and baseline emits no changes", () => {
  const s = db();
  seedDemo(s);
  const i = s.all("items")[0];
  s.put("items", { ...i, saved: true, note: "private" });
  s.saveItem({ ...i, updatedAt: "2030-01-01" }, true);
  expect(s.get("items", i.id)?.note).toBe("private");
  expect(s.all("changes")).toHaveLength(0);
  s.saveItem({ ...i, state: "closed" }, false);
  expect(s.all("changes")).toHaveLength(1);
});
it("repository deletion removes cached items and search entries", () => {
  const s = db();
  seedDemo(s);
  s.delete("repositories", "compass-demo/canvas-lab");
  expect(s.all("items")).toHaveLength(0);
  expect(s.search("redraws")).toEqual([]);
});
it("ranks evidence with source IDs and respects related PRs", () => {
  const s = db();
  seedDemo(s);
  const ranked = rank(s.all("items"), s.all("sources"), {
    ...s.profile(),
    skills: "React, TypeScript",
  });
  expect(ranked.find((r) => r.item.number === 57)?.category).toBe(
    "Possibly blocked or already being addressed",
  );
  expect(ranked.find((r) => r.item.number === 42)?.sourceIds).toContain(
    "demo-meeting",
  );
  expect(
    rank(
      s.all("items").map((i) => ({ ...i, state: "closed" })),
      [],
      s.profile(),
    ),
  ).toEqual([]);
});
