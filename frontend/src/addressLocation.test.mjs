import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { addressLocationKey, referenceAddressLocation, geocodeAddress } from './addressLocation.ts';

const references = JSON.parse(readFileSync(new URL('../assets/enderecos-demonstracao-recife.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
test('75 endereços reais distintos, dentro de Recife e sem coordenadas inventadas', () => {
  assert.equal(references.length, 75);
  assert.equal(new Set(references.map(addressLocationKey)).size, 75);
  for (const address of references) {
    const result = referenceAddressLocation(address, references);
    assert.equal(result.latitude, address.latitude);
    assert.equal(result.longitude, address.longitude);
    assert.ok(address.latitude > -8.06 && address.latitude < -8.005);
    assert.ok(address.longitude > -34.93 && address.longitude < -34.87);
    assert.ok(address.street && address.number && address.neighborhood && address.osmId);
  }
});
test('cache considera endereço completo e nunca usa o ponto antigo após edição', () => {
  const address = references[0];
  assert.equal(referenceAddressLocation({ ...address, number: '999999' }, references), null);
  assert.notEqual(addressLocationKey(address), addressLocationKey({ ...address, cep: '12345678' }));
  assert.deepEqual(referenceAddressLocation({ ...address, street: address.street.toUpperCase() }, references), referenceAddressLocation(address, references));
});

test('resolvedor compartilhado reutiliza referência e cache válido sem geocodificar novamente', async () => {
  const address = references[0];
  assert.deepEqual(await geocodeAddress(address, references), referenceAddressLocation(address, references));
  const cached = { latitude: -8.02, longitude: -34.9, displayName: 'Referência em cache' };
  assert.deepEqual(await geocodeAddress(address, [], { getItem: () => JSON.stringify(cached), setItem: () => assert.fail('Cache válido não deve ser substituído') }), cached);
});
