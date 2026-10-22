import type { Item, Source, Profile, Opportunity } from "./types";
export const weights = {
  open: 15,
  beginner: 24,
  unassigned: 12,
  skill: 18,
  recent: 10,
  description: 8,
  community: 20,
  assigned: -22,
  relatedPR: -18,
};
export function rank(
  items: Item[],
  sources: Source[],
  profile: Profile,
  now = Date.now(),
): Opportunity[] {
  return items
    .filter((i) => i.kind === "issue" && i.state === "open")
    .map((item) => {
      let score = weights.open;
      const reasons = ["Open at last synchronization."];
      const refs = sources.filter((s) =>
        s.refs.some(
          (r) =>
            r.kind === "explicit" &&
            r.repo === item.repo &&
            r.number === item.number,
        ),
      );
      let category = "Needs investigation";
      if (item.labels.some((l) => /good first|beginner|help wanted/i.test(l))) {
        score += weights.beginner;
        reasons.push("Repository labels suggest an accessible contribution.");
        category = "Beginner-friendly";
      }
      if (!item.assignees.length) {
        score += weights.unassigned;
        reasons.push("No assignee recorded at last sync.");
      } else {
        score += weights.assigned;
        reasons.push(
          `Assigned to ${item.assignees.join(", ")}; coordinate before starting.`,
        );
        category = "Possibly blocked or already being addressed";
      }
      const skills = [
        ...new Set(
          (profile.skills + "," + profile.interests)
            .toLowerCase()
            .split(/[,;]+/)
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ].filter((s) =>
        (item.title + " " + item.body + " " + item.labels.join(" "))
          .toLowerCase()
          .includes(s),
      );
      if (skills.length) {
        score += weights.skill;
        reasons.push(
          `Matches your declared skills or interests: ${skills.join(", ")}.`,
        );
        if (category === "Needs investigation")
          category = "Potentially meaningful";
      }
      if (now - Date.parse(item.updatedAt) < 30 * 86400000) {
        score += weights.recent;
        reasons.push("Updated within the last 30 days.");
      }
      if (item.body.length > 100) {
        score += weights.description;
        reasons.push("Description contains context to investigate.");
      }
      if (refs.length) {
        score += weights.community;
        reasons.push(
          `Explicitly referenced by ${refs.map((s) => s.title).join(", ")}. A reference is not maintainer endorsement.`,
        );
        if (!item.assignees.length) category = "Community-context match";
      }
      if (
        items.some(
          (p) =>
            p.kind === "pr" &&
            p.state === "open" &&
            p.repo === item.repo &&
            new RegExp(
              `(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+(?:https://github.com/${item.repo}/issues/)?#?${item.number}\\b`,
              "i",
            ).test(p.body),
        )
      ) {
        score += weights.relatedPR;
        reasons.push("An open PR explicitly claims to address this issue.");
        category = "Possibly blocked or already being addressed";
      }
      return {
        item,
        score: Math.max(0, Math.min(100, score)),
        category,
        reasons,
        sourceIds: refs.map((s) => s.id),
      };
    })
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
}
