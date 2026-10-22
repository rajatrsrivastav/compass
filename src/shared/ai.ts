export const models = ["gpt-5.4-mini", "gpt-5.4-mini-2026-03-17"] as const;
export interface AIConfig {
  model: (typeof models)[number];
  dailyLimit: number;
  outputTokens: number;
}
export const defaultAIConfig: AIConfig = {
  model: "gpt-5.4-mini",
  dailyLimit: 5,
  outputTokens: 800,
};
export interface EvidenceChunk {
  id: string;
  recordId: string;
  title: string;
  provenance: string;
  observedAt: string;
  url: string;
  text: string;
}
export interface CloudPreview {
  id: string;
  conversationId: string;
  question: string;
  model: string;
  outputTokens: number;
  chunks: EvidenceChunk[];
  expiresAt: string;
}
export interface AIStatus {
  configured: boolean;
  persistent: boolean;
  config: AIConfig;
  callsToday: number;
}
export interface ActionResult {
  message?: string;
  preview?: CloudPreview;
}
