import type { AIConfig, AIStatus, EvidenceChunk, ActionResult } from "./ai";
export type Provenance = "github" | "manual" | "import" | "demo";
export type ReviewState =
  | "Not reviewed"
  | "Investigating"
  | "Needs follow-up"
  | "Reviewed privately"
  | "Watch for changes";
export interface Profile {
  username: string;
  skills: string;
  interests: string;
  hours: number;
  goal: string;
  theme: "dark" | "light";
  demo: boolean;
  onboarding: boolean;
  primary: string;
  syncLimit: number;
}
export interface GuidanceDocument {
  path: string;
  url: string;
  text: string;
  observedAt: string;
  truncated: boolean;
  stale: boolean;
}
export interface Briefing {
  documents: GuidanceDocument[];
  locations: {
    path: string;
    checkedAt: string;
    status: "checked" | "missing" | "unavailable" | "deferred";
  }[];
  observedAt: string;
}
export interface Repository {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  provenance: Provenance;
  syncedAt: string | null;
  error: string | null;
  partial: boolean;
  guidance: Record<string, string>;
  remaining: number | null;
  briefing?: Briefing;
}
export interface Inspection {
  id: string;
  inspectedAt: string;
  headSha: string | null;
  itemUpdatedAt: string;
  commentsObservedAt: string | null;
  reviewsObservedAt: string | null;
  commentsComplete: boolean;
  reviewsComplete: boolean;
  feedbackIds: string[];
  reviews: { author: string; state: string; at: string; url: string }[];
  privateState: ReviewState;
  note: string;
}
export interface Item {
  id: string;
  repo: string;
  number: number;
  kind: "issue" | "pr";
  title: string;
  body: string;
  url: string;
  state: string;
  author: string;
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  observedAt: string;
  commentsObservedAt?: string;
  commentsComplete?: boolean;
  reviewsObservedAt?: string;
  reviewsComplete?: boolean;
  headSha?: string;
  comments: Comment[];
  reviews: Comment[];
  checks: string;
  checksHeadSha?: string;
  checksObservedAt?: string;
  provenance: Provenance;
  saved: boolean;
  reviewState: ReviewState;
  note: string;
  noteHeadSha?: string | null;
  inspections?: Inspection[];
}
export interface Comment {
  author: string;
  body: string;
  url: string;
  at: string;
  state?: string;
}
export interface Reference {
  repo: string;
  number: number;
  kind: "explicit" | "candidate";
  evidence: string;
}
export interface Segment {
  text: string;
  timestamp: string | null;
}
export interface Source {
  id: string;
  title: string;
  format: string;
  provenance: Provenance;
  date: string;
  importedAt: string;
  text: string;
  url: string;
  repo: string;
  refs: Reference[];
  segments: Segment[];
  annotations: Annotation[];
}
export interface Annotation {
  id: string;
  passage: string;
  kind: "decision" | "priority" | "question" | "action";
  note: string;
}
export interface Task {
  id: string;
  title: string;
  hours: number;
  done: boolean;
  deadline: string;
  type: "objective" | "achievement" | "preparation";
  url: string;
}
export interface Conversation {
  id: string;
  title: string;
  demo: boolean;
  createdAt: string;
  messages: Message[];
}
export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
  origin: "user" | "deterministic" | "model" | "demo";
  model?: string;
  totalTokens?: number;
  evidence?: EvidenceChunk[];
  abstained?: boolean;
  sources: string[];
}
export interface Change {
  sourceId?: string;
  id: string;
  repo: string;
  itemId: string;
  title: string;
  detail: string;
  at: string;
  provenance: Provenance;
}
export interface Snapshot {
  profile: Profile;
  repositories: Repository[];
  items: Item[];
  sources: Source[];
  tasks: Task[];
  conversations: Conversation[];
  changes: Change[];
  syncing: string[];
  credential: { present: boolean; persistent: boolean };
  ai?: AIStatus;
  search?: string[];
}
export interface Opportunity {
  item: Item;
  score: number;
  category: string;
  reasons: string[];
  sourceIds: string[];
  workStatus?: string;
  relatedIds?: string[];
}
export type Action =
  | { type: "profile"; value: Profile }
  | { type: "repository:add"; value: string }
  | { type: "repository:delete"; id: string }
  | { type: "sync"; id: string }
  | { type: "sync:cancel"; id: string }
  | { type: "demo:seed" }
  | {
      type: "item:update";
      id: string;
      saved?: boolean;
      reviewState?: ReviewState;
      note?: string;
    }
  | {
      type: "source:add";
      title: string;
      text: string;
      format: string;
      repo: string;
      date: string;
      url: string;
      consent: boolean;
    }
  | { type: "item:inspect"; id: string }
  | { type: "source:import"; repo: string; consent: boolean }
  | { type: "source:delete"; id: string }
  | {
      type: "source:annotate";
      id: string;
      passage: string;
      kind: Annotation["kind"];
      note: string;
    }
  | { type: "task:save"; task: Task }
  | { type: "task:delete"; id: string }
  | { type: "chat:create"; title: string }
  | { type: "chat:rename"; id: string; title: string }
  | { type: "chat:delete"; id: string }
  | { type: "chat:send"; id: string; text: string; sources: string[] }
  | { type: "credential:set"; token: string; persist: boolean }
  | { type: "credential:delete" }
  | { type: "ai:key"; token: string; persist: boolean }
  | { type: "ai:delete" }
  | { type: "ai:configure"; config: AIConfig }
  | { type: "chat:preview"; id: string; text: string; sources: string[] }
  | { type: "chat:cloud"; id: string; previewId: string; consent: true }
  | { type: "external"; url: string }
  | { type: "export"; kind: "journey" | "chat"; id?: string };
export interface Bridge {
  snapshot: (query?: string) => Promise<Snapshot>;
  act: (action: Action) => Promise<ActionResult>;
}
