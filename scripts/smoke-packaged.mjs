import { _electron as electron } from "@playwright/test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
const executable = process.argv[2];
if (!executable)
  throw new Error("Provide the packaged application executable path.");
const dir = mkdtempSync(join(tmpdir(), "compass-packaged-"));
let app;
try {
  app = await electron.launch({
    executablePath: resolve(executable),
    env: {
      ...process.env,
      OSS_COMPASS_DATA_DIR: dir,
      ELECTRON_RENDERER_URL: "https://example.invalid",
    },
  });
  const page = await app.firstWindow();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  assert.ok(
    page.url().startsWith("file://"),
    "Packaged app must ignore the development server URL",
  );
  const metadata = await app.evaluate(({ app, Menu }) => ({
    packaged: app.isPackaged,
    version: app.getVersion(),
    menu: Menu.getApplicationMenu()?.items.flatMap(
      (item) => item.submenu?.items.map((child) => child.role) || [],
    ),
  }));
  assert.equal(metadata.packaged, true);
  assert.equal(
    metadata.version,
    JSON.parse(readFileSync("package.json", "utf8")).version,
  );
  const devToolsOpened = await app.evaluate(async ({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0].webContents;
    contents.openDevTools();
    await new Promise((resolve) => globalThis.setTimeout(resolve, 300));
    return contents.isDevToolsOpened();
  });
  assert.equal(devToolsOpened, false);
  assert.ok(!metadata.menu.includes("toggledevtools"));
  await page.getByLabel("GitHub username").fill("packaged-smoke-test");
  await page.getByRole("button", { name: "Create my workspace" }).click();
  await page.getByRole("button", { name: "Explore demo workspace" }).click();
  await page
    .getByRole("button", { name: "Opportunity Radar", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Reduce canvas redraws during playback" })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    `PASS: packaged ${metadata.version}; local production renderer; developer tools disabled; SQLite onboarding, demo seed and issue navigation; no renderer exceptions.`,
  );
} finally {
  if (app) await app.close();
  rmSync(dir, { recursive: true, force: true });
}
