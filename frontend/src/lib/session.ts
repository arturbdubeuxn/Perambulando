import { ApiRequestError, apiRequest } from './api';

// Mesmas chaves que o cadastro de host e a tela de criar evento já usam. Assim,
// quem entra pelo nosso login passa a funcionar nas telas que leem a sessão.
const ACCESS_TOKEN_KEY = 'perambulando.accessToken';
const HOST_ID_KEY = 'perambulando.hostId';

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

// Na web usamos sessionStorage (some ao fechar a aba). Ele NÃO é um cofre seguro:
// qualquer script da própria página consegue lê-lo.
function getWebStorage(): StorageLike | null {
  try {
    return (globalThis as { sessionStorage?: StorageLike }).sessionStorage ?? null;
  } catch {
    return null;
  }
}

// Fora da web, por enquanto a sessão fica só na memória (some ao fechar o app).
// Quando o expo-secure-store for aprovado, ele entra aqui, atrás das mesmas funções.
const memoryStore = new Map<string, string>();

function readItem(key: string): string | null {
  const storage = getWebStorage();
  return storage ? storage.getItem(key) : (memoryStore.get(key) ?? null);
}

function writeItem(key: string, value: string) {
  const storage = getWebStorage();
  if (storage) {
    storage.setItem(key, value);
  } else {
    memoryStore.set(key, value);
  }
}

function removeItem(key: string) {
  const storage = getWebStorage();
  if (storage) {
    storage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

// Lê só a data de expiração (claim exp) do JWT, para a interface saber quando a
// sessão venceu. Não verifica assinatura: quem valida o token é sempre a API.
function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decode = (globalThis as { atob?: (data: string) => string }).atob;
    if (!payload || !decode) {
      return null;
    }
    const json = JSON.parse(decode(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: unknown;
    };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function setSession(session: { accessToken: string; hostId?: number }) {
  writeItem(ACCESS_TOKEN_KEY, session.accessToken);
  if (session.hostId !== undefined) {
    writeItem(HOST_ID_KEY, String(session.hostId));
  }
}

export async function clearSession() {
  removeItem(ACCESS_TOKEN_KEY);
  removeItem(HOST_ID_KEY);
}

// Devolve o token, ou null se não houver sessão ou se ela já tiver expirado
// (nesse caso a sessão é limpa).
export async function getToken(): Promise<string | null> {
  const token = readItem(ACCESS_TOKEN_KEY);
  if (!token) {
    return null;
  }

  const expiresAt = tokenExpiresAt(token);
  if (expiresAt !== null && expiresAt <= Date.now()) {
    await clearSession();
    return null;
  }

  return token;
}

export async function getHostId(): Promise<number | null> {
  const value = Number(readItem(HOST_ID_KEY) ?? 0);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function isLoggedIn() {
  return (await getToken()) !== null;
}

export async function authHeader(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Como apiRequest, mas envia o Bearer. Se a API responder 401 (token ausente,
// inválido ou expirado), a sessão local é apagada e o erro segue para a tela,
// que decide redirecionar para o login.
export async function authedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeader();
  try {
    return await apiRequest<T>(path, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      await clearSession();
    }
    throw error;
  }
}
