import type { CloudPreview, ActionResult } from "../shared/ai";
import { OpenAIProvider } from "./ai/provider";
import { randomUUID } from "node:crypto";
import type { Action, Snapshot, Source } from "../shared/types";
import { parseRepo, externalUrl } from "../shared/schemas";
import { Store } from "./database/store";
import { SyncService } from "./github/sync";
import { Credentials } from "./security/credentials";
import { parseImport, extractReferences, candidates } from "./imports/parse";
import { seedDemo } from "./demo";
import { feedbackId } from "../shared/review";
import { rank } from "../shared/ranking";
export class Service {
  private previews = new Map<
    string,
    { preview: CloudPreview; selected: string[] }
  >();
  private cloudActive = new Set<string>();
  private provider: OpenAIProvider;

  constructor(
    public store: Store,
    public sync: SyncService,
    public credentials: Credentials,
    private aiCredentials?: Credentials,
    provider?: OpenAIProvider,
  ) {
    this.provider =
      provider ?? new OpenAIProvider(() => this.aiCredentials?.get());
  }
  snapshot(query = ""): Snapshot {
    const profile = this.store.profile();
    const repositories = this.store
        .all("repositories")
        .filter((r) => profile.demo || r.provenance !== "demo"),
      repoIds = new Set(repositories.map((r) => r.id));
    return {
      profile,
      repositories,
      items: this.store.all("items").filter((i) => repoIds.has(i.repo)),
      sources: this.store
        .all("sources")
        .filter((s) => profile.demo || s.provenance !== "demo"),
      tasks: this.store.all("tasks"),
      conversations: this.store
        .all("conversations")
        .filter((c) => profile.demo || !c.demo),
      changes: this.store
        .all("changes")
        .filter((c) => profile.demo || c.provenance !== "demo")
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 100),
      syncing: [...this.sync.active.keys()],
      credential: this.credentials.status(),
      ai: {
        configured: !!this.aiCredentials?.status().present,
        persistent: !!this.aiCredentials?.status().persistent,
        config: this.store.aiConfig(),
        callsToday: this.store.callsToday(),
      },
      ...(query ? { search: this.store.search(query) } : {}),
    };
  }
  addSource(input: Extract<Action, { type: "source:add" }>) {
    if (!input.consent)
      throw new Error("Import permission confirmation is required.");
    if (input.url) externalUrl(input.url);
    const segments = parseImport(input.text, input.format);
    if (!segments.length)
      throw new Error("No readable transcript segments were found.");
    const text = segments.map((s) => s.text).join("\n\n"),
      id = randomUUID(),
      at = new Date().toISOString(),
      snapshot = this.snapshot();
    if (input.repo && !snapshot.repositories.some((r) => r.id === input.repo))
      throw new Error("Repository context is not tracked.");
    const explicit = extractReferences(
      text,
      input.repo,
      snapshot.repositories.map((r) => r.id),
    );
    const source: Source = {
      id,
      title: input.title,
      format: input.format,
      provenance: ["manual", "paste", "link"].includes(input.format)
        ? "manual"
        : "import",
      date: input.date,
      importedAt: at,
      text,
      url: input.url,
      repo: input.repo,
      segments,
      refs: [...explicit, ...candidates(text, snapshot.items, explicit)],
      annotations: [],
    };
    this.store.db.transaction(() => {
      this.store.put("sources", source);
      for (const ref of explicit)
        this.store.put("changes", {
          id: randomUUID(),
          sourceId: id,
          repo: ref.repo,
          itemId: `${ref.repo}#${ref.number}`,
          title: `New community reference to #${ref.number}`,
          detail: `${source.title}: ${ref.evidence}. User-supplied source; independently unverified.`,
          at,
          provenance: source.provenance,
        });
    })();
  }
  async act(a: Action): Promise<ActionResult> {
    switch (a.type) {
      case "profile":
        this.store.setProfile(a.value);
        break;
      case "repository:add": {
        const id = parseRepo(a.value);
        if (this.store.get("repositories", id))
          throw new Error("Repository already tracked");
        this.store.put("repositories", {
          id,
          name: id,
          description: "Pending first synchronization",
          language: "Unknown",
          stars: 0,
          provenance: "github",
          syncedAt: null,
          error: null,
          partial: false,
          guidance: {},
          remaining: null,
        });
        break;
      }
      case "repository:delete": {
        if (this.sync.active.has(a.id))
          throw new Error(
            "Cancel synchronization before deleting this repository.",
          );
        this.store.delete("repositories", a.id);
        if (this.store.profile().primary === a.id)
          this.store.setProfile({ ...this.store.profile(), primary: "" });
        break;
      }
      case "sync":
        await this.sync.sync(a.id);
        break;
      case "sync:cancel":
        this.sync.cancel(a.id);
        break;
      case "demo:seed":
        seedDemo(this.store);
        break;
      case "item:update": {
        const item = this.store.get("items", a.id);
        if (!item) throw new Error("Item not found");
        this.store.put("items", {
          ...item,
          ...(a.saved !== undefined ? { saved: a.saved } : {}),
          ...(a.note !== undefined
            ? { note: a.note, noteHeadSha: item.headSha ?? null }
            : {}),
          ...(a.reviewState ? { reviewState: a.reviewState } : {}),
        });
        break;
      }
      case "item:inspect": {
        const item = this.store.get("items", a.id);
        if (!item || item.kind !== "pr")
          throw new Error("Select a cached pull request.");
        const inspection = {
          id: randomUUID(),
          inspectedAt: new Date().toISOString(),
          headSha: item.headSha ?? null,
          itemUpdatedAt: item.updatedAt,
          commentsObservedAt: item.commentsObservedAt ?? null,
          reviewsObservedAt: item.reviewsObservedAt ?? null,
          commentsComplete: item.commentsComplete ?? false,
          reviewsComplete: item.reviewsComplete ?? false,
          feedbackIds: [...item.comments, ...item.reviews].map(feedbackId),
          reviews: item.reviews.map((r) => ({
            author: r.author,
            state: r.state ?? "COMMENT",
            at: r.at,
            url: r.url,
          })),
          privateState: item.reviewState,
          note: item.note,
        };
        this.store.put("items", {
          ...item,
          inspections: [...(item.inspections ?? []), inspection],
        });
        return {
          message:
            "Private inspection recorded against the available cached evidence.",
        };
      }
      case "source:add":
        this.addSource(a);
        break;
      case "source:delete": {
        const source = this.store.get("sources", a.id);
        if (source) {
          this.store.db.transaction(() => {
            for (const c of this.store
              .all("changes")
              .filter((c) => c.sourceId === source.id))
              this.store.delete("changes", c.id);
            this.store.delete("sources", a.id);
          })();
        }
        break;
      }
      case "source:annotate": {
        const s = this.store.get("sources", a.id);
        if (!s || !s.text.includes(a.passage))
          throw new Error("Select an exact passage from the source.");
        this.store.put("sources", {
          ...s,
          annotations: [
            ...s.annotations,
            {
              id: randomUUID(),
              passage: a.passage,
              kind: a.kind,
              note: a.note,
            },
          ],
        });
        break;
      }
      case "task:save": {
        if (a.task.url) externalUrl(a.task.url);
        const planned = this.store
          .all("tasks")
          .filter(
            (t) => t.id !== a.task.id && !t.done && t.type !== "achievement",
          )
          .reduce((n, t) => n + t.hours, 0);
        if (
          !a.task.done &&
          a.task.type !== "achievement" &&
          planned + a.task.hours > this.store.profile().hours
        )
          throw new Error(
            "This exceeds your weekly capacity. Reduce hours or complete an existing task.",
          );
        this.store.put("tasks", a.task);
        break;
      }
      case "task:delete":
        this.store.delete("tasks", a.id);
        break;
      case "chat:create":
        this.store.put("conversations", {
          id: randomUUID(),
          title: a.title,
          demo: false,
          createdAt: new Date().toISOString(),
          messages: [],
        });
        break;
      case "chat:rename": {
        const c = this.store.get("conversations", a.id);
        if (c) this.store.put("conversations", { ...c, title: a.title });
        break;
      }
      case "chat:delete":
        this.store.delete("conversations", a.id);
        break;
      case "chat:send": {
        const c = this.store.get("conversations", a.id);
        if (!c) throw new Error("Conversation not found");
        if (c.demo)
          throw new Error(
            "Demo conversations are read-only. Start a new local conversation.",
          );
        const s = this.snapshot(),
          items = s.items.filter((i) => a.sources.includes(i.id)),
          sources = s.sources.filter((i) => a.sources.includes(i.id));
        const ranked = rank(
          s.items,
          sources,
          s.profile,
          Date.now(),
          s.repositories,
        );
        const relatedIds = ranked
          .filter((r) => items.some((i) => i.id === r.item.id))
          .flatMap((r) => r.relatedIds ?? []);
        const refs = [
          ...new Set([
            ...items.map((i) => i.id),
            ...sources.map((i) => i.id),
            ...relatedIds,
          ]),
        ];
        let answer =
          "**Local evidence assistant · deterministic response**\n\n";
        if (!refs.length)
          answer +=
            "Select issue or community records to receive an evidence summary. Local mode does not call a model. For a contribution plan: reproduce the issue, read contributor guidance, coordinate with maintainers, and budget time for tests and feedback.";
        else {
          for (const i of items) {
            const r = ranked.find((r) => r.item.id === i.id);
            answer += `### ${i.title}\nRecord: ${i.id}. ${i.provenance === "demo" ? "SYNTHETIC DEMO. " : ""}Last checked: ${i.observedAt}. State: ${i.state}.\n${r ? r.reasons.map((x) => "- " + x).join("\n") : "Private review state: " + i.reviewState + "."}\n\n`;
          }
          for (const id of relatedIds) {
            const pr = s.items.find((i) => i.id === id)!;
            answer += `Related work: ${pr.id}, ${pr.state}, checked ${pr.observedAt}. Explicit reference; scope needs verification.\n\n`;
          }
          for (const source of sources)
            answer += `### ${source.title}\nSource: ${source.id}; provenance: ${source.provenance}; imported: ${source.importedAt}.\n\nQuoted excerpt (untrusted source text):\n> ${source.text.slice(0, 900).replace(/\n/g, "\n> ")}\n\n${source.refs.map((r) => `- ${r.kind}: ${r.repo}#${r.number} — ${r.evidence}`).join("\n")}\n\n`;
          answer +=
            "Next: verify the current discussion, reproduce the behavior, and record an investigation. Source references do not establish maintainer endorsement.";
        }
        const at = new Date().toISOString();
        this.store.appendChat(a.id, [
          {
            id: randomUUID(),
            role: "user",
            text: a.text,
            at,
            origin: "user",
            sources: refs,
          },
          {
            id: randomUUID(),
            role: "assistant",
            text: answer,
            at,
            origin: "deterministic",
            sources: refs,
          },
        ]);
        break;
      }
      case "ai:key":
        if (!this.aiCredentials)
          throw new Error("AI credential storage is unavailable.");
        this.aiCredentials.set(a.token, a.persist);
        this.previews.clear();
        return {
          message: a.persist
            ? "OpenAI key saved with OS encryption. No request has been sent."
            : "OpenAI key saved for this session. No request has been sent.",
        };
      case "ai:delete":
        this.aiCredentials?.clear();
        this.previews.clear();
        break;
      case "ai:configure":
        this.store.setAIConfig(a.config);
        this.previews.clear();
        break;
      case "chat:preview": {
        const c = this.store.get("conversations", a.id);
        if (!c || c.demo) throw new Error("Choose a real local conversation.");
        const s = this.snapshot();
        const visible = new Set(
          [
            ...s.items,
            ...s.sources,
            ...s.repositories,
            ...s.tasks,
            ...s.changes,
          ].map((r) => r.id),
        );
        if (a.sources.some((id) => !visible.has(id)))
          throw new Error(
            "Selected evidence is no longer visible. Select it again.",
          );
        const chunks = this.store.retrieve(a.text, [...new Set(a.sources)]);
        if (!chunks.length)
          throw new Error(
            "Insufficient selected evidence. Add synchronized records or use local mode.",
          );
        const config = this.store.aiConfig();
        const preview: CloudPreview = {
          id: randomUUID(),
          conversationId: a.id,
          question: a.text,
          model: config.model,
          outputTokens: config.outputTokens,
          chunks,
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        };
        this.previews.clear();
        this.previews.set(preview.id, { preview, selected: a.sources });
        return { preview };
      }
      case "chat:cloud": {
        if (a.consent !== true)
          throw new Error("Explicit cloud-processing consent is required.");
        if (!this.aiCredentials?.get())
          throw new Error("Configure an OpenAI key or use local mode.");
        const entry = this.previews.get(a.previewId);
        if (
          !entry ||
          entry.preview.conversationId !== a.id ||
          Date.parse(entry.preview.expiresAt) < Date.now()
        )
          throw new Error(
            "Preview expired. Preview the evidence again before sending.",
          );
        if (this.cloudActive.has(a.id))
          throw new Error(
            "An OpenAI request is already running for this conversation.",
          );
        const c = this.store.get("conversations", a.id);
        if (!c || c.demo) throw new Error("Choose a real local conversation.");
        const s = this.snapshot();
        const visible = new Set(
          [
            ...s.items,
            ...s.sources,
            ...s.repositories,
            ...s.tasks,
            ...s.changes,
          ].map((r) => r.id),
        );
        if (
          entry.selected.some((id) => !visible.has(id)) ||
          JSON.stringify(
            this.store.retrieve(entry.preview.question, entry.selected),
          ) !== JSON.stringify(entry.preview.chunks)
        )
          throw new Error("Evidence changed. Preview it again before sending.");
        this.store.reserveCall();
        this.previews.delete(a.previewId);
        this.cloudActive.add(a.id);
        try {
          const answer = await this.provider.answer(entry.preview);
          // Deleting a conversation while a request runs must not resurrect it.
          if (!this.store.get("conversations", a.id))
            throw new Error(
              "Conversation was deleted while the request was running.",
            );
          const at = new Date().toISOString(),
            sources = [...new Set(entry.preview.chunks.map((c) => c.recordId))];
          this.store.appendChat(a.id, [
            {
              id: randomUUID(),
              role: "user",
              text: entry.preview.question,
              at,
              origin: "user",
              sources,
            },
            {
              id: randomUUID(),
              role: "assistant",
              text: answer.text,
              at,
              origin: "model",
              sources,
              model: answer.model,
              totalTokens: answer.usage,
              abstained: answer.abstained,
              evidence: entry.preview.chunks,
            },
          ]);
          return {
            message:
              "Model response saved. Citation IDs were checked; factual correctness still needs review.",
          };
        } finally {
          this.cloudActive.delete(a.id);
        }
      }
      case "credential:set":
        this.credentials.set(a.token, a.persist);
        return {
          message: a.persist
            ? "Token encrypted using OS-backed storage."
            : "Token available for this session only.",
        };
      case "credential:delete":
        this.credentials.clear();
        break;
      default:
        throw new Error("This action requires a desktop handler.");
    }
    return {};
  }
  export(kind: "journey" | "chat", id?: string) {
    const s = this.snapshot();
    if (kind === "chat") {
      const c = s.conversations.find((c) => c.id === id);
      if (!c) throw new Error("Conversation not found");
      return (
        `# ${c.title}\n${c.demo ? "Synthetic Demo Data" : "Local conversation"}\n\n` +
        c.messages
          .map(
            (m) =>
              `## ${m.role} · ${m.origin} · ${m.at}\n\n${m.model ? `Model: ${m.model}; total tokens: ${m.totalTokens ?? "unknown"}. Citation IDs checked, claims unverified.\n\n` : ""}${m.text}\n\nSources: ${m.sources.join(", ")}${m.evidence ? "\n\n### Supplied evidence\n" + m.evidence.map((c) => `\n${c.id} · ${c.recordId} · ${c.provenance} · observed ${c.observedAt}\n${c.title} ${c.url}\n\n> ${c.text.replace(/\n/g, "\n> ")}\n`).join("\n") : ""}`,
          )
          .join("\n\n")
      );
    }
    return `# OSS Compass contribution report\nGenerated ${new Date().toISOString()}\n\n## Cached public GitHub evidence\n${
      s.items
        .filter((i) => i.provenance === "github" && i.saved)
        .map(
          (i) =>
            `- [${i.title}](${i.url}) — ${i.state}; checked ${i.observedAt}. Saved for investigation, not proof of authorship.`,
        )
        .join("\n") || "No saved public evidence."
    }\n\n## Manually entered achievements (unverified)\n${
      s.tasks
        .filter((t) => t.type === "achievement")
        .map((t) => `- ${t.title} ${t.url}`)
        .join("\n") || "None recorded."
    }\n\n## Private preparation\n${s.tasks
      .filter((t) => t.type !== "achievement")
      .map(
        (t) =>
          `- [${t.done ? "x" : " "}] ${t.title} (${t.hours}h), deadline: ${t.deadline || "none"}`,
      )
      .join("\n")}\n${s.items
      .filter((i) => i.saved || i.reviewState !== "Not reviewed")
      .map(
        (i) =>
          `- ${i.repo}#${i.number}: ${i.reviewState}${i.provenance === "demo" ? " (synthetic demo)" : ""}`,
      )
      .join(
        "\n",
      )}\n\nPrivate review states are not official GitHub reviews. No maintainer approval is inferred.\n`;
  }
}
