export type ChatAddress = { street: string; number: string; neighborhood: string; city: string };
export type ChatProgramming = { id: number; name: string; description: string; startDate: string; endDate: string; isFree: boolean; minPrice: number; imageUrl: string; address: ChatAddress };
export type ChatHost = { id: number; name: string; description: string; typeofhost: number; logoUrl: string; address: ChatAddress };
export type TravelChatResult = { programmings: ChatProgramming[]; hosts: ChatHost[] };

export function parseTravelChatResult(value: unknown): TravelChatResult {
  const result = value as TravelChatResult | null;
  if (!result || !Array.isArray(result.programmings) || !Array.isArray(result.hosts) || [...result.programmings, ...result.hosts].some((item) => !item || !Number.isInteger(item.id) || item.id <= 0 || typeof item.name !== 'string')) {
    throw new Error('Não foi possível ler as opções do assistente. Tente novamente.');
  }
  return {
    programmings: [...new Map(result.programmings.map((item) => [item.id, item])).values()],
    hosts: [...new Map(result.hosts.map((item) => [item.id, item])).values()],
  };
}

export async function sendTravelChatMessage(text: string, token: string, signal: AbortSignal): Promise<TravelChatResult> {
  signal.throwIfAborted();
  const message = text.trim();
  if (!message || message.length > 4000) {
    throw new Error('Escreva uma mensagem de até 4.000 caracteres.');
  }
  const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
  const request = (jwt: string) => fetch(`${apiBaseUrl}/api/TravelChat/Messages`, {
    method: 'POST', signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    body: JSON.stringify({ text: message }),
  });
  let response = await request(token);
  if (response.status === 401 && token) {
    response = await request('');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Você enviou muitos pedidos seguidos. Aguarde um pouco e tente novamente.');
    }
    if (response.status >= 500) {
      throw new Error('O assistente está indisponível agora. Tente novamente em instantes.');
    }
    throw new Error(body?.detail || body?.title || 'Não foi possível consultar as opções. Tente novamente.');
  }
  return parseTravelChatResult(body);
}
