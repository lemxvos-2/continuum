const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const KEY = "continuum-admin-token";

let token: string | null = sessionStorage.getItem(KEY);

export const isLoggedIn = () => token !== null;
export const logout = () => { token = null; sessionStorage.removeItem(KEY); };

export async function login(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Credenciais inválidas");
  const data = await res.json();
  token = data.accessToken ?? data.token;
  sessionStorage.setItem(KEY, token!);
  try {
    await api("/me");
  } catch {
    logout();
    throw new Error("Esta conta não é a de administrador");
  }
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (!token) throw new Error("Sem sessão");
  const res = await fetch(`${API}/api/admin${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    logout();
    window.dispatchEvent(new Event("admin-logout"));
    throw new Error("Sessão expirada");
  }
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}
