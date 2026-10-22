import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("journey export, credential deletion, and pending profile edits work", async () => {
  const dir = mkdtempSync(join(tmpdir(), "compass-export-"));
  const app = await electron.launch({
    args: ["."],
    env: { ...process.env, OSS_COMPASS_DATA_DIR: dir },
  });
  try {
    const page = await app.firstWindow();
    await page.getByLabel("GitHub username").fill("export-tester");
    await page.getByRole("button", { name: "Create my workspace" }).click();
    await page.getByRole("button", { name: "My Journey", exact: true }).click();
    await page
      .getByLabel("Objective or achievement")
      .fill("Reproduce one issue");
    await page.getByRole("button", { name: "Add to journey" }).click();
    await expect(page.locator(".task-card")).toContainText(
      "Reproduce one issue",
    );
    const report = join(dir, "report.md");
    await app.evaluate(({ dialog }, path) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path });
    }, report);
    await page.getByRole("button", { name: "Export factual report" }).click();
    await expect(page.getByRole("status")).toContainText("export saved");
    expect(readFileSync(report, "utf8")).toContain("Private preparation");
    expect(readFileSync(report, "utf8")).toContain("Reproduce one issue");
    await page.getByRole("button", { name: "Settings & privacy" }).click();
    await page.getByLabel("Technical skills", { exact: true }).fill("Rust");
    await expect
      .poll(
        async () => {
          await page.waitForTimeout(3500);
          return page
            .getByLabel("Technical skills", { exact: true })
            .inputValue();
        },
        { timeout: 5000 },
      )
      .toBe("Rust");
    await page.getByRole("button", { name: "Save profile" }).click();
    await page
      .getByLabel("GitHub token", { exact: true })
      .fill("synthetic-test-token-not-a-real-credential");
    await page.getByRole("button", { name: "Save token", exact: true }).click();
    await expect(
      page.getByText("Session-only token", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Delete stored credential" })
      .click();
    await expect(
      page.getByText("Unauthenticated public access", { exact: true }),
    ).toBeVisible();
    // A rejected IPC payload must not dispatch arbitrary desktop capabilities.
    const rejected = await page.evaluate(async () => {
      try {
        await window.compass.act({
          type: "shell",
          command: "echo should-not-execute",
        } as any);
        return false;
      } catch {
        return true;
      }
    });
    expect(rejected).toBe(true);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
