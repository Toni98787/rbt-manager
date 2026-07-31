import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  format,
} from 'date-fns';

export type Period = 'today' | 'week' | 'month' | 'year';

export function periodInterval(period: Period, now = new Date()) {
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) };
  }
}

export function inPeriod(iso: string, period: Period, now = new Date()) {
  const date = parseISO(iso);
  return isWithinInterval(date, periodInterval(period, now));
}

export function fmtDate(iso: string) {
  return format(parseISO(iso), 'dd MMM yyyy');
}

export function fmtDateTime(iso: string) {
  return format(parseISO(iso), 'dd MMM yyyy · HH:mm');
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
