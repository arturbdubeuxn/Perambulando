import type { OpeningWeek } from './openingHours';

export type HostEvent = {
  id: number; hostId: number; name: string; description: string;
  startDate: string; endDate: string; imageUrl: string; isFree: boolean;
  minPrice: number; maxPrice: number;
};
export type HostDetails = {
  id: number; name: string; description: string; typeofhost: number;
  logoUrl: string; phone: string; instagranUrl: string;
  minPrice: number | null; maxPrice: number | null;
  address: { city: string; street: string; number: string; complement: string; neighborhood: string; cep: string };
  openingWeek: OpeningWeek;
  programmings: HostEvent[];
};

export function groupHostEvents(events: HostEvent[], now = Date.now()) {
  const upcoming: HostEvent[] = [];
  const past: HostEvent[] = [];
  for (const event of events) {
    const end = Date.parse(event.endDate);
    if (Number.isFinite(end) && end <= now) {
      past.push(event);
    } else {
      upcoming.push(event);
    }
  }
  upcoming.sort((a, b) => {
    const first = Date.parse(a.startDate);
    const second = Date.parse(b.startDate);
    return (Number.isFinite(first) ? first : Infinity) - (Number.isFinite(second) ? second : Infinity);
  });
  past.sort((a, b) => Date.parse(b.endDate) - Date.parse(a.endDate));
  return { upcoming, past };
}

export function hostEventStatus(event: HostEvent, now = Date.now()) {
  const start = Date.parse(event.startDate);
  const end = Date.parse(event.endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 'Data a confirmar';
  }
  if (end <= now) {
    return 'Encerrado';
  }
  return start <= now ? 'Em andamento' : 'Em breve';
}

export function hostEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Data a confirmar';
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}
