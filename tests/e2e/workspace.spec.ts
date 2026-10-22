import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
test("complete offline contribution workflow survives a desktop restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "oss-compass-e2e-"));
  let app = await electron.launch({
    args: ["."],
    env: { ...process.env, OSS_COMPASS_DATA_DIR: dir },
  });
  try {
    let page = await app.firstWindow();
    await expect(page.getByText("Set your direction")).toBeVisible();
    await page.getByLabel("GitHub username").fill("course-contributor");
    await page.getByLabel("Technical skills").fill("React, TypeScript");
    await page.getByRole("button", { name: "Create my workspace" }).click();
    await expect(
      page.getByRole("heading", {
        name: "A little context. A better contribution.",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Explore demo workspace" }).click();
    await expect(page.getByText("DEMO DATA VISIBLE")).toBeVisible();
    await page
      .getByRole("button", { name: "Opportunity Radar", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Reduce canvas redraws during playback",
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Save Reduce canvas redraws during playback",
        exact: true,
      })
      .click();
    await page
      .getByRole("heading", { name: "Reduce canvas redraws during playback" })
      .click();
    const details = page.getByRole("dialog", { name: "Item details" });
    await expect(details).toBeVisible();
    await expect(
      page.getByText("BEFORE YOU START", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close details" }),
    ).toBeFocused();
    for (let tab = 0; tab < 8; tab++) {
      await page.keyboard.press("Tab");
      expect(
        await details.evaluate((el) => el.contains(document.activeElement)),
      ).toBe(true);
    }
    await page
      .getByLabel("Investigation notes")
      .fill("Measure frame times before proposing an optimization.");
    await page.getByRole("button", { name: "Save private note" }).click();
    await page.getByRole("button", { name: "Close details" }).click();
    await page
      .getByRole("button", { name: "PR Review Queue", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "Add regression coverage for keyboard navigation",
      })
      .click();
    await page.getByLabel("My review state").selectOption("Needs follow-up");
    await page
      .getByRole("button", { name: "Record inspection", exact: true })
      .click();
    await expect(
      page.getByText("Inspection history (1)", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close details" }).click();
    await page
      .getByRole("button", { name: "Community Context", exact: true })
      .click();
    await page.getByRole("button", { name: "Capture context" }).click();
    await page.getByLabel("Source title").fill("Imported VTT workshop");
    await page.getByLabel("Capture method").selectOption("vtt");
    await page
      .getByLabel("Source text")
      .fill(readFileSync("tests/fixtures/meeting.vtt", "utf8"));
    await page.getByLabel("I have permission").check();
    await page
      .getByRole("button", { name: "Save source", exact: true })
      .click();
    await page.getByRole("button", { name: /Imported VTT workshop/ }).click();
    await expect(
      page
        .locator(".reference-row b")
        .filter({ hasText: "compass-demo/canvas-lab#42" }),
    ).toBeVisible();
    await page.getByLabel("Selected passage").fill("measure redraw costs");
    await page.getByRole("button", { name: "Add annotation" }).click();
    await expect(page.locator(".annotation")).toContainText(
      "measure redraw costs",
    );
    await page.getByRole("button", { name: "Capture context" }).click();
    await page.getByLabel("Source title").fill("My community note");
    await page.getByLabel("Capture method").selectOption("manual");
    await page
      .getByLabel("Source text")
      .fill(
        "User-entered note: investigate compass-demo/canvas-lab#57 with keyboard navigation.",
      );
    await page
      .getByRole("button", { name: "Save source", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /My community note/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "AI Copilot", exact: true }).click();
    await page
      .getByRole("button", { name: /Finding my first contribution/ })
      .click();
    await expect(
      page.getByText("Synthetic Demo Data · read-only"),
    ).toBeVisible();
    await page
      .getByLabel("Conversation title")
      .fill("My real local conversation");
    await page.getByRole("button", { name: "New conversation" }).click();
    await page.getByRole("button", { name: "Context (0)" }).click();
    await page
      .getByLabel("Reduce canvas redraws during playback", { exact: true })
      .check();
    await page.getByLabel("Chat message").fill("What should I investigate?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByText("Local evidence assistant · deterministic response"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    await expect(
      page
        .getByRole("button", { name: /Reduce canvas redraws during playback/ })
        .last(),
    ).toBeVisible();
    mkdirSync("docs/screenshots", { recursive: true });
    await page.screenshot({
      path: "docs/screenshots/overview-dark.png",
      fullPage: true,
    });
    const security = await app.evaluate(({ BrowserWindow }) =>
      (
        BrowserWindow.getAllWindows()[0].webContents as any
      ).getLastWebPreferences(),
    );
    expect(security.contextIsolation).toBe(true);
    expect(security.sandbox).toBe(true);
    expect(security.nodeIntegration).toBe(false);
    expect(await page.evaluate(() => typeof (window as any).require)).toBe(
      "undefined",
    );
    await app.close();
    app = await electron.launch({
      args: ["."],
      env: { ...process.env, OSS_COMPASS_DATA_DIR: dir },
    });
    page = await app.firstWindow();
    await expect(
      page.getByText("course-contributor", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Opportunity Radar", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Unsave Reduce canvas redraws during playback",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("heading", { name: "Reduce canvas redraws during playback" })
      .click();
    await expect(page.getByLabel("Investigation notes")).toHaveValue(
      "Measure frame times before proposing an optimization.",
    );
    await page.getByRole("button", { name: "Close details" }).click();
    await page
      .getByRole("button", { name: "PR Review Queue", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "Add regression coverage for keyboard navigation",
      })
      .click();
    await expect(page.getByLabel("My review state")).toHaveValue(
      "Needs follow-up",
    );
    await expect(
      page.getByText("Inspection history (1)", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "AI Copilot", exact: true }).click();
    await page
      .getByRole("button", { name: /My real local conversation/ })
      .click();
    await expect(
      page.getByText("What should I investigate?", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: "docs/screenshots/copilot.png",
      fullPage: true,
    });
    // Native file-dialog import uses the same validated pipeline, without a platform connector.
    await app.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [path],
      });
    }, resolve("tests/fixtures/meeting.vtt"));
    await page
      .getByRole("button", { name: "Community Context", exact: true })
      .click();
    await page.getByRole("button", { name: "Capture context" }).click();
    await page.getByLabel("I have permission").check();
    await page.getByRole("button", { name: "Choose file instead" }).click();
    await expect(
      page.getByRole("button", { name: /meeting.vtt/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close editor" }).click();
    await page.getByRole("button", { name: /Imported VTT workshop/ }).click();
    await page.screenshot({
      path: "docs/screenshots/community.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Settings & privacy" }).click();
    await page.getByRole("button", { name: "Light", exact: true }).click();
    await page.getByLabel("Show synthetic demo records").uncheck();
    await page.getByRole("button", { name: "AI Copilot", exact: true }).click();
    await expect(
      page.getByRole("button", { name: /Finding my first contribution/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /My real local conversation/ }),
    ).toBeVisible();
    await page.screenshot({
      path: "docs/screenshots/copilot-light.png",
      fullPage: true,
    });
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
