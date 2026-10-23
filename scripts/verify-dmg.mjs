import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  readFileSync,
  existsSync,
  readlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import { listPackage } from "@electron/asar";

const image = process.argv[2];
if (!image)
  throw new Error(
    "Usage: node scripts/verify-dmg.mjs release/OSS-Compass-VERSION-universal.dmg",
  );
const scratch = mkdtempSync(join(tmpdir(), "compass-dmg-"));
const mount = join(scratch, "mounted");
const installed = join(scratch, "Applications", "OSS Compass.app");
const run = (command, args) =>
  execFileSync(command, args, { encoding: "utf8" });
let attached = false;
try {
  console.log(run("hdiutil", ["verify", resolve(image)]));
  mkdirSync(mount);
  console.log(
    run("hdiutil", [
      "attach",
      resolve(image),
      "-readonly",
      "-nobrowse",
      "-mountpoint",
      mount,
    ]),
  );
  attached = true;
  assert.equal(readlinkSync(join(mount, "Applications")), "/Applications");
  assert.ok(
    existsSync(
      join(mount, "OSS Compass.app", "Contents", "Resources", "icon.icns"),
    ),
  );
  run("ditto", [join(mount, "OSS Compass.app"), installed]);
  const entries = listPackage(
    join(installed, "Contents", "Resources", "app.asar"),
  );
  const roots = [...new Set(entries.map((entry) => entry.split("/")[1]))];
  assert.deepEqual(roots.sort(), [
    "LICENSE",
    "node_modules",
    "out",
    "package.json",
  ]);
  console.log(
    "Verified package contains only production bundles, dependencies, metadata and license.",
  );
  const plist = join(installed, "Contents", "Info.plist");
  const value = (key) =>
    run("plutil", ["-extract", key, "raw", "-o", "-", plist]).trim();
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  assert.equal(value("CFBundleIdentifier"), "dev.osscompass.desktop");
  assert.equal(value("CFBundleShortVersionString"), version);
  assert.equal(value("CFBundleIconFile"), "icon.icns");
  const binary = join(installed, "Contents", "MacOS", "OSS Compass");
  const expected = image.includes("-universal.dmg")
    ? ["arm64", "x86_64"]
    : ["arm64"];
  const architectures = run("lipo", ["-archs", binary])
    .trim()
    .split(/\s+/)
    .sort();
  assert.deepEqual(architectures, expected);
  console.log(`Electron architectures: ${architectures.join(", ")}`);
  // better-sqlite3 13 loads a platform/architecture-specific Node-API prebuild.
  for (const architecture of expected) {
    const target = architecture === "x86_64" ? "x64" : architecture;
    const sqlite = join(
      installed,
      "Contents",
      "Resources",
      "app.asar.unpacked",
      "node_modules",
      "better-sqlite3",
      "prebuilds",
      `darwin-${target}.node`,
    );
    assert.equal(run("lipo", ["-archs", sqlite]).trim(), architecture);
    console.log(`SQLite ${target} prebuild verified.`);
  }
  console.log(
    `Verified version ${version}, app ID, icon, Applications link; minimum macOS ${value("LSMinimumSystemVersion")}.`,
  );
  execFileSync(process.execPath, ["scripts/smoke-packaged.mjs", binary], {
    stdio: "inherit",
  });
  console.log(
    "PASS: DMG verified, mounted read-only, application copied to a temporary Applications directory and launched successfully. No system installation, Developer ID signing, notarization, or Intel hardware test is implied.",
  );
} finally {
  if (attached) run("hdiutil", ["detach", mount]);
  rmSync(scratch, { recursive: true, force: true });
}
