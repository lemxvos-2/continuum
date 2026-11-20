import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notesApi } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { qk } from "@/lib/queries";
import { useLanguage } from "@/contexts/LanguageContext";
import { getActiveWorkspace } from "@/lib/workspace";
import { noteSearchText } from "@/lib/note-search";
import {
  appendThought, dayKey, extractOpenLoops, markRelevant, pickShuffle, snooze, visibleLoops,
  type LoopState, type OpenLoop, type ShuffleState,
} from "@/lib/revisit";

interface NoteLite { id: string; title: string; updatedAt: string; entityIds?: string[] }

const L = {
  pt: { shuffle: "1 minuto por dia", relevant: "Ainda relevante", thought: "Adicionar pensamento", archive: "Desapegar", skip: "Pular", save: "Salvar", loops: "pensamentos incompletos", resolve: "Resolver", snooze: "Adiar", dismiss: "Descartar", ph: "Seu pensamento de hoje…" },
  en: { shuffle: "1 minute a day", relevant: "Still relevant", thought: "Add thought", archive: "Let go", skip: "Skip", save: "Save", loops: "unfinished thoughts", resolve: "Resolve", snooze: "Snooze", dismiss: "Dismiss", ph: "Today's thought…" },
  es: { shuffle: "1 minuto al día", relevant: "Aún relevante", thought: "Añadir idea", archive: "Soltar", skip: "Saltar", save: "Guardar", loops: "pensamientos incompletos", resolve: "Resolver", snooze: "Posponer", dismiss: "Descartar", ph: "Tu idea de hoy…" },
  fr: { shuffle: "1 minute par jour", relevant: "Toujours pertinent", thought: "Ajouter une pensée", archive: "Lâcher prise", skip: "Passer", save: "Enregistrer", loops: "pensées inachevées", resolve: "Résoudre", snooze: "Reporter", dismiss: "Ignorer", ph: "Votre pensée du jour…" },
};

const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const SK = "continuum:revisit:shuffle", LK = "continuum:revisit:loops";
const DAY = 86_400_000;

async function detail(id: string) {
  const cached = queryClient.getQueryData<{ content?: unknown }>(qk.note(id));
  if (cached && "content" in cached) return cached;
  const d = (await notesApi.get(id)).data;
  queryClient.setQueryData(qk.note(id), d);
  return d;
}

export function RevisitCard({ notes }: { notes: NoteLite[] }) {
  const { language } = useLanguage();
  const t = L[language as keyof typeof L] ?? L.en;
  const navigate = useNavigate();
  const now = Date.now();
  const ws = getActiveWorkspace() ?? "all";
  const [shuffle, setShuffle] = useState<ShuffleState>(() => load(SK, { stage: {}, next: {}, archived: [] }));
  const [loopState, setLoopState] = useState<LoopState>(() => load(LK, { snoozed: {}, dismissed: [] }));
  const skipKey = `continuum:revisit:skip:${dayKey(now)}`;
  const [skip, setSkip] = useState(() => Number(localStorage.getItem(skipKey) || 0));
  const [preview, setPreview] = useState("");
  const [thought, setThought] = useState<string | null>(null);
  const [loops, setLoops] = useState<OpenLoop[]>([]);

  const pick = useMemo(() => pickShuffle(notes, shuffle, String(ws), skip, now), [notes, shuffle, ws, skip]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPreview("");
    if (!pick) return;
    detail(pick.id).then((d) => setPreview(noteSearchText(d.content).slice(0, 220))).catch(() => {});
  }, [pick]);

  // Scan up to 15 notes older than 7 days for open loops (details are cached).
  useEffect(() => {
    let cancelled = false;
    const old = notes.filter((n) => now - new Date(n.updatedAt).getTime() > 7 * DAY)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).slice(0, 15);
    Promise.all(old.map((n) => detail(n.id).then((d) => extractOpenLoops(n.id, d.content)).catch(() => [])))
      .then((all) => { if (!cancelled) setLoops(all.flat()); });
    return () => { cancelled = true; };
  }, [notes.length, ws]); // eslint-disable-line react-hooks/exhaustive-deps

  const updShuffle = (s: ShuffleState) => { setShuffle(s); save(SK, s); };
  const updLoops = (s: LoopState) => { setLoopState(s); save(LK, s); };
  const shown = visibleLoops(loops, loopState, now);
  const title = (id: string) => notes.find((n) => n.id === id)?.title || "—";

  const addThought = async () => {
    if (!pick || !thought?.trim()) return;
    const d = await detail(pick.id);
    const content = appendThought(d.content, thought.trim(), new Date().toLocaleDateString());
    await notesApi.update(pick.id, { content });
    queryClient.setQueryData(qk.note(pick.id), { ...d, content });
    setThought(null);
    updShuffle(markRelevant(shuffle, pick.id, now));
  };

  if (!pick && !shown.length) return null;

  return (
    <section className="mb-6 space-y-3">
      {pick && (
        <div className="rounded-xl border border-border/20 bg-card/50 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{t.shuffle}</p>
          <button className="mt-2 block text-left" onClick={() => navigate(`/notes/${pick.id}`)}>
            <h3 className="font-serif text-xl text-foreground">{pick.title || "—"}</h3>
            {preview && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{preview}</p>}
          </button>
          {thought !== null ? (
            <div className="mt-3 flex gap-2">
              <Input autoFocus value={thought} placeholder={t.ph} onChange={(e) => setThought(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addThought()} />
              <Button size="sm" onClick={addThought}>{t.save}</Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => updShuffle(markRelevant(shuffle, pick.id, now))}>📌 {t.relevant}</Button>
              <Button size="sm" variant="secondary" onClick={() => setThought("")}>✏️ {t.thought}</Button>
              <Button size="sm" variant="ghost" onClick={() => updShuffle({ ...shuffle, archived: [...shuffle.archived, pick.id] })}>📦 {t.archive}</Button>
              {skip < 3 && <Button size="sm" variant="ghost" onClick={() => { localStorage.setItem(skipKey, String(skip + 1)); setSkip(skip + 1); }}>{t.skip}</Button>}
            </div>
          )}
        </div>
      )}
      {shown.length > 0 && (
        <div className="rounded-xl border border-border/20 bg-card/50 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{shown.length} {t.loops}</p>
          <ul className="mt-2 space-y-3">
            {shown.map((l) => (
              <li key={l.key}>
                <p className="text-sm text-foreground">“{l.text}”</p>
                <p className="text-xs text-muted-foreground">{title(l.noteId)}</p>
                <div className="mt-1 flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => navigate(`/notes/${l.noteId}`)}>{t.resolve}</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => updLoops(snooze(loopState, l.key, now))}>{t.snooze}</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => updLoops({ ...loopState, dismissed: [...loopState.dismissed, l.key] })}>{t.dismiss}</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
