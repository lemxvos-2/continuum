const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const KEY = "continuum-admin-token";
const GOOGLE_KEY = "admin_token";

let token: string | null = sessionStorage.getItem(KEY) ?? localStorage.getItem(GOOGLE_KEY);

export const isLoggedIn = () => token !== null;
export const logout = () => {
  token = null;
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(GOOGLE_KEY);
};

export async function getGoogleLoginUrl() {
  const res = await fetch(`${API}/api/auth/google/url?platform=admin`);
  if (!res.ok) throw new Error("Não foi possível iniciar o login com Google");
  const data = await res.json();
  if (typeof data.url !== "string") throw new Error("Resposta inválida ao iniciar login com Google");
  return data.url as string;
}

export async function completeGoogleLogin(code: string, state: string, redirectUri: string) {
  const res = await fetch(`${API}/api/auth/google/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state, redirectUri }),
  });
  if (!res.ok) throw new Error(`Falha na autenticação Google (${res.status})`);
  const data = await res.json();
  const accessToken = data.accessToken ?? data.token;
  if (typeof accessToken !== "string" || !accessToken) {
    throw new Error("A autenticação Google não retornou um token válido");
  }

  token = accessToken;
  localStorage.setItem(GOOGLE_KEY, accessToken);
  const adminRes = await fetch(`${API}/api/admin/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (adminRes.status === 401 || adminRes.status === 403 || adminRes.status === 404) {
    logout();
    throw new Error("Esta conta Google não tem permissão de administrador. Verifique o ADMIN_EMAIL configurado no servidor.");
  }
  if (!adminRes.ok) {
    logout();
    throw new Error(`Não foi possível validar o acesso administrativo (${adminRes.status})`);
  }
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Credenciais inválidas");
  const data = await res.json();
  token = data.accessToken ?? data.token;
  if (!token) throw new Error("A autenticação não retornou um token válido");
  sessionStorage.setItem(KEY, token);
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
