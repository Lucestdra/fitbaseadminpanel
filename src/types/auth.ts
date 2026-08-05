import type { StaffRole } from '@/api/session';

export interface AuthUser {
  id: string;
  name: string;
  /** The wire role. There is no second client-side role vocabulary to keep in step. */
  role: StaffRole;
  avatarInitials: string;
  email: string;
}

/** What the registration form collects. */
export interface SignUpInput {
  studioName: string;
  name: string;
  email: string;
  password: string;

  /**
   * The KVKK aydınlatma metni acknowledgement.
   *
   * Not a formality and not defaultable: the server refuses registration without it, because KVKK
   * art. 10 requires the data subject be informed *before* their data is processed and a form that
   * proceeds without the acknowledgement has processed it already.
   */
  acceptedKvkkNotice: boolean;
}

/**
 * The long form of each role, for a profile line.
 *
 * <b>Exhaustive over `StaffRole`</b>, so a role added to the backend regenerates `schema.d.ts` and
 * fails this file to compile. That is the point: a new role silently falling through to "Eğitmen"
 * would print somebody the wrong job title, and the previous version of this file had a second
 * client-side role vocabulary that could drift from the wire one without anything noticing.
 *
 * Distinct from `ROLE_META` in `utils/staff`, which carries the short badge label. "Stüdyo
 * Yöneticisi" under a name and "Yönetici" in a 60-pixel pill are different jobs for different
 * strings, not a duplication.
 */
export const ROLE_LABEL: Record<StaffRole, string> = {
  OrganizationManager: 'Stüdyo Yöneticisi',
  SalesFinanceConsultant: 'Satış Danışmanı',
  Coach: 'Eğitmen',
};
