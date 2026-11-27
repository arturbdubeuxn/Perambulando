import type { OpeningWeek } from './openingHours';

export type RoadmapKind = 'host' | 'programming';
export type RoadmapStop = { key: string; kind: RoadmapKind; id: number; name: string; imageUrl: string; startDate: string; endDate: string; eventStart?: string; eventEnd?: string };
export type RoadmapDraft = { id?: number; owned: boolean; name: string; description: string; stops: RoadmapStop[]; dirty: boolean; revision: number };
export type RoadmapResponse = { id: number; name: string; description?: string; roadmapProgrammingResponseDTO: { programmingId?: number; hostId?: number; order: number; startDate: string; endDate: string; programming?: { name: string; imageUrl: string; startDate: string; endDate: string }; hostDTO?: { name: string; logoUrl: string } }[] };
const listeners = new Set<() => void>();
const drafts = new Map<string, RoadmapDraft>();
let pending = Promise.resolve();
const newDraft = (): RoadmapDraft => ({ owned: false, name: 'Meu passeio', description: '', stops: [], dirty: false, revision: 0 });
const visitorRoadmapIndexKey = 'perambulando.roadmaps.guest';

export function roadmapToken() {
  try {
    return globalThis.sessionStorage?.getItem('perambulando.accessToken') ?? '';
  } catch {
    return '';
  }
}

function storageKey() {
  // Separate visitor drafts and authenticated sessions without persisting the JWT.
  const token = roadmapToken();
  let hash = 0;
  for (const character of token) { hash = (hash * 31 + character.charCodeAt(0)) | 0; }
  return `perambulando.roadmap.${token ? hash : 'guest'}`;
}

export function getRoadmapDraft(): RoadmapDraft {
  const key = storageKey();
  if (!drafts.has(key)) {
    let draft = newDraft();
    try {
      const value = JSON.parse(globalThis.localStorage?.getItem(key) ?? 'null');
      if (value && typeof value.name === 'string' && Array.isArray(value.stops) && value.stops.every((stop: RoadmapStop) => stop && ['host', 'programming'].includes(stop.kind) && Number.isInteger(stop.id) && stop.id > 0 && typeof stop.startDate === 'string' && typeof stop.endDate === 'string')) {
        draft = { ...draft, ...value };
      }
    } catch { /* Keep the session draft when storage is unavailable. */ }
    drafts.set(key, draft);
  }
  return drafts.get(key)!;
}

export function storeRoadmapDraft(draft: RoadmapDraft) {
  const next = { ...draft, revision: getRoadmapDraft().revision + 1 };
  drafts.set(storageKey(), next);
  try { globalThis.localStorage?.setItem(storageKey(), JSON.stringify(next)); } catch { /* Shared session state remains available. */ }
  listeners.forEach((listener) => listener());
  return next;
}

export function subscribeToRoadmap(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => {
    if (event.key === storageKey() || event.key === null) { drafts.delete(storageKey()); listener(); }
  };
  globalThis.addEventListener?.('storage', storage);
  return () => { listeners.delete(listener); globalThis.removeEventListener?.('storage', storage); };
}

export function resetRoadmapDraft() { return storeRoadmapDraft(newDraft()); }

export function getVisitorRoadmapIds() {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(visitorRoadmapIndexKey) ?? '[]');
    return Array.isArray(value) ? [...new Set(value.filter((id): id is number => Number.isInteger(id) && id > 0))] : [];
  } catch {
    return [];
  }
}

function storeVisitorRoadmapIds(ids: number[]) {
  try { globalThis.localStorage?.setItem(visitorRoadmapIndexKey, JSON.stringify([...new Set(ids)])); } catch { /* The current draft remains available in memory. */ }
}

export function rememberVisitorRoadmap(id: number) {
  if (Number.isInteger(id) && id > 0) { storeVisitorRoadmapIds([...getVisitorRoadmapIds(), id]); }
}

export async function roadmapRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = roadmapToken();
  const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
  const response = await fetch(`${base}${path}`, { ...options, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente para gerenciar seus roteiros.' : response.status === 403 ? 'Esta conta não pode alterar este roteiro.' : error?.detail ?? error?.title ?? 'Não foi possível acessar os roteiros. Tente novamente.');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const listRoadmaps = () => roadmapRequest<RoadmapResponse[]>('/api/Roadmap/GetAllRoadmapsByUserId');
export const loadRoadmap = (id: number) => roadmapRequest<RoadmapResponse>(`/api/Roadmap/Details/${id}`);
export const deleteRoadmap = (id: number) => roadmapRequest<void>(`/api/Roadmap/${id}/Delete`, { method: 'PATCH' });

export async function listAccessibleRoadmaps() {
  if (roadmapToken()) { return listRoadmaps(); }
  const current = getRoadmapDraft();
  if (current.id && !current.owned) { rememberVisitorRoadmap(current.id); }
  const ids = getVisitorRoadmapIds();
  const results = await Promise.allSettled(ids.map((id) => loadRoadmap(id)));
  const available = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
  if (ids.length > 0 && available.length === 0) { throw new Error('Não foi possível consultar os roteiros salvos neste navegador. Tente novamente.'); }
  return available;
}

export function roadmapFromResponse(response: RoadmapResponse, owned: boolean): RoadmapDraft {
  if (!response || !Number.isInteger(response.id) || !Array.isArray(response.roadmapProgrammingResponseDTO)) { throw new Error('Resposta de roteiro inválida. Tente novamente.'); }
  return { id: response.id, owned, name: response.name, description: response.description ?? '', dirty: false, revision: 0,
    stops: [...response.roadmapProgrammingResponseDTO].sort((a, b) => a.order - b.order).map((stop) => {
      const kind = stop.programmingId ? 'programming' : 'host';
      const id = stop.programmingId ?? stop.hostId!;
      return { key: `${kind}:${id}`, kind, id, name: stop.programming?.name ?? stop.hostDTO?.name ?? 'Local indisponível', imageUrl: stop.programming?.imageUrl ?? stop.hostDTO?.logoUrl ?? '', startDate: stop.startDate, endDate: stop.endDate, eventStart: stop.programming?.startDate, eventEnd: stop.programming?.endDate };
    }) };
}

export function roadmapError(draft: RoadmapDraft) {
  if (!draft.name.trim()) { return 'Dê um nome ao seu roteiro.'; }
  if (!draft.stops.length) { return 'Adicione pelo menos uma parada ao roteiro.'; }
  const stops = [...draft.stops].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
  for (let index = 0; index < stops.length; index++) {
    const stop = stops[index];
    const start = Date.parse(stop.startDate); const end = Date.parse(stop.endDate);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) { return `${stop.name}: informe início e fim válidos, com início anterior ao fim.`; }
    if (stop.kind === 'programming' && ((stop.eventStart && start < Date.parse(stop.eventStart)) || (stop.eventEnd && end > Date.parse(stop.eventEnd)))) { return `${stop.name}: a visita deve acontecer durante a programação.`; }
    if (index > 0 && start < Date.parse(stops[index - 1].endDate)) { return `${stops[index - 1].name} e ${stop.name}: ajuste os horários sobrepostos.`; }
  }
  return '';
}

export function roadmapPayload(draft: RoadmapDraft) {
  const error = roadmapError(draft);
  if (error) { throw new Error(error); }
  return { name: draft.name.trim(), description: draft.description.trim(), roadmapProgrammingDTO: [...draft.stops].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)).map((stop, index) => ({ ...(stop.kind === 'host' ? { hostId: stop.id } : { programmingId: stop.id }), order: index + 1, startDate: new Date(stop.startDate).toISOString(), endDate: new Date(stop.endDate).toISOString() })) };
}

export async function saveRoadmap(draft: RoadmapDraft) {
  const editing = Boolean(draft.id && draft.owned && roadmapToken());
  return roadmapRequest<RoadmapResponse>(editing ? `/api/Roadmap/${draft.id}/Edit` : '/api/Roadmap/Create', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(roadmapPayload(draft)) });
}

export function formatRoadmapTime(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) { return ''; }
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const part = (name: string) => parts.find((value) => value.type === name)?.value;
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}

export function parseRoadmapTime(text: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(text.trim());
  if (!match) { throw new Error('Use o formato DD/MM/AAAA HH:mm. Horário de Recife.'); }
  const [, day, month, year, hour, minute] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00-03:00`);
  if (!Number.isFinite(date.getTime()) || formatRoadmapTime(date.toISOString()) !== text.trim()) { throw new Error('Confira o dia, mês e horário informados.'); }
  return date.toISOString();
}

export function nextHostVisit(week: OpeningWeek | undefined, after: number) {
  const local = new Date(after - 3 * 3600000);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + 3 * 3600000;
  for (let offset = -1; offset <= 7; offset++) {
    const dayStart = midnight + offset * 86400000;
    const day = new Date(dayStart - 3 * 3600000).getUTCDay();
    const periods = week?.days.find((item) => item.dayOfWeek === day && !item.isClosed)?.periods ?? [];
    const seconds = (value: string) => value.split(':').map(Number).reduce((total, part) => total * 60 + part, 0) * (value.split(':').length === 2 ? 60 : 1);
    const intervals = periods.map((period) => ({ start: dayStart + seconds(period.openingTime) * 1000, end: dayStart + seconds(period.closingTime) * 1000 + (period.closesNextDay ? 86400000 : 0) })).sort((a, b) => a.start - b.start);
    for (const interval of intervals) {
      const start = Math.max(after, interval.start);
      if (interval.end - start >= 15 * 60000) { return { startDate: new Date(start).toISOString(), endDate: new Date(Math.min(start + 3600000, interval.end)).toISOString() }; }
    }
  }
  throw new Error('Este estabelecimento não tem um intervalo de funcionamento disponível nos próximos sete dias.');
}

export function toggleRoadmapStop(kind: RoadmapKind, id: number) {
  const scope = storageKey();
  const operation = pending.then(async () => {
    if (!Number.isInteger(id) || id < 1) { throw new Error('Local inválido.'); }
    if (scope !== storageKey()) { throw new Error('A sessão mudou. Tente novamente.'); }
    const key = `${kind}:${id}`;
    const draft = getRoadmapDraft();
    if (draft.stops.some((stop) => stop.key === key)) {
      storeRoadmapDraft({ ...draft, dirty: true, stops: draft.stops.filter((stop) => stop.key !== key) });
      return;
    }
    const detail = await roadmapRequest<{ name: string; imageUrl?: string; logoUrl?: string; startDate?: string; endDate?: string; openingWeek?: OpeningWeek }>(`/api/${kind === 'host' ? 'Host' : 'Programming'}/Details/${id}`);
    if (scope !== storageKey() || getRoadmapDraft().revision !== draft.revision) { throw new Error('O roteiro mudou enquanto o local carregava. Tente incluir novamente.'); }
    const dates = kind === 'programming' ? { startDate: detail.startDate!, endDate: detail.endDate! } : nextHostVisit(detail.openingWeek, Math.max(Date.now(), ...draft.stops.map((stop) => Date.parse(stop.endDate))));
    if (!dates.startDate || !dates.endDate) { throw new Error('Este local não tem horários disponíveis.'); }
    const stop: RoadmapStop = { key, kind, id, name: detail.name, imageUrl: detail.imageUrl ?? detail.logoUrl ?? '', ...dates, ...(kind === 'programming' ? { eventStart: detail.startDate, eventEnd: detail.endDate } : {}) };
    storeRoadmapDraft({ ...draft, dirty: true, stops: [...draft.stops, stop].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)) });
  });
  pending = operation.catch(() => undefined);
  return operation;
}

export function roadmapCatalogQueries(filters: { hosts: boolean; events: boolean; hostTypes: number[]; categories: number[]; city: string; text: string }, skip: number) {
  const common = () => new URLSearchParams({ Take: '20', Skip: String(skip), City: filters.city.trim() });
  const hostQuery = common(); const eventQuery = common();
  if (filters.text.trim()) { hostQuery.set('Name', filters.text.trim()); eventQuery.set('Text', filters.text.trim()); }
  filters.hostTypes.forEach((id) => hostQuery.append('Types', String(id)));
  filters.categories.forEach((id) => eventQuery.append('CategoriesId', String(id)));
  return { hosts: filters.hosts ? `/api/Host/HostFilter?${hostQuery}` : null, events: filters.events ? `/api/Programming/Filter?${eventQuery}` : null };
}
