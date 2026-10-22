import { models } from "./ai";
import { z } from "zod";
const text = z.string().max(10000),
  id = z.string().min(1).max(300);
export const profileSchema = z.object({
  username: z.string().max(100),
  skills: text,
  interests: text,
  hours: z.number().min(1).max(80),
  goal: z.string().max(100),
  theme: z.enum(["dark", "light"]),
  demo: z.boolean(),
  onboarding: z.boolean(),
  primary: z.string().max(200),
  syncLimit: z.number().int().min(10).max(500),
});
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("profile"), value: profileSchema }),
  z.object({ type: z.literal("repository:add"), value: z.string().max(300) }),
  ...[
    "repository:delete",
    "sync",
    "sync:cancel",
    "source:delete",
    "task:delete",
    "chat:delete",
    "item:inspect",
  ].map((type) => z.object({ type: z.literal(type), id })),
  z.object({ type: z.literal("demo:seed") }),
  z.object({
    type: z.literal("item:update"),
    id,
    saved: z.boolean().optional(),
    reviewState: z
      .enum([
        "Not reviewed",
        "Investigating",
        "Needs follow-up",
        "Reviewed privately",
        "Watch for changes",
      ])
      .optional(),
    note: text.optional(),
  }),
  z.object({
    type: z.literal("source:add"),
    title: z.string().min(1).max(200),
    text: z.string().min(1).max(2_000_000),
    format: z.enum([
      "manual",
      "paste",
      "link",
      "txt",
      "md",
      "srt",
      "vtt",
      "json",
    ]),
    repo: z.string().max(200),
    date: z.string().max(40),
    url: z.string().max(2000),
    consent: z.literal(true),
  }),
  z.object({
    type: z.literal("source:import"),
    repo: z.string().max(200),
    consent: z.literal(true),
  }),
  z.object({
    type: z.literal("source:annotate"),
    id,
    passage: text.min(1),
    kind: z.enum(["decision", "priority", "question", "action"]),
    note: text,
  }),
  z.object({
    type: z.literal("task:save"),
    task: z.object({
      id,
      title: z.string().min(1).max(500),
      hours: z.number().min(0).max(80),
      done: z.boolean(),
      deadline: z.string().max(40),
      type: z.enum(["objective", "achievement", "preparation"]),
      url: z.string().max(2000),
    }),
  }),
  z.object({
    type: z.literal("chat:create"),
    title: z.string().min(1).max(200),
  }),
  z.object({
    type: z.literal("chat:rename"),
    id,
    title: z.string().min(1).max(200),
  }),
  z.object({
    type: z.literal("chat:send"),
    id,
    text: text.min(1),
    sources: z.array(id).max(30),
  }),
  z.object({
    type: z.literal("credential:set"),
    token: z.string().trim().min(1).max(500),
    persist: z.boolean(),
  }),
  z.object({ type: z.literal("credential:delete") }),
  z.object({
    type: z.literal("ai:key"),
    token: z.string().trim().min(1).max(500),
    persist: z.boolean(),
  }),
  z.object({ type: z.literal("ai:delete") }),
  z.object({
    type: z.literal("ai:configure"),
    config: z.object({
      model: z.enum(models),
      dailyLimit: z.number().int().min(1).max(50),
      outputTokens: z.number().int().min(256).max(2000),
    }),
  }),
  z.object({
    type: z.literal("chat:preview"),
    id,
    text: z.string().trim().min(1).max(2000),
    sources: z.array(id).min(1).max(30),
  }),
  z.object({
    type: z.literal("chat:cloud"),
    id,
    previewId: id,
    consent: z.literal(true),
  }),
  z.object({ type: z.literal("external"), url: z.string().url().max(2000) }),
  z.object({
    type: z.literal("export"),
    kind: z.enum(["journey", "chat"]),
    id: id.optional(),
  }),
]);
export function parseRepo(value: string): string {
  const input = value
    .trim()
    .replace(/\/$/, "")
    .replace(/\.git$/, "");
  const name = input.startsWith("https://github.com/")
    ? input.slice(19)
    : input;
  if (
    !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})\/[a-zA-Z0-9_.-]+$/.test(name) ||
    name.includes("..")
  )
    throw new Error("Use owner/repo or an HTTPS GitHub repository URL.");
  return name.toLowerCase();
}
export function externalUrl(value: string): string {
  const u = new URL(value);
  if (u.protocol !== "https:" || u.username || u.password || u.port)
    throw new Error("Only standard HTTPS links are allowed.");
  if (
    u.hostname === "localhost" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) ||
    u.hostname.includes(":") ||
    !u.hostname.includes(".")
  )
    throw new Error("Local destinations are not allowed.");
  return u.href;
}
