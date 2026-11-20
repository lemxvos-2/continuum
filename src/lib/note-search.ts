import { tiptapContentToPlainText } from "@/lib/tiptap-content";

/** Plain text of a note including @entity and #note mention labels. */
export function noteSearchText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string" && !content.trim().startsWith("{")) {
    return content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  return tiptapContentToPlainText(content).replace(/\s+/g, " ").trim();
}

const stripPrefixes = (value: string) => value.replace(/[@#]/g, "");

/** Case-insensitive match that ignores @/# so "ana" and "@ana" both match. */
export function matchesNoteSearch(text: string, query: string): boolean {
  const hay = text.toLocaleLowerCase();
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  return hay.includes(q) || stripPrefixes(hay).includes(stripPrefixes(q));
}

/** Locates the match range in the original text, tolerating missing @/# prefixes. */
export function findNoteSearchMatch(text: string, query: string): { index: number; length: number } | null {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return null;
  const direct = text.toLocaleLowerCase().indexOf(q);
  if (direct >= 0) return { index: direct, length: q.length };
  const words = stripPrefixes(q).split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const pattern = words.map((w) => `[@#]?${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).join("\\s+");
  const m = new RegExp(pattern, "i").exec(text);
  return m ? { index: m.index, length: m[0].length } : null;
}
