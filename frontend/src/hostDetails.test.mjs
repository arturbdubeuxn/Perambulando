import assert from 'node:assert/strict';
import test from 'node:test';
import { groupHostEvents, hostEventDate, hostEventStatus } from './hostDetails.ts';

const now = Date.parse('2026-11-25T15:00:00Z');
const event = (id, startDate, endDate) => ({ id, hostId: 1, name: `Evento ${id}`, description: `Descrição ${id}`, startDate, endDate, imageUrl: '', isFree: true, minPrice: 0, maxPrice: 0 });

test('separa encerrados pelo término, preserva eventos em andamento e ordena faixas', () => {
  const events = [event(1, '2026-12-01T18:00:00Z', '2026-12-01T21:00:00Z'), event(2, '2026-11-25T14:00:00Z', '2026-11-25T16:00:00Z'), event(3, '2026-11-20T18:00:00Z', '2026-11-20T21:00:00Z'), event(4, '2026-11-24T18:00:00Z', '2026-11-24T21:00:00Z')];
  const originalOrder = events.map((item) => item.id);
  const grouped = groupHostEvents(events, now);
  assert.deepEqual(grouped.upcoming.map((item) => item.id), [2, 1]);
  assert.deepEqual(grouped.past.map((item) => item.id), [4, 3]);
  assert.deepEqual(events.map((item) => item.id), originalOrder);
  assert.equal(hostEventStatus(events[1], now), 'Em andamento');
});

test('trata término exato e evento que atravessa a meia-noite', () => {
  const ended = event(1, '2026-11-25T14:00:00Z', '2026-11-25T15:00:00Z');
  assert.equal(hostEventStatus(ended, now), 'Encerrado');
  assert.deepEqual(groupHostEvents([ended], now).past, [ended]);
  const overnight = event(2, '2026-11-25T21:00:00-03:00', '2026-11-26T02:00:00-03:00');
  assert.equal(hostEventStatus(overnight, Date.parse('2026-11-26T01:00:00-03:00')), 'Em andamento');
});

test('mantém descrições e registros sem data disponíveis, sem inventar histórico', () => {
  const invalid = event(1, 'inválida', 'inválida');
  assert.deepEqual(groupHostEvents([invalid], now).upcoming, [invalid]);
  assert.deepEqual(groupHostEvents([], now), { upcoming: [], past: [] });
  assert.equal(hostEventDate('inválida'), 'Data a confirmar');
  assert.equal(hostEventStatus(invalid, now), 'Data a confirmar');
});
