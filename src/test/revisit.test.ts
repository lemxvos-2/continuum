import { describe, expect, it } from "vitest";
import { extractOpenLoops, markRelevant, pickShuffle, snooze, visibleLoops } from "@/lib/revisit";

const DAY = 86_400_000;
const doc = { type: "doc", content: [
  { type: "taskList", content: [
    { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Comprar livro" }] }] },
    { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Feito" }] }] },
  ] },
  { type: "paragraph", content: [{ type: "text", text: "Vale a pena trocar o banco?" }] },
  { type: "paragraph", content: [{ type: "text", text: "IDEIA: app de receitas" }] },
  { type: "paragraph", content: [{ type: "text", text: "Texto normal." }] },
] };

describe("revisit", () => {
  it("detects unchecked tasks, questions and prefixes only", () => {
    expect(extractOpenLoops("n", doc).map((l) => l.kind)).toEqual(["task", "question", "prefix"]);
  });
  it("snoozes a loop for 14 days", () => {
    const loops = extractOpenLoops("n", doc);
    const s = snooze({ snoozed: {}, dismissed: [] }, loops[0].key, 0);
    expect(visibleLoops(loops, s, 13 * DAY)).toHaveLength(2);
    expect(visibleLoops(loops, s, 15 * DAY)).toHaveLength(3);
  });
  it("relevant advances 7 → 30 days", () => {
    expect(markRelevant({ stage: {}, next: {}, archived: [] }, "a", 0).next.a).toBe(30 * DAY);
  });
  it("shuffle ignores notes edited under 7 days and is stable per day", () => {
    const now = 100 * DAY;
    const notes = [{ id: "a", updatedAt: new Date(now - 2 * DAY).toISOString() }, { id: "b", updatedAt: new Date(0).toISOString() }];
    const st = { stage: {}, next: {}, archived: [] };
    expect(pickShuffle(notes, st, "u", 0, now)?.id).toBe("b");
    expect(pickShuffle(notes, { ...st, archived: ["b"] }, "u", 0, now)).toBeNull();
  });
});

import { coOccurrences } from "@/lib/revisit";
describe("coOccurrences", () => {
  it("needs 3 shared notes and computes percent of self notes", () => {
    const notes = [{ entityIds: ["a", "x", "y"] }, { entityIds: ["a", "x", "y"] }, { entityIds: ["a", "x"] }, { entityIds: ["a"] }, { entityIds: ["a"] }];
    expect(coOccurrences("a", notes)).toEqual([{ id: "x", count: 3, pct: 60 }]);
  });
});

import { capsuleDate, dueCapsules, extractCapsules, relatedByEntities } from "@/lib/revisit";
describe("time capsule", () => {
  const now = Date.UTC(2026, 0, 1);
  it("parses 30d, 3m and explicit dates", () => {
    expect(capsuleDate("30d", now)).toBe("2026-01-31");
    expect(capsuleDate("3m", now)).toBe("2026-04-01");
    expect(capsuleDate("2027-01-01", now)).toBe("2027-01-01");
    expect(capsuleDate("logo", now)).toBeNull();
  });
  it("shows a capsule only on or after its date", () => {
    const caps = extractCapsules("n", { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "📬 2026-02-01 — Me arrependi?" }] }] });
    expect(dueCapsules(caps, [], Date.UTC(2026, 0, 31))).toHaveLength(0);
    expect(dueCapsules(caps, [], Date.UTC(2026, 1, 1))).toHaveLength(1);
  });
});
describe("relatedByEntities", () => {
  it("orders by shared entities then oldest, excluding current", () => {
    const notes = [
      { id: "cur", updatedAt: "2026-01-01", entityIds: ["a", "b"] },
      { id: "new1", updatedAt: "2026-05-01", entityIds: ["a"] },
      { id: "old1", updatedAt: "2025-01-01", entityIds: ["a"] },
      { id: "both", updatedAt: "2026-06-01", entityIds: ["a", "b"] },
      { id: "none", updatedAt: "2020-01-01", entityIds: ["z"] },
    ];
    expect(relatedByEntities("cur", ["a", "b"], notes).map((r) => r.note.id)).toEqual(["both", "old1", "new1"]);
  });
});
