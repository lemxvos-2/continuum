import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, completeGoogleLogin, getGoogleLoginUrl, isLoggedIn, login, logout } from "./api";
import "./styles.css";

type Tab = "metrics" | "users" | "billing";
const EMAIL_AUTH_ENABLED = String(import.meta.env.VITE_DEV_MODE ?? "false").toLowerCase() === "true";

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  return (
    <form className="card login" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr("");
      try { await login(email, password); onDone(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
    }}>
      <h1>Continuum Admin</h1>
      <button type="button" className="google-login" disabled={googleBusy} onClick={async () => {
        setGoogleBusy(true); setErr("");
        try { window.location.href = await getGoogleLoginUrl(); } catch (x: any) { setErr(x.message); setGoogleBusy(false); }
      }}>
        <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.85 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
        {googleBusy ? "Redirecionando…" : "Entrar com Google"}
      </button>
      {EMAIL_AUTH_ENABLED && <>
        <div className="login-divider"><span>ou entre com e-mail</span></div>
        <input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </>}
      {err && <p className="err">{err}</p>}
      {EMAIL_AUTH_ENABLED && <button disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>}
    </form>
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
    <div className="card login">
      <h1>Continuum Admin</h1>
      {loading ? <p>Validando sua conta Google…</p> : <p className="err">{err}</p>}
      {!loading && <button onClick={() => { window.location.href = "/"; }}>Voltar ao login</button>}
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

function Metrics() {
  const { data, err } = useLoad(() => api("/metrics"), []);
  if (err) return <p className="err">{err}</p>;
  if (!data) return <p>Carregando…</p>;
  const stats: [string, number][] = [
    ["Usuários", data.totalUsers], ["Ativos", data.activeUsers], ["Novos (7d)", data.newUsers7d],
    ["Novos (30d)", data.newUsers30d], ["Notas", data.totalNotes], ["Entidades", data.totalEntities], ["Workspaces", data.totalWorkspaces],
  ];
  return (
    <>
      <div className="grid">{stats.map(([l, v]) => <div className="card stat" key={l}><span>{l}</span><b>{v}</b></div>)}</div>
      <h2>Usuários por plano</h2>
      <div className="grid">{Object.entries(data.usersByPlan).map(([p, v]) => <div className="card stat" key={p}><span>{p}</span><b>{v as number}</b></div>)}</div>
      <h2>Saúde do servidor</h2>
      <div className="card">Status: <b>{data.health.status}</b> · Memória {data.health.heapUsedMb}/{data.health.heapMaxMb} MB · CPUs {data.health.processors} · {new Date(data.health.serverTime).toLocaleString()}</div>
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
  return (
    <>
      <input className="search" placeholder="Buscar por e-mail ou usuário" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
      {err && <p className="err">{err}</p>}
      {data && (
        <>
          <table>
            <thead><tr><th>Usuário</th><th>E-mail</th><th>Plano</th><th>Notas</th><th>Entidades</th><th>Criado</th><th>Status</th><th /></tr></thead>
            <tbody>{data.items.map((u: any) => (
              <tr key={u.id}>
                <td>{u.username}{u.role === "ADMIN" && <em> admin</em>}</td><td>{u.email}</td><td>{u.plan}</td>
                <td>{u.noteCount}</td><td>{u.entityCount}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>{u.active ? "Ativo" : "Bloqueado"}</td>
                <td><button className="sm" onClick={() => toggle(u.id, !u.active)}>{u.active ? "Bloquear" : "Ativar"}</button></td>
              </tr>))}</tbody>
          </table>
          <div className="pager">
            <button className="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
            <span>Página {page + 1} de {Math.max(1, Math.ceil(data.total / 25))} · {data.total} usuários</span>
            <button className="sm" disabled={(page + 1) * 25 >= data.total} onClick={() => setPage(page + 1)}>Próxima</button>
          </div>
        </>
      )}
    </>
  );
}

function Billing() {
  const { data, err } = useLoad(() => api("/subscriptions"), []);
  if (err) return <p className="err">{err}</p>;
  if (!data) return <p>Carregando…</p>;
  return (
    <>
      <div className="grid">{Object.entries(data.byStatus).map(([s, v]) => <div className="card stat" key={s}><span>{s}</span><b>{v as number}</b></div>)}</div>
      <table>
        <thead><tr><th>E-mail</th><th>Plano</th><th>Status</th><th>Ciclo</th><th>Renova em</th><th>Cancela</th><th>Stripe</th></tr></thead>
        <tbody>{data.items.map((s: any) => (
          <tr key={s.id}>
            <td>{s.userEmail ?? "—"}</td><td>{s.plan}</td><td>{s.status}</td><td>{s.interval ?? "—"}</td>
            <td>{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}</td>
            <td>{s.cancelAtPeriodEnd ? "Sim" : "Não"}</td>
            <td>{s.stripeSubscriptionId ? <a href={`https://dashboard.stripe.com/subscriptions/${s.stripeSubscriptionId}`} target="_blank" rel="noreferrer">abrir</a> : "—"}</td>
          </tr>))}</tbody>
      </table>
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
  return (
    <div className="shell">
      <header>
        <b>Continuum Admin</b>
        <nav>
          {(["metrics", "users", "billing"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {{ metrics: "Métricas", users: "Usuários", billing: "Assinaturas" }[t]}
            </button>
          ))}
        </nav>
        <button className="sm" onClick={() => { logout(); setLogged(false); }}>Sair</button>
      </header>
      <main>{tab === "metrics" ? <Metrics /> : tab === "users" ? <Users /> : <Billing />}</main>
    </div>
  );
}

function App() {
  return window.location.pathname === "/google-callback" ? <GoogleCallback /> : <Dashboard />;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
