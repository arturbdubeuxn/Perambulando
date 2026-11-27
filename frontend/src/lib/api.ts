// Cliente HTTP compartilhado. A URL vem de EXPO_PUBLIC_API_URL (variável pública:
// nunca coloque segredos nela). Sem a variável, usa a API local do perfil http.
export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(
  /\/$/,
  '',
);

// Formato de ProblemDetails / ValidationProblemDetails devolvido pelos controllers.
export type ApiErrorBody = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export class ApiRequestError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    const validationMessages = body?.errors ? Object.values(body.errors).flat() : [];
    super(body?.detail || validationMessages.join(' ') || body?.title || 'A requisição falhou.');
    this.status = status;
    this.body = body;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    throw new ApiRequestError(response.status, body as ApiErrorBody | null);
  }

  return body as T;
}

// fetch lança TypeError quando não consegue falar com a API (API fora do ar, CORS, rede).
export const isNetworkError = (error: unknown) => error instanceof TypeError;
