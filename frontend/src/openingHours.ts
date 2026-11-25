export type OpeningPeriod = { openingTime: string; closingTime: string; closesNextDay: boolean };
export type OpeningDay = { dayOfWeek: number; isClosed: boolean; periods: OpeningPeriod[] };
export type OpeningWeek = { days: OpeningDay[] };

export const openingDayLabels = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const openingDayOrder = [1, 2, 3, 4, 5, 6, 0];

export function emptyOpeningWeek(): OpeningDay[] {
  return openingDayOrder.map((dayOfWeek) => ({ dayOfWeek, isClosed: true, periods: [] }));
}

export function maskOpeningTime(value: string) {
  return value.replace(/\D/g, '').slice(0, 6).replace(/^(\d{2})(\d)/, '$1:$2').replace(/:(\d{2})(\d)/, ':$1:$2');
}

export function openingWeekError(days: OpeningDay[]): string {
  if (days.length !== 7 || new Set(days.map((day) => day.dayOfWeek)).size !== 7 || days.some((day) => !Number.isInteger(day.dayOfWeek) || day.dayOfWeek < 0 || day.dayOfWeek > 6)) {
    return 'Informe os sete dias da semana, sem repetir dias.';
  }
  const intervals: { start: number; end: number; label: string }[] = [];
  for (const day of days) {
    const label = openingDayLabels[day.dayOfWeek];
    if (typeof day.isClosed !== 'boolean' || !Array.isArray(day.periods)) {
      return `${label}: informe se abre e os intervalos de atendimento.`;
    }
    if ((day.isClosed && day.periods.length > 0) || (!day.isClosed && day.periods.length === 0)) {
      return `${label}: dias fechados não devem ter horários; dias abertos precisam de um intervalo.`;
    }
    for (const period of day.periods) {
      if (!period || typeof period.closesNextDay !== 'boolean') {
        return `${label}: confira a indicação de fechamento no dia seguinte.`;
      }
      if (![period.openingTime, period.closingTime].every((time) => /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time))) {
        return `${label}: preencha os horários no formato 09:00, entre 00:00 e 23:59.`;
      }
      const [oh, om, os = 0] = period.openingTime.split(':').map(Number);
      const [ch, cm, cs = 0] = period.closingTime.split(':').map(Number);
      const opening = oh * 3600 + om * 60 + os;
      const duration = ch * 3600 + cm * 60 + cs - opening + (period.closesNextDay ? 86400 : 0);
      if (duration <= 0 || duration > 86400) {
        return `${label}: confira abertura, fechamento e a opção “Fecha no dia seguinte”. O intervalo deve durar até 24 horas.`;
      }
      const start = day.dayOfWeek * 86400 + opening;
      const end = start + duration;
      intervals.push({ start, end, label });
      if (end > 604800) {
        intervals.push({ start: start - 604800, end: end - 604800, label });
      }
    }
  }
  intervals.sort((a, b) => a.start - b.start);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i].start < intervals[i - 1].end) {
      return `${intervals[i - 1].label} e ${intervals[i].label}: há horários sobrepostos. Revise também o fechamento no dia seguinte.`;
    }
  }
  return '';
}

export function openingWeekPayload(days: OpeningDay[]): OpeningWeek {
  const error = openingWeekError(days);
  if (error) {
    throw new Error(error);
  }
  return { days: days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    isClosed: day.isClosed,
    periods: day.periods.map((period) => ({
      openingTime: period.openingTime.length === 5 ? `${period.openingTime}:00` : period.openingTime,
      closingTime: period.closingTime.length === 5 ? `${period.closingTime}:00` : period.closingTime,
      closesNextDay: period.closesNextDay,
    })),
  })) };
}

export function loadedOpeningDays(week: OpeningWeek): OpeningDay[] {
  if (!week || !Array.isArray(week.days)) {
    throw new Error('Resposta de funcionamento inválida. Tente carregar novamente.');
  }
  if (week.days.length === 0) {
    return emptyOpeningWeek();
  }
  const days = week.days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    isClosed: day.isClosed,
    periods: day.periods.map((period) => ({
      openingTime: period.openingTime.length === 8 && period.openingTime.endsWith(':00') ? period.openingTime.slice(0, 5) : period.openingTime,
      closingTime: period.closingTime.length === 8 && period.closingTime.endsWith(':00') ? period.closingTime.slice(0, 5) : period.closingTime,
      closesNextDay: period.closesNextDay,
    })),
  }));
  const error = openingWeekError(days);
  if (error) {
    throw new Error(`Não foi possível carregar a semana: ${error}`);
  }
  return days;
}
