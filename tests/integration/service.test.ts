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
