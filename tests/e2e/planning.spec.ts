import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("bundled GitHub planning works without synchronization and preserves private stages", async () => {
  const dir = mkdtempSync(join(tmpdir(), "compass-planning-"));
  const launch = () =>
    electron.launch({
      args: ["."],
      env: { ...process.env, OSS_COMPASS_DATA_DIR: dir },
    });
  let app = await launch();
  try {
    let page = await app.firstWindow();
    await page.context().setOffline(true);
    await page.getByLabel("GitHub username").fill("planning-test");
    await page.getByRole("button", { name: "Create my workspace" }).click();
    await page
      .getByRole("button", { name: "Repositories", exact: true })
      .click();
    const file = page.getByLabel("Repository file", { exact: true });
    await expect(file).toHaveValue("README.md");
    await page
      .getByRole("button", { name: "Add repository", exact: true })
      .click();
    await expect(page.getByLabel("Repository URL")).toBeFocused();
    await page.getByRole("button", { name: "Close form" }).click();
    await expect(
      page.getByRole("heading", { name: "MCP Gateway", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/screenshots/repository-readme.png",
    });
    await page
      .getByRole("navigation", { name: "File contents" })
      .getByRole("button", { name: "Configuration", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Configuration", exact: true }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Source", exact: true }).click();
    await expect(page.getByLabel("README.md contents")).toContainText(
      "# MCP Gateway",
    );
    await file.selectOption("LICENSE");
    await expect(page.getByLabel("LICENSE contents")).toContainText(
      "Apache License",
    );
    await page
      .getByRole("button", { name: "Opportunity Radar", exact: true })
      .click();
    await page.getByLabel("Search items").fill("1685");
    await page.getByRole("heading", { name: /Dual-version upstreams/ }).click();
    await page.getByRole("button", { name: /Discussion/ }).click();
    const comment = page.locator(".thread-entry").first();
    await expect(comment.locator(".reader-prose")).toBeVisible();
    await comment.getByRole("button", { name: "View source" }).click();
    await expect(comment.locator(".plain-file")).toBeVisible();
    await comment.getByRole("button", { name: "Show preview" }).click();
    await expect(comment.locator(".reader-prose")).toBeVisible();
    await page.getByRole("button", { name: "Close details" }).click();
    await page.getByLabel("Search items").fill("1467");
    await expect(
      page.getByText("BUNDLED GITHUB SNAPSHOT", { exact: false }).first(),
    ).toBeVisible();
    await page
      .getByRole("heading", { name: /consolidate JSON-RPC error response/ })
      .click();
    const details = page.getByRole("dialog", { name: "Item details" });
    await expect(details).toContainText("snapshot captured");
    await expect(details).not.toContainText(
      "Insufficient synchronized information",
    );
    await page.getByRole("button", { name: "Close details" }).click();

    await page.getByRole("button", { name: "Milestones", exact: true }).click();
    await page.getByRole("button", { name: /v1\.2/ }).click();
    await expect(
      page.getByRole("progressbar", { name: "v1.2 completion" }),
    ).toHaveAttribute("value", "2");
    await expect(
      page.getByText("18 cached issues", { exact: false }),
    ).toBeVisible();
    await page.screenshot({ path: "test-results/screenshots/milestones.png" });
    await page.getByRole("button", { name: "View on issue board" }).click();
    await expect(page.getByLabel("Board milestone")).toHaveValue("11");
    await page.screenshot({ path: "test-results/screenshots/issue-board.png" });
    await page.getByLabel("Search board issues").fill("#1467");
    await page
      .getByLabel("Local stage for #1467")
      .selectOption("Investigating");
    await expect(
      page.getByRole("region", { name: "Investigating" }),
    ).toContainText("#1467");

    await app.close();
    app = await launch();
    page = await app.firstWindow();
    await page
      .getByRole("button", { name: "Issue Board", exact: true })
      .click();
    await page.getByLabel("Search board issues").fill("#1467");
    await expect(
      page.getByRole("region", { name: "Investigating" }),
    ).toContainText("#1467");
    await expect(page.getByLabel("Local stage for #1467")).toHaveValue(
      "Investigating",
    );
    await page.getByLabel("Board issue state").selectOption("open");
    const card = page.locator(".board-issue").filter({ hasText: "#1467" });
    const blocked = page.getByRole("region", { name: "Blocked" });
    await card.dragTo(blocked.getByRole("heading"));
    await expect(blocked).toContainText("#1467");
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
