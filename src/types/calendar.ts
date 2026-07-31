export type CalendarSessionType = 'ders' | 'randevu' | 'deneme';

export interface CalendarSession {
  id: string;
  day: string;
  time: string;
  title: string;
  trainer: string;
  booked: number;
  capacity: number;
  type: CalendarSessionType;
}

export interface CalendarDay {
  id: string;
  label: string;
  dateLabel: string;
}
