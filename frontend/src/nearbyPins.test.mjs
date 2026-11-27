import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNearbyPinDetails, resolveNearbyPins, loadNearbyPlaces, formatDistance } from './nearbyPins.ts';

const now = Date.parse('2026-11-27T15:00:00Z');
const event = { id: 20, hostId: 10, name: 'Evento', description: 'Descrição completa', imageUrl: 'event.jpg', startDate: new Date(now + 1000).toISOString(), endDate: new Date(now + 2000).toISOString(), address: { id: 30 } };
const host = { id: 10, typeofhost: 1, name: 'Café', description: 'Sobre o café', logoUrl: 'host.jpg', address: { id: 30 }, programmings: [event] };
const pin = { id: 20, type: 'Programming', name: event.name, description: event.description, address: 'Rua real, 100', imageUrl: event.imageUrl, distanceMeters: 42, latitude: -8.03, longitude: -34.9, event, host };

test('gastronomia: azul antes, evento no início, azul no término exato', () => {
  for (const [time, expected] of [[now, 'Host'], [now + 1000, 'Programming'], [now + 1999, 'Programming'], [now + 2000, 'Host']]) {
    const [result] = resolveNearbyPins([pin], time);
    assert.equal(result.type, expected);
    assert.equal(result.id, expected === 'Host' ? 10 : 20);
    assert.equal(result.distanceMeters, 42);
    assert.equal(result.latitude, pin.latitude);
  }
});
test('comércio elimina pins duplicados e evento em andamento pode estar em outra página', () => {
  const ongoing = { ...event, id: 21, startDate: new Date(now - 1000).toISOString(), endDate: new Date(now + 500).toISOString() };
  const commercial = { ...host, typeofhost: 2, programmings: [event, ongoing] };
  const result = resolveNearbyPins([{ ...pin, host: commercial }, { ...pin, id: 22, host: commercial }, { ...pin, type: 'Host', id: 10, host: undefined, event: undefined }], now);
  assert.deepEqual(result.map(item => [item.type, item.id]), [['Programming', 21]]);
  assert.equal(resolveNearbyPins([{ ...pin, host: commercial }], now + 500)[0].type, 'Host');
});
test('produtores e eventos em outro endereço conservam pins; eventos futuros filtrados representam o estabelecimento', () => {
  assert.equal(resolveNearbyPins([{ ...pin, host: { ...host, typeofhost: 0 } }], now)[0].type, 'Programming');
  assert.equal(resolveNearbyPins([{ ...pin, event: { ...event, address: { id: 99 } } }], now)[0].type, 'Programming');
  assert.equal(resolveNearbyPins([pin], now, true)[0].type, 'Host');
  assert.equal(resolveNearbyPins([pin], now + 1000, true)[0].type, 'Programming');
});
test('seleção combinada preserva locais futuros de categorias diferentes e consolida o mesmo estabelecimento', () => {
  const otherHost = { ...host, id: 11, name: 'Loja', typeofhost: 2, address: { id: 31 } };
  const otherEvent = { ...event, id: 21, hostId: 11, address: { id: 31 } };
  const otherPin = { ...pin, id: 21, host: { ...otherHost, programmings: [otherEvent] }, event: otherEvent };
  const result = resolveNearbyPins([pin, otherPin, { ...pin, id: 22 }], now, true);
  assert.deepEqual(result.map(item => [item.type, item.id]), [['Host', 10], ['Host', 11]]);
});
test('enriquecimento público reutiliza host, preserva ordem e tolera indisponibilidade', async () => {
  const calls = [];
  const result = await loadNearbyPinDetails([pin, { ...pin, id: 22 }, { ...pin, id: 23 }], async path => {
    calls.push(path);
    if (path === '/api/Programming/Details/23') { throw new Error('indisponível'); }
    return path.includes('/Host/') ? host : { ...event, id: Number(path.split('/').at(-1)) };
  });
  assert.equal(calls.filter(path => path === '/api/Host/Details/10').length, 1);
  assert.deepEqual(result.map(item => item.id), [20, 22, 23]);
  assert.equal(result[0].host.id, 10);
});

test('locais próximos excluem o host e seus eventos, deduplicam e completam cinco em outra página', async () => {
  const item = (id, type, distanceMeters) => ({ ...pin, id, type, distanceMeters });
  const pages = [
    [item(10, 'Host', 0), item(20, 'Programming', 0), item(21, 'Programming', 30), item(22, 'Programming', 40)],
    [item(21, 'Programming', 30), item(23, 'Programming', 50), item(14, 'Host', 60), item(15, 'Host', 70)],
  ];
  const skips = [];
  const results = await loadNearbyPlaces({ latitude: -8.03, longitude: -34.9 }, async path => {
    if (path.includes('/GetNearMe')) {
      const query = new URL(path, 'http://api.test').searchParams;
      assert.equal(query.get('Latitude'), '-8.03');
      assert.equal(query.get('Longitude'), '-34.9');
      const skip = Number(query.get('Skip')); skips.push(skip);
      return { items: pages[skip === 0 ? 0 : 1], skip, hasMore: skip === 0 };
    }
    const id = Number(path.split('/').at(-1));
    return { hostId: id === 20 ? 10 : 11, categories: [{ name: 'Música' }] };
  }, { hostId: 10 });
  assert.deepEqual(skips, [0, 4]);
  assert.deepEqual(results.map(entry => entry.item.id), [21, 22, 23, 14, 15]);
  assert.equal(results[0].label, 'Música');
  assert.equal(results[4].label, 'Estabelecimento');
});

test('reutilização nos eventos exclui somente a programação selecionada e permite categoria indisponível', async () => {
  const results = await loadNearbyPlaces({ latitude: -8.03, longitude: -34.9 }, async path => {
    if (path.includes('/GetNearMe')) {
      return { items: [pin, { ...pin, id: 21 }], skip: 0, hasMore: false };
    }
    throw new Error('Detalhes indisponíveis');
  }, { programmingId: 20 });
  assert.equal(results.length, 1);
  assert.equal(results[0].item.id, 21);
  assert.equal(results[0].label, 'Programação');
  assert.equal(formatDistance(125), '125 m');
  assert.equal(formatDistance(1250), '1,3 km');
});

test('consulta de proximidade cancelada não dispara requisições', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(loadNearbyPlaces({ latitude: -8.03, longitude: -34.9 }, async () => { assert.fail('Não deve consultar após cancelamento'); }, {}, controller.signal), { name: 'AbortError' });
});
