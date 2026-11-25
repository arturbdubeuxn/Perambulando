import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyOpeningWeek, loadedOpeningDays, maskOpeningTime, openingWeekError, openingWeekPayload } from './openingHours.ts';

const period = (openingTime, closingTime, closesNextDay = false) => ({ openingTime, closingTime, closesNextDay });
const withDay = (days, dayOfWeek, periods) => days.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, isClosed: false, periods } : day);

test('envia sete dias, sem IDs do servidor, e preserva segundos', () => {
  const week = openingWeekPayload(withDay(emptyOpeningWeek(), 1, [period('09:00', '18:00:30')]));
  assert.equal(week.days.length, 7);
  assert.deepEqual(week.days.find((day) => day.dayOfWeek === 1).periods, [period('09:00:00', '18:00:30')]);
  assert.equal(openingWeekError(emptyOpeningWeek()), '');
});

test('aceita pausa no almoço e intervalos consecutivos', () => {
  assert.equal(openingWeekError(withDay(emptyOpeningWeek(), 1, [period('09:00', '12:00'), period('14:00', '18:00')])), '');
  assert.equal(openingWeekError(withDay(emptyOpeningWeek(), 1, [period('09:00', '12:00'), period('12:00', '18:00')])), '');
});

test('rejeita horários vazios, fora da faixa, invertidos e mais de 24h', () => {
  for (const value of [period('', ''), period('24:00', '25:00'), period('12:60', '13:00'), period('18:00', '02:00'), period('09:00', '10:00', true)]) {
    assert.notEqual(openingWeekError(withDay(emptyOpeningWeek(), 1, [value])), '');
  }
});

test('aceita fechamento no dia seguinte e 24h explícitas', () => {
  assert.equal(openingWeekError(withDay(emptyOpeningWeek(), 5, [period('18:00', '02:00', true)])), '');
  assert.equal(openingWeekError(withDay(emptyOpeningWeek(), 1, [period('09:00', '09:00', true)])), '');
});

test('rejeita sobreposição no mesmo dia e na virada sábado/domingo', () => {
  assert.notEqual(openingWeekError(withDay(emptyOpeningWeek(), 1, [period('09:00', '12:00'), period('11:00', '18:00')])), '');
  const week = withDay(withDay(emptyOpeningWeek(), 6, [period('18:00', '02:00', true)]), 0, [period('01:00', '03:00')]);
  assert.notEqual(openingWeekError(week), '');
});

test('protege semanas incompletas e coerência de dias fechados', () => {
  assert.notEqual(openingWeekError(emptyOpeningWeek().slice(1)), '');
  const week = emptyOpeningWeek();
  week[0].periods.push(period('09:00', '18:00'));
  assert.notEqual(openingWeekError(week), '');
  assert.throws(() => openingWeekPayload(week));
  assert.throws(() => loadedOpeningDays({ days: [week[0]] }));
});

test('carrega semana vazia e contrato TimeOnly sem reutilizar referências', () => {
  assert.deepEqual(loadedOpeningDays({ days: [] }), emptyOpeningWeek());
  const saved = openingWeekPayload(withDay(emptyOpeningWeek(), 1, [period('09:00', '18:00')]));
  const loaded = loadedOpeningDays(saved);
  assert.equal(loaded.find((day) => day.dayOfWeek === 1).periods[0].openingTime, '09:00');
  loaded[0].isClosed = true;
  assert.equal(saved.days[0].isClosed, false);
  assert.equal(maskOpeningTime('093015'), '09:30:15');
});
