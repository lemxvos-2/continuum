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
