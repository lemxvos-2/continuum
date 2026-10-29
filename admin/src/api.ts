const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

// Kept only in memory (lost on reload) to reduce exposure to XSS / shared machines.
let session: { token: string; adminKey: string } | null = null;

export const isLoggedIn = () => session !== null;
export const logout = () => { session = null; };

export async function login(email: string, password: string, adminKey: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Credenciais inválidas");
  const data = await res.json();
  const token = data.accessToken ?? data.token;
  session = { token, adminKey };
  try {
    await api("/metrics");
  } catch {
    session = null;
    throw new Error("Acesso negado");
  }
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (!session) throw new Error("Sem sessão");
  const res = await fetch(`${API}/api/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
      "X-Admin-Key": session.adminKey,
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401 || res.status === 404) { session = null; throw new Error("Sessão expirada ou acesso negado"); }
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}
