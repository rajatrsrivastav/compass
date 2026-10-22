import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("cloud preview requires consent, shows exact passages and preserves local fallback", async () => {
  const dir = mkdtempSync(join(tmpdir(), "compass-consent-"));
  const app = await electron.launch({
    args: ["."],
    env: { ...process.env, OSS_COMPASS_DATA_DIR: dir },
  });
  try {
    const page = await app.firstWindow();
    await page.getByLabel("GitHub username").fill("privacy-tester");
    await page.getByRole("button", { name: "Create my workspace" }).click();
    await page.getByRole("button", { name: "Explore demo workspace" }).click();
    await page.getByRole("button", { name: "Settings & privacy" }).click();
    await page
      .getByLabel("OpenAI API key", { exact: true })
      .fill("test-only-key-never-sent");
    await page
      .getByRole("button", { name: "Save OpenAI key", exact: true })
      .click();
    await expect(
      page.getByText("Session-only key", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Daily request limit (UTC)").fill("1");
    await page.getByRole("button", { name: "Save AI limits" }).click();
    await page.getByRole("button", { name: "AI Copilot", exact: true }).click();
    await page
      .getByLabel("Conversation title", { exact: true })
      .fill("Consent test");
    await page.getByRole("button", { name: "New conversation" }).click();
    await page.getByRole("button", { name: "Context (0)" }).click();
    await page
      .getByLabel("Reduce canvas redraws during playback", { exact: true })
      .check();
    await page.getByLabel("Chat message").fill("Summarize canvas redraws");
    await page.getByRole("button", { name: "Preview OpenAI evidence" }).click();
    await expect(
      page.getByText("Review what will leave this device", { exact: true }),
    ).toBeVisible();
    const send = page.getByRole("button", {
      name: "Send approved evidence to OpenAI",
    });
    await expect(send).toBeDisabled();
    await page
      .getByText("Reduce canvas redraws during playback · demo", {
        exact: true,
      })
      .click();
    await expect(page.locator(".evidence-preview")).toContainText("canvas");
    await page.screenshot({
      path: "docs/screenshots/cloud-consent.png",
      fullPage: true,
    });
    await page.getByLabel("I authorize sending this question").check();
    await expect(send).toBeEnabled();
    // No provider request is made in this desktop test.
    await page.getByLabel("Chat message").fill("Summarize locally instead");
    await expect(send).toHaveCount(0);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByText("Local evidence assistant · deterministic response"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Settings & privacy" }).click();
    await expect(page.getByLabel("Daily request limit (UTC)")).toHaveValue("1");
    await page.getByRole("button", { name: "Delete OpenAI key" }).click();
    await expect(
      page.getByText("Local mode available", { exact: true }),
    ).toBeVisible();
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
