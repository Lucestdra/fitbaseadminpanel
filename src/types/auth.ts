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

export interface SignUpInput {
  studioName: string;
  name: string;
  email: string;
  phone: string;
}

export const ROLE_LABEL: Record<TeamRole, string> = {
  yonetici: 'Stüdyo Yöneticisi',
  satis: 'Satış Danışmanı',
  egitmen: 'Eğitmen',
};
