import type { CalendarDay, CalendarSession } from '@/types/calendar';
import type { KpiItem } from '@/types/dashboard';

export const weekDays: CalendarDay[] = [
  { id: 'pzt', label: 'Pzt', dateLabel: '26 May' },
  { id: 'sal', label: 'Sal', dateLabel: '27 May' },
  { id: 'car', label: 'Çar', dateLabel: '28 May' },
  { id: 'per', label: 'Per', dateLabel: '29 May' },
  { id: 'cum', label: 'Cum', dateLabel: '30 May' },
  { id: 'cmt', label: 'Cmt', dateLabel: '31 May' },
  { id: 'paz', label: 'Paz', dateLabel: '1 Haz' },
];

export const todayDayId = 'car';

export const weekSchedule: CalendarSession[] = [
  { id: 'cs-1', day: 'pzt', time: '08:00', title: 'Reformer Pilates', trainer: 'Ece Yıldız', booked: 8, capacity: 10, type: 'ders' },
  { id: 'cs-2', day: 'pzt', time: '09:00', title: 'Vinyasa Yoga', trainer: 'Melis Kara', booked: 10, capacity: 12, type: 'ders' },
  { id: 'cs-3', day: 'pzt', time: '18:00', title: 'Fonksiyonel Antrenman', trainer: 'Can Demir', booked: 9, capacity: 12, type: 'ders' },

  { id: 'cs-4', day: 'sal', time: '08:00', title: 'Reformer Pilates', trainer: 'Ece Yıldız', booked: 7, capacity: 10, type: 'ders' },
  { id: 'cs-5', day: 'sal', time: '12:00', title: 'Core & Mat Pilates', trainer: 'Berkay Tuncel', booked: 10, capacity: 10, type: 'ders' },
  { id: 'cs-6', day: 'sal', time: '17:00', title: '1-on-1 PT Randevusu', trainer: 'Can Demir', booked: 1, capacity: 1, type: 'randevu' },

  { id: 'cs-7', day: 'car', time: '08:00', title: 'Reformer Pilates', trainer: 'Ece Yıldız', booked: 8, capacity: 10, type: 'ders' },
  { id: 'cs-8', day: 'car', time: '09:00', title: 'Vinyasa Yoga', trainer: 'Melis Kara', booked: 10, capacity: 12, type: 'ders' },
  { id: 'cs-9', day: 'car', time: '10:30', title: 'Fonksiyonel Antrenman', trainer: 'Can Demir', booked: 9, capacity: 12, type: 'ders' },
  { id: 'cs-10', day: 'car', time: '12:00', title: 'Hamile Yogası', trainer: 'Ayşe Kaya', booked: 6, capacity: 8, type: 'ders' },
  { id: 'cs-11', day: 'car', time: '18:30', title: 'Reformer Pilates', trainer: 'Ece Yıldız', booked: 7, capacity: 10, type: 'ders' },

  { id: 'cs-12', day: 'per', time: '09:00', title: 'Gentle Vinyasa Yoga', trainer: 'Melis Kara', booked: 8, capacity: 12, type: 'ders' },
  { id: 'cs-13', day: 'per', time: '14:00', title: '1-on-1 PT Randevusu', trainer: 'Berkay Tuncel', booked: 1, capacity: 1, type: 'randevu' },
  { id: 'cs-14', day: 'per', time: '19:00', title: 'Fonksiyonel Antrenman', trainer: 'Can Demir', booked: 11, capacity: 12, type: 'ders' },

  { id: 'cs-15', day: 'cum', time: '08:00', title: 'Reformer Pilates', trainer: 'Ece Yıldız', booked: 9, capacity: 10, type: 'ders' },
  { id: 'cs-16', day: 'cum', time: '10:00', title: 'Hamile Yogası', trainer: 'Ayşe Kaya', booked: 5, capacity: 8, type: 'ders' },
  { id: 'cs-17', day: 'cum', time: '18:00', title: 'Vinyasa Yoga', trainer: 'Melis Kara', booked: 12, capacity: 12, type: 'ders' },

  { id: 'cs-18', day: 'cmt', time: '10:00', title: 'Core & Mat Pilates', trainer: 'Berkay Tuncel', booked: 10, capacity: 10, type: 'ders' },
  { id: 'cs-19', day: 'cmt', time: '11:30', title: 'Fonksiyonel Antrenman', trainer: 'Can Demir', booked: 8, capacity: 12, type: 'ders' },

  { id: 'cs-20', day: 'sal', time: '10:00', title: 'Deneme Dersi - Ayşe Korkmaz', trainer: 'Ece Yıldız', booked: 1, capacity: 1, type: 'deneme' },
  { id: 'cs-21', day: 'car', time: '15:00', title: 'Deneme Dersi - Tolga Özkan', trainer: 'Can Demir', booked: 1, capacity: 1, type: 'deneme' },
  { id: 'cs-22', day: 'per', time: '11:00', title: 'Deneme Dersi - Bahar Eren', trainer: 'Melis Kara', booked: 1, capacity: 1, type: 'deneme' },
  { id: 'cs-23', day: 'cum', time: '16:00', title: 'Deneme Dersi - Kerem Demir', trainer: 'Berkay Tuncel', booked: 1, capacity: 1, type: 'deneme' },
];

export const calendarKpis: KpiItem[] = [
  { id: 'appointments-today', title: 'Bugünkü Randevular', value: '18', change: '↑ %12 vs dün', icon: 'calendar-outline' },
  { id: 'week-sessions', title: 'Bu Hafta Toplam Seans', value: '19', change: '↑ %6 vs geçen hafta', icon: 'repeat-outline' },
  { id: 'occupancy-rate', title: 'Haftalık Doluluk Oranı', value: '%81', change: '↑ %3 vs geçen hafta', icon: 'pie-chart-outline' },
  { id: 'open-seats', title: 'Boş Kontenjan', value: '26', change: '↓ %8 vs geçen hafta', icon: 'person-add-outline' },
  { id: 'cancellations', title: 'İptal / No-show', value: '9', change: '↑ %2 vs geçen hafta', icon: 'close-circle-outline' },
];
