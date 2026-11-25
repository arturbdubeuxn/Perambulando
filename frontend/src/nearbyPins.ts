export type NearbyPin = {
  id: number; type: 'Host' | 'Programming'; name: string; description: string;
  address: string; imageUrl?: string; distanceMeters: number; latitude: number; longitude: number;
};
type PinEvent = { id: number; name: string; description: string; imageUrl: string; startDate: string; endDate: string; address: { id: number } };
type PinHost = { id: number; typeofhost: number; name: string; description: string; logoUrl: string; address: { id: number }; programmings: PinEvent[] };
type EventDetails = PinEvent & { hostId: number };
export type EnrichedPin = NearbyPin & { event?: EventDetails; host?: PinHost };

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
      if (!event || !Number.isInteger(event.hostId)) {
        continue;
      }
      if (!hosts.has(event.hostId)) {
        hosts.set(event.hostId, request<PinHost>(`/api/Host/Details/${event.hostId}`));
      }
      const host = await hosts.get(event.hostId)!.catch(() => null);
      if (host) {
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
    } else if (!categoryFiltered) {
      resolved.set(`Host-${host.id}`, { ...item, id: host.id, type: 'Host', name: host.name, description: host.description, imageUrl: host.logoUrl });
    }
  }
  for (const hostId of occupied) {
    resolved.delete(`Host-${hostId}`);
  }
  return [...resolved.values()].sort((a, b) => a.distanceMeters - b.distanceMeters || a.type.localeCompare(b.type) || a.id - b.id);
}
