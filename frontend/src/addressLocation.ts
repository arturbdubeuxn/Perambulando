type LocationAddress = { city: string; street: string; number: string; neighborhood: string; cep: string };
type ReferenceAddress = LocationAddress & { latitude: number; longitude: number };

export function addressLocationKey(address: LocationAddress) {
  return [address.city, address.street, address.number, address.neighborhood, address.cep]
    .map((part) => part.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')).join('|');
}

export function referenceAddressLocation(address: LocationAddress, references: ReferenceAddress[]) {
  const reference = references.find((entry) => addressLocationKey(entry) === addressLocationKey(address));
  if (!reference) {
    return null;
  }
  return { latitude: reference.latitude, longitude: reference.longitude, displayName: [reference.street, reference.number, reference.neighborhood, reference.city].filter(Boolean).join(', ') };
}

export async function geocodeAddress(address: LocationAddress, references: ReferenceAddress[], storage?: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void } | null, signal?: AbortSignal) {
  const reference = referenceAddressLocation(address, references);
  if (reference) {
    return reference;
  }
  const cep = address.cep.replace(/\D/g, '');
  const streetAndNumber = [address.street, address.number].filter(Boolean).join(', ');
  const queries = [
    [streetAndNumber, address.city, cep, 'Brasil'].filter(Boolean).join(', '),
    [streetAndNumber, address.city, 'Brasil'].filter(Boolean).join(', '),
    [address.street, address.city, 'Brasil'].filter(Boolean).join(', '),
  ].filter((query, index, all) => query && all.indexOf(query) === index);
  const cacheKey = `perambulando.geocode.v3.${addressLocationKey(address)}`;

  const cached = storage?.getItem(cacheKey);
  if (cached) {
    try {
      const coordinates = JSON.parse(cached) as { latitude: number; longitude: number; displayName: string };
      if (Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude) && Math.abs(coordinates.latitude) <= 90 && Math.abs(coordinates.longitude) <= 180) {
        return coordinates;
      }
    } catch {
      storage?.setItem(cacheKey, '');
    }
  }

  for (let index = 0; index < queries.length; index += 1) {
    signal?.throwIfAborted();
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(queries[index])}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json', 'Accept-Language': 'pt-BR' } });
    if (!response.ok) {
      continue;
    }
    const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
    const first = results[0];
    if (!first) {
      continue;
    }
    const coordinates = {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name,
    };
    if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
      continue;
    }
    storage?.setItem(cacheKey, JSON.stringify(coordinates));
    return coordinates;
  }

  throw new Error('O mapa não encontrou uma coordenada para o endereço ou CEP cadastrado.');
}

