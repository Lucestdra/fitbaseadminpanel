import type { StaffRole } from '@/api/session';
import type { TeamRole } from './team';

export interface AuthUser {
  id: string;
  name: string;
  role: TeamRole;
  avatarInitials: string;
  email: string;
  phone: string;
  specialty: string | null;
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

export const ROLE_LABEL: Record<TeamRole, string> = {
  yonetici: 'Stüdyo Yöneticisi',
  satis: 'Satış Danışmanı',
  egitmen: 'Eğitmen',
};

/**
 * Wire role → this app's role.
 *
 * ADR-0012 puts English `PascalCase` on the wire and the Turkish vocabulary in the client. The
 * mapping is exhaustive over `StaffRole`, so adding a role to the backend's enum regenerates
 * `schema.d.ts` and fails this file to compile — which is the point: a new role that silently fell
 * through to `egitmen` would grant somebody a coach's screens.
 */
const TEAM_ROLE: Record<StaffRole, TeamRole> = {
  OrganizationManager: 'yonetici',
  SalesFinanceConsultant: 'satis',
  Coach: 'egitmen',
};

export function toTeamRole(role: StaffRole): TeamRole {
  return TEAM_ROLE[role];
}
