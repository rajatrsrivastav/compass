import { describe, it, expect } from "vitest";
import { parseRepo, actionSchema, externalUrl } from "../../src/shared/schemas";
import {
  parseImport,
  extractReferences,
  candidates,
} from "../../src/main/imports/parse";
describe("input boundaries", () => {
  it("parses repository names and URLs", () => {
    expect(parseRepo("https://github.com/Electron/Electron.git")).toBe(
      "electron/electron",
    );
    expect(parseRepo("foo/bar")).toBe("foo/bar");
    for (const x of [
      "https://evil.com/foo/bar",
      "foo/bar/issues",
      "../x",
      "https://github.com@evil.com/a/b",
    ])
      expect(() => parseRepo(x)).toThrow();
  });
  it("validates IPC and consent", () => {
    expect(
      actionSchema.safeParse({ type: "shell", command: "rm" }).success,
    ).toBe(false);
    expect(
      actionSchema.safeParse({
        type: "source:import",
        repo: "x/y",
        consent: false,
      }).success,
    ).toBe(false);
  });
  it("rejects executable and local links", () => {
    for (const u of [
      "javascript:alert(1)",
      "file:///tmp/x",
      "http://github.com",
      "https://localhost/x",
    ])
      expect(() => externalUrl(u)).toThrow();
  });
});
describe("permission-respecting import", () => {
  it("parses subtitles and timestamps", () =>
    expect(
      parseImport("1\n00:01:00,000 --> 00:01:04,000\nDiscuss #12", "srt"),
    ).toEqual([{ text: "Discuss #12", timestamp: "00:01:00,000" }]));
  it("supports Slack exports without a platform connection", () =>
    expect(
      parseImport('[{"text":"hello","user":"U1","ts":"1000"}]', "json")[0].text,
    ).toBe("U1: hello"));
  it("rejects invalid and oversized imports", () => {
    for (const [t, f] of [
      ["{}", "json"],
      ["hello", "exe"],
      ["", "txt"],
      ["a".repeat(2_000_001), "txt"],
    ])
      expect(() => parseImport(t, f)).toThrow();
  });
  it("resolves explicit references with unambiguous context only", () => {
    expect(extractReferences("#12", "", ["a/b"])).toEqual([]);
    expect(
      extractReferences("a/b#12 https://github.com/a/b/pull/13 #14", "a/b", [
        "a/b",
      ]),
    ).toHaveLength(3);
    expect(
      extractReferences("https://github.com/other/repo/issues/12", "a/b", [
        "a/b",
      ]),
    ).toEqual([]);
  });
  it("does not invent candidate matches", () =>
    expect(candidates("hello", [], [])).toEqual([]));
});
it("validates Slack JSON rows and handles invalid timestamp ranges", () => {
  for (const raw of ["null", "[null]", '{"messages":[3]}'])
    expect(() => parseImport(raw, "json")).toThrow("Expected a Slack");
  expect(
    parseImport('[{"text":"hello","ts":"1e100","user":{}}]', "json"),
  ).toEqual([{ text: "Unknown speaker: hello", timestamp: null }]);
});
