import type { NavItem } from '@/types/navigation';

export const navItems: NavItem[] = [
  { id: 'overview', label: 'Genel Bakış', href: '/', icon: 'grid-outline' },
  { id: 'messages', label: 'Mesajlar', href: '/mesajlar', icon: 'chatbubbles-outline' },
  { id: 'leads', label: 'Müşteri Adayları', href: '/musteri-adaylari', icon: 'person-add-outline' },
  { id: 'members', label: 'Üyeler', href: '/uyeler', icon: 'people-outline' },
  { id: 'calendar', label: 'Takvim', href: '/takvim', icon: 'calendar-outline' },
  { id: 'program', label: 'Program', href: '/program', icon: 'clipboard-outline' },
  { id: 'classes', label: 'Dersler', href: '/dersler', icon: 'barbell-outline' },
  { id: 'payments', href: '/odemeler', label: 'Ödemeler', icon: 'card-outline' },
  { id: 'reports', label: 'Raporlar', href: '/raporlar', icon: 'bar-chart-outline' },
  { id: 'team', label: 'Ekip', href: '/ekip', icon: 'people-circle-outline' },
  { id: 'trainers', label: 'Eğitmenler', href: '/egitmenler', icon: 'body-outline' },
  { id: 'settings', label: 'Ayarlar', href: '/ayarlar', icon: 'settings-outline' },
];

export const currentStudio = {
  name: 'Fitbase Studio',
  location: 'Kadıköy, İstanbul',
};

