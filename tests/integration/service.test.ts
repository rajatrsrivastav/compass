import { it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../../src/main/database/store";
import { Service } from "../../src/main/service";
import { SyncService } from "../../src/main/github/sync";
import { GitHubClient } from "../../src/main/github/client";
import { Credentials } from "../../src/main/security/credentials";
const dirs: string[] = [];
const stores: Store[] = [];
const noEncryption = {
  isEncryptionAvailable: () => false,
  encryptString: (s: string) => Buffer.from(s),
  decryptString: (b: Buffer) => b.toString(),
};
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "compass-test-"));
  dirs.push(dir);
  const store = new Store(join(dir, "test.db"));
  stores.push(store);
  const credentials = new Credentials(
    join(dir, "credentials.enc"),
    noEncryption,
  );
  const service = new Service(
    store,
    new SyncService(store, new GitHubClient(store, () => undefined)),
    credentials,
  );
  return { dir, store, credentials, service };
}
afterEach(() => {
  stores.forEach((s) => {
    if (s.db.open) s.close();
  });
  stores.length = 0;
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }));
  dirs.length = 0;
});
it("manual notes and transcript references are persisted and searchable", async () => {
  const { service } = setup();
  await service.act({ type: "demo:seed" });
  await service.act({
    type: "source:add",
    title: "Authorized notes",
    text: "Investigate compass-demo/canvas-lab#42 redraw performance.",
    format: "manual",
    repo: "",
    date: "2026-10-22",
    url: "",
    consent: true,
  });
  const source = service
    .snapshot()
    .sources.find((s) => s.title === "Authorized notes")!;
  expect(source.provenance).toBe("manual");
  expect(source.refs[0].kind).toBe("explicit");
  expect(service.snapshot("redraw").search).toContain(source.id);
  await service.act({
    type: "source:annotate",
    id: source.id,
    passage: "redraw performance",
    kind: "action",
    note: "Measure first",
  });
  expect(
    service.snapshot().sources.find((s) => s.id === source.id)?.annotations,
  ).toHaveLength(1);
  await service.act({ type: "source:delete", id: source.id });
  expect(service.snapshot().changes).toEqual([]);
});
it("separates real chat and demo data and persists messages after reopen", async () => {
  const { service, store, dir } = setup();
  await service.act({ type: "demo:seed" });
  await service.act({ type: "chat:create", title: "Real investigation" });
  const c = service.snapshot().conversations.find((c) => !c.demo)!;
  await service.act({
    type: "chat:send",
    id: c.id,
    text: "What should I investigate?",
    sources: ["compass-demo/canvas-lab#42"],
  });
  expect(
    service.snapshot().conversations.find((x) => x.id === c.id)?.messages[1]
      .origin,
  ).toBe("deterministic");
  await service.act({
    type: "profile",
    value: { ...store.profile(), demo: false },
  });
  expect(service.snapshot().conversations).toHaveLength(1);
  expect(service.snapshot().items).toHaveLength(0);
  store.close();
  const reopened = new Store(join(dir, "test.db"));
  stores.push(reopened);
  expect(reopened.get("conversations", c.id)?.messages).toHaveLength(2);
  expect(reopened.profile().demo).toBe(false);
});
it("does not persist tokens when secure storage is unavailable", () => {
  const { credentials, dir } = setup();
  expect(() => credentials.set("test-secret", true)).toThrow("unavailable");
  credentials.set("test-secret", false);
  expect(credentials.status()).toEqual({ present: true, persistent: false });
  expect(existsSync(join(dir, "credentials.enc"))).toBe(false);
  credentials.clear();
  expect(credentials.get()).toBeUndefined();
});
it("rejects basic_text backend and stores ciphertext only with secure backend", () => {
  const { dir } = setup();
  const path = join(dir, "encrypted");
  const fake = {
    isEncryptionAvailable: () => true,
    encryptString: () => Buffer.from("ciphertext"),
    decryptString: () => "secret",
    getSelectedStorageBackend: () => "basic_text",
  };
  expect(() => new Credentials(path, fake).set("secret", true)).toThrow();
  const secure = { ...fake, getSelectedStorageBackend: () => "keychain" };
  const credentials = new Credentials(path, secure);
  credentials.set("secret", true);
  expect(readFileSync(path, "utf8")).toBe("ciphertext");
  expect(new Credentials(path, secure).get()).toBe("secret");
  credentials.clear();
  expect(existsSync(path)).toBe(false);
});
it("enforces weekly capacity and labels factual exports", async () => {
  const { service } = setup();
  await expect(
    service.act({
      type: "task:save",
      task: {
        id: "x",
        title: "too much",
        hours: 40,
        done: false,
        deadline: "",
        type: "objective",
        url: "",
      },
    }),
  ).rejects.toThrow("capacity");
  expect(service.export("journey")).toContain(
    "Manually entered achievements (unverified)",
  );
});
it("keeps the old credential when replacement encryption fails", () => {
  const { dir } = setup();
  let fail = false;
  const path = join(dir, "atomic.enc");
  const encryption = {
    isEncryptionAvailable: () => true,
    encryptString: (s: string) => {
      if (fail) throw new Error("Keychain locked");
      return Buffer.from(s);
    },
    decryptString: (b: Buffer) => b.toString(),
  };
  const credentials = new Credentials(path, encryption);
  credentials.set("previous-test-token", true);
  fail = true;
  expect(() => credentials.set("replacement-test-token", true)).toThrow(
    "Keychain locked",
  );
  expect(credentials.get()).toBe("previous-test-token");
  expect(readFileSync(path, "utf8")).toBe("previous-test-token");
  expect(credentials.status().persistent).toBe(true);
});
it("keeps session credentials when the persistence destination cannot be written", () => {
  const { dir } = setup();
  const c = new Credentials(join(dir, "missing", "key.enc"), {
    ...noEncryption,
    isEncryptionAvailable: () => true,
  });
  c.set("session-test-token", false);
  expect(() => c.set("new-test-token", true)).toThrow();
  expect(c.get()).toBe("session-test-token");
  expect(c.status().persistent).toBe(false);
});
it("includes related PR evidence in deterministic issue summaries", async () => {
  const { service, store } = setup();
  await service.act({ type: "demo:seed" });
  const issue = store.all("items").find((i) => i.kind === "issue")!;
  const pr = store.all("items").find((i) => i.kind === "pr")!;
  store.put("items", { ...pr, body: `See #${issue.number}`, state: "open" });
  await service.act({ type: "chat:create", title: "Related work" });
  const c = service.snapshot().conversations.find((c) => !c.demo)!;
  await service.act({
    type: "chat:send",
    id: c.id,
    text: "Existing work?",
    sources: [issue.id],
  });
  const answer = store.get("conversations", c.id)!.messages[1];
  expect(answer.text).toContain("Related PR already open");
  expect(answer.sources).toContain(pr.id);
});
it("persists inspection history, observes head/feedback changes and preserves private notes across sync", async () => {
  const { reviewDelta } = await import("../../src/shared/review");
  const { service, store, dir } = setup();
  await service.act({ type: "demo:seed" });
  const pr = store.all("items").find((i) => i.kind === "pr")!;
  store.put("items", {
    ...pr,
    headSha: "head-a",
    commentsObservedAt: "2026-01-01",
    reviewsObservedAt: "2026-01-01",
    commentsComplete: true,
    reviewsComplete: true,
  });
  await service.act({
    type: "item:update",
    id: pr.id,
    note: "Check the old implementation",
    reviewState: "Needs follow-up",
  });
  await service.act({ type: "item:inspect", id: pr.id });
  const inspected = store.get("items", pr.id)!;
  expect(inspected.inspections?.[0].headSha).toBe("head-a");
  expect(inspected.inspections?.[0].reviews[0].state).toBe("CHANGES_REQUESTED");
  expect(reviewDelta(inspected).headChanged).toBe(false);
  expect(reviewDelta(inspected).feedbackComplete).toBe(false);
  const feedback = {
    author: "reviewer",
    at: "2030-01-01",
    body: "Please recheck",
    state: "COMMENTED",
    url: "https://github.com/a/b/pull/1#review-2",
  };
  store.saveItem(
    {
      ...pr,
      headSha: "head-b",
      reviews: [...pr.reviews, feedback],
      commentsObservedAt: "2030-01-01",
      reviewsObservedAt: "2030-01-01",
      commentsComplete: true,
      reviewsComplete: true,
    },
    false,
  );
  const changed = store.get("items", pr.id)!;
  expect(changed.note).toBe("Check the old implementation");
  expect(changed.reviewState).toBe("Needs follow-up");
  expect(reviewDelta(changed)).toMatchObject({
    headChanged: true,
    notesStale: true,
    feedbackComplete: true,
    newFeedback: [feedback],
  });
  expect(reviewDelta({ ...changed, headSha: undefined }).headKnown).toBe(false);
  await service.act({ type: "item:inspect", id: pr.id });
  expect(reviewDelta(store.get("items", pr.id)!).notesStale).toBe(true);
  await service.act({
    type: "item:update",
    id: pr.id,
    note: "Rechecked against head-b",
  });
  expect(reviewDelta(store.get("items", pr.id)!).notesStale).toBe(false);
  store.close();
  const reopened = new Store(join(dir, "test.db"));
  stores.push(reopened);
  expect(reopened.get("items", pr.id)?.inspections).toHaveLength(2);
  expect(reopened.get("items", pr.id)?.inspections?.[0].note).toBe(
    "Check the old implementation",
  );
});
it("upgrades a v2 cache without losing domain data", async () => {
  const { store, dir, service } = setup();
  await service.act({ type: "demo:seed" });
  const first = store.all("items")[0];
  await service.act({
    type: "item:update",
    id: first.id,
    note: "Keep across migration",
  });
  store.db.exec(
    "DROP INDEX http_cache_repo; ALTER TABLE http_cache DROP COLUMN repo; DELETE FROM migrations WHERE version=3;",
  );
  store.db
    .prepare("INSERT INTO http_cache VALUES(?,?,?,?)")
    .run("https://api.github.com/repos/a/b", '"old"', "{}", "");
  store.close();
  const reopened = new Store(join(dir, "test.db"));
  stores.push(reopened);
  expect(reopened.get("items", first.id)?.note).toBe("Keep across migration");
  expect(reopened.all("sources")).toHaveLength(1);
  expect(reopened.db.prepare("SELECT * FROM http_cache").all()).toHaveLength(0);
  expect(
    reopened.db
      .prepare("SELECT version FROM migrations ORDER BY version")
      .all(),
  ).toEqual([{ version: 1 }, { version: 2 }, { version: 3 }]);
  reopened.migrate();
});
