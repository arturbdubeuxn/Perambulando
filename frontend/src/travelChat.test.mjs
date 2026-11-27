import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { parseTravelChatResult, sendTravelChatMessage } from './travelChat.ts';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });
const result = { programmings: [{ id: 1, name: 'Evento do catálogo' }], hosts: [{ id: 1, name: 'Estabelecimento do catálogo' }] };

test('preserva opções do catálogo sem duplicatas e rejeita contrato inválido', () => {
  assert.deepEqual(parseTravelChatResult({ programmings: [...result.programmings, ...result.programmings], hosts: result.hosts }), result);
  assert.deepEqual(parseTravelChatResult({ programmings: [], hosts: [] }), { programmings: [], hosts: [] });
  for (const value of [null, {}, { programmings: [], hosts: null }, { programmings: [{ id: -1, name: 'x' }], hosts: [] }]) {
    assert.throws(() => parseTravelChatResult(value));
  }
});
test('visitante envia somente text sem JWT e reaproveita o endpoint existente', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/api/TravelChat/Messages'));
    assert.equal(options.method, 'POST');
    assert.equal(options.signal, controller.signal);
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(options.body), { text: 'Sábado em Recife' });
    return new Response(JSON.stringify(result));
  };
  assert.deepEqual(await sendTravelChatMessage('  Sábado em Recife  ', '', controller.signal), result);
});
test('JWT indisponível permite repetir uma única vez como visitante, sem alterar a sessão', async () => {
  const headers = [];
  globalThis.fetch = async (_url, options) => {
    headers.push(options.headers.Authorization);
    return headers.length === 1 ? new Response('{}', { status: 401 }) : new Response(JSON.stringify(result));
  };
  assert.deepEqual(await sendTravelChatMessage('Quero cultura em Recife', 'existing-jwt', new AbortController().signal), result);
  assert.deepEqual(headers, ['Bearer existing-jwt', undefined]);
});
test('mensagem inválida ou pedido cancelado não chama o serviço', async () => {
  globalThis.fetch = async () => assert.fail('Não deve chamar o serviço');
  await assert.rejects(sendTravelChatMessage('  ', '', new AbortController().signal));
  await assert.rejects(sendTravelChatMessage('x'.repeat(4001), '', new AbortController().signal));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(sendTravelChatMessage('Recife', '', controller.signal), { name: 'AbortError' });
});
test('falha do provedor e limite de chamadas têm mensagens recuperáveis sem inventar opções', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  await assert.rejects(sendTravelChatMessage('Recife', '', new AbortController().signal), /indisponível/);
  globalThis.fetch = async () => new Response('{}', { status: 429 });
  await assert.rejects(sendTravelChatMessage('Recife', '', new AbortController().signal), /muitos pedidos/);
});
