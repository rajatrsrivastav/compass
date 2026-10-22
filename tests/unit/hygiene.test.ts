import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
it("ignores local secrets and runtime artifacts", () => {
  for (const path of [
    ".env.local",
    "test.db",
    "credentials.enc",
    "node_modules/x",
    "release/app.exe",
  ])
    expect(
      execFileSync("git", ["check-ignore", path], { encoding: "utf8" }).trim(),
    ).toBe(path);
});
it("keeps renderer isolated and preload narrow", () => {
  const main = readFileSync("src/main/index.ts", "utf8").replace(/\s/g, "");
  expect(main).toContain("contextIsolation:true");
  expect(main).toContain("nodeIntegration:false");
  expect(main).toContain("sandbox:true");
  expect(main).toContain("senderFrame!==window.webContents.mainFrame");
  const preload = readFileSync("src/preload/index.ts", "utf8");
  expect(preload).not.toContain("sendSync");
  expect(preload).not.toContain("...ipcRenderer");
});

it("does not ignore the credential storage implementation", () => {
  expect(
    spawnSync("git", ["check-ignore", "src/main/security/credentials.ts"])
      .status,
  ).toBe(1);
});
