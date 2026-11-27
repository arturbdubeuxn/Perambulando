export type NearbyPin = {
  id: number; type: 'Host' | 'Programming'; name: string; description: string;
  address: string; imageUrl?: string; distanceMeters: number; latitude: number; longitude: number;
};
type PinEvent = { id: number; name: string; description: string; imageUrl: string; startDate: string; endDate: string; address: { id: number } };
type PinHost = { id: number; typeofhost: number; name: string; description: string; logoUrl: string; address: { id: number }; programmings: PinEvent[] };
type EventDetails = PinEvent & { hostId: number };
export type EnrichedPin = NearbyPin & { event?: EventDetails; host?: PinHost };
export type NearbyPlace = { item: NearbyPin; label: string };

export function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export async function loadNearbyPlaces(origin: { latitude: number; longitude: number }, request: <T>(path: string) => Promise<T>, exclude: { hostId?: number; programmingId?: number } = {}, signal?: AbortSignal): Promise<NearbyPlace[]> {
  const selected: NearbyPlace[] = [];
  const seen = new Set<string>();
  let skip = 0;
  let hasMore = true;
  while (selected.length < 5 && hasMore) {
    signal?.throwIfAborted();
    const query = new URLSearchParams({ Latitude: String(origin.latitude), Longitude: String(origin.longitude), MaxDistanceKm: '20', Skip: String(skip) });
    const response = await request<{ items: NearbyPin[]; skip: number; hasMore: boolean }>(`/api/Nearby/GetNearMe?${query.toString()}`);
    const candidates = response.items.filter((item) => {
      const key = `${item.type}-${item.id}`;
      if (seen.has(key) || (item.type === 'Host' && item.id === exclude.hostId) || (item.type === 'Programming' && item.id === exclude.programmingId)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    const entries = await Promise.all(candidates.map(async (item) => {
      if (item.type === 'Host') {
        return { item, label: 'Estabelecimento' };
      }
      const details = await request<{ hostId: number; categories: { name: string }[] }>(`/api/Programming/Details/${item.id}`).catch(() => null);
      if (exclude.hostId != null && (!details || details.hostId === exclude.hostId)) {
        return null;
      }
      return { item, label: details?.categories?.[0]?.name ?? 'Programação' };
    }));
    signal?.throwIfAborted();
    for (const entry of entries) {
      if (entry && selected.length < 5) {
        selected.push(entry);
      }
    }
    skip += response.items.length;
    hasMore = response.hasMore && response.items.length > 0;
  }
  return selected.sort((a, b) => a.item.distanceMeters - b.item.distanceMeters);
}

// Public contracts do not include host IDs or dates in Nearby items.
// Resolve them without changing the API or treating a future event as ongoing.
export async function loadNearbyPinDetails(items: NearbyPin[], request: <T>(path: string) => Promise<T>): Promise<EnrichedPin[]> {
  const hosts = new Map<number, Promise<PinHost>>();
  const results: EnrichedPin[] = [...items];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      const item = items[index];
      if (item.type !== 'Programming') {
        continue;
      }
      const event = await request<EventDetails>(`/api/Programming/Details/${item.id}`).catch(() => null);
      if (!event || !Number.isInteger(event.hostId) || !Number.isInteger(event.address?.id)) {
        continue;
      }
      if (!hosts.has(event.hostId)) {
        hosts.set(event.hostId, request<PinHost>(`/api/Host/Details/${event.hostId}`));
      }
      const host = await hosts.get(event.hostId)!.catch(() => null);
      if (host && Number.isInteger(host.address?.id) && Array.isArray(host.programmings)) {
        results[index] = { ...item, event, host };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, worker));
  return results;
}

export function resolveNearbyPins(items: EnrichedPin[], now: number, categoryFiltered = false): NearbyPin[] {
  const resolved = new Map<string, NearbyPin>();
  const occupied = new Set<number>();
  for (const item of items) {
    const { host, event } = item;
    if (!host || !event || ![1, 2].includes(host.typeofhost) || host.address.id !== event.address.id) {
      resolved.set(`${item.type}-${item.id}`, item);
      continue;
    }
    const active = (categoryFiltered ? [event] : host.programmings)
      .filter((entry) => entry.address.id === host.address.id && Date.parse(entry.startDate) <= now && now < Date.parse(entry.endDate))
      .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate) || a.id - b.id)[0];
    if (active) {
      occupied.add(host.id);
      resolved.set(`Programming-${active.id}`, { ...item, id: active.id, type: 'Programming', name: active.name, description: active.description, imageUrl: active.imageUrl });
    } else {
      resolved.set(`Host-${host.id}`, { ...item, id: host.id, type: 'Host', name: host.name, description: host.description, imageUrl: host.logoUrl });
    }
  }
  for (const hostId of occupied) {
    resolved.delete(`Host-${hostId}`);
  }
  return [...resolved.values()].sort((a, b) => a.distanceMeters - b.distanceMeters || a.type.localeCompare(b.type) || a.id - b.id);
}
