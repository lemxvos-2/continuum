import { describe, expect, it } from "vitest";
import { findNoteSearchMatch, matchesNoteSearch, noteSearchText } from "@/lib/note-search";

const doc = {
  type: "doc",
  content: [{ type: "paragraph", content: [
    { type: "text", text: "fui almoçar com a " },
    { type: "mention", attrs: { id: "e1", label: "ana" } },
  ] }],
};

describe("note search with entity mentions", () => {
  it("includes the mentioned entity in the searchable text", () => {
    expect(noteSearchText(doc)).toBe("fui almoçar com a @ana");
  });

  it("finds the note with or without the @ prefix", () => {
    const text = noteSearchText(doc);
    expect(matchesNoteSearch(text, "fui almoçar com a @ana")).toBe(true);
    expect(matchesNoteSearch(text, "fui almoçar com a ana")).toBe(true);
    expect(matchesNoteSearch(text, "ana")).toBe(true);
    expect(matchesNoteSearch(text, "joão")).toBe(false);
  });

  it("locates the match including the mention", () => {
    expect(findNoteSearchMatch("fui almoçar com a @ana hoje", "com a ana")).toEqual({ index: 12, length: 10 });
  });
});
