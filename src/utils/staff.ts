import type { BadgeTone } from '@/components/ui/Badge';
import type { StaffRole, StaffStatus } from '@/api/staff';

/**
 * Turkish labels for the wire roles.
 *
 * <b>Three roles, and the mapping is exact</b> — the panel's `yonetici` / `egitmen` / `satis` are
 * `OrganizationManager` / `Coach` / `SalesFinanceConsultant`. English on the wire, Turkish in this
 * adapter (ADR-0012), so the role a permission check reads and the role a screen prints are the
 * same value rather than two strings kept in step by hand.
 */
export const ROLE_META: Record<StaffRole, { label: string; tone: BadgeTone }> = {
  OrganizationManager: { label: 'Yönetici', tone: 'dark' },
  Coach: { label: 'Eğitmen', tone: 'mint' },
  SalesFinanceConsultant: { label: 'Satış', tone: 'info' },
};

/**
 * Turkish labels for the wire statuses.
 *
 * <b>`Invited` is a fourth state the panel did not have.</b> Somebody invited is on the roster and
 * cannot yet sign in; showing them as "Aktif" would tell a manager the handover is done when no
 * email has been opened.
 */
export const STATUS_META: Record<StaffStatus, { label: string; tone: BadgeTone }> = {
  Active: { label: 'Aktif', tone: 'mint' },
  OnLeave: { label: 'İzinli', tone: 'warning' },
  Inactive: { label: 'Ayrıldı', tone: 'neutral' },
  Invited: { label: 'Davet Bekliyor', tone: 'info' },
};

/** Initials for the avatar. Two words at most; a third adds nothing at 32 pixels. */
export function initialsOf(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');
}
