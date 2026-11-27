import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { favoritesStorageKey, getFavoriteKeys, storeFavoriteKeys, setLocalFavorite, subscribeToFavorites } from './favorites.ts';

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const values = new Map();
let failWrite = false;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => { if (failWrite) { throw new Error('Armazenamento bloqueado'); } values.set(key, value); },
} });
after(() => { if (original) { Object.defineProperty(globalThis, 'localStorage', original); } else { delete globalThis.localStorage; } });

test('reutiliza chave existente, preserva favoritos válidos e remove duplicatas/dados inválidos', () => {
  values.set(favoritesStorageKey, JSON.stringify(['programming:15', 'host:15', 'programming:15', 'host:0', 1, 'user:2']));
  assert.deepEqual(getFavoriteKeys(), ['programming:15', 'host:15']);
});
test('adição e remoção preservam outros favoritos e separam host de programação com mesmo ID', () => {
  storeFavoriteKeys([]);
  setLocalFavorite('host:10', true);
  setLocalFavorite('programming:10', true);
  setLocalFavorite('host:11', true);
  setLocalFavorite('host:10', false);
  assert.deepEqual(getFavoriteKeys(), ['programming:10', 'host:11']);
  assert.deepEqual(JSON.parse(values.get(favoritesStorageKey)), getFavoriteKeys());
});
test('alterações notificam outras telas e inscrição pode ser encerrada', () => {
  let changes = 0;
  const stop = subscribeToFavorites(() => { changes++; });
  setLocalFavorite('host:20', true);
  assert.equal(changes, 1);
  stop();
  setLocalFavorite('host:21', true);
  assert.equal(changes, 1);
});
test('armazenamento bloqueado preserva favoritos na sessão sem ler por cima os dados antigos', () => {
  storeFavoriteKeys(['host:30']);
  failWrite = true;
  assert.equal(setLocalFavorite('programming:31', true).persisted, false);
  assert.deepEqual(getFavoriteKeys(), ['host:30', 'programming:31']);
  setLocalFavorite('host:30', false);
  assert.deepEqual(getFavoriteKeys(), ['programming:31']);
  failWrite = false;
  assert.equal(storeFavoriteKeys(getFavoriteKeys()), true);
});
