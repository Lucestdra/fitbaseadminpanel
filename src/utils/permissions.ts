import type { TeamRole } from '@/types/team';

/** Nav item ids each role is allowed to see. Order follows the sidebar. */
const ROLE_NAV_IDS: Record<TeamRole, string[]> = {
  yonetici: [
    'overview',
    'messages',
    'leads',
    'members',
    'calendar',
    'classes',
    'payments',
    'reports',
    'team',
    'trainers',
    'settings',
  ],
  satis: ['messages', 'leads', 'members', 'calendar'],
  egitmen: ['messages', 'leads', 'members', 'calendar', 'program'],
};

/** Where each role lands right after signing in. */
const ROLE_LANDING_ROUTE: Record<TeamRole, string> = {
  yonetici: '/',
  satis: '/musteri-adaylari',
  egitmen: '/program',
};

export function getAllowedNavIds(role: TeamRole): string[] {
  return ROLE_NAV_IDS[role];
}

export function canAccess(role: TeamRole, navId: string): boolean {
  return ROLE_NAV_IDS[role].includes(navId);
}

export function getLandingRoute(role: TeamRole): string {
  return ROLE_LANDING_ROUTE[role];
}
