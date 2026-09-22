export const BUSINESS_TIME_ZONE = 'Asia/Makassar';

export function businessDateOf(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function businessToday(now = new Date()): string {
  return businessDateOf(now);
}

export function normalizeDateOnly(value: string | Date): string {
  const raw = value instanceof Date ? businessDateOf(value) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error('Format tanggal harus YYYY-MM-DD');
  }
  const [year, month, day] = raw.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error('Tanggal tidak valid');
  }
  return raw;
}

export function businessDayRange(
  start: string,
  end: string,
): { start: Date; end: Date } {
  const startDate = normalizeDateOnly(start);
  const endDate = normalizeDateOnly(end);
  if (startDate > endDate) {
    throw new Error('Tanggal mulai tidak boleh setelah tanggal selesai');
  }
  return {
    start: new Date(`${startDate}T00:00:00.000+08:00`),
    end: new Date(`${endDate}T23:59:59.999+08:00`),
  };
}

export function isSunday(date: string | Date): boolean {
  const dateOnly = normalizeDateOnly(date);
  return new Date(`${dateOnly}T00:00:00.000Z`).getUTCDay() === 0;
}

export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export function addCalendarMonths(date: string, months: number): string {
  const [year, month, day] = normalizeDateOnly(date).split('-').map(Number);
  const targetMonth = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0),
  ).getUTCDate();
  return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay)))
    .toISOString()
    .slice(0, 10);
}
