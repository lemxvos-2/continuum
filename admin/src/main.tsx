import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, AlertCircle, ArrowLeft, Ban, BarChart3, Boxes, ChevronLeft, ChevronRight, Cpu, CreditCard,
  ExternalLink, FileText, FolderKanban, Loader2, LogOut, Mail, MemoryStick, Search, ShieldCheck,
  Sparkles, UserCheck, UserPlus, Users as UsersIcon,
} from "lucide-react";
import { api, completeGoogleLogin, getGoogleLoginUrl, isLoggedIn, login, logout } from "./api";
import "./styles.css";

type Tab = "metrics" | "users" | "billing";
const EMAIL_AUTH_ENABLED = String(import.meta.env.VITE_DEV_MODE ?? "false").toLowerCase() === "true";
const ic = { className: "icon", strokeWidth: 1.75 };

const TABS: { id: Tab; label: string; Icon: typeof BarChart3 }[] = [
  { id: "metrics", label: "Métricas", Icon: BarChart3 },
  { id: "users", label: "Usuários", Icon: UsersIcon },
  { id: "billing", label: "Assinaturas", Icon: CreditCard },
];

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><Sparkles {...ic} /></div>
      <div><div className="brand-name">Continuum</div><div className="brand-sub">Admin</div></div>
    </div>
  );
}

function ErrorAlert({ msg }: { msg: string }) {
  return <div className="alert" role="alert"><AlertCircle {...ic} /><span>{msg}</span></div>;
}

function Loading({ label = "Carregando…" }: { label?: string }) {
  return <div className="loading"><Loader2 {...ic} className="icon spin" />{label}</div>;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.85 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.130.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.910-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  return (
    <div className="login-screen">
      <form className="card login" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr("");
        try { await login(email, password); onDone(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
      }}>
        <Brand />
        <h1>Entrar no painel</h1>
        <p className="lead">Acesso restrito à conta de administrador.</p>
        <button type="button" className="btn btn-outline btn-block google-login" disabled={googleBusy} onClick={async () => {
          setGoogleBusy(true); setErr("");
          try { window.location.href = await getGoogleLoginUrl(); } catch (x: any) { setErr(x.message); setGoogleBusy(false); }
        }}>
          {googleBusy ? <Loader2 {...ic} className="icon spin" /> : <GoogleIcon />}
          {googleBusy ? "Redirecionando…" : "Entrar com Google"}
        </button>
        {EMAIL_AUTH_ENABLED && <>
          <div className="divider">ou</div>
          <div className="input-wrap"><Mail {...ic} /><input className="input" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="input-wrap"><ShieldCheck {...ic} /><input className="input" placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        </>}
        {err && <ErrorAlert msg={err} />}
        {EMAIL_AUTH_ENABLED && <button className="btn btn-primary btn-block" disabled={busy}>{busy && <Loader2 {...ic} className="icon spin" />}{busy ? "Entrando…" : "Entrar"}</button>}
      </form>
    </div>
  );
}

function GoogleCallback() {
  const started = useRef(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      setErr("Não foi possível concluir o login: faltam parâmetros do Google.");
      setLoading(false);
      return;
    }
    completeGoogleLogin(code, state, `${window.location.origin}/google-callback`)
      .then(() => { window.location.replace("/"); })
      .catch((error: unknown) => {
        setErr(error instanceof Error ? error.message : "Não foi possível concluir o login com Google.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="login-screen">
      <div className="card login">
        <Brand />
        {loading ? <Loading label="Validando sua conta Google…" /> : <ErrorAlert msg={err} />}
        {!loading && <button className="btn btn-secondary btn-block" onClick={() => { window.location.href = "/"; }}><ArrowLeft {...ic} />Voltar ao login</button>}
      </div>
    </div>
  );
}

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState("");
  const reload = () => fn().then(setData).catch((e) => setErr(e.message));
  useEffect(() => { reload(); }, deps); // eslint-disable-line
  return { data, err, reload };
}

function Stat({ label, value, Icon }: { label: string; value: number; Icon: typeof BarChart3 }) {
  return (
    <div className="card stat">
      <div className="stat-head"><span>{label}</span><Icon {...ic} /></div>
      <div className="stat-value">{(value ?? 0).toLocaleString("pt-BR")}</div>
    </div>
  );
}

function statusTone(s: string) {
  const v = String(s).toUpperCase();
  if (["ACTIVE", "TRIALING", "UP", "OK"].includes(v)) return "success";
  if (["PAST_DUE", "INCOMPLETE", "UNPAID"].includes(v)) return "warning";
  if (["CANCELED", "CANCELLED", "DOWN", "INCOMPLETE_EXPIRED"].includes(v)) return "danger";
  return "";
}

function Metrics() {
  const { data, err } = useLoad(() => api("/metrics"), []);
  if (err) return <ErrorAlert msg={err} />;
  if (!data) return <Loading />;
  const stats: [string, number, typeof BarChart3][] = [
    ["Usuários", data.totalUsers, UsersIcon], ["Ativos", data.activeUsers, UserCheck],
    ["Novos (7d)", data.newUsers7d, UserPlus], ["Novos (30d)", data.newUsers30d, UserPlus],
    ["Notas", data.totalNotes, FileText], ["Entidades", data.totalEntities, Boxes], ["Workspaces", data.totalWorkspaces, FolderKanban],
  ];
  const h = data.health;
  const pct = h.heapMaxMb ? Math.min(100, Math.round((h.heapUsedMb / h.heapMaxMb) * 100)) : 0;
  return (
    <>
      <section><h3 className="section-title">Visão geral</h3>
        <div className="grid">{stats.map(([l, v, I]) => <Stat key={l} label={l} value={v} Icon={I} />)}</div>
      </section>
      <section><h3 className="section-title">Usuários por plano</h3>
        <div className="grid">{Object.entries(data.usersByPlan).map(([p, v]) => <Stat key={p} label={p} value={v as number} Icon={CreditCard} />)}</div>
      </section>
      <section className="card">
        <div className="card-header"><h3 className="card-title"><Activity {...ic} />Saúde do servidor</h3><span className={`badge dot ${statusTone(h.status)}`}>{h.status}</span></div>
        <div className="card-pad health">
          <div className="health-item"><MemoryStick {...ic} />Memória <b>{h.heapUsedMb}/{h.heapMaxMb} MB</b><div className="meter"><span style={{ width: `${pct}%` }} /></div></div>
          <div className="health-item"><Cpu {...ic} />CPUs <b>{h.processors}</b></div>
          <div className="health-item muted">{new Date(h.serverTime).toLocaleString("pt-BR")}</div>
        </div>
      </section>
    </>
  );
}

function Users() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { data, err, reload } = useLoad(() => api(`/users?q=${encodeURIComponent(q)}&page=${page}&size=25`), [q, page]);
  const toggle = async (id: string, active: boolean) => {
    if (!confirm(active ? "Ativar este usuário?" : "Bloquear este usuário?")) return;
    try { await api(`/users/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) }); reload(); } catch (e: any) { alert(e.message); }
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / 25)) : 1;
  return (
    <section className="card">
      <div className="toolbar">
        <div className="input-wrap"><Search {...ic} /><input className="input" placeholder="Buscar por e-mail ou usuário" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /></div>
        {data && <span className="muted" style={{ fontSize: 12 }}>{data.total} usuários</span>}
      </div>
      {err && <div className="card-pad"><ErrorAlert msg={err} /></div>}
      {!data && !err && <div className="card-pad"><Loading /></div>}
      {data && (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Usuário</th><th>E-mail</th><th>Plano</th><th>Notas</th><th>Entidades</th><th>Criado</th><th>Status</th><th /></tr></thead>
              <tbody>{data.items.length === 0 ? <tr><td colSpan={8} className="empty">Nenhum usuário encontrado.</td></tr> : data.items.map((u: any) => (
                <tr key={u.id}>
                  <td><div className="user-cell"><span className="avatar">{String(u.username ?? u.email ?? "?").slice(0, 2)}</span>{u.username}{u.role === "ADMIN" && <span className="badge info">admin</span>}</div></td>
                  <td className="muted">{u.email}</td>
                  <td><span className="badge">{u.plan}</span></td>
                  <td className="num">{u.noteCount}</td><td className="num">{u.entityCount}</td>
                  <td className="num">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td><span className={`badge dot ${u.active ? "success" : "danger"}`}>{u.active ? "Ativo" : "Bloqueado"}</span></td>
                  <td style={{ textAlign: "right" }}>
                    {u.active
                      ? <button className="btn btn-danger btn-sm" onClick={() => toggle(u.id, false)}><Ban {...ic} />Bloquear</button>
                      : <button className="btn btn-outline btn-sm" onClick={() => toggle(u.id, true)}><UserCheck {...ic} />Ativar</button>}
                  </td>
                </tr>))}</tbody>
            </table>
          </div>
          <div className="pager">
            <span>Página {page + 1} de {pages}</span>
            <div className="pager-btns">
              <button className="btn btn-outline btn-sm btn-icon" aria-label="Anterior" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft {...ic} /></button>
              <button className="btn btn-outline btn-sm btn-icon" aria-label="Próxima" disabled={(page + 1) * 25 >= data.total} onClick={() => setPage(page + 1)}><ChevronRight {...ic} /></button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Billing() {
  const { data, err } = useLoad(() => api("/subscriptions"), []);
  if (err) return <ErrorAlert msg={err} />;
  if (!data) return <Loading />;
  return (
    <>
      <section><h3 className="section-title">Por status</h3>
        <div className="grid">{Object.entries(data.byStatus).map(([s, v]) => <Stat key={s} label={s} value={v as number} Icon={CreditCard} />)}</div>
      </section>
      <section className="card">
        <div className="card-header"><h3 className="card-title"><CreditCard {...ic} />Assinaturas</h3><span className="muted" style={{ fontSize: 12 }}>{data.items.length} no total</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>E-mail</th><th>Plano</th><th>Status</th><th>Ciclo</th><th>Renova em</th><th>Cancela</th><th>Stripe</th></tr></thead>
            <tbody>{data.items.length === 0 ? <tr><td colSpan={7} className="empty">Nenhuma assinatura.</td></tr> : data.items.map((s: any) => (
              <tr key={s.id}>
                <td>{s.userEmail ?? "—"}</td>
                <td><span className="badge">{s.plan}</span></td>
                <td><span className={`badge dot ${statusTone(s.status)}`}>{s.status}</span></td>
                <td className="muted">{s.interval ?? "—"}</td>
                <td className="num">{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString("pt-BR") : "—"}</td>
                <td>{s.cancelAtPeriodEnd ? <span className="badge warning">Sim</span> : <span className="muted">Não</span>}</td>
                <td>{s.stripeSubscriptionId ? <a className="link" href={`https://dashboard.stripe.com/subscriptions/${s.stripeSubscriptionId}`} target="_blank" rel="noreferrer">Abrir<ExternalLink {...ic} /></a> : "—"}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Dashboard() {
  const [logged, setLogged] = useState(isLoggedIn());
  const [tab, setTab] = useState<Tab>("metrics");
  useEffect(() => {
    const out = () => setLogged(false);
    window.addEventListener("admin-logout", out);
    return () => window.removeEventListener("admin-logout", out);
  }, []);
  if (!logged) return <Login onDone={() => setLogged(true)} />;
  const current = TABS.find((t) => t.id === tab)!;
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`nav-item ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}><Icon {...ic} />{label}</button>
        ))}
        <div className="sidebar-foot">
          <button className="nav-item" onClick={() => { logout(); setLogged(false); }}><LogOut {...ic} />Sair</button>
        </div>
      </aside>
      <div className="content">
        <div className="topbar"><h2>{current.label}</h2></div>
        <main>{tab === "metrics" ? <Metrics /> : tab === "users" ? <Users /> : <Billing />}</main>
      </div>
    </div>
  );
}

function App() {
  return window.location.pathname === "/google-callback" ? <GoogleCallback /> : <Dashboard />;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
