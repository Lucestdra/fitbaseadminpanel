import type { NavItem } from '@/types/navigation';

/**
 * The label, icon and route for each nav id the server can return.
 *
 * <b>Not mock data, which is why it is no longer under `src/mock/`.</b> It lived there while the
 * sidebar derived itself from a client-side role → nav-id map; that map is gone, and `GET /me`
 * returns the ids this caller reaches, in order. What is left here is the presentation the server
 * has no business owning — a Turkish label and an Ionicons name.
 *
 * The `id` values are the contract. They match `MeNavigationEntry.Id` exactly, so an id the server
 * sends and this table does not carry renders nothing rather than an empty row — see the filter in
 * `StudioSidebar`.
 */
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
