export const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function formatDateLabel(date: Date): string {
  return `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function parseDateLabel(label: string): Date | null {
  const parts = label.trim().split(' ');
  if (parts.length < 3) return null;
  const day = parseInt(parts[0], 10);
  const monthIndex = TURKISH_MONTHS.indexOf(parts[1]);
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || monthIndex === -1 || Number.isNaN(year)) return null;
  return new Date(year, monthIndex, day);
}

export function formatDateTimeLabel(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]} ${hours}:${minutes}`;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function formatRelativeDateTimeLabel(date: Date, now: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / (24 * 60 * 60 * 1000));
  if (dayDiff === 0) return `Bugün ${time}`;
  if (dayDiff === 1) return `Yarın ${time}`;
  return `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]} ${time}`;
}

export const WEEKDAYS: { id: string; label: string }[] = [
  { id: 'pzt', label: 'Pzt' },
  { id: 'sal', label: 'Sal' },
  { id: 'car', label: 'Çar' },
  { id: 'per', label: 'Per' },
  { id: 'cum', label: 'Cum' },
  { id: 'cmt', label: 'Cmt' },
  { id: 'paz', label: 'Paz' },
];

export function generateTimeOptions(startHour = 6, endHour = 22, stepMinutes = 30): string[] {
  const options: string[] = [];
  for (let totalMinutes = startHour * 60; totalMinutes <= endHour * 60; totalMinutes += stepMinutes) {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    options.push(`${hours}:${minutes}`);
  }
  return options;
}
