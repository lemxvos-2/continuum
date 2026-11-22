import type * as React from "react";
import {
  ArrowPathIcon, ArrowTopRightOnSquareIcon, BellSlashIcon, BookOpenIcon, ChatBubbleBottomCenterTextIcon, CheckCircleIcon, CheckIcon,
  ClockIcon, EnvelopeOpenIcon, EyeSlashIcon, PencilSquareIcon, QuestionMarkCircleIcon, SparklesIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SmoothDrawer from "@/components/ui/smooth-drawer";
import { isRevisitEnabled, setRevisitEnabled } from "@/lib/revisit-pref";
import { notesApi } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { qk } from "@/lib/queries";
import { useLanguage } from "@/contexts/LanguageContext";
import { getActiveWorkspace } from "@/lib/workspace";
import { noteSearchText } from "@/lib/note-search";
import {
  appendThought, dayKey, dueCapsules, extractCapsules, type Capsule, extractOpenLoops, markRelevant, pickShuffle, snooze, visibleLoops,
  type LoopState, type OpenLoop, type ShuffleState,
} from "@/lib/revisit";

interface NoteLite { id: string; title: string; updatedAt: string; entityIds?: string[] }

const L = {
  pt: { title: "Revisão do dia", sub: "Um minuto para resgatar notas antigas e fechar pensamentos soltos.", later: "Concluir por hoje", off: "Desativar revisão diária", capsule: "Mensagem do seu eu do passado", open: "Ver nota", reply: "Responder", shuffle: "Nota para revisitar", relevant: "Revisada", thought: "Adicionar reflexão", archive: "Não sugerir mais", skip: "Outra nota", save: "Salvar", loops: "pensamentos em aberto", snooze: "Adiar 14 dias", done: "Já resolvi", dismiss: "Dispensar", ph: "O que você pensa hoje?" },
  en: { title: "Daily review", sub: "One minute to revive old notes and close loose thoughts.", later: "Done for today", off: "Turn off daily review", capsule: "A message from your past self", open: "View note", reply: "Reply", shuffle: "Note to revisit", relevant: "Reviewed", thought: "Add reflection", archive: "Don't suggest again", skip: "Another note", save: "Save", loops: "open thoughts", snooze: "Snooze 14 days", done: "Already solved", dismiss: "Dismiss", ph: "What do you think today?" },
  es: { title: "Revisión del día", sub: "Un minuto para rescatar notas antiguas y cerrar ideas sueltas.", later: "Listo por hoy", off: "Desactivar revisión diaria", capsule: "Mensaje de tu yo del pasado", open: "Ver nota", reply: "Responder", shuffle: "Nota para revisar", relevant: "Revisada", thought: "Añadir reflexión", archive: "No sugerir más", skip: "Otra nota", save: "Guardar", loops: "ideas abiertas", snooze: "Posponer 14 días", done: "Ya resuelto", dismiss: "Descartar", ph: "¿Qué piensas hoy?" },
  fr: { title: "Revue du jour", sub: "Une minute pour raviver d'anciennes notes et clore les idées en suspens.", later: "Terminé pour aujourd'hui", off: "Désactiver la revue quotidienne", capsule: "Message de votre moi passé", open: "Voir la note", reply: "Répondre", shuffle: "Note à revisiter", relevant: "Revue", thought: "Ajouter une réflexion", archive: "Ne plus suggérer", skip: "Une autre", save: "Enregistrer", loops: "idées en suspens", snooze: "Reporter 14 jours", done: "Déjà résolu", dismiss: "Ignorer", ph: "Qu'en pensez-vous aujourd'hui ?" },
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

export function RevisitCard({ notes, compact = false }: { notes: NoteLite[]; compact?: boolean }) {
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
  const [caps, setCaps] = useState<Capsule[]>([]);
  const [enabled, setEnabled] = useState(isRevisitEnabled);
  const seenKey = `continuum:revisit:seen:${dayKey(now)}`;
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState<{ key: string; text: string } | null>(null);

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
    const recent = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 40);
    Promise.all(recent.map((n) => detail(n.id).then((d) => extractCapsules(n.id, d.content)).catch(() => [])))
      .then((all) => { if (!cancelled) setCaps(all.flat()); });
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

  const dueCaps = dueCapsules(caps, loopState.dismissed, now).slice(0, 2);
  const sendReply = async (c: Capsule) => {
    if (!reply?.text.trim()) return;
    const d = await detail(c.noteId);
    const content = appendThought(d.content, reply.text.trim(), new Date().toLocaleDateString());
    await notesApi.update(c.noteId, { content });
    queryClient.setQueryData(qk.note(c.noteId), { ...d, content });
    setReply(null);
    updLoops({ ...loopState, dismissed: [...loopState.dismissed, c.key] });
  };

  const has = !!pick || shown.length > 0 || dueCaps.length > 0;
  useEffect(() => {
    if (enabled && has && !localStorage.getItem(seenKey)) { setOpen(true); localStorage.setItem(seenKey, "1"); }
  }, [enabled, has, seenKey]);

  if (!enabled || !has) return null;
  const count = (pick ? 1 : 0) + shown.length + dueCaps.length;
  const dismissKey = (key: string) => updLoops({ ...loopState, dismissed: [...loopState.dismissed, key] });
  const chip = "h-8 gap-1.5 rounded-full px-3 text-xs";
  const Label = ({ icon: I, children }: { icon: typeof SparklesIcon; children: React.ReactNode }) => (
    <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground"><I className="h-3.5 w-3.5" />{children}</p>
  );

  return (
    <>
    {compact ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.title}
        title={t.title}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition active:scale-95 hover:bg-foreground"
      >
        <ArrowPathIcon className="h-5 w-5" />
      </button>
    ) : (
      <button type="button" onClick={() => setOpen(true)} className="group mb-4 inline-flex items-center gap-2 rounded-full border border-border/20 bg-card/50 py-1.5 pl-2.5 pr-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
        <SparklesIcon className="h-4 w-4 text-primary" />
        {t.title}
        <span className="min-w-5 rounded-full bg-primary/15 px-1.5 py-0.5 text-center text-[10px] font-medium text-primary">{count}</span>
      </button>
    )}
    <SmoothDrawer open={open} onOpenChange={setOpen} title={t.title} description={t.sub}>
    <section className="space-y-4 px-5 pb-5">
      {dueCaps.map((c) => (
        <div key={c.key} className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <Label icon={EnvelopeOpenIcon}>{t.capsule}</Label>
          <p className="mt-3 font-serif text-lg leading-snug text-foreground">“{c.text}”</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{title(c.noteId)}</p>
          {reply?.key === c.key ? (
            <div className="mt-3 flex gap-2">
              <Input autoFocus value={reply.text} placeholder={t.ph} onChange={(e) => setReply({ key: c.key, text: e.target.value })} onKeyDown={(e) => e.key === "Enter" && sendReply(c)} />
              <Button size="sm" onClick={() => sendReply(c)}>{t.save}</Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className={chip} onClick={() => setReply({ key: c.key, text: "" })}><ChatBubbleBottomCenterTextIcon className="h-4 w-4" />{t.reply}</Button>
              <Button size="sm" variant="secondary" className={chip} onClick={() => navigate(`/notes/${c.noteId}`)}><ArrowTopRightOnSquareIcon className="h-4 w-4" />{t.open}</Button>
              <Button size="sm" variant="ghost" className={chip} onClick={() => dismissKey(c.key)}><XMarkIcon className="h-4 w-4" />{t.dismiss}</Button>
            </div>
          )}
        </div>
      ))}
      {pick && (
        <div className="rounded-2xl border border-border/20 bg-card/60 p-4">
          <Label icon={BookOpenIcon}>{t.shuffle}</Label>
          <button className="mt-3 block w-full text-left" onClick={() => navigate(`/notes/${pick.id}`)}>
            <h3 className="font-serif text-xl leading-tight text-foreground">{pick.title || "—"}</h3>
            {preview && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{preview}</p>}
          </button>
          {thought !== null ? (
            <div className="mt-3 flex gap-2">
              <Input autoFocus value={thought} placeholder={t.ph} onChange={(e) => setThought(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addThought()} />
              <Button size="sm" onClick={addThought}>{t.save}</Button>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" className="h-9 gap-1.5" onClick={() => updShuffle(markRelevant(shuffle, pick.id, now))}><CheckIcon className="h-4 w-4" />{t.relevant}</Button>
                <Button size="sm" variant="secondary" className="h-9 gap-1.5" onClick={() => setThought("")}><PencilSquareIcon className="h-4 w-4" />{t.thought}</Button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                {skip < 3 ? (
                  <Button size="sm" variant="ghost" className={chip} onClick={() => { localStorage.setItem(skipKey, String(skip + 1)); setSkip(skip + 1); }}><ArrowPathIcon className="h-4 w-4" />{t.skip} · {3 - skip}</Button>
                ) : <span />}
                <Button size="sm" variant="ghost" className={chip + " text-muted-foreground"} onClick={() => updShuffle({ ...shuffle, archived: [...shuffle.archived, pick.id] })}><EyeSlashIcon className="h-4 w-4" />{t.archive}</Button>
              </div>
            </>
          )}
        </div>
      )}
      {shown.length > 0 && (
        <div className="rounded-2xl border border-border/20 bg-card/60 p-4">
          <Label icon={QuestionMarkCircleIcon}>{shown.length} {t.loops}</Label>
          <ul className="mt-2 divide-y divide-border/10">
            {shown.map((l) => (
              <li key={l.key} className="py-3 first:pt-2 last:pb-0">
                <button className="block w-full text-left" onClick={() => navigate(`/notes/${l.noteId}`)}>
                  <p className="text-sm leading-snug text-foreground">{l.text}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground"><ArrowTopRightOnSquareIcon className="h-3 w-3 shrink-0" />{title(l.noteId)}</p>
                </button>
                <div className="mt-2 flex gap-1.5">
                  <Button size="sm" variant="secondary" className="h-7 gap-1 rounded-full px-2.5 text-xs" onClick={() => updLoops(snooze(loopState, l.key, now))}><ClockIcon className="h-3.5 w-3.5" />{t.snooze}</Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full px-2.5 text-xs" onClick={() => dismissKey(l.key)}><CheckCircleIcon className="h-3.5 w-3.5" />{t.done}</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-1 pt-1">
        <Button className="h-11 w-full rounded-xl" onClick={() => setOpen(false)}>{t.later}</Button>
        <button type="button" className="mx-auto flex items-center gap-1.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground" onClick={() => { setRevisitEnabled(false); setEnabled(false); setOpen(false); }}>
          <BellSlashIcon className="h-3.5 w-3.5" />{t.off}
        </button>
      </div>
    </section>
    </SmoothDrawer>
    </>
  );
}
