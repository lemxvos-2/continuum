// Deterministic "note graveyard" helpers: open loops + daily shuffle. No AI.
import { parseTiptapContent, type TiptapNode } from "@/lib/tiptap-content";

const DAY = 86_400_000;
export const SHUFFLE_INTERVALS = [7, 30, 90, 180];
export const SNOOZE_DAYS = 14;
const LOOP_PREFIX = /^(TODO|DÚVIDA|DUVIDA|IDEIA|DECIDIR|IDEA|DECIDE|QUESTION)\s*:/i;

export interface OpenLoop { key: string; noteId: string; text: string; kind: "task" | "question" | "prefix"; }

function text(node: TiptapNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "mention") return `@${String(node.attrs?.label ?? "")}`;
  return (node.content ?? []).map(text).join("");
}

export function extractOpenLoops(noteId: string, content: unknown): OpenLoop[] {
  const out: OpenLoop[] = [];
  const walk = (node: TiptapNode) => {
    if (node.type === "taskItem") {
      if (!node.attrs?.checked) {
        const t = text(node).trim();
        if (t) out.push({ key: `${noteId}:${t}`, noteId, text: t, kind: "task" });
      }
      return;
    }
    if (node.type === "paragraph" || node.type === "heading") {
      const t = text(node).trim();
      if (LOOP_PREFIX.test(t)) out.push({ key: `${noteId}:${t}`, noteId, text: t, kind: "prefix" });
      else if (t.length > 8 && t.endsWith("?")) out.push({ key: `${noteId}:${t}`, noteId, text: t, kind: "question" });
      return;
    }
    (node.content ?? []).forEach(walk);
  };
  walk(parseTiptapContent(content));
  return out;
}

export interface ShuffleState { stage: Record<string, number>; next: Record<string, number>; archived: string[]; }
export interface LoopState { snoozed: Record<string, number>; dismissed: string[]; }

function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

export function dayKey(now: number) { return new Date(now).toISOString().slice(0, 10); }

/** Eligible = older than first interval, not archived, due. Same pick all day (seed = date + user + skip). */
export function pickShuffle<T extends { id: string; updatedAt: string; entityIds?: string[] }>(
  notes: T[], state: ShuffleState, seed: string, skip: number, now: number,
): T | null {
  const pool = notes.filter((n) => {
    if (state.archived.includes(n.id)) return false;
    if (now - new Date(n.updatedAt).getTime() < SHUFFLE_INTERVALS[0] * DAY) return false;
    return (state.next[n.id] ?? 0) <= now;
  }).sort((a, b) => a.id.localeCompare(b.id));
  if (!pool.length) return null;
  const weights = pool.map((n) => 1 + (n.entityIds?.length ?? 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = hash(`${seed}:${dayKey(now)}:${skip}`) % total;
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r < 0) return pool[i]; }
  return pool[0];
}

export function markRelevant(state: ShuffleState, id: string, now: number): ShuffleState {
  const stage = Math.min((state.stage[id] ?? 0) + 1, SHUFFLE_INTERVALS.length - 1);
  return { ...state, stage: { ...state.stage, [id]: stage }, next: { ...state.next, [id]: now + SHUFFLE_INTERVALS[stage] * DAY } };
}

export function visibleLoops(loops: OpenLoop[], state: LoopState, now: number, limit = 3) {
  return loops.filter((l) => !state.dismissed.includes(l.key) && (state.snoozed[l.key] ?? 0) <= now).slice(0, limit);
}

export function snooze(state: LoopState, key: string, now: number): LoopState {
  return { ...state, snoozed: { ...state.snoozed, [key]: now + SNOOZE_DAYS * DAY } };
}

export function appendThought(content: unknown, thought: string, date: string): TiptapNode {
  const doc = parseTiptapContent(content);
  return { ...doc, content: [...(doc.content ?? []), { type: "paragraph", content: [{ type: "text", text: `${date} — ${thought}` }] }] };
}

/** Entities co-occurring with `selfId` in at least `min` notes; pct = shared / notes of self. */
export function coOccurrences(selfId: string, notes: { entityIds?: string[] }[], min = 3) {
  const counts = new Map<string, number>();
  for (const n of notes) for (const e of new Set(n.entityIds ?? [])) if (e !== selfId) counts.set(e, (counts.get(e) ?? 0) + 1);
  return [...counts].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id, count, pct: Math.round((count / Math.max(notes.length, 1)) * 100) }));
}

/** Older notes sharing entities with the current one: most shared first, then oldest. */
export function relatedByEntities<T extends { id: string; updatedAt: string; entityIds?: string[] }>(
  currentId: string, entityIds: string[], notes: T[], limit = 3,
) {
  const mine = new Set(entityIds);
  return notes.filter((n) => n.id !== currentId)
    .map((n) => ({ note: n, shared: (n.entityIds ?? []).filter((e) => mine.has(e)).length }))
    .filter((r) => r.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.note.updatedAt.localeCompare(b.note.updatedAt))
    .slice(0, limit);
}

/** "30d", "3m", "1y" or "YYYY-MM-DD" → ISO date, or null. */
export function capsuleDate(input: string, now: number): string | null {
  const s = input.trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d+)\s*([dmy])$/);
  if (!m) return null;
  const d = new Date(now), n = Number(m[1]);
  if (m[2] === "d") d.setUTCDate(d.getUTCDate() + n);
  else if (m[2] === "m") d.setUTCMonth(d.getUTCMonth() + n);
  else d.setUTCFullYear(d.getUTCFullYear() + n);
  return dayKey(d.getTime());
}

const CAPSULE = /^📬\s*(\d{4}-\d{2}-\d{2})\s*[—-]\s*(.*)$/;
export interface Capsule { key: string; noteId: string; date: string; text: string }

export function extractCapsules(noteId: string, content: unknown): Capsule[] {
  const out: Capsule[] = [];
  const walk = (node: TiptapNode) => {
    if (node.type === "paragraph") {
      const m = text(node).trim().match(CAPSULE);
      if (m && m[2].trim()) out.push({ key: `cap:${noteId}:${m[1]}:${m[2].trim()}`, noteId, date: m[1], text: m[2].trim() });
      return;
    }
    (node.content ?? []).forEach(walk);
  };
  walk(parseTiptapContent(content));
  return out;
}

export const dueCapsules = (caps: Capsule[], dismissed: string[], now: number) =>
  caps.filter((c) => c.date <= dayKey(now) && !dismissed.includes(c.key));
