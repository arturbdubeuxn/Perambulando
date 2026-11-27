import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { deleteRoadmap, formatRoadmapTime, getRoadmapDraft, getVisitorRoadmapIds, listAccessibleRoadmaps, listRoadmaps, loadRoadmap, nextHostVisit, parseRoadmapTime, rememberVisitorRoadmap, resetRoadmapDraft, roadmapCatalogQueries, roadmapError, roadmapFromResponse, roadmapPayload, saveRoadmap, storeRoadmapDraft, subscribeToRoadmap, toggleRoadmapStop } from './roadmap.ts';

const originalFetch = globalThis.fetch;
const originalLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalSession = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
let token = '';
let storage = new Map();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => token } });
afterEach(() => { globalThis.fetch = originalFetch; token = ''; storage = new Map(); resetRoadmapDraft(); });
process.on('exit', () => {
  if (originalLocal) { Object.defineProperty(globalThis, 'localStorage', originalLocal); } else { delete globalThis.localStorage; }
  if (originalSession) { Object.defineProperty(globalThis, 'sessionStorage', originalSession); } else { delete globalThis.sessionStorage; }
});
const eventStop = { key: 'programming:2', kind: 'programming', id: 2, name: 'Feira', imageUrl: '', startDate: '2026-11-28T13:00:00Z', endDate: '2026-11-28T14:00:00Z', eventStart: '2026-11-28T12:00:00Z', eventEnd: '2026-11-28T18:00:00Z' };
const hostStop = { key: 'host:2', kind: 'host', id: 2, name: 'Café', imageUrl: '', startDate: '2026-11-28T14:00:00Z', endDate: '2026-11-28T15:00:00Z' };
const draft = (stops = [hostStop, eventStop]) => ({ name: 'Sábado no bairro', description: 'Meu passeio', owned: false, dirty: true, revision: 0, stops });
const response = { id: 10, name: 'Passeio salvo', description: '', roadmapProgrammingResponseDTO: [
  { hostId: 2, order: 2, startDate: hostStop.startDate, endDate: hostStop.endDate, hostDTO: { name: 'Café', logoUrl: '' } },
  { programmingId: 2, order: 1, startDate: eventStop.startDate, endDate: eventStop.endDate, programming: { name: 'Feira', imageUrl: '', startDate: eventStop.eventStart, endDate: eventStop.eventEnd } },
] };

test('contrato de criação usa IDs exclusivos, ordenação cronológica e UTC, sem objetos aninhados', () => {
  const payload = roadmapPayload(draft());
  assert.deepEqual(payload.roadmapProgrammingDTO, [
    { programmingId: 2, order: 1, startDate: '2026-11-28T13:00:00.000Z', endDate: '2026-11-28T14:00:00.000Z' },
    { hostId: 2, order: 2, startDate: '2026-11-28T14:00:00.000Z', endDate: '2026-11-28T15:00:00.000Z' },
  ]);
  assert.equal(roadmapError(draft()), '');
  assert.throws(() => roadmapPayload(draft([])), /pelo menos uma parada/);
  assert.throws(() => roadmapPayload({ ...draft(), name: ' ' }), /nome/);
});
test('bloqueia conflitos, visitas fora da duração e horários inválidos sem enviar requisição', async () => {
  globalThis.fetch = () => assert.fail('Não deve enviar roteiro inválido');
  await assert.rejects(saveRoadmap(draft([eventStop, { ...hostStop, startDate: '2026-11-28T13:30:00Z' }])), /sobrepostos/);
  await assert.rejects(saveRoadmap(draft([{ ...eventStop, startDate: '2026-11-28T10:00:00Z' }])), /durante a programação/);
  await assert.rejects(saveRoadmap(draft([{ ...hostStop, endDate: 'data inválida' }])), /válidos/);
});
test('conversão de horário é de Recife, rejeita dias inexistentes e preserva meia-noite', () => {
  assert.equal(parseRoadmapTime('28/11/2026 10:00'), '2026-11-28T13:00:00.000Z');
  assert.equal(formatRoadmapTime('2026-11-28T03:00:00Z'), '28/11/2026 00:00');
  assert.throws(() => parseRoadmapTime('31/02/2026 10:00'));
  assert.throws(() => parseRoadmapTime('28/11/2026 24:00'));
  assert.throws(() => parseRoadmapTime('2026-11-28 10:00'));
});
test('proposta de visita respeita almoço, fechamento e funcionamento após meia-noite', () => {
  const week = { days: [{ dayOfWeek: 6, isClosed: false, periods: [
    { openingTime: '09:00:00', closingTime: '12:00:00', closesNextDay: false },
    { openingTime: '14:00', closingTime: '18:00', closesNextDay: false },
    { openingTime: '22:00:00', closingTime: '02:00:00', closesNextDay: true },
  ] }] };
  assert.equal(nextHostVisit(week, Date.parse('2026-11-28T15:30:00Z')).startDate, '2026-11-28T17:00:00.000Z');
  assert.equal(nextHostVisit(week, Date.parse('2026-11-28T20:40:00Z')).endDate, '2026-11-28T21:00:00.000Z');
  assert.equal(nextHostVisit(week, Date.parse('2026-11-29T04:00:00Z')).startDate, '2026-11-29T04:00:00.000Z');
  assert.throws(() => nextHostVisit({ days: [] }, Date.now()), /funcionamento disponível/);
});
test('visitante cria e consulta roteiro; consulta usa nomes, tipos e ordem do contrato real', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push([url, options]); return new Response(JSON.stringify(response), { status: url.endsWith('/Create') ? 201 : 200 }); };
  assert.equal((await saveRoadmap(draft())).id, 10);
  const loaded = roadmapFromResponse(await loadRoadmap(10), false);
  assert.equal(calls[0][0].endsWith('/api/Roadmap/Create'), true);
  assert.equal(calls[0][1].method, 'POST'); assert.equal(calls[0][1].headers.Authorization, undefined);
  assert.equal(calls[1][0].endsWith('/api/Roadmap/Details/10'), true);
  assert.deepEqual(loaded.stops.map((item) => item.key), ['programming:2', 'host:2']);
  assert.deepEqual(loaded.stops.map((item) => item.name), ['Feira', 'Café']);
  assert.equal(loaded.stops[0].eventEnd, eventStop.eventEnd);
});
test('visitante lista no navegador os roteiros públicos salvos e conta continua usando JWT', async () => {
  rememberVisitorRoadmap(10); rememberVisitorRoadmap(10);
  assert.deepEqual(getVisitorRoadmapIds(), [10]);
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([url, options]);
    return new Response(JSON.stringify(token ? [response] : response));
  };
  assert.deepEqual((await listAccessibleRoadmaps()).map((item) => item.id), [10]);
  assert.equal(new URL(calls[0][0]).pathname, '/api/Roadmap/Details/10');
  assert.equal(calls[0][1].headers.Authorization, undefined);
  token = 'test-roadmap-owner';
  assert.deepEqual((await listAccessibleRoadmaps()).map((item) => item.id), [10]);
  assert.equal(new URL(calls[1][0]).pathname, '/api/Roadmap/GetAllRoadmapsByUserId');
  assert.equal(calls[1][1].headers.Authorization, 'Bearer test-roadmap-owner');
});
test('conta lista, edita e exclui com JWT e verbos corretos; PATCH aceita 204', async () => {
  token = 'test-roadmap-owner'; const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([url, options]);
    return url.endsWith('/Delete') ? new Response(null, { status: 204 }) : new Response(JSON.stringify(url.endsWith('ByUserId') ? [response] : response));
  };
  assert.equal((await listRoadmaps()).length, 1);
  await saveRoadmap({ ...draft(), id: 10, owned: true });
  await deleteRoadmap(10);
  assert.deepEqual(calls.map(([url]) => new URL(url).pathname), ['/api/Roadmap/GetAllRoadmapsByUserId', '/api/Roadmap/10/Edit', '/api/Roadmap/10/Delete']);
  assert.deepEqual(calls.map(([, options]) => options.method ?? 'GET'), ['GET', 'PUT', 'PATCH']);
  calls.forEach(([, options]) => assert.equal(options.headers.Authorization, 'Bearer test-roadmap-owner'));
});
test('roteiro público carregado é salvo como nova versão sem tentar editar roteiro sem proprietário', async () => {
  globalThis.fetch = async (url, options) => { assert.ok(url.endsWith('/Create')); assert.equal(options.method, 'POST'); return new Response(JSON.stringify(response)); };
  await saveRoadmap({ ...draft(), id: 10, owned: false });
});
test('erros de sessão, propriedade e funcionamento são apresentados sem apagar o rascunho', async () => {
  storeRoadmapDraft(draft());
  for (const [status, message] of [[401, /sessão expirou/], [403, /não pode alterar/], [400, /intervalo de funcionamento/]]) {
    globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'A visita deve caber em um intervalo de funcionamento do host.' }), { status });
    await assert.rejects(saveRoadmap(getRoadmapDraft()), message);
    assert.equal(getRoadmapDraft().stops.length, 2);
  }
});
test('filtros somam categorias e tipos; estabelecimentos e eventos usam parâmetros compatíveis', () => {
  const queries = roadmapCatalogQueries({ hosts: true, events: true, hostTypes: [1, 2], categories: [3, 8], city: 'Recife', text: 'arte' }, 20);
  const hosts = new URL(queries.hosts, 'http://test').searchParams; const events = new URL(queries.events, 'http://test').searchParams;
  assert.deepEqual(hosts.getAll('Types'), ['1', '2']); assert.equal(hosts.get('Name'), 'arte');
  assert.deepEqual(events.getAll('CategoriesId'), ['3', '8']); assert.equal(events.get('Text'), 'arte'); assert.equal(events.get('Skip'), '20');
  assert.equal(hosts.has('CategoriesId'), false);
  assert.equal(roadmapCatalogQueries({ hosts: false, events: true, hostTypes: [], categories: [], city: '', text: '' }, 0).hosts, null);
});
test('todos os cards compartilham inclusão/remoção e diferenciam host e evento com o mesmo ID', async () => {
  resetRoadmapDraft(); let notifications = 0;
  const unsubscribe = subscribeToRoadmap(() => notifications++);
  globalThis.fetch = async () => new Response(JSON.stringify({ name: 'Feira', startDate: eventStop.startDate, endDate: eventStop.endDate }));
  await toggleRoadmapStop('programming', 2);
  assert.equal(getRoadmapDraft().stops[0].key, 'programming:2');
  assert.equal(getRoadmapDraft().dirty, true);
  globalThis.fetch = () => assert.fail('Remover não precisa de consulta');
  await toggleRoadmapStop('programming', 2);
  assert.equal(getRoadmapDraft().stops.length, 0);
  assert.equal(notifications, 2); unsubscribe();
  const guest = storeRoadmapDraft(draft([hostStop])); token = 'test-isolated-account';
  resetRoadmapDraft(); assert.equal(getRoadmapDraft().stops.length, 0);
  token = ''; assert.equal(getRoadmapDraft().revision, guest.revision);
});
test('consulta de inclusão atrasada não sobrescreve troca ou edição de roteiro', async () => {
  resetRoadmapDraft(); let release;
  globalThis.fetch = async () => { await new Promise((resolve) => { release = resolve; }); return new Response(JSON.stringify({ name: 'Feira', startDate: eventStop.startDate, endDate: eventStop.endDate })); };
  const operation = toggleRoadmapStop('programming', 2);
  await new Promise((resolve) => setTimeout(resolve, 0));
  storeRoadmapDraft({ ...getRoadmapDraft(), name: 'Outro passeio' }); release();
  await assert.rejects(operation, /roteiro mudou/);
  assert.equal(getRoadmapDraft().name, 'Outro passeio'); assert.equal(getRoadmapDraft().stops.length, 0);
});
